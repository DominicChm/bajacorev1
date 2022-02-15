import {RunManager} from "../RunManager/RunManager";
import * as sio from "socket.io"
import {CHANNELS} from "./SIOChannels";
import {DAQSchema} from "../SchemaManager/interfaces/DAQSchema";
import {logger} from "../Util/logging";
import {PlaybackManager} from "../RunManager/PlaybackManager";
import {RunHandle} from "../RunManager/RunHandle";
import {bindClass} from "../Util/util";

const log = logger("ClientAgent");

//TODO: SEPARATE STATE TRANSMISSION CHANNELS
export class ClientAgent {
    private _io: sio.Socket;
    private _runManager: RunManager;

    private _activeRun: RunHandle | null = null;
    private _activePlay: PlaybackManager | null = null;

    constructor(io: sio.Socket, rm: RunManager) {
        bindClass(this);

        log("new connection - clientAgent");

        this._io = io;
        this._runManager = rm.on("runChange", this.handleRunsUpdate);

        io.on("disconnect", () => console.log("DISCON"));

        this.initPlayChannels();
        this.initRunChannels();

        //Disable update dispatching for now - Client can't handle it yet.
        setInterval(this.emitRuns, 1000); //Poll runs at 1s
    }

    private initSchemaChannels() {
        this._io.on("create_module", this.wh(
            (typeName: string) => this.activeRun().schemaManager().createNewModuleDefinition(typeName)
        ));
        this._io.on("schema_update", this.wh(
            (schema: DAQSchema) => this.activeRun().schemaManager().load(schema)
        ));
    }

    private initRunChannels() {
        this._io.on(CHANNELS.RUN_INIT_REQUEST, this.wh(
            (uuid: string) => this.runManager().beginRunStorage(uuid)
        ));
        this._io.on(CHANNELS.RUN_STOP_REQUEST, this.wh(
            (uuid: string) => this.runManager().stopRunStorage(uuid)
        ));
        this._io.on(CHANNELS.RUN_DELETE_REQUEST, this.wh(
            (uuid: string) => {
                log(`DELETING ${uuid}`);
                this.runManager().deleteStoredRun(uuid);
            }
        ));
        this._io.on(CHANNELS.ACTIVATE_RUN, this.wh(this.activateRun));
        this._io.on(CHANNELS.DEACTIVATE_RUN, this.wh(this.deactivateRun));
    }

    private initPlayChannels() {
        this._io.on(CHANNELS.PLAY_START, this.wh(
            () => this.activePlay().play()
        ));
        this._io.on(CHANNELS.PLAY_STOP, this.wh(
            () => this.activePlay().stop()
        ));
        this._io.on(CHANNELS.PLAY_FRAMERATE, this.wh(
            (framerate: number) => this.activePlay().setFramerate(framerate)
        ));
        this._io.on("play_seek", this.wh(
            (time: number) => this.activePlay().seekTo(time)
        ));
    }

    private emitSchema(schema?: DAQSchema) {
        if (!schema)
            schema = this._activeRun?.schemaManager().schema();

        this._io.emit(CHANNELS.SCHEMA, schema ?? {});
    }

    private emitRuns() {
        this._io.emit(CHANNELS.RUNS, this._runManager.runs());
    }

    private emitPlayState(play?: PlaybackManager) {
        this._io.emit(CHANNELS.PLAY_STATE, play?.state() ?? this._activePlay?.state() ?? undefined);
    }

    private emitActiveRun() {
        this._io.emit("active_run", this._activeRun?.uuid());
    }

    private emitData(data: any) {
        this._io.emit("data", data);
    }

    private emitCompleteState() {
        this.emitActiveRun();
        this.emitSchema();
        this.emitPlayState();
        this.emitRuns();
    }

    /**
     * Wrap-Handler. Wraps each handler with a bind and error handler.
     * @private
     */
    private wh(handler: any) {
        const self = this;
        const handlerWrapper = (...args: any[]) => {
            try {
                handler.bind(this)(...args);
            } catch (e: any) {
                console.error(e);
                this.emitError(e.message);
                this.emitCompleteState();
            }
        }

        return handlerWrapper.bind(this);
    }

    activateRun(uuid: string) {
        if (this._activeRun)
            this.deactivateRun(false);

        this._activeRun = this._runManager.resolveRun(uuid)
            .on("destroyed", this.deactivateRun);

        this._activePlay = this._activeRun.getPlayManager()
            .on("stateChanged", this.emitPlayState)
            .setFramerate(10)
            .callback(this.emitData);

        this._activeRun.schemaManager()
            .on("load", this.emitSchema)
            .on("update", this.emitSchema)

        this.emitCompleteState();
    }

    deactivateRun(emit: boolean = true) {
        this.activeRun()
            .off("destroyed", this.deactivateRun);

        this.activePlay()
            .off("stateChanged", this.emitPlayState)
            .destroy()

        this.activeRun().schemaManager()
            .off("load", this.emitSchema)
            .off("update", this.emitSchema)

        this._activeRun = null;
        this._activePlay = null;

        if (emit)
            this.emitCompleteState();
    }

    handleRunsUpdate() {
        if (this._activeRun && !this._runManager.getRunByUUID(this._activeRun.uuid()))
            this.deactivateRun();
        else
            this.emitRuns();
    }

    private activeRun() {
        if (!this._activeRun)
            throw new Error("Error: no active run!");

        return this._activeRun;
    }

    private activePlay() {
        if (!this._activePlay)
            throw new Error("Error: No active play!");

        return this._activePlay;
    }

    runManager() {
        return this._runManager;
    }

    emitError(errorMessage: string) {
        log(`emitting error: ${errorMessage}`, "error");
        this._io.emit(CHANNELS.GENERAL_ERROR, errorMessage);
    }
}
