import {IRunMetaSchema, RunMetaSchema} from "./schemas/RunMeta";
import Joi from "joi";
import {outputJSON, readJSON, readJSONSync, writeJSON} from "fs-extra";
import {TypedEmitter} from "tiny-typed-emitter";
import {bindThis} from "../Util/util";

interface RunMetaManagerEvents {
    changed: (meta: IRunMetaSchema) => void;
}

export class RunMetaManager extends TypedEmitter<RunMetaManagerEvents> {
    private readonly _path: string;
    private _meta: IRunMetaSchema;
    private readonly _readonly: boolean;

    constructor(path: string, readonly: boolean = false) {
        super();
        bindThis(RunMetaManager, this);

        this._path = path;

        //Do initial set BEFORE applying readonly.
        this.set(readJSONSync(this._path, {throws: false}) ?? {});

        this._readonly = readonly;
    }

    public set(meta: IRunMetaSchema) {
        if (this._readonly) throw new Error("Run metadata is read-only!");
        meta = Joi.attempt(meta, RunMetaSchema);
        this._meta = meta;
        this.emit("changed", this._meta);
        outputJSON(this._path, meta).catch(e => {
            throw e;
        });
    }

    public name() {
        return this._meta.name;
    }

    //TODO: Ensure this can't be mutated.
    public meta() {
        return this._meta
    }
}
