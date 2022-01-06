import {RunManager} from "../RunManager/RunManager";
import * as sio from "socket.io"
import {CHANNELS} from "./SIOChannels";

export class ClientAgent {
    private io: sio.Socket;
    private runManager: RunManager;

    constructor(io: sio.Socket, rm: RunManager) {
        this.io = io;
        this.runManager = rm;
        console.log("new connection - clientAgent");
        io.on(CHANNELS.DATA_FRAME_REQUEST, this.handleFrameRequest.bind(this));
        io.on(CHANNELS.DATA_PLAY_REQUEST, this.handlePlayRequest.bind(this));
        io.on(CHANNELS.RUN_INIT_REQUEST, this.handleRunInitRequest.bind(this));
        io.on(CHANNELS.RUN_HEADER_REQUEST, this.handleRunHeaderRequest.bind(this));
        io.on(CHANNELS.RUN_STOP_REQUEST, this.handleRunStopRequest.bind(this));
        io.on(CHANNELS.RUN_DELETE_REQUEST, this.handleRunDeleteRequest.bind(this));


        this.initClient();
    }

    /**
     * Send off entire current state.
     */
    initClient() {
        this.io.emit(CHANNELS.RUNS_LIST, this.runManager.runs());
        this.io.emit(CHANNELS.CAPABILITIES, this.runManager.capabilities());
    }

    handleFrameRequest(uuid: string, timestamp: number) {
        console.log("DATA FRAME!!");
        this.io.emit(CHANNELS.DATA_FRAME, "TEST FRAME :DDD");
    }

    handlePlayRequest() {

    }

    handleRunStopRequest(uuid: string) {
        try {
            this.runManager.stopRunStorage(uuid);
        } catch (e: any) {
            this.emitError(e.message);
        }
    }

    handleRunInitRequest(reqUUID: string) {
        console.log("INIT REQUESTED");
        try {
            this.runManager.beginRunStorage(reqUUID);
        } catch (e: any) {
            this.emitError(e.message);
        }
    }

    handleRunDeleteRequest(uuid: string) {
        console.log(`DELETING ${uuid}`);
        try {
            this.runManager.deleteStoredRun(uuid);
        } catch (e: any) {
            this.emitError(e.message);
        }
    }

    handleRunHeaderRequest(uuid: string) {

    }

    emitError(errorMessage: string) {
        console.log(`emitting error: ${errorMessage}`);
        console.log(errorMessage);
        this.io.emit(CHANNELS.GENERAL_ERROR, errorMessage);
    }


}
