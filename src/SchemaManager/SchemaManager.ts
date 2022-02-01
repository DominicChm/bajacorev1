import {DAQSchema} from "../ModuleManager/interfaces/DAQSchema";
import {ModuleInstance} from "../ModuleManager/ModuleInstance";
import {ModuleDefinition} from "../ModuleManager/interfaces/ModuleDefinition";
import {cloneDeep, isEqualWith} from "lodash";
import {standardizeMac} from "../ModuleManager/MACUtil";
import {TypedEmitter} from "tiny-typed-emitter";
import {moduleTypeDefinitions} from "../moduleTypes";
import {ModuleTypeDefinition} from "../ModuleManager/ModuleTypeDefinition";
import {ModuleTypeDriver} from "../ModuleManager/ModuleTypeDriver";

interface SchemaManagerEvents {
    //General listeners - fire whenever anything in the schema changes
    load: (schema: DAQSchema, instances: ModuleInstance[]) => void;
    update: (schema: DAQSchema, instances: ModuleInstance[]) => void;
    unload: (schema: DAQSchema, instances: ModuleInstance[]) => void;

    module_removed: (id: string, schema: DAQSchema) => void;
    module_added: (id: string, schema: DAQSchema) => void;
}


export interface SchemaManagerOptions {
    moduleTypes: ModuleTypeDefinition[],
}

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

    private instantiateDefinition(def: ModuleDefinition<any>) {
        const tp = this.findDriver(def.type);
        const instance = new ModuleInstance(tp, def);
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
        const td = this.findDriver(def.type); //Check type

        //Validate all module definition configs.
        def = td.validateDefinition(def);
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
        this.addModule(this.findDriver(typeName).defaultDefinition());
    }

    findDriver(typeName: string): ModuleTypeDriver {
        const typeDriver = this.moduleDrivers().find(v => v.typeName() === typeName);

        if (!typeDriver)
            throw new Error(`Couldn't find module with type >${typeName}< when creating definition!`);

        return typeDriver;
    }

    addModule(def: ModuleDefinition<any>): this {
        console.log(`ADDING: ${def.id}`);

        const typeDriver = this.findDriver(def.type);
        def = typeDriver.validateDefinition(def);

        const s = this.schema();
        s.modules.push(def);

        this.load(s);
        return this;
    }
}
