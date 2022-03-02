import {Transform, TransformCallback} from "stream";

// Limits the speed of the piped stream to the passed interval.
// All chunks will eventually be emitted, at a rate of one every interval milliseconds.
export class StreamPauser extends Transform {
    private _pausedCallback: any;

    constructor() {
        super({objectMode: true});
        this._pausedCallback = null
    }

    pauseStream() {
        // this._pausedCallback ||= true;
        this.cork();
        this.pause();
    }

    resumeStream() {
        // if (this._pausedCallback)
        //     this._pausedCallback();
        //
        // this._pausedCallback = null;

        this.uncork();
        this.resume();
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        // if (this._pausedCallback)
        //     this._pausedCallback = () => callback(null, chunk);
        // else
            callback(null, chunk);
    }
}
