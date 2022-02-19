import {Transform, TransformCallback} from "stream";
import {SchemaManager} from "../SchemaManager/SchemaManager";

/**
 * Maps a data stream to use module names rather than UUIDs, as a step in converting to user-readable CSV.
 */
export class DataRenamerStream extends Transform {
    private readonly _map: Map<string, string>;

    constructor(schemaManager: SchemaManager) {
        super({objectMode: true});
        this._map = new Map<string, string>();
        for (const i of schemaManager.instanceManager().instances()) {
            this._map.set(i.uuid(), i.name());
        }
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        const newObj: any = {};
        for (const [uuid, name] of this._map) {
            newObj[name] = chunk[uuid];
        }

        callback(null, newObj);
    }

}
