import {RealtimeRun} from "../RunManager/RealtimeRun";
import {v4} from "uuid"
import {AnyModuleInstance, ModuleInstance} from "./ModuleInstance";
import {ModuleType} from "./ModuleType";
import {Newable} from "../RunManager/RunManager";
import {DAQSchema} from "./interfaces/DAQSchema";
import {connect, MqttClient} from "mqtt";
import {MqttRouter} from "./MqttRouter";
import {standardizeMac} from "./MACUtil";
import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import {SchemaManager} from "./SchemaManager";

export interface ModuleManagerOptions {
    mqttUrl: string;
    schemaManager: SchemaManager;
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
    private _run: RealtimeRun | undefined;

    constructor(opts: ModuleManagerOptions) {
        super();
        this._opts = opts;
        this._mqtt = connect(opts.mqttUrl);
        this._router = new MqttRouter(this._mqtt);

        this._opts.schemaManager.on("load", this.bindSchema.bind(this));
        this._opts.schemaManager.on("unload", this.unbindSchema.bind(this));
    }

    schemaManager() {
        return this._opts.schemaManager;
    }

    bindSchema(schema: DAQSchema, instances: AnyModuleInstance[]): this {
        //Unload a schema before loading a new one.
        this.unbindSchema(schema, instances);

        //Setup new Run
        const newRun = new RealtimeRun(v4(), schema);
        this._run?.replace(newRun.uuid());
        this._run = newRun;

        instances.forEach(i => this._router.on(`car/${i.id()}/raw`, i.handleRawInput));

        return this;
    }

    unbindSchema(schema: DAQSchema, instances: AnyModuleInstance[]) {
        for(const i of instances) {
            //Detach MQTT Listeners
            this._router.off(`car/${i.id()}/raw`, i.handleRawInput);
        }

    }

    handleInstanceConfigMutation() {
        this.emit("schema_updated", this.schemaManager().schema() as DAQSchema);
    }

    getRuns(): RealtimeRun[] {
        if (this._run)
            return [this._run];

        return [];
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
