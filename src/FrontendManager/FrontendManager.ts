import Express, {Request, Response} from "express"
import {RunManager} from "../RunManager/RunManager";
import {Server, createServer} from "http";
import {ClientManager} from "./ClientManager";
import {logger} from "../Util/logging";
import {StoredRun} from "../RunManager/StoredRun/StoredRun";
import {DataRenamerStream} from "./DataRenamerStream";
import {CSVEncoderStream} from "./CSVEncoderStream";

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

        this.setupRoutes();

        //TODO: Make frontend port a config var!
        this._server.listen(3000, () => log(`Listening on ${3000}`));
    }

    private setupRoutes() {
        this._app.use(Express.static('public'));
        this._app.get('/csv/:uuid', this.dlCSV.bind(this));
    }

    /**
     * Generates and Serves a CSV for the run passed as a query parameter.
     */
    private dlCSV(req: Request, res: Response) {
        const run = this._runManager.resolveRun(req.params.uuid, StoredRun);
        run.getPlayManager(true)
            .seekTo(0)
            .noMeter()
            .allFrames()
            .createPlayStream()
            .pipe(new DataRenamerStream(run.schemaManager()))
            .pipe(new CSVEncoderStream(run.schemaManager().frameInterval()))
            .pipe(res);
    }
}
