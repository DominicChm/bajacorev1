import {StoredRun} from "./StoredRun";
import fs from "fs-extra"
import * as Path from "path";
import {v4 as uuidv4} from 'uuid';
import {RealtimeRun} from "./RealtimeRun";

export class FileManager {
    private rootDir: string;
    private runs: StoredRun[] = [];

    constructor(rootDir: string) {
        this.rootDir = Path.resolve(rootDir);

        this.setupRootDir()
            .catch(console.error);
    }

    public getRuns(): StoredRun[] {
        return this.runs ?? [];
    }

    private async readRuns(): Promise<StoredRun[]> {
        //Returns read runs. Ignores directories with a `lock` file in them (those are being written)
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

    public initRunStorage(sourceRun: RealtimeRun): StoredRun {
        const runFolder = this.resolve(sourceRun.uuid());
        fs.ensureDirSync(runFolder);
        const run = new StoredRun(sourceRun.uuid(), runFolder)
            .init()
            .lockForWriting();

        this.runs.push(run);
        return run;
    }

    deleteRunDirectory() {
        throw new Error("UNIMPLEMENTED");
    }

    private resolve(path: string) {
        return Path.resolve(this.rootDir, path);
    }
}
