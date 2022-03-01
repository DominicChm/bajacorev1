import {StoredRun} from "./StoredRun/StoredRun";
import fs from "fs-extra"
import * as Path from "path";
import {TypedEmitter} from "tiny-typed-emitter";
import {bindThis} from "../Util/util";

interface StoredRunManagerEvents {
    run_change: () => void
}

interface StoredRunManagerOptions {
    runDataDirectory: string
}

/**
 * Responsible for managing stored runs
 */
export class StoredRunManager extends TypedEmitter<StoredRunManagerEvents> {
    private runs: StoredRun[] = [];
    private readonly _opts: StoredRunManagerOptions;

    constructor(opts: StoredRunManagerOptions) {
        super();
        bindThis(StoredRunManager, this);

        this._opts = {
            runDataDirectory: Path.resolve(opts.runDataDirectory),
        };
        this.setupRootDir()
            .catch(console.error);
    }

    private runDataDir() {
        return this._opts.runDataDirectory;
    }

    public getRuns(): StoredRun[] {
        return this.runs ?? [];
    }

    private async readRuns(): Promise<StoredRun[]> {
        //Returns read runs.
        if (!fs.existsSync(this.runDataDir()))
            throw new Error(`Root directory >${this.runDataDir()}< doesn't exist!`);

        const runDirs = await fs.readdir(this.runDataDir());
        this.runs = runDirs.map(dir => new StoredRun(dir, Path.resolve(this.runDataDir(), dir)));
        this.runs.forEach(r => r.metaManager().on("changed", () => this.emit("run_change")));
        return this.runs;
    }

    //Sets up the root directory to be ready for runs.
    public async setupRootDir() {
        fs.ensureDirSync(this.runDataDir());

        //Cleanup any locks that exist from a bad shutdown.
        (await this.readRuns()).forEach(r => r.unlock());
    }

    public createStoredRun(uuid: string): StoredRun {
        const runFolder = this.resolve(uuid);
        fs.ensureDirSync(runFolder);

        const run = new StoredRun(uuid, runFolder);

        this.runs.push(run);
        return run;
    }

    private resolve(path: string) {
        return Path.resolve(this.runDataDir(), path);
    }
}
