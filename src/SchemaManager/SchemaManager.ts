import {DAQSchema} from "./interfaces/DAQSchema";
import {ModuleInstance} from "./ModuleInstance";
import {ModuleDefinition} from "./interfaces/ModuleDefinition";
import {cloneDeep} from "lodash";
import {TypedEmitter} from "tiny-typed-emitter";
import {ModuleTypeDriver} from "./ModuleTypeDriver";
import {logger} from "../Util/logging";
import {bindThis, checkDuplicates} from "../Util/util";
import {cStruct, CType} from "c-type-util";
import {SchemaManagerEvents} from "./interfaces/SchemaManagerEvents";
import {SchemaManagerOptions} from "./interfaces/SchemaManagerOptions";
import Joi from "joi";
import {DAQSchemaValidator} from "./schemas/DAQSchema";
import {ModuleTypeRegistry} from "../ModuleTypeRegistry/ModuleTypeRegistry";
import {SBP} from "../moduleTypes/SensorBrakePressure";
import {Module} from "../ModuleTypeRegistry/Module";

const log = logger("SchemaManager");

//TODO: ADD FRAMERATE/INTERVAL TO THE SCHEMA, AS A BREAKING PARAMETER.
/**
 * Manages a DAQSchema. Handles mutation, loading, and unloading.
 */
export class SchemaManager extends TypedEmitter<SchemaManagerEvents> {
    private readonly _opts: SchemaManagerOptions;
    private _registry: ModuleTypeRegistry;

    private _frameInterval: number;
    private _name: string;
    private _modules: { [key: string]: Module };

    constructor(opts: SchemaManagerOptions) {
        super();
        bindThis(SchemaManager, this);

        this._opts = {
            breakingAllowed: true,
            ...opts,
        };

        this._registry = new ModuleTypeRegistry().registerModule(SBP);
    }

    setAllowBreaking(val: boolean): this {
        this._opts.breakingAllowed = val;
        return this;
    }

    registry() {
        return this._registry;
    }

    doesNewSchemaBreak(schema: DAQSchema) {
        return schema.frameInterval !== this.frameInterval();
    }

    preprocessSchema() {

    }

    /**
     * Loads a new schema. If the new schema requires a full reload (a new module is added, or a dependency breaks)
     * the current schema is unloaded first. If a full reload isn't required, it just updates current instances.
     * @param schema
     */
    load(schema: DAQSchema): this {
        schema = Joi.attempt(schema, DAQSchemaValidator);

        Object.values(this._modules).forEach(m => m.beginUpdate());

        //Step 1 - Update the definitions of existing modules.
        for (const [id, moduleDefinition] of Object.entries(schema.modules))
            this._modules[id] = this._modules.updateDefinition(moduleDefinition);

        //Step 2 - Delete invalid/not updated (deleted) modules
        for (const [id, module] of Object.entries(this._modules).filter(([id, m]) => !m.isUpdateValid()))
            module.destroy();

        return this;
    }

    /**
     * Returns the current Schema.
     */
    public schema(): DAQSchema {
        if (!this._schema)
            throw new Error("No schema loaded!");

        return {
            frameInterval: this._frameInterval,
            name: this._name,
            modules: Object.values(this._modules).map(v => v.definition())
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
