import {Transform, TransformCallback} from "stream";

// Limits the speed of the piped stream to the passed interval.
// All chunks will eventually be emitted, at a rate of one every interval milliseconds.
export class TemporalStream extends Transform {
    private _interval: number = 1000;

    constructor(interval?: number) {
        super({objectMode: true});

        if (interval != null) this._interval = interval;
    }

    setInterval(interval: number) {
        this._interval = interval;
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        this.push(chunk);
        if (this._interval > 0) setTimeout(callback, this._interval);
        else callback();
    }
}
