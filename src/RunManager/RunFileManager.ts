import {StoredRun} from "./StoredRun";
import fs from "fs-extra"
import * as Path from "path";
import {TypedEmitter} from "tiny-typed-emitter";

interface RunManagerEvents {
    run_change: () => void
}

export class RunFileManager extends TypedEmitter<RunManagerEvents>{
    private rootDir: string;
    private runs: StoredRun[] = [];

    constructor(rootDir: string) {
        super();
        this.rootDir = Path.resolve(rootDir);

        this.setupRootDir()
            .catch(console.error);
    }

    public getRuns(): StoredRun[] {
        return this.runs ?? [];
    }

    private async readRuns(): Promise<StoredRun[]> {
        //Returns read runs. Ignores directories with a `lock` file in them (those are being written)
        if (!fs.existsSync(this.rootDir))
            throw new Error(`Root directory >${this.rootDir}< doesn't exist!`);

        const runDirs = await fs.readdir(this.rootDir);
        this.runs = runDirs.map(dir => new StoredRun(dir, Path.resolve(this.rootDir, dir)));
        return this.runs;
    }

    //Sets up the root directory to be ready for runs.
    public async setupRootDir() {
        fs.ensureDirSync(this.rootDir);

        //Cleanup any locks that exist from a bad shutdown.
        (await this.readRuns()).forEach(r => r.unlock());
    }

    public initRunStorage(uuid: string): StoredRun {
        const runFolder = this.resolve(uuid);
        fs.ensureDirSync(runFolder);

        const run = new StoredRun(uuid, runFolder);

        this.runs.push(run);
        return run;
    }

    private resolve(path: string) {
        return Path.resolve(this.rootDir, path);
    }
}
