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

export interface ModuleManagerOptions {
    mqttUrl: string,
    moduleTypes: ModuleTypePair[],
}

export interface ModuleTypePair {
    type: ModuleType<any, any, any>,
    instance: Newable<ModuleInstance<any, any, any, any, any>>
}

export class ModuleManager {
    //Links to MQTT and handles status and data aggregation and encoding
    private _opts: ModuleManagerOptions;
    private _moduleInstances: ModuleInstance<any, any, any, any, any>[] = [];
    private readonly _mqtt: MqttClient
    private readonly _router: MqttRouter;
    private readonly _run: RealtimeRun;
    private _schema: DAQSchema | undefined;

    constructor(opts: ModuleManagerOptions) {
        this._run = new RealtimeRun(v4());
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

            return instance.definition();
        });

        this._schema = {...schema, modules: updatedModules};

        for (const i of this._moduleInstances) {
            i.linkMQTT(this._router);
        }

        return this;
    }

    getRuns(): RealtimeRun[] {
        return [this._run];
    }

    getInstance(id: string): any | undefined {
        id = standardizeMac(id);
        return this._moduleInstances.find(m => id === m.id());
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
    const i = mm.getInstance("aa.bb.cc.dd.ee.ff");
    i.printMessage("test");
}, 1000);
