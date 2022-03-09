import {DAQSchema} from "./interfaces/DAQSchema";
import {ModuleDefinition} from "./interfaces/ModuleDefinition";
import {cloneDeep} from "lodash";
import {TypedEmitter} from "tiny-typed-emitter";
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
import {diffObjects} from "../Util/diffObjects";

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
        const {deleted, added, changed} = diffObjects(this.schema().modules, schema.modules);

        return this;
    }

    /**
     * Returns the current Schema.
     */
    public schema(): DAQSchema {
        return {
            frameInterval: this._frameInterval,
            name: this._name,
            modules: this.moduleDefinitions(),
        }
    }

    public moduleDefinitions(): { [key: string]: ModuleDefinition } {
        return Object.fromEntries<ModuleDefinition>(
            Object.entries(this._modules).map(([k, v]) => [k, v.definition()]) as any
        )
    }


    //Adds a bare-minimum definition to the schema.
    createNewModuleDefinition(typeName: string) {
        this.addModule(this.findDriver(typeName).newDefinition());
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

    storedCType(): CType<any> {
        const members = Object.fromEntries(this._instanceManager.instances().map(i => [i.id(), i.typeDriver().storageCType()]))

        return cStruct(members);
    }

    frameInterval() {
        return this._frameInterval;
    }
}
