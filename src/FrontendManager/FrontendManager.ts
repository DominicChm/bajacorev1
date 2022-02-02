import Express from "express"
import {RunManager} from "../RunManager/RunManager";
import {Server} from "http";
import * as http from "http";
import {ClientManager} from "./ClientManager";
import {logger} from "../logging";

const log = logger("FrontendManager");

export class FrontendManager {
    private readonly app: Express.Application;
    private readonly server: Server;
    private readonly clientManager: ClientManager;
    private readonly runManager: RunManager;

    constructor(rm: RunManager) {
        this.app = Express();
        this.server = http.createServer(this.app);
        this.clientManager = new ClientManager(rm, this.server);
        this.runManager = rm;

        //TODO: Make frontend port a config var!
        this.server.listen(3000, () => log(`Listening on ${3000}`));
    }

    private setupRoutes() {
        this.app.use(Express.static('public'));
    }
}
