import {DAQSchema} from "./interfaces/DAQSchema";
import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import {AnyModuleInstance, ModuleInstance} from "./ModuleInstance";
import {ModuleDefinition} from "./interfaces/ModuleDefinition";
import {ModuleTypePair} from "./ModuleManager";
import SensorBrakePressure from "../moduleTypes/SensorBrakePressure";
import onChange from "on-change";

interface SchemaManagerEvents {
    load: (schema: DAQSchema, instances: AnyModuleInstance[]) => void;
    update: (schema: DAQSchema, instances: AnyModuleInstance[]) => void;
    unload: (schema: DAQSchema, instances: AnyModuleInstance[]) => void;
    module_removed: (id: string, schema: DAQSchema) => void;
    module_added: (id: string, schema: DAQSchema) => void;
}

export interface SchemaManagerOptions {
    moduleTypes: ModuleTypePair[],
}

export class SchemaManager extends (EventEmitter as new () => TypedEmitter<SchemaManagerEvents>) {
    private _schema: DAQSchema | null = null;
    private _instances: AnyModuleInstance[] = [];
    private readonly _opts: SchemaManagerOptions;

    constructor(opts: Partial<SchemaManagerOptions> = {}) {
        super();
        this._opts = {
            moduleTypes: [SensorBrakePressure],
            ...opts
        };

        this.load = this.load.bind(this);
        this.moduleTypes = this.moduleTypes.bind(this);
        this.instances = this.instances.bind(this);
        this.handleInstanceDefinitionChange = this.handleInstanceDefinitionChange.bind(this);
    }

    loaded() {
        return this._schema;
    }

    //Returns module types.
    moduleTypes() {
        return this._opts.moduleTypes;
    }

    //Returns references to loaded instances.
    instances() {
        return this._instances;
    }

    private loadSchema(schema: DAQSchema) {
        this._schema = {...schema, modules: []};
        schema.modules.forEach(this.addModuleDefinition); //Load modules
    }

    private instantiateSchema(schema: DAQSchema) {
        const s = this.checkSchema();

        if (this._instances && this._instances.length > 0)
            throw new Error("Attempt to instantiate schema when there are loaded instances! Was the previous one not unloaded?");

        s.modules.forEach(this.instantiateDefinition);
    }

    private instantiateDefinition(def: ModuleDefinition<any>) {
        const tp = this.findTypePair(def.type);
        const instance = new tp.instance(def);
        this._instances.push(instance);
    }

    load(schema: DAQSchema): this {
        if (this._schema)
            this.unload();

        this.loadSchema(schema);
        this.instantiateSchema(this._schema as DAQSchema);

        console.log("Loaded!");
        return this;
    }


    checkSchema() {
        if (!this._schema)
            throw new Error("Schema not loaded!");

        return this._schema as DAQSchema;
    }

    setName(name: string) {
        const s = this.checkSchema();
        s.name = name;
    }

    setConfig() {

    }

    unload(): this {
        if (!this._schema)
            throw new Error("Attempt to unload when no schema loaded!");

        //Anything depending on instances should clean up/unload with this event.
        this.emit("unload", this._schema, this._instances);

        this._schema = null;
        this._instances = [];

        return this;
    }

    private reload() {
        console.log("SchemaManager - RELOAD!");
        if (this.schema())
            this.load(this.schema() as DAQSchema);
        else
            throw new Error("Attempt to reload without a schema loaded!");
    }

    private handleInstanceDefinitionChange(def: ModuleDefinition<any>, breaking: boolean) {
        if (this.schema())
            this.load(this.schema() as DAQSchema);

        else if (breaking)
            throw new Error("A breaking change happened while a schema wasn't loaded???");
    }

    //Adds a bare-minimum definition to the schema.
    createNewModuleDefinition(typeName: string, id: string) {
        this.addModuleDefinition({
            type: typeName,
            id: id,
            name: "",
            config: {},
            description: "",
            version: 0,
        });
    }

    addModuleDefinition(def: ModuleDefinition<any>) {
        const typePair = this.findTypePair(def.type);

        //Validate all module definition configs.
        def.config = typePair.type.validateConfig(def.config);

        this.addModule(def);
    }

    findTypePair(typeName: string): ModuleTypePair {
        const typePair = this.moduleTypes().find(v => v.type.typename() === typeName);

        if (!typePair)
            throw new Error(`Couldn't find module with type >${typeName}< when creating definition!`);

        return typePair;
    }

    addModule(def: ModuleDefinition<any>): this {
        console.log(`ADDING: ${def.id}`);
        this._schema?.modules.push(def);
        this.reload();
        return this;
    }

    removeModule(id: string): this {
        console.log(`ADDING: ${id}`);
        this._schema?.modules.filter(v => v.id !== id);
        this.reload();
        return this;
    }

    schema() {
        return this._watchedSchema
    }
}