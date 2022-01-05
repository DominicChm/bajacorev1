import {RunManager} from "../RunManager/RunManager";
import * as WebSocket from "ws"
import {ClientAgent} from "./ClientAgent";
import {Express} from "express";
import * as http from "http";
import * as sio from "socket.io"
import {CHANNELS} from "./SIOChannels";

export class ClientManager {
    private io: sio.Server;
    private agents: WeakSet<ClientAgent> = new WeakSet();
    private runManager: RunManager;

    constructor(runManager: RunManager, server: http.Server) {
        this.runManager = runManager;

        this.io = new sio.Server(server);
        this.io.on('connection', (socket: sio.Socket) => {
            this.agents.add(new ClientAgent(socket, this.runManager));
        });

        this.runManager.on("run_init", () => {
            this.io.emit(CHANNELS.RUNS_LIST, this.runManager.runs())
        })
    }
}
