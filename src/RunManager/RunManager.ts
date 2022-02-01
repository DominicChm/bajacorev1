import {RealtimeRun} from "./RealtimeRun";
import {ModuleManager} from "../ModuleManager/ModuleManager";
import {StoredRun} from "./StoredRun";
import {RunFileManager} from "./RunFileManager";
import {RunHandle} from "./RunHandle";
import EventEmitter from "events";
import {v4 as uuidv4} from "uuid";
import {Capabilties} from "./interfaces/capabilties";
import {TypedEmitter} from "tiny-typed-emitter";

export type Newable<T> = { new(...args: any[]): T; };

interface RunManagerEvents {
    run_change: (runs: RunHandle[]) => void
}

/**
 * Manages all components responsible for managing run data.
 * Central component for creating, removing, reading, and storing runs.
 */
export class RunManager extends TypedEmitter<RunManagerEvents> {
    private _fileManager: RunFileManager | undefined;
    private _moduleManager: ModuleManager | undefined;
    private _runs: RunHandle[] = [];

    constructor(fileManager?: RunFileManager | null, moduleManager?: ModuleManager | null) {
        super();
        this._fileManager = fileManager ?? undefined;
        this._fileManager?.on("run_change", this.emitRunsChange.bind(this));

        this._moduleManager = moduleManager ?? undefined;
    }

    private emitRunsChange() {
        this.emit("run_change", this.runs());
    }

    //Helper function to guard filemanager-reliant functions
    private checkFM(): RunFileManager {
        if (this._fileManager == null)
            throw new Error("Error - no filemanager!");

        return this._fileManager;
    }

    public runs(): RunHandle[] {
        //Return all run objects
        this._runs = [];

        if (this._fileManager)
            this._runs = this._runs.concat(this._fileManager.getRuns());

        if (this._moduleManager)
            this._runs = this._runs.concat(this._moduleManager.getRuns());

        //Filter destroyed runs.
        this._runs = this._runs.filter(r => !(r instanceof StoredRun && r.destroyed()));
        return this._runs;
    }

    public getRunById<T extends RunHandle>(uuid: string, runType?: Newable<T>): T | undefined {
        //Return the run object with the given ID. Throws if not found
        const run = this.runs().find(run => run.uuid() === uuid && (!runType || run instanceof runType));
        return run as T;
    }

    public resolveRun<T extends RunHandle>(run: string | T): T {
        let r: string | T | undefined = run;

        if (typeof run === "string")
            r = this.getRunById<T>(run);

        if (!r)
            throw new Error(`No run could be found with ID >${run}<`);

        return r as T;
    }

    //Begins to store the realtime run of uuid.
    public beginRunStorage(run: string | RealtimeRun) {
        const fm = this.checkFM()
        fm.initRunStorage(uuidv4()).link(this.resolveRun(run));

        this.emitRunsChange();
    }

    public stopRunStorage(run: string | StoredRun) {
        this.resolveRun(run).unlink();
        this.emitRunsChange();
    }

    public deleteStoredRun(run: string | StoredRun) {
        if (this._fileManager == null)
            throw new Error("Error starting run - no filemanager!");

        run = this.resolveRun(run);

        run.unlink().delete();

        this.emitRunsChange();
    }

    public fileManager() {
        return this._fileManager;
    }

    public moduleManager() {
        return this._moduleManager;
    }

    capabilities(): Capabilties {
        return {
            runTypes: {
                realtime: !!this._moduleManager,
                stored: !!this._fileManager
            }
        }
    }

}
