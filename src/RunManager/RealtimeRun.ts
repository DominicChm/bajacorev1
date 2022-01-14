import {RunHandle} from "./RunHandle";
import {Stream} from "stream";
import {DAQSchema} from "../ModuleManager/interfaces/DAQSchema";

export class RealtimeRun extends RunHandle {
    constructor(uuid: string, schema: DAQSchema | undefined) {
        super("realtime", uuid, schema);
    }

    getPlayStream(timestamp?: number, scale?: number): any {
        return undefined as unknown as any;
    }

    getHeader(): Uint8Array {
        return new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
}
