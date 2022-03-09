import {RealtimeRun} from "../RunManager/RealtimeRun/RealtimeRun";
import {v4} from "uuid"
import {DAQSchema} from "../SchemaManager/interfaces/DAQSchema";
import {connect, MqttClient} from "mqtt";
import {MqttRouter} from "./MqttRouter";
import {TypedEmitter} from "tiny-typed-emitter";
import {logger} from "../Util/logging";
import {InstanceBinding} from "./InstanceBinding";
import {performance} from "perf_hooks";
import NanoTimer from "nanotimer";

const log = logger("ModuleManager");

export interface ModuleManagerOptions {
    mqttUrl: string;
    schemaPath: string;
    realtimeMetaPath: string;
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
    private readonly _run: RealtimeRun;
    private _bindings: Map<string, InstanceBinding> = new Map();
    private _frameTimer: NanoTimer;

    //TODO: REPLACE THIS SINGLE DISPATCHED DATA OBJECT WITH A REAL TIME-BASED
    // AGGREGATOR - THIS IS A "GET IT DONE" STRATEGY!!!
    private _data: any = {};

    constructor(opts: ModuleManagerOptions) {
        super();
        this.dispatchData = this.dispatchData.bind(this);
        this.gatherData = this.gatherData.bind(this);

        this._opts = opts;
        this._mqtt = connect(opts.mqttUrl);
        this._mqtt.on("connect", () => log("MQTT Connected!"));
        this._mqtt.on("error", (e) => log(`MQTT ERROR! >${e.message}<`));

        this._router = new MqttRouter(this._mqtt);
        this._run = new RealtimeRun(v4(), opts.schemaPath, opts.realtimeMetaPath);

        this._run.schemaManager().instanceManager().on("bindInstance", this.bindInstance.bind(this));
        this._run.schemaManager().instanceManager().on("unbindInstance", this.unbindInstance.bind(this));
        this._run.schemaManager().instanceManager().on("rebindInstance", this.rebindInstance.bind(this));

        this._run.schemaManager().on("formatBroken", this.onFormatBroken.bind(this));
        this._run.schemaManager().initLoadListener(this.initInstances.bind(this));

        this._frameTimer = new NanoTimer()
        this._frameTimer.setInterval(this.dispatchData.bind(this), '', `${this._run.schemaManager().frameInterval()}m`);
    }

    /**
     * Updates the framerate timer when the DAQ schema has a breaking change (possibly framerate).
     */
    onFormatBroken() {
        this._frameTimer.clearInterval();
        this._frameTimer.setInterval(this.dispatchData.bind(this), '', `${this._run.schemaManager().frameInterval()}m`);
    }

    schemaManager() {
        return this._run.schemaManager();
    }

    initInstances(schema: DAQSchema, instances: ModuleInstance[]) {
        instances.forEach(this.bindInstance.bind(this));
    }

    bindInstance(instance: ModuleInstance) {
        this._bindings.set(instance.id(), new InstanceBinding(instance, this._router, this.gatherData));
        this._data = this.schemaManager()?.storedCType().readLE(new Uint8Array(1000).buffer);
    }

    rebindInstance(instance: ModuleInstance) {
        this.unbindInstance(instance);
        this.bindInstance(instance);
    }

    /**
     * Ingests parsed, JSON data from modules.
     */
    private gatherData(data: any, time: number, instance: ModuleInstance, binding: InstanceBinding) {
        //console.log(data, this._data);
        //log(data);
        this._data[instance.id()] = data;
    }

    // TODO: REPLACE THIS GARBAGE! TIMING WILL N O T BE ACCURATE WITH THIS APPROACH.
    //  DATA IS SUSCEPTIBLE TO UP TO 500ms DELAYS BC OF WIFI INTERFERENCE!
    private dispatchData() {
        this._run?.feedData(this._data);
    }

    unbindInstance(instance: ModuleInstance) {
        this._bindings.get(instance.id())?.unbind();
        this._bindings.delete(instance.id());
    }

    getRuns(): RealtimeRun[] {
        if (this._run)
            return [this._run];

        return [];
    }
}
