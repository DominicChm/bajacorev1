import {RunHandle} from "./RunHandle";
import {Stream} from "stream";

export class RealtimeRun extends RunHandle {
    getPlayStream(timestamp?: number, scale?: number): ReadableStream {
        return undefined as unknown as ReadableStream;
    }

    getHeader(): Uint8Array {
        return new Uint8Array([]);
    }
}
