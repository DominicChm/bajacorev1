import {RealtimeRun} from "../RunManager/RealtimeRun";
import {v4} from "uuid"
import {ModuleInstance} from "./ModuleInstance";
import {ModuleType} from "./ModuleType";
import {Newable} from "../RunManager/RunManager";
import {DAQSchema} from "./interfaces/DAQSchema";
import SensorBrakePressure from "../moduleTypes/SensorBrakePressure";
import {connect, MqttClient} from "mqtt";
import {MqttRouter} from "./MqttRouter";
import {standardizeMac} from "./MACUtil";
import EventEmitter from "events";
import TypedEmitter from "typed-emitter";

export interface ModuleManagerOptions {
    mqttUrl: string,
    moduleTypes: ModuleTypePair[],
}

export interface ModuleTypePair {
    type: ModuleType<any, any, any>,
    instance: Newable<ModuleInstance<any, any, any, any, any>>
}

interface ModuleManagerEvents {
    schema_load: (schema: DAQSchema, run: RealtimeRun) => void;
    schema_updated: (schema: DAQSchema) => void;
    schema_unload: () => void;
    //schema_patched: (schema: Partial<DAQSchema>) => void;
}


export class ModuleManager extends (EventEmitter as new () => TypedEmitter<ModuleManagerEvents>) {
    //Links to MQTT and handles status and data aggregation and encoding
    private _opts: ModuleManagerOptions;
    private _moduleInstances: ModuleInstance<any, any, any, any, any>[] = [];
    private readonly _mqtt: MqttClient
    private readonly _router: MqttRouter;
    private readonly _run: RealtimeRun;
    private _schema: DAQSchema | undefined;

    constructor(opts: ModuleManagerOptions) {
        super();
        this._run = new RealtimeRun(v4(), undefined);
        this._opts = opts;
        this._mqtt = connect(opts.mqttUrl);
        this._router = new MqttRouter(this._mqtt);
    }

    public moduleTypes() {
        return this._opts.moduleTypes;
    }

    loadSchema(schema: DAQSchema): this {
        //console.log(schema)
        const updatedModules = schema.modules.map(m => {
            const mType = this.moduleTypes().find(t => t.type.typename() === m.type);
            if (!mType) throw new Error(`Couldn't find module with typename >${m.type}<`);

            const instance = new mType.instance(m);

            this._moduleInstances.push(instance);
            instance.on("definition_updated", this.emitSchemaUpdated.bind(this));

            return instance.definition();
        });

        this._schema = {...schema, modules: updatedModules};

        this._run.setSchema(this._schema);

        this._moduleInstances.forEach(this.linkInstanceMqtt.bind(this));

        //this.emitSchemaUpdated();
        this.emit("schema_load", this.schema() as DAQSchema, this._run);
        return this;
    }

    unloadSchema() {
        if (!this._schema)
            return;

        this._router.removeAllListeners();
        this.emit("schema_unload");
    }

    emitSchemaUpdated() {
        this.emit("schema_updated", this.schema() as DAQSchema);
    }

    //TODO: Types
    linkInstanceMqtt(instance: any) {
        this._router.on(`car/${instance.id()}/raw`, instance.handleRawInput.bind(instance));
    }

    schema() {
        return this._schema;
    }

    getRuns(): RealtimeRun[] {
        return [this._run];
    }

    instance(id: string): any | undefined {
        id = standardizeMac(id);
        return this._moduleInstances.find(m => id === m.id());
    }

    instances() {
        return this._moduleInstances;
    }

    private linkModuleInstance(instance: ModuleInstance<any, any, any, any, any>) {

    }
}

const testSchema: DAQSchema = {
    name: "Schema",
    modules: [
        {
            name: "Brake Pressure",
            id: "AA:BB:CC:DD:EE:FF",
            description: "Test brake pressure sensor",
            version: 0,
            type: "brake_pressure",
            config: {
                config_v: 1
            }
        }
    ]
}

const mm = new ModuleManager({
    moduleTypes: [SensorBrakePressure],
    mqttUrl: "mqtt://localhost:1883"
}).loadSchema(testSchema);

setInterval(() => {
    const i = mm.instance("aa.bb.cc.dd.ee.ff");
    i.printMessage("test");
}, 1000);
