import {Writable} from "stream";

export class EventStreamConsumer extends Writable {
    constructor() {
        super({objectMode: true});
    }

    _write(chunk: any, encoding: BufferEncoding, callback: (error?: (Error | null)) => void) {
        this.emit("data", chunk);
        callback();
    }
}
