import {Transform, TransformCallback} from "stream";
import * as Papa from 'papaparse'

const flattenObject = (obj: any, prefix = '') =>
    Object.keys(obj).reduce((acc: any, k) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[k] === 'object') Object.assign(acc, flattenObject(obj[k], pre + k));
        else acc[pre + k] = obj[k];
        return acc;
    }, {});

export class CSVEncoder extends Transform {
    private _frameInterval: number | undefined;
    private _time: number = 0;
    private _headerWritten: boolean = false;

    constructor(frameInterval?: number) {
        super({objectMode: true});
        this._frameInterval = frameInterval;
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        if (this._frameInterval) {
            chunk.time = this._time;
            this._time += this._frameInterval;
        }
        const flat = flattenObject(chunk)
        const dat = Papa.unparse([flat], {header: !this._headerWritten}) + "\n";
        //console.log(flat);
        this._headerWritten = true;
        callback(null, dat);
    }

}
