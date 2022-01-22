import {RunManager} from "../RunManager/RunManager";
import * as sio from "socket.io"
import {CHANNELS} from "./SIOChannels";
import {RunHandle} from "../RunManager/RunHandle";
import onChange from "on-change";
import {DAQSchema} from "../ModuleManager/interfaces/DAQSchema";
import {Capabilties} from "../RunManager/interfaces/capabilties";
import {RealtimeRun} from "../RunManager/RealtimeRun";

interface ClientState {
    activeRun: string | null;
    schema: DAQSchema | null;
    capabilities: Capabilties;
    runs: RunHandle[];
}

export class ClientAgent {
    private io: sio.Socket;
    private runManager: RunManager;
    private _clientState: ClientState;

    constructor(io: sio.Socket, rm: RunManager) {
        this.io = io;
        this.runManager = rm;

        this._clientState = onChange({
            activeRun: null,
            schema: null,
            capabilities: rm.capabilities(),
            runs: this.runManager.runs()
        }, this.handleClientStateChange.bind(this));

        this.runManager.on("run_change", this.handleRunsUpdate.bind(this));

        console.log("new connection - clientAgent");
        io.on(CHANNELS.DATA_FRAME_REQUEST, this.wh(this.handleFrameRequest));
        io.on(CHANNELS.DATA_PLAY_REQUEST, this.wh(this.handlePlayRequest));
        io.on(CHANNELS.RUN_INIT_REQUEST, this.wh(this.handleRunInitRequest));
        io.on(CHANNELS.RUN_HEADER_REQUEST, this.wh(this.handleRunHeaderRequest));
        io.on(CHANNELS.RUN_STOP_REQUEST, this.wh(this.handleRunStopRequest));
        io.on(CHANNELS.RUN_DELETE_REQUEST, this.wh(this.handleRunDeleteRequest));
        io.on(CHANNELS.ACTIVATE_RUN, this.wh(this.activateRun));

        io.on("create_module", this.wh(this.createModule));


        //Handler should be "latest" deactivation handler, b/c it changes when a
        //run is activated.
        io.on(CHANNELS.DEACTIVATE_RUN, this.wh(() => this.deactivateRun()));


        this.handleClientStateChange();
    }

    createModule(typeName: string, id: string) {
        this.runManager.resolveRun(this._clientState.activeRun as string)
            .schema()
            .initModuleDefinition(typeName, id);
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
        console.log("DATA FRAME!!");
        this.io.emit(CHANNELS.DATA_FRAME, "TEST FRAME :DDD");
    }

    activateRun(uuid: string) {
        if(this._clientState.activeRun)
            this.deactivateRun();

        const run = this.runManager.resolveRun(uuid);
        this._clientState.activeRun = uuid;
        this._clientState.schema = run.schema();

        // Listeners that handle changes in run state. Detached when run is replaced or destroyed.
        const destroyListener = this.wh(() => this.deactivateRun());
        const replaceListener = (replacementUUID: string) => {
            this.activateRun(replacementUUID);
            //TODO: Re-push data frames.
        }

        //Update the deactivateRun listener to apply to the newly active run.
        this.deactivateRun = () => {
            this._clientState.activeRun = null;
            this._clientState.schema = null;
            run.off("destroyed", destroyListener);
            run.off("replaced", replaceListener);

        }
        run.on("destroyed", destroyListener);
        run.on("replaced", replaceListener);
    }

    deactivateRun() {
        throw new Error("Can't deactivate - no run active!");
    }

    clientState() {
        return this._clientState;
    }

    handlePlayRequest() {
        if (!this.clientState().activeRun)
            throw new Error("Can't start playback - No active run!");
    }

    handleRunStopRequest(uuid: string) {
        this.runManager.stopRunStorage(uuid);
    }

    handleRunInitRequest(reqUUID: string) {
        console.log("INIT REQUESTED");
        this.runManager.beginRunStorage(reqUUID);
    }

    handleRunDeleteRequest(uuid: string) {
        console.log(`DELETING ${uuid}`);
        this.runManager.deleteStoredRun(uuid);
    }

    handleRunHeaderRequest(uuid: string) {

    }

    emitError(errorMessage: string) {
        console.log(`emitting error: ${errorMessage}`);
        console.log(errorMessage);
        this.io.emit(CHANNELS.GENERAL_ERROR, errorMessage);
    }
}
