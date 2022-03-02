import {Transform, TransformCallback} from "stream";
import {InstanceManager} from "../SchemaManager/InstanceManager";

export class DataConverterStream extends Transform {
    private readonly _instanceManager: InstanceManager;

    constructor(manager: InstanceManager) {
        super({objectMode: true});
        this._instanceManager = manager;
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        callback(null, this._instanceManager.raw2human(chunk));
    }

}
