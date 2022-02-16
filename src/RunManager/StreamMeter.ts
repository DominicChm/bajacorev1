import {Transform, TransformCallback} from "stream";

export class StreamMeter extends Transform {
    private interval: number = 1000;

    constructor(interval?: number) {
        super({objectMode: true});

        this.setInterval = this.setInterval.bind(this);
        if (interval != null) this.interval = interval;
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        this.push(chunk);
        if (this.interval > 0) setTimeout(() => callback(), this.interval);
        else callback();
    }

    setInterval(): this {
        this.interval = 0;
        return this;
    }
}
