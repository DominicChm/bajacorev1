import {DAQSchema} from "../ModuleManager/interfaces/DAQSchema";

export abstract class RunHandle {
    private readonly _uuid;
    private readonly _runType;
    private _schema: DAQSchema | undefined;

    constructor(runType: string, uuid: string, schema: DAQSchema | undefined) {
        this._uuid = uuid;
        this._runType = runType;
        this._schema = schema;
    }

    public abstract getHeader(): Uint8Array;

    public uuid(): string {
        return this._uuid;
    }

    public setSchema(schema: DAQSchema) {
        this._schema = schema;
    }

    public schema(): DAQSchema {
        if(!this._schema)
            throw new Error("No schema in run!!!!");
        return this._schema;
    }

    public abstract getPlayStream(timestamp?: number, scale?: number): any;

    public toJSON() {
        return {
            uuid: this._uuid,
            type: this._runType,
        }
    }
}
