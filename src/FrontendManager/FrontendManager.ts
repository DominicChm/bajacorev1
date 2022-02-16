import Express, {Request, Response} from "express"
import {RunManager} from "../RunManager/RunManager";
import {Server, createServer} from "http";
import {ClientManager} from "./ClientManager";
import {logger} from "../Util/logging";

const log = logger("FrontendManager");

/**
 * Sets up and manages all frontend connections and routes. Responsible for
 * initializing the ClientManager.
 */
export class FrontendManager {
    private readonly _app: Express.Application;
    private readonly _server: Server;
    private readonly _clientManager: ClientManager;
    private readonly _runManager: RunManager;

    constructor(rm: RunManager) {
        this._app = Express();
        this._server = createServer(this._app);
        this._clientManager = new ClientManager(rm, this._server);
        this._runManager = rm;

        //TODO: Make frontend port a config var!
        this._server.listen(3000, () => log(`Listening on ${3000}`));
    }

    private setupRoutes() {
        this._app.use(Express.static('public'));
        this._app.get('/', (req, res) => {
            res.send('hello world')
        })
    }

    /**
     * Generates and Serves a CSV for the run passed as a query parameter.
     */
    private dlCSV(req: Request, res: Response) {
        
    }
}
