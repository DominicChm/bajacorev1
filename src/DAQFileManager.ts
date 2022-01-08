import {RunFileManager} from "./RunManager/RunFileManager";
import Path from "path";
import {ensureDirSync} from "fs-extra";

export const PATHS = {
    runData: "run-data",
    schemas: "schemas"
}

export class DAQFileManager {
    private readonly _runFileManager: RunFileManager | undefined;
    private readonly rootDir: string;

    constructor(rootDir: string, createRunManager: boolean) {
        this.rootDir = Path.resolve(rootDir);

        ensureDirSync(this.resolve(PATHS.runData));
        ensureDirSync(this.resolve(PATHS.schemas));


        if (createRunManager)
            this._runFileManager = new RunFileManager(this.resolve(PATHS.runData));

    }

    private resolve(path: string) {
        return Path.resolve(this.rootDir, path);
    }

    runFileManager(): RunFileManager | undefined {
        return this._runFileManager;
    }
}
