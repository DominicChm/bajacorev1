import {RealtimeRun} from "./RealtimeRun";
import {ModuleManager} from "../ModuleManager/ModuleManager";
import {StoredRun} from "./StoredRun";
import {StoredRunManager} from "./StoredRunManager";
import {RunHandle} from "./RunHandle";
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
    private readonly _fileManager: StoredRunManager | undefined;
    private readonly _moduleManager: ModuleManager | undefined;
    private _runs: RunHandle[] = [];

    constructor(fileManager?: StoredRunManager | null, moduleManager?: ModuleManager | null) {
        super();
        this._fileManager = fileManager ?? undefined;
        this._fileManager?.on("run_change", this.emitRunsChange.bind(this));

        this._moduleManager = moduleManager ?? undefined;
    }

    private emitRunsChange() {
        this.emit("run_change", this.runs());
    }

    /**
     * Helper function to guard methods that need a FileManager to work.
     * @private
     */
    private checkFM(): StoredRunManager {
        if (this._fileManager == null)
            throw new Error("Error - no filemanager!");

        return this._fileManager;
    }

    /**
     * Returns all held runs. Not cached, so always up-to-date.
     */
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

    /**
     * Find a run which is an instance of the passed run type, or any. Returns undefined if not found.
     * @param uuid - The UUID of the run to attempt to find
     * @param runType - The class to filter findable runs by (Realtime or Stored)
     */
    public getRunById<T extends RunHandle>(uuid: string, runType?: Newable<T>): T | undefined {
        const run = this.runs().find(run => run.uuid() === uuid && (!runType || run instanceof runType));
        return run as T;
    }

    /**
     * Resolves either a run or string to a valid run. If one isn't found, this method throws.
     * @param run - A Run or run UUID
     * @param runType - Optional - the type of run to resolve.
     */
    public resolveRun<T extends RunHandle>(run: string | T, runType?: Newable<T>): T {
        let r: string | T | undefined = run;

        if (typeof run === "string")
            r = this.getRunById<T>(run, runType);

        if (!r)
            throw new Error(`No run could be found with ID >${run}<`);

        return r as T;
    }

    /**
     * Initializes the storage of a RealtimeRun into a StoredRun.
     * @param run
     */
    public beginRunStorage(run: string | RealtimeRun) {
        const fm = this.checkFM();
        //TODO: Use the play interface!
        const realtimeRun = this.resolveRun(run, RealtimeRun);
        fm.initRunStorage(uuidv4()).link(realtimeRun);

        this.emitRunsChange();
    }

    /**
     * Unlinks a StoredRun from a RealtimeRun.
     * @param run - A run or UUID to stop
     */
    public stopRunStorage(run: string | StoredRun) {
        this.resolveRun(run).unlink();
        this.emitRunsChange();
    }

    /**
     * What the name says - deletes a stored run. This action cannot be undone.
     * @param run - A run or UUID to delete
     */
    public deleteStoredRun(run: string | StoredRun) {
        this.resolveRun(run, StoredRun).unlink().delete();
        this.emitRunsChange();
    }

    public fileManager() {
        return this._fileManager;
    }

    public moduleManager() {
        return this._moduleManager;
    }

    /**
     * Returns a simple object describing what capabilities this RunManager has, depending on what modules have been
     * loaded.
     */
    capabilities(): Capabilties {
        return {
            runTypes: {
                realtime: !!this._moduleManager,
                stored: !!this._fileManager
            }
        }
    }

}
