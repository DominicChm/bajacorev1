import Express from "express"
import {RunManager} from "../RunManager/RunManager";
import {Server} from "http";
import * as http from "http";
import {ClientManager} from "./ClientManager";
import cors from "cors"

export class FrontendManager {
    private app: Express.Application;
    private server: Server;
    private clientManager: ClientManager;
    private runManager: RunManager;

    constructor(rm: RunManager) {
        this.app = Express();
        this.server = http.createServer(this.app);
        this.clientManager = new ClientManager(rm, this.server);
        this.runManager = rm;

        this.server.listen(3000, () => console.log("Listening on 3000"));
    }

    private setupRoutes() {
        this.app.use(Express.static('public'));
    }
}
