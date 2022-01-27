import {DAQSchema} from "../ModuleManager/interfaces/DAQSchema";
import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import {SchemaManager} from "../SchemaManager/SchemaManager";
import {CType} from "c-type-util";
import {FileSchemaManager} from "../SchemaManager/FileSchemaManager";

interface RunEvents {
    destroyed: () => void;
    replaced: (replacementUUID: string) => void;
    format_changed: () => void;
    raw_data: (data: ArrayBuffer) => void;
    data: (data: any) => void;
}

export class PlaybackManager {
    private readonly stopCB: () => void;

    constructor(stop: () => void) {
        this.stopCB = stop;
    }

    stop() {
        this.stopCB();
    }
}

export interface PlayOptions {
    tStart?: number;
    tEnd?: number;
    scale?: number;
    framerate?: number; //Max fps to play.
}


export abstract class RunHandle extends (EventEmitter as new () => TypedEmitter<RunEvents>) {
    private readonly _uuid;
    private readonly _runType;
    private readonly _schemaManager: SchemaManager;
    private _destroyed = false;

    protected constructor(runType: string, uuid: string, schemaPath: string) {
        super();
        this._uuid = uuid;
        this._runType = runType;
        this._schemaManager = new FileSchemaManager(schemaPath);
        this.schemaManager().on("unload", this.handleUnload);
        this.schemaManager().on("load", () => this.emit("format_changed"));
    }

    handleUnload() {

    }

    public uuid(): string {
        return this._uuid;
    }

    public schemaManager(): SchemaManager {
        return this._schemaManager;
    }

    public abstract play(opts: PlayOptions, callback: (frame: any) => void): PlaybackManager;

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
