import {Transform, TransformCallback} from "stream";
import {SchemaManager} from "../SchemaManager/SchemaManager";

export class DataConverterStream extends Transform {
    private readonly _converters: Map<string, (data: any) => any>;

    constructor(manager: SchemaManager) {
        super({objectMode: true});

        this._converters = new Map()
        for (const instance of manager.instanceManager().instances()) {
            this._converters.set(instance.uuid(), instance.stored2human)
        }
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        const convertedData: any = {};
        for (const [uuid, converter] of this._converters) {
            convertedData[uuid] = converter(chunk[uuid]);
        }

        callback(null, convertedData);
    }

}
