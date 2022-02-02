import {RunManager} from "../RunManager/RunManager";
import * as sio from "socket.io"
import {CHANNELS} from "./SIOChannels";
import {PlaybackManager, PlayOptions, RunHandle} from "../RunManager/RunHandle";
import onChange from "on-change";
import {DAQSchema} from "../ModuleManager/interfaces/DAQSchema";
import {Capabilties} from "../RunManager/interfaces/capabilties";
import {assign} from "lodash";
import {logger} from "../logging";

const log = logger("ClientAgent");

interface ClientState {
    activeRun: string | null;
    playing: boolean;
    schema: DAQSchema | null;
    capabilities: Capabilties;
    runs: RunHandle[];
}

export class ClientAgent {
    private io: sio.Socket;
    private runManager: RunManager;
    private _clientState: ClientState;
    private _activeRun: RunHandle | null = null;
    private _activePlay: PlaybackManager | null = null;

    constructor(io: sio.Socket, rm: RunManager) {
        this.io = io;
        this.runManager = rm;

        this._clientState = onChange({
            activeRun: null,
            schema: null,
            playing: false,
            capabilities: rm.capabilities(),
            runs: this.runManager.runs()
        }, this.handleClientStateChange.bind(this));

        this.runManager.on("run_change", this.handleRunsUpdate.bind(this));

        log("new connection - clientAgent");
        io.on(CHANNELS.DATA_FRAME_REQUEST, this.wh(this.handleFrameRequest));
        io.on(CHANNELS.DATA_PLAY_REQUEST, this.wh(this.handlePlayRequest));
        io.on(CHANNELS.RUN_INIT_REQUEST, this.wh(this.handleRunInitRequest));
        io.on(CHANNELS.RUN_STOP_REQUEST, this.wh(this.handleRunStopRequest));
        io.on(CHANNELS.RUN_DELETE_REQUEST, this.wh(this.handleRunDeleteRequest));
        io.on(CHANNELS.ACTIVATE_RUN, this.wh(this.activateRun));

        io.on("create_module", this.wh(this.createModule));

        io.on("schema_update", this.wh(this.handleSchemaUpdateRequest))


        //Handler should be "latest" deactivation handler, b/c it changes when a
        //run is activated.
        io.on(CHANNELS.DEACTIVATE_RUN, this.wh(() => this.deactivateRun()));


        this.handleClientStateChange();
    }

    private handleSchemaUpdateRequest(schema: DAQSchema) {
        if (!this._activeRun)
            throw new Error("Can't set schema - no active run!");

        this._activeRun
            .schemaManager()
            .load(schema);
    }

    createModule(typeName: string, id: string) {
        this._activeRun
            ?.schemaManager()
            .createNewModuleDefinition(typeName, id);
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
                this.handleClientStateChange();
            }
        }

        return handlerWrapper.bind(this);
    }

    handleRunsUpdate() {
        this.clientState().runs = this.runManager.runs();

        const ar = this.clientState().activeRun;
        if (ar && !this.runManager.getRunById(ar))
            this.deactivateRun();
    }

    handleClientStateChange(path?: string, value?: any, previousValue?: any, name?: any) {
        this.io.emit(CHANNELS.CLIENT_STATE, this.clientState());
    }

    handleFrameRequest(uuid: string, timestamp: number) {
        log("DATA FRAME!!");
        this.io.emit(CHANNELS.DATA_FRAME, "TEST FRAME :DDD");
    }

    activateRun(uuid: string) {
        if (this._clientState.activeRun)
            this.deactivateRun();

        //Don't write changes to our state until the end to keep potential errors from having an effect.
        const newState: Partial<ClientState> = {};
        const activeRun = this.runManager.resolveRun(uuid);

        newState.activeRun = uuid;

        newState.schema = activeRun.schemaManager().schema();
        activeRun
            ?.schemaManager()
            .on("load", (schema) => this._clientState.schema = schema)
            .on("update", (schema) => this._clientState.schema = schema)


        // Listeners that handle changes in run state. Detached when run is replaced or destroyed.
        const destroyListener = this.wh(() => this.deactivateRun());

        //Update the deactivateRun listener to apply to the newly active run.
        this.deactivateRun = () => {
            this._activeRun?.off("destroyed", destroyListener);
            this.stopPlaying();

            this._clientState.activeRun = null;
            this._clientState.schema = null;
            this._activeRun = null;
        }

        activeRun.on("destroyed", destroyListener);

        assign(this._clientState, newState);
        this._activeRun = activeRun;
    }

    deactivateRun() {
        throw new Error("Can't deactivate - no run active!");
    }

    clientState() {
        return this._clientState;
    }

    emitData(data: any) {
        this.io.emit("data", data);
    }

    startPlaying(opts: PlayOptions) {
        if (!this.clientState().activeRun)
            throw new Error("Can't start playback - No active run!");

        this.stopPlaying();

        this._clientState.playing = true;
        this._activePlay = this._activeRun?.play(opts, this.wh(this.emitData)) ?? null;
    }

    stopPlaying() {
        if (this._activePlay) {
            this._activePlay.stop();
            this._clientState.playing = false;
        }
    }

    handlePlayRequest(opts: PlayOptions) {
        this.startPlaying(opts);
    }

    handleRunStopRequest(uuid: string) {
        this.runManager.stopRunStorage(uuid);
    }

    handleRunInitRequest(reqUUID: string) {
        log("INIT REQUESTED");
        this.runManager.beginRunStorage(reqUUID);
    }

    handleRunDeleteRequest(uuid: string) {
        log(`DELETING ${uuid}`);
        this.runManager.deleteStoredRun(uuid);
    }


    emitError(errorMessage: string) {
        log(`emitting error: ${errorMessage}`, "error");
        log(errorMessage, "error");
        this.io.emit(CHANNELS.GENERAL_ERROR, errorMessage);
    }
}
