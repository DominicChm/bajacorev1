import {FileSchemaManager} from "../SchemaManager/FileSchemaManager";
import {TypedEmitter} from "tiny-typed-emitter";
import {PlaybackManager} from "./PlaybackManager";
import {RunEvents} from "./interfaces/RunEvents";
import {RunMetaManager} from "./RunMetaManager";
import {bindThis} from "../Util/util";

export abstract class RunHandle extends TypedEmitter<RunEvents> {
    private readonly _uuid;
    private readonly _runType;
    private readonly _schemaManager: FileSchemaManager;
    private readonly _metaManager: RunMetaManager;
    private _destroyed = false;

    protected constructor(runType: string, uuid: string, schemaPath: string, metaPath: string, metaReadonly: boolean) {
        super();
        bindThis(RunHandle, this);
        this._uuid = uuid;
        this._runType = runType;

        this._schemaManager = new FileSchemaManager(schemaPath);
        this._metaManager = new RunMetaManager(metaPath, metaReadonly);

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
            id: this._uuid,
            type: this._runType,
            meta: this.metaManager().meta()
        }
    }

    destroy() {
        this.removeAllListeners();
        this._destroyed = true;
        this.emit("destroyed");
    }

    destroyed(): boolean {
        return this._destroyed;
    }

    abstract getPlayManager(convertData: boolean): PlaybackManager;

    public metaManager() {
        return this._metaManager;
    }
}
