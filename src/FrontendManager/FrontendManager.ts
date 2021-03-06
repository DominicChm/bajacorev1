import Express, {Request, Response} from "express"
import {RunManager} from "../RunManager/RunManager";
import {Server, createServer} from "http";
import {ClientManager} from "./ClientManager";
import {logger} from "../Util/logging";
import {StoredRun} from "../RunManager/StoredRun/StoredRun";
import {DataRenamerStream} from "../StreamUtils";
import {CSVEncoderStream} from "../StreamUtils";

const log = logger("FrontendManager");

export interface FrontendOpts {
    port: number
}

/**
 * Sets up and manages all frontend connections and routes. Responsible for
 * initializing the ClientManager.
 */
export class FrontendManager {
    private readonly _app: Express.Application;
    private readonly _server: Server;
    private readonly _clientManager: ClientManager;
    private readonly _runManager: RunManager;

    constructor(opts: FrontendOpts, rm: RunManager) {
        this._app = Express();
        this._server = createServer(this._app);
        this._clientManager = new ClientManager(rm, this._server);
        this._runManager = rm;

        this.setupRoutes();

        this._server.listen(opts.port, () => log(`Listening on ${opts.port}`));
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

        //Force the browser to download the file instead of rendering it.
        res.setHeader('Content-disposition', 'attachment; filename=' + run.metaManager().name() + ".csv");
        res.setHeader("content-type", "text/csv");
        run.getDataStream(0, true)
            .pipe(new DataRenamerStream(run.schemaManager()))
            .pipe(new CSVEncoderStream(run.schemaManager().frameInterval()))
            .pipe(res);
    }
}
