import {RealtimeRun} from "../RunManager/RealtimeRun";
import {v4} from "uuid"
import {ModuleInstance} from "./ModuleInstance";
import {DAQSchema} from "./interfaces/DAQSchema";
import {connect, MqttClient} from "mqtt";
import {MqttRouter} from "./MqttRouter";
import {TypedEmitter} from "tiny-typed-emitter";
import {logger} from "../logging";
import {InstanceBinding} from "./InstanceBinding";
import {performance} from "perf_hooks";

const log = logger("ModuleManager");

export interface ModuleManagerOptions {
    mqttUrl: string;
    schemaPath: string;
    aggregationWindow: number;
}

interface ModuleManagerEvents {

}


/**
 * Facilitates interactions with remote modules. Sets up and tears down MQTT and provides a RealtimeRun
 * to stream data from modules.
 */
export class ModuleManager extends TypedEmitter<ModuleManagerEvents> {
    //Links to MQTT and handles status and data aggregation and encoding
    private _opts: ModuleManagerOptions;
    private readonly _mqtt: MqttClient
    private readonly _router: MqttRouter;
    private readonly _run: RealtimeRun | undefined;
    private _bindings: InstanceBinding[] = [];

    constructor(opts: ModuleManagerOptions) {
        super();
        this._opts = opts;
        this._mqtt = connect(opts.mqttUrl);
        this._mqtt.on("connect", () => log("MQTT Connected!"));
        this._mqtt.on("error", (e) => log(`MQTT ERROR! >${e.message}<`));

        this._router = new MqttRouter(this._mqtt);
        this._run = new RealtimeRun(v4(), opts.schemaPath);

        this._run.schemaManager().on("bindInstance", this.bindInstance.bind(this));
        this._run.schemaManager().on("unbindInstance", this.unbindInstance.bind(this));
        this._run.schemaManager().on("rebindInstance", this.rebindInstance.bind(this));

        this._run.schemaManager().initLoadListener(this.initInstances.bind(this));
    }

    schemaManager() {
        return this._run?.schemaManager();
    }

    initInstances(schema: DAQSchema, instances: ModuleInstance[]) {
        instances.forEach(this.bindInstance.bind(this));
    }

    bindInstance(instance: ModuleInstance) {
        this._bindings.push(new InstanceBinding(instance, this._router, this.gatherData));
    }

    rebindInstance(instance: ModuleInstance) {
        this.unbindInstance(instance);
        this.bindInstance(instance);
    }

    /**
     * Ingests parsed, JSON data from modules.
     */
    private gatherData(data: any, time: number, instance: ModuleInstance, binding: InstanceBinding) {
        log(data);
        performance.now();
    }

    unbindInstance(instance: ModuleInstance) {
        this._bindings.find(b => b.uuid() === instance.uuid())?.unbind();
        this._bindings.filter(b => b.uuid() !== instance.uuid());
    }

    getRuns(): RealtimeRun[] {
        if (this._run)
            return [this._run];

        return [];
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
