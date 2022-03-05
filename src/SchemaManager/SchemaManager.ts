import {DAQSchema} from "./interfaces/DAQSchema";
import {ModuleInstance} from "./ModuleInstance";
import {ModuleDefinition} from "./interfaces/ModuleDefinition";
import {cloneDeep} from "lodash";
import {TypedEmitter} from "tiny-typed-emitter";
import {moduleTypeDefinitions} from "../moduleTypes";
import {ModuleTypeDriver} from "./ModuleTypeDriver";
import {logger} from "../Util/logging";
import {checkDuplicates} from "../Util/util";
import {cStruct, CType} from "c-type-util";
import {InstanceManager} from "./InstanceManager";
import {SchemaManagerEvents} from "./interfaces/SchemaManagerEvents";
import {SchemaManagerOptions} from "./interfaces/SchemaManagerOptions";
import Joi from "joi";
import {DAQSchemaValidator} from "./schemas/DAQSchema";

const log = logger("SchemaManager");

//TODO: ADD FRAMERATE/INTERVAL TO THE SCHEMA, AS A BREAKING PARAMETER.
/**
 * Manages a DAQSchema. Handles mutation, loading, and unloading.
 */
export class SchemaManager extends TypedEmitter<SchemaManagerEvents> {
    private _schema: DAQSchema | null = null;
    private _instanceManager: InstanceManager;
    private readonly _opts: SchemaManagerOptions;
    private readonly _moduleTypeDrivers: ModuleTypeDriver[];

    constructor(opts: Partial<SchemaManagerOptions> = {}) {
        super();
        this._opts = {
            moduleTypes: moduleTypeDefinitions,
            breakingAllowed: true,
            ...opts,
        };

        this._moduleTypeDrivers = moduleTypeDefinitions.map(v => new ModuleTypeDriver(v));


        //Validate drivers
        checkDuplicates(this._moduleTypeDrivers, m => m.typeName());
        checkDuplicates(this._moduleTypeDrivers, m => m.typeHash());


        this.load = this.load.bind(this);
        this.moduleTypes = this.moduleTypes.bind(this);
        this.createNewModuleDefinition = this.createNewModuleDefinition.bind(this);
        this.validateDefinition = this.validateDefinition.bind(this);

        this._instanceManager = new InstanceManager(this);
    }

    setAllowBreaking(val: boolean): this {
        this._opts.breakingAllowed = val;
        return this;
    }

    //Returns module types.
    moduleTypes() {
        return this._opts.moduleTypes;
    }

    moduleDrivers() {
        return this._moduleTypeDrivers;
    }

    doesNewSchemaBreak(schema: DAQSchema) {
        return schema.frameInterval !== this.frameInterval();
    }

    /**
     * Loads a new schema. If the new schema requires a full reload (a new module is added, or a dependency breaks)
     * the current schema is unloaded first. If a full reload isn't required, it just updates current instances.
     * @param schema
     * @param fullReload
     */
    load(schema: DAQSchema, fullReload: boolean = false): this {
        //Check schema for dupe IDs. Will throw if found.
        schema = Joi.attempt(schema, DAQSchemaValidator);

        checkDuplicates(schema.modules, (m) => m.id);
        const loadedFlag = !this._schema;

        const {
            loadResults,
            definitions
        } = this._instanceManager.loadModuleDefinitions(schema.modules, !this._opts.breakingAllowed);

        const broken = this.doesNewSchemaBreak(schema);
        this._schema = {
            ...schema,
            modules: definitions
        };

        if (loadedFlag)
            this.emit("load", this.schema(), this.persistentSchema());
        else
            this.emit("update", this.schema(), this.persistentSchema());

        if (loadResults.deleted > 0 || loadResults.created > 0 || broken) {
            log("Format broken");
            this.emit("formatBroken", this.schema(), this.persistentSchema());
        }

        return this;
    }

    /**
     * Validates and returns a passed module definition, based on its typename.
     * @param def
     * @private
     */
    private validateDefinition(def: ModuleDefinition) {
        return this.findDriver(def.type).validateDefinition(def);
    }

    /**
     * Returns the current Schema.
     */
    public schema() {
        if (!this._schema)
            throw new Error("No schema loaded!");

        return cloneDeep(this._schema);

    }

    public persistentSchema(): DAQSchema {
        return {
            ...this._schema,
            modules: this._instanceManager.instances().map(i => i.persistentDefinition()),
        }
    }

    //Adds a bare-minimum definition to the schema.
    createNewModuleDefinition(typeName: string) {
        this.addModule(this.findDriver(typeName).newDefinition());
    }

    /**
     * Resolves a typename to a ModuleTypeDriver
     * @param typeName - The typename that corresponds to a ModuleType
     */
    findDriver(typeName: string): ModuleTypeDriver {
        const typeDriver = this.moduleDrivers().find((v: any) => v.typeName() === typeName);

        if (!typeDriver)
            throw new Error(`Couldn't find module with type >${typeName}< when creating definition!`);

        return typeDriver;
    }

    /**
     * Validates and adds a moduleDefinition to this schema
     * @param def - the ModuleDefinition to add.
     */
    addModule(def: ModuleDefinition): this {
        log(`Adding: ${def.mac}`);

        def = this.findDriver(def.type).validateDefinition(def);

        const s = this.schema();
        s.modules.push(def);

        this.load(s);
        return this;
    }


    /**
     * Used to run a load listener on (for example) class instantiation, if a schema has already been loaded.
     * @param listener
     */
    initLoadListener(listener: (schema: DAQSchema, instances: ModuleInstance[]) => void) {
        if (this._schema)
            listener(this.schema(), this._instanceManager.instances());
    }

    rawCType() {
        // for (const instance of this._instances) {
        // }
    }

    storedCType(): CType<any> {
        const members = Object.fromEntries(this._instanceManager.instances().map(i => [i.id(), i.typeDriver().storageCType()]))

        return cStruct(members);
    }

    instanceManager() {
        return this._instanceManager;
    }

    frameInterval() {
        return this._schema?.frameInterval;
    }

    isLoaded() {
        return !!this._schema;
    }
}
