import {Transform, TransformCallback} from "stream";

const nodata = Symbol("nodata");

// Limits the time between emitted chunks. Emits a chunk every interval ms, skipping chunks that come in during the cool-down.
// Always eventually emits the last chunk passed in.
export class FramerateLimiter extends Transform {
    private _interval: number;
    private bufferedChunk: any = nodata;
    private timeoutHandle: any = null;

    constructor(interval?: number) {
        super({objectMode: true});

        this.handleTimeout = this.handleTimeout.bind(this);

        this._interval = interval ?? 1000;
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        if (this._interval > 0) {
            this.bufferedChunk = chunk;
            this.timeoutHandle ||= setTimeout(this.handleTimeout, this._interval);
        } else this.push(chunk);
        callback();
    }

    handleTimeout(): void {
        this.timeoutHandle = null;
        if (this.bufferedChunk === nodata) return;


        this.push(this.bufferedChunk);
        this.bufferedChunk = nodata

        //Re-set the timeout here to keep timing roughly consistent. If no new data comes in, the next run won't
        this.timeoutHandle = setTimeout(this.handleTimeout, this._interval);
    }

    setInterval(interval: number) {
        this._interval = interval;
    }

    interval() {
        return this._interval;
    }

    _flush(callback: TransformCallback) {
        clearTimeout(this.timeoutHandle);

        callback(null, this.bufferedChunk === nodata ? null : this.bufferedChunk);

        this.bufferedChunk = nodata;
        this.timeoutHandle = null;
    }
}
