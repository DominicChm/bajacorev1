import {RunHandle} from "./RunHandle";
import {Stream} from "stream";

export class RealtimeRun extends RunHandle {
    constructor(uuid: string) {
        super("realtime", uuid);
    }

    getPlayStream(timestamp?: number, scale?: number): any {
        return undefined as unknown as any;
    }

    getHeader(): Uint8Array {
        return new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }
}
