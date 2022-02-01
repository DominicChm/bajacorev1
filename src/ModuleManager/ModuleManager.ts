import {RealtimeRun} from "../RunManager/RealtimeRun";
import {v4} from "uuid"
import {ModuleInstance} from "./ModuleInstance";
import {DAQSchema} from "./interfaces/DAQSchema";
import {connect, MqttClient} from "mqtt";
import {MqttRouter} from "./MqttRouter";
import {standardizeMac} from "./MACUtil";
import {TypedEmitter} from "tiny-typed-emitter";

export interface ModuleManagerOptions {
    mqttUrl: string;
    schemaPath: string;
}

interface ModuleManagerEvents {
    schema_load: (schema: DAQSchema, run: RealtimeRun) => void;
    schema_updated: (schema: DAQSchema) => void;
    schema_unload: () => void;
    //schema_patched: (schema: Partial<DAQSchema>) => void;
}

export class ModuleManager extends TypedEmitter<ModuleManagerEvents> {
    //Links to MQTT and handles status and data aggregation and encoding
    private _opts: ModuleManagerOptions;
    private _moduleInstances: ModuleInstance[] = [];
    private readonly _mqtt: MqttClient
    private readonly _router: MqttRouter;
    private readonly _run: RealtimeRun | undefined;
    private _listenedRawChannels: [string, any][] = [];

    constructor(opts: ModuleManagerOptions) {
        super();
        this._opts = opts;
        this._mqtt = connect(opts.mqttUrl);
        this._router = new MqttRouter(this._mqtt);
        this._run = new RealtimeRun(v4(), opts.schemaPath);

        this._run.schemaManager().on("load", this.bindSchema.bind(this));
        this._run.schemaManager().on("unload", this.unbindSchema.bind(this));
    }

    schemaManager() {
        return this._run?.schemaManager();
    }

    bindSchema(schema: DAQSchema, instances: ModuleInstance[]): this {
        //attach all modules to MQTT.
        for (const i of instances) {
            const e: [string, any] = [`car/${i.id()}/raw`, i.feedRaw];
            instances.forEach(i => this._router.on(e[0], e[1]));
            this._listenedRawChannels.push(e);
        }

        return this;
    }

    unbindSchema(schema: DAQSchema, instances: ModuleInstance[]) {
        for (const [event, listener] of this._listenedRawChannels) {
            //Detach MQTT Listeners
            this._router.off(event, listener);
        }

        this._listenedRawChannels = [];
    }

    getRuns(): RealtimeRun[] {
        if (this._run)
            return [this._run];

        return [];
    }

    instance(id: string): any | undefined {
        id = standardizeMac(id);
        return this.schemaManager()?.instances().find(m => id === m.id());
    }

    instances() {
        return this.schemaManager()?.instances();
    }
}

//
// const testSchema: DAQSchema = {
//     name: "Schema",
//     modules: [
//         {
//             name: "Brake Pressure",
//             id: "AA:BB:CC:DD:EE:FF",
//             description: "Test brake pressure sensor",
//             version: 0,
//             type: "brake_pressure",
//             config: {
//                 config_v: 1
//             }
//         }
//     ]
// }
//
// const mm = new ModuleManager({
//     moduleTypes: [SensorBrakePressure],
//     mqttUrl: "mqtt://localhost:1883"
// }).loadSchema(testSchema);
//
// setInterval(() => {
//     const i = mm.instance("aa.bb.cc.dd.ee.ff");
//     i.printMessage("test");
// }, 1000);
