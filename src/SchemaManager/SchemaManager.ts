import {DAQSchema} from "../ModuleManager/interfaces/DAQSchema";
import {ModuleInstance} from "../ModuleManager/ModuleInstance";
import {ModuleDefinition} from "../ModuleManager/interfaces/ModuleDefinition";
import {cloneDeep, isEqualWith} from "lodash";
import {standardizeMac} from "../ModuleManager/MACUtil";
import {TypedEmitter} from "tiny-typed-emitter";
import {moduleTypeDefinitions} from "../moduleTypes";
import {ModuleTypeDefinition} from "../ModuleManager/ModuleTypeDefinition";
import {ModuleTypeDriver} from "../ModuleManager/ModuleTypeDriver";
import {logger} from "../logging";

const log = logger("SchemaManager");

interface SchemaManagerEvents {
    // Fires on a full (breaking) load.
    load: (schema: DAQSchema, instances: ModuleInstance[]) => void;

    // Fires on a hot (non-breaking) load.
    update: (schema: DAQSchema, instances: ModuleInstance[]) => void;

    // Fires before an unload. Should be used to clean up anything reliant on a schema or instances.
    beforeUnload: (schema: DAQSchema, instances: ModuleInstance[]) => void;
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
        this.instantiateDefinition = this.instantiateDefinition.bind(this);
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
    private instantiateDefinition(def: ModuleDefinition<any>) {
        const instance = new ModuleInstance(this.findDriver(def.type), def);
        this._instances.push(instance);
    }

    //Compares an incoming schema with the current one to determine if a full reload is necessary.
    requiresReload(schema: DAQSchema) {
        const idsEqual = isEqualWith(this._schema, schema, (val: any, other: any) => {
            return true;
        });
        return schema.modules.length !== this._schema?.modules.length;
    }

    /**
     * Loads a new schema. If the new schema requires a full reload (a new module is added, or a dependency breaks)
     * the current schema is unloaded first. If a full reload isn't required, it just updates current instances.
     * @param schema
     * @param fullReload
     */
    load(schema: DAQSchema, fullReload: boolean = false): this {
        if (this.requiresReload(schema)) {
            const newSchema = {
                ...schema,
                modules: schema.modules.map(this.validateDefinition),
            };

            //Unload current if needed after new schema is validated.
            if (this._schema)
                this.unload();

            newSchema.modules.forEach(this.instantiateDefinition);

            this._schema = newSchema;

            log("Loaded (Breaking)!");
            this.emit("load", this.schema(), this._instances);
        } else {
            schema.modules.forEach((v, i) => {
                this._instances[i].setDefinition(v);
            });

            log("Loaded (Hot)!");
            this.emit("update", this.schema(), this._instances);
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
        this.emit("beforeUnload", this._schema, this._instances);

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
        this.addModule(this.findDriver(typeName).defaultDefinition());
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
     * @param id - The instance MAC to dinf
     */
    instance(id: string): any | undefined {
        id = standardizeMac(id);
        return this.instances().find(m => id === m.id());
    }
}
