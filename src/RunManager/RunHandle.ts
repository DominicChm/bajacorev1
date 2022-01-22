import {DAQSchema} from "../ModuleManager/interfaces/DAQSchema";
import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import {SchemaManager} from "../ModuleManager/SchemaManager";
import {CType} from "c-type-util";

interface RunEvents {
    destroyed: () => void;
    replaced: (replacementUUID: string) => void;
    format_changed: () => void;

}

export abstract class RunHandle extends (EventEmitter as new () => TypedEmitter<RunEvents>) {
    private readonly _uuid;
    private readonly _runType;
    private _schemaManager: SchemaManager;
    private _destroyed = false;

    protected constructor(runType: string, uuid: string, schema: DAQSchema | undefined) {
        super();
        this._uuid = uuid;
        this._runType = runType;
        this._schemaManager = new SchemaManager();
        this.schemaManager().on("unload", this.handleUnload);
        this.schemaManager().on("load", () => this.emit("format_changed"));
    }

    handleUnload() {

    }

    public abstract getHeader(): Uint8Array;

    public uuid(): string {
        return this._uuid;
    }

    public schemaManager(): SchemaManager {
        return this._schemaManager;
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
