import {RunFileManager} from "../RunManager/RunFileManager";
import Path from "path";
import {ensureDirSync, existsSync, writeJsonSync} from "fs-extra";
import {defaultDAQSchema} from "../ModuleManager/interfaces/DAQSchema";

export const PATHS = {
    runData: "run-data",
    schema: "schema.json"
}

export class DAQFileManager {
    private readonly _runFileManager: RunFileManager | undefined;
    private readonly rootDir: string;

    constructor(rootDir: string, createRunManager: boolean) {
        this.rootDir = Path.resolve(rootDir);

        ensureDirSync(this.resolve(PATHS.runData));

        if (!existsSync(this.resolve(PATHS.schema)))
            writeJsonSync(this.resolve(PATHS.schema), defaultDAQSchema);

        if (createRunManager)
            this._runFileManager = new RunFileManager(this.resolve(PATHS.runData));
    }

    private loadSchema() {

    }

    private resolve(path: string) {
        return Path.resolve(this.rootDir, path);
    }

    runFileManager(): RunFileManager | undefined {
        return this._runFileManager;
    }
}
