import {Worker} from "worker_threads";
import Path from "path";

export class TimeSyncServer {
    private _worker: Worker;

    constructor() {
        this._worker = new Worker(Path.resolve(__dirname, "./worker.js"));
    }
}

