import {RealtimeRun} from "./RealtimeRun";
import {ModuleManager} from "../ModuleManager/ModuleManager";
import {StoredRun} from "./StoredRun";
import {FileManager} from "./FileManager";
import {RunHandle} from "./RunHandle";
import EventEmitter from "events";
import TypedEmitter from "typed-emitter"
import {v4 as uuidv4} from "uuid";
import {Capabilties} from "./interfaces/capabilties";

export type Newable<T> = { new(...args: any[]): T; };

interface RunManagerEvents {
    run_change: () => void
}

/**
 * Manages all components responsible for managing run data.
 * Central component for creating, removing, reading, and storing runs.
 */
export class RunManager extends (EventEmitter as new () => TypedEmitter<RunManagerEvents>) {
    private fileManager: FileManager | undefined;
    private moduleManager: ModuleManager | undefined;
    private _runs: RunHandle[] = [];

    constructor(fileManager?: FileManager | null, moduleManager?: ModuleManager | null) {
        super();
        this.fileManager = fileManager ?? undefined;
        this.moduleManager = moduleManager ?? undefined;
    }

    public runs(): RunHandle[] {
        //Return all run objects
        this._runs = [];

        if (this.fileManager)
            this._runs = this._runs.concat(this.fileManager.getRuns());

        if (this.moduleManager)
            this._runs = this._runs.concat(this.moduleManager.getRuns());

        //Filter destroyed runs.
        this._runs = this._runs.filter(r => !(r instanceof StoredRun && r.destroyed()));
        return this._runs;
    }

    public getRunById<T extends RunHandle>(uuid: string, runType?: Newable<T>): T {
        //Return the run object with the given ID. Throws if not found
        const run = this.runs().find(run => run.uuid() === uuid && (!runType || run instanceof runType));

        if (!run)
            throw new Error(`No run could be found with ID >${uuid}<`);

        return run as T;
    }

    //Begins to store the realtime run of uuid.
    public beginRunStorage(run: string | RealtimeRun) {
        if (this.fileManager == null)
            throw new Error("Error starting run - no filemanager!");

        //Resolve uuid to a run.
        if (typeof run === "string")
            run = this.getRunById(run, RealtimeRun);

        if (!run)
            throw new Error("Couldn't resolve input run.");
        //const uuid = uuidv4(); //Select the new run's uuid.

        const storedRun = this.fileManager
            .initRunStorage(uuidv4())
            .link(run);

        this.emit("run_change");
    }

    public stopRunStorage(run: string | StoredRun) {
        if (this.fileManager == null)
            throw new Error("Error starting run - no filemanager!");

        //Resolve uuid to a run.
        if (typeof run === "string")
            run = this.getRunById(run, StoredRun);

        if (!run)
            throw new Error("Couldn't resolve input run.");

        run.unlink();

        this.emit("run_change");
    }

    public deleteStoredRun(run: string | StoredRun) {
        if (this.fileManager == null)
            throw new Error("Error starting run - no filemanager!");

        //Resolve uuid to a run.
        if (typeof run === "string")
            run = this.getRunById(run, StoredRun);

        if (!run)
            throw new Error("Couldn't resolve input run.");

        run.unlink().delete();

        this.emit("run_change");
    }

    capabilities(): Capabilties {
        return {
            runTypes: {
                realtime: !!this.moduleManager,
                stored: !!this.fileManager
            }
        }
    }

}
