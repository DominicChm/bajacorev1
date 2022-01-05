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
        io.emit(CHANNELS.RUNS_LIST, rm.runs());
    }

    handleFrameRequest(uuid: string, timestamp: number) {
        console.log("DATA FRAME!!");
        this.io.emit(CHANNELS.DATA_FRAME, "TEST FRAME :DDD");
    }

    handlePlayRequest() {

    }

    handleRunCloseRequest() {

    }

    handleRunInitRequest() {
        console.log("INIT REQUESTED");
        try {
            this.runManager.initRunStorage();
        } catch (e: any) {
            this.emitError(e.message);
        }
    }

    handleRunHeaderRequest(uuid: string) {

    }

    emitError(e: any) {
        this.io.emit(CHANNELS.GENERAL_ERROR, e.message);
    }


}
