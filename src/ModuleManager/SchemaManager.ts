import {DAQSchema} from "./interfaces/DAQSchema";
import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import {RealtimeRun} from "../RunManager/RealtimeRun";
import {AnyModuleInstance, ModuleInstance} from "./ModuleInstance";
import {ModuleDefinition} from "./interfaces/ModuleDefinition";
import {ModuleTypePair} from "./ModuleManager";

interface SchemaManagerEvents {
    load: (schema: DAQSchema, instances: AnyModuleInstance[]) => void;
    unload: (schema: DAQSchema, instances: AnyModuleInstance[]) => void;
    instance_removed: (id: string, schema: DAQSchema) => void;
    instance_added: (id: string, schema: DAQSchema) => void;

    //schema_patched: (schema: Partial<DAQSchema>) => void;
}

export interface SchemaManagerOptions {
    moduleTypes: ModuleTypePair[],
}

export class SchemaManager extends (EventEmitter as new () => TypedEmitter<SchemaManagerEvents>) {
    private _schema: DAQSchema | undefined;
    private _watchedSchema: DAQSchema | undefined;
    private _instances: AnyModuleInstance[] = [];
    private readonly _opts;

    constructor(opts: SchemaManagerOptions) {
        super();
        this._opts = opts;

        this.load = this.load.bind(this);
        this.handleInstanceDefinitionChange = this.handleInstanceDefinitionChange.bind(this);
    }

    moduleTypes() {
        return this._opts.moduleTypes;
    }

    instances() {
        return this._instances;
    }


    load(schema: DAQSchema): this {
        if (this._schema)
            this.unload();

        const validatedModules = schema.modules.map(m => {
            const mType = this.moduleTypes().find(t => t.type.typename() === m.type);
            if (!mType) throw new Error(`Couldn't find module with typename >${m.type}<`);

            const instance = new mType.instance(m);
            this._instances.push(instance);

            instance.on("definition_updated", this.handleInstanceDefinitionChange);

            return instance.definition();
        });

        this._schema = {...schema, modules: validatedModules};

        return this;
    }

    private reload() {
        console.log("RELOAD!");
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

    unload(): this {
        if (!this._schema)
            throw new Error("Attempt to unload when no schema loaded!");
        this.emit("unload", this._schema, this._instances);
        return this;
    }

    modules() {

    }

    createNewModuleDefinition(typeName: string, id: string) {
        const typePair = this.moduleTypes().find(v => v.type.typename() === typeName);
        if (!typePair)
            throw new Error("Couldn't find module type when creating definition!");

        const def: ModuleDefinition<any> = {
            type: typeName,
            id: id,
            name: "",
            config: typePair.type.validateConfig({}),
            description: "",
            version: 0,
        }

        this.addModule(def);
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