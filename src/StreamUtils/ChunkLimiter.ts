import {Transform, TransformCallback} from "stream";

// Limits the amount of chunks that can pass through this stream.
// Corks once the limit is reached.
// 0 disables limiting.
export class ChunkLimiter extends Transform {
    private _limit: number = 0;
    private _counted: number = 0;

    constructor(limit: number) {
        super({objectMode: true});
        this._limit = limit;
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        this.push(chunk);

        this._counted++;
        console.log(this._counted, this._limit);

        callback();
    }

    reset(): this {
        this._counted = 0;
        this.uncork();
        this.emit("uncorked");
        return this;
    }

    setLimit(limit: number, reset: boolean = true): this {
        this._limit = limit;
        if (reset) this.reset();

        return this;
    }
}
