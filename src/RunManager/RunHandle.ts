import {DAQSchema} from "../ModuleManager/interfaces/DAQSchema";
import EventEmitter from "events";
import TypedEmitter from "typed-emitter";

interface RunEvents {
    destroyed: () => void;
    replaced: (replacementUUID: string) => void;
    //schema_patched: (schema: Partial<DAQSchema>) => void;
}

export abstract class RunHandle extends (EventEmitter as new () => TypedEmitter<RunEvents>) {
    private readonly _uuid;
    private readonly _runType;
    private _schema: DAQSchema | undefined;
    private _destroyed = false;

    protected constructor(runType: string, uuid: string, schema: DAQSchema | undefined) {
        super();
        this._uuid = uuid;
        this._runType = runType;
        this._schema = schema;
    }

    public abstract getHeader(): Uint8Array;

    public uuid(): string {
        return this._uuid;
    }

    public setSchema(schema: DAQSchema) {
        if (this._schema)
            throw new Error("Attempt to mutate schema!");

        this._schema = schema;
    }

    public schema(): DAQSchema {
        if (!this._schema)
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

    //Signals that this run is being replaced by another.
    //Unloads this run and fires an event
    public replace(uuid: string) {
        this.destroy();
        this.emit("replaced", uuid);
    }

    destroy() {
        this.removeAllListeners();
        this._destroyed = true;
    }

    destroyed(): boolean {
        return this._destroyed;
    }
}
