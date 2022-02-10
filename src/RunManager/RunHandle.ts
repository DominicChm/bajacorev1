import {SchemaManager} from "../SchemaManager/SchemaManager";
import {FileSchemaManager} from "../SchemaManager/FileSchemaManager";
import {TypedEmitter} from "tiny-typed-emitter";
import {PlaybackManager} from "./PlaybackManager";

interface RunEvents {
    destroyed: () => void;
    formatChanged: () => void;
    raw_data: (data: ArrayBuffer, timestamp: number) => void;
    data: (data: any, timestamp: number) => void;

    unlink: () => void;
    link: () => void;
}

export abstract class RunHandle extends TypedEmitter<RunEvents> {
    private readonly _uuid;
    private readonly _runType;
    private readonly _schemaManager: FileSchemaManager;
    private _destroyed = false;

    protected constructor(runType: string, uuid: string, schemaPath: string) {
        super();
        this._uuid = uuid;
        this._runType = runType;
        this._schemaManager = new FileSchemaManager(schemaPath);

        this.schemaManager().on("formatBroken", () => this.emit("formatChanged"));
    }

    public uuid(): string {
        return this._uuid;
    }

    public schemaManager(): FileSchemaManager {
        return this._schemaManager;
    }

    public toJSON() {
        return {
            uuid: this._uuid,
            type: this._runType,
        }
    }

    destroy() {
        this.removeAllListeners();
        this._destroyed = true;
    }

    destroyed(): boolean {
        return this._destroyed;
    }

    abstract getPlayManager(): PlaybackManager;

}
