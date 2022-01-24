import {DAQSchema} from "./interfaces/DAQSchema";
import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import {AnyModuleInstance, ModuleInstance} from "./ModuleInstance";
import {ModuleDefinition} from "./interfaces/ModuleDefinition";
import {ModuleTypePair} from "./ModuleManager";
import SensorBrakePressure from "../moduleTypes/SensorBrakePressure";
import onChange from "on-change";
import {cloneDeep, isEqualWith} from "lodash";
import {standardizeMac} from "./MACUtil";

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
        this.createModule = this.createModule.bind(this);
        this.addModuleDefinition = this.addModuleDefinition.bind(this);
        this.validateDefinition = this.validateDefinition.bind(this);
        this.instantiateDefinition = this.instantiateDefinition.bind(this);
    }

    //Returns module types.
    moduleTypes() {
        return this._opts.moduleTypes;
    }

    //Returns references to loaded instances.
    instances() {
        return this._instances;
    }

    private instantiateDefinition(def: ModuleDefinition<any>) {
        const tp = this.findTypePair(def.type);
        const instance = new tp.instance(def);
        this._instances.push(instance);
    }

    //Compares an incoming schema with the current one to determine if a full reload is necessary.
    requiresReload(schema: DAQSchema) {
        const idsEqual = isEqualWith(this._schema, schema, (val: any, other: any) => {
            console.log(val, other);
            return true;
        });
        return schema.modules.length !== this._schema?.modules.length;
    }

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

            console.log("Loaded (Breaking)!");
            this.emit("load", this.schema(), this._instances);
        } else {
            schema.modules.forEach((v, i) => {
                this._instances[i].setDefinition(v);
            });

            console.log("Loaded (Hot)!");
            this.emit("update", this.schema(), this._instances);
        }


        return this;
    }

    private validateDefinition(def: ModuleDefinition<any>) {
        const typePair = this.findTypePair(def.type); //Check type

        def.id = standardizeMac(def.id);

        //Validate all module definition configs.
        def.config = typePair.type.validateConfig(def.config);

        return def;
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
        const s = this.schema();
        s.modules.push(def);

        this.load(s);
        return this;
    }

    createModule(id: string, typeName: string) {
        this.createNewModuleDefinition(typeName, id);
    }
}
