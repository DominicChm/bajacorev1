import {Transform, TransformCallback} from "stream";

// Injects a count into the stream object.
export class ChunkCounter extends Transform {
    private _value: number;
    private _valuePerChunk: number;
    private _key: string;

    constructor(startValue: number, valuePerChunk: number, key: string) {
        super({objectMode: true});

        this._value = startValue;
        this._valuePerChunk = valuePerChunk;
        this._key = key;
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        if (typeof chunk !== "object")
            throw new Error("Time injector only works on object streams!");

        chunk[this._key] = this._value;
        this._value += this._valuePerChunk;

        callback(null, chunk);
    }

    key(): Symbol | string {
        return this._key;
    }
}
