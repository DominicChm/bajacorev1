import {Stream, Transform, TransformCallback} from "stream";
import {CType} from "c-type-util";

export class CTypeStream extends Transform {
    private leftovers: Buffer = Buffer.alloc(0);
    private _ctype: CType<any>;

    constructor(ctype: CType<any>) {
        super({objectMode: true, defaultEncoding: "binary"});
        this._ctype = ctype;
    }

    _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback) {
        //console.log(chunk);
        chunk = Buffer.concat([this.leftovers, chunk]);
        while (chunk.length > this._ctype.size) {
            this.push(this._ctype.readLE(chunk.buffer, chunk.byteOffset));
            chunk = chunk.slice(this._ctype.size)
        }

        this.leftovers = chunk;
        callback();
    }
}
