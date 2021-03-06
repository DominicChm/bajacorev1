import Path from "path";
import {ensureDirSync, existsSync, writeJsonSync} from "fs-extra";
import {defaultDAQSchema} from "../SchemaManager/interfaces/DAQSchema";

export const PATHS = {
    runData: "run-data",
    schema: "realtime-schema.json",
    realtimeMeta: "realtime-meta.json"
}

export class DAQPathManager {
    private readonly rootDir: string;

    constructor(rootDir: string) {
        this.rootDir = Path.resolve(rootDir);

        ensureDirSync(this.resolve(PATHS.runData));

        if (!existsSync(this.resolve(PATHS.schema)))
            writeJsonSync(this.resolve(PATHS.schema), defaultDAQSchema);
    }

    private resolve(path: string) {
        return Path.resolve(this.rootDir, path);
    }

    RunDataPath() {
        return this.resolve(PATHS.runData)
    }

    RealtimeSchemaPath() {
        return this.resolve(PATHS.schema)
    }

    RealtimeMetaPath() {
        return this.resolve(PATHS.realtimeMeta);
    }
}
