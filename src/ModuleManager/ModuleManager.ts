import {RealtimeRun} from "../RunManager/RealtimeRun";
import {v4} from "uuid"
import {ModuleInstance} from "./ModuleInstance";
import {ModuleType} from "./ModuleType";
import {Newable} from "../RunManager/RunManager";
import {DAQSchema} from "./interfaces/DAQSchema";

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

    private readonly _run: RealtimeRun;

    constructor(opts: ModuleManagerOptions) {
        this._run = new RealtimeRun(v4());
        this._opts = opts;

    }

    loadSchema(schema: DAQSchema): this {
        return this;
    }

    getRuns(): RealtimeRun[] {
        return [this._run];
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
            config: {
                config_v: 1
            }
        }
    ]
}

new ModuleManager({moduleTypes: [], mqttUrl: "mqtt://localhost:1883"}).loadSchema(testSchema);
