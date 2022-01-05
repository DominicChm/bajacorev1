import {RealtimeRun} from "./RealtimeRun";
import {ModuleManager} from "../ModuleManager/ModuleManager";
import {StoredRun} from "./StoredRun";
import {FileManager} from "./FileManager";
import {RunHandle} from "./RunHandle";
import EventEmitter from "events";
import TypedEmitter from "typed-emitter"
import {v4 as uuidv4} from "uuid";

export type Newable<T> = { new(...args: any[]): T; };

interface RunManagerEvents {
    run_init: () => void
}

export class RunManager extends (EventEmitter as new () => TypedEmitter<RunManagerEvents>) {
    private fileManager: FileManager | undefined;
    private moduleManager: ModuleManager | undefined;
    private _runs: RunHandle[] = [];

    constructor(fileManager?: FileManager | null, moduleManager?: ModuleManager | null) {
        super();
        this.fileManager = fileManager ?? undefined;
        this.moduleManager = moduleManager ?? undefined;
    }

    public createPlayStream(run: RunHandle, timeStamp?: number, scale?: number) {
        if (run instanceof RealtimeRun && !(timeStamp == null && scale == null))
            throw new Error("Error playing: Scale and timestamp are not supported for realtime runs!");

        if (run instanceof RealtimeRun && this.moduleManager == null)
            throw new Error("Error playing: Can't play realtime run - no ModuleManager instance!")

        if (run instanceof StoredRun && this.fileManager == null)
            throw new Error("Error playing: Can't play stored run - no FileManager instance!")

        //Create either realtime or historical pipe here.

    }

    public runs(): RunHandle[] {
        //Return all run objects
        this._runs = [];

        if (this.fileManager)
            this._runs = this._runs.concat(this.fileManager.getRuns());
        if (this.moduleManager)
            this._runs = this._runs.concat(this.moduleManager.getRuns());

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
    public initRunStorage(run: string | RealtimeRun) {
        if (this.fileManager == null)
            throw new Error("Error starting run - no filemanager!");

        //Resolve uuid to a run.
        if (typeof run === "string")
            run = this.getRunById(run, RealtimeRun);

        //const uuid = uuidv4(); //Select the new run's uuid.

        const storedRun = this.fileManager.initRunStorage(run);

        this.emit("run_init");
    }

}
