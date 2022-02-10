import {Writable} from "stream";

export class StreamMeter extends Writable {
    private interval: number = 1000;

    constructor(interval?: number) {
        super({objectMode: true});
        this.setInterval = this.setInterval.bind(this);
        if (interval) this.interval = interval;
    }

    _write(chunk: any, encoding: BufferEncoding, callback: (error?: (Error | null)) => void) {
        this.emit("data", chunk);
        if (this.interval > 0) setTimeout(() => callback(), this.interval);
        else callback();
    }

    setInterval(): this {
        this.interval = 0;
        return this;
    }
}
