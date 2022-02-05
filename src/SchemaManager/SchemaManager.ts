import {DAQSchema} from "../ModuleManager/interfaces/DAQSchema";
import {ModuleInstance} from "../ModuleManager/ModuleInstance";
import {ModuleDefinition} from "../ModuleManager/interfaces/ModuleDefinition";
import {cloneDeep, isEqual, isEqualWith} from "lodash";
import {standardizeMac} from "../ModuleManager/MACUtil";
import {TypedEmitter} from "tiny-typed-emitter";
import {moduleTypeDefinitions} from "../moduleTypes";
import {ModuleTypeDefinition} from "../ModuleManager/ModuleTypeDefinition";
import {ModuleTypeDriver} from "../ModuleManager/ModuleTypeDriver";
import {logger} from "../logging";
import {checkDuplicates} from "../util";
import {cStruct, CType} from "c-type-util";

const log = logger("SchemaManager");

interface SchemaManagerEvents {
    load: (schema: DAQSchema) => void;
    update: (schema: DAQSchema) => void;
    unload: (schema: DAQSchema) => void;

    // Emitted when a change that breaks the binary format happens, like a module being added or removed.
    formatBroken: (schema: DAQSchema) => void;

    bindInstance: (instance: ModuleInstance) => void;
    unbindInstance: (instance: ModuleInstance) => void;
    rebindInstance: (instance: ModuleInstance) => void;
}


export interface SchemaManagerOptions {
    moduleTypes: ModuleTypeDefinition[],
}

/**
 * Manages a DAQSchema. Handles mutation, loading, and unloading.
 */
export class SchemaManager extends TypedEmitter<SchemaManagerEvents> {
    private _schema: DAQSchema | null = null;
    private _instances: ModuleInstance[] = [];
    private readonly _opts;

    constructor(opts: Partial<SchemaManagerOptions> = {}) {
        super();
        this._opts = {
            moduleTypes: moduleTypeDefinitions,
            ...opts,

            moduleDrivers: moduleTypeDefinitions.map(v => new ModuleTypeDriver(v)),
        };

        this.load = this.load.bind(this);
        this.moduleTypes = this.moduleTypes.bind(this);
        this.instances = this.instances.bind(this);
        this.createNewModuleDefinition = this.createNewModuleDefinition.bind(this);
        this.validateDefinition = this.validateDefinition.bind(this);
        this.instantiateModuleDefinition = this.instantiateModuleDefinition.bind(this);
    }

    //Returns module types.
    moduleTypes() {
        return this._opts.moduleTypes;
    }

    moduleDrivers() {
        return this._opts.moduleDrivers;
    }

    //Returns references to loaded instances.
    instances() {
        return this._instances;
    }

    /**
     * Creates and adds to this a ModuleInstance based on the passed ModuleDefinition
     * @param def - The ModuleDefinition to instantiate and load.
     * @private
     */
    private instantiateModuleDefinition(def: ModuleDefinition<any>) {
        const instance = new ModuleInstance(this.findDriver(def.type), def);
        this._instances.push(instance);
        return instance;
    }

    /**
     * Loads a new schema. If the new schema requires a full reload (a new module is added, or a dependency breaks)
     * the current schema is unloaded first. If a full reload isn't required, it just updates current instances.
     * @param schema
     * @param fullReload
     */
    load(schema: DAQSchema, fullReload: boolean = false): this {
        //Check schema for dupe IDs. Will throw if found.
        checkDuplicates(schema.modules, (m) => m.uuid);
        const loadedFlag = !this._schema;

        const presentUUIDs = new Set<string>();
        const instances: { [index: string]: ModuleInstance[] } = {
            new: [],
            deleted: [],
            changed: [],
        }

        // Create a validate
        schema.modules = schema.modules.map(instanceDefinition => {
            let instance = this.instance(instanceDefinition.uuid);

            //Instantiate missing instances
            if (!instance) {
                instance = this.instantiateModuleDefinition(instanceDefinition);
                instances.new.push(instance);
            }
            //Re-create instances with type changes. Format flag handled by deletion automatically.
            else if (instance.definition().type !== instanceDefinition.type) { //Type changed - reinstantiate this definition.
                const newDef = this.findDriver(instanceDefinition.type).deriveDefinition(instance.definition());
                instance = this.instantiateModuleDefinition(newDef);
                instances.new.push(instance);
                log(`TYPECHANGED >${instance.uuid()}<`)

                //Re-bind instances with config changes.
            } else if (!isEqual(instanceDefinition, instance.definition())) {
                instance.setDefinition(instanceDefinition);

                instances.changed.push(instance);
                log(`REBIND >${instance.uuid()}<`)
            }

            presentUUIDs.add(instance.definition().uuid);
            return instance.definition();
        });

        this._schema = schema;

        //Unbind deleted instances
        instances.deleted = this._instances.filter(i => !presentUUIDs.has(i.uuid()))
        this._instances = this._instances.filter(i => presentUUIDs.has(i.uuid()));

        instances.new.forEach(i => this.emit("bindInstance", i));
        instances.changed.forEach(i => this.emit("rebindInstance", i));
        instances.deleted.forEach(i => this.emit("unbindInstance", i));

        //Then remove them from our held ones


        if (loadedFlag)
            this.emit("load", this.schema());
        else
            this.emit("update", this.schema());

        if (instances.deleted.length > 0 || instances.new.length > 0) {
            log("Format broken");
            this.emit("formatBroken", this.schema());
        }

        return this;
    }

    /**
     * Validates and returns a passed module definition, based on its typename.
     * @param def
     * @private
     */
    private validateDefinition(def: ModuleDefinition<any>) {
        return this.findDriver(def.type).validateDefinition(def);
    }

    /**
     * Unloads the current Schema. Fires an unload event.
     */
    unload(): this {
        if (!this._schema)
            throw new Error("Attempt to unload when no schema loaded!");

        //Anything depending on instances should clean up/unload with this event.
        this._instances.forEach(i => this.emit("unbindInstance", i));

        this._schema = null;
        this._instances = [];

        log("Unloaded");
        return this;
    }

    /**
     * Returns the current Schema.
     */
    public schema() {
        if (!this._schema)
            throw new Error("No schema loaded!");

        return {
            ...cloneDeep(this._schema),
            modules: this._instances.map(m => m.definition())
        };
    }

    //Adds a bare-minimum definition to the schema.
    createNewModuleDefinition(typeName: string, id: string) {
        this.addModule(this.findDriver(typeName).newDefinition());
    }

    /**
     * Resolves a typename to a ModuleTypeDriver
     * @param typeName - The typename that corresponds to a ModuleType
     */
    findDriver(typeName: string): ModuleTypeDriver {
        const typeDriver = this.moduleDrivers().find(v => v.typeName() === typeName);

        if (!typeDriver)
            throw new Error(`Couldn't find module with type >${typeName}< when creating definition!`);

        return typeDriver;
    }

    /**
     * Validates and adds a moduleDefinition to this schema
     * @param def - the ModuleDefinition to add.
     */
    addModule(def: ModuleDefinition<any>): this {
        log(`Adding: ${def.id}`);

        def = this.findDriver(def.type).validateDefinition(def);

        const s = this.schema();
        s.modules.push(def);

        this.load(s);
        return this;
    }

    /**
     * Find an instance based on the passed MAC ID.
     * @param uuid
     */
    instance(uuid: string): ModuleInstance | undefined {
        return this.instances().find(m => uuid === m.uuid());
    }

    /**
     * Used to run a load listener on (for example) class instantiation, if a schema has already been loaded.
     * @param listener
     */
    initLoadListener(listener: (schema: DAQSchema, instances: ModuleInstance[]) => void) {
        if (this._schema)
            listener(this.schema(), this._instances);
    }

    rawCType() {
        for (const instance of this._instances) {
        }
    }

    storedCType(): CType<any> {
        const members = Object.fromEntries(this
            .instances().map(i => [i.uuid(), i.typeDriver().storageCType()]))

        return cStruct(members);
    }
}
