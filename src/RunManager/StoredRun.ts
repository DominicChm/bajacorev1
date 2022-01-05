import * as Path from "path";
import fs, {ensureFile, ensureFileSync, remove, removeSync, existsSync} from "fs-extra";
import {RunHandle} from "./RunHandle";

export const paths = {
    lockFile: "lock",
    data: "data.daq",
}

export class StoredRun extends RunHandle {
    private rootPath: string;
    private isWriting: boolean;
    private _writeStream: fs.WriteStream | undefined;

    constructor(uuid: string, rootPath: string) {
        super(uuid);
        this.rootPath = rootPath;
        this.isWriting = existsSync(this.resolve(paths.lockFile));
    }

    public init(): this {

        return this;
    }

    public lockForWriting(): this {
        ensureFileSync(this.lockfilePath());
        this.isWriting = true;
        this._writeStream = fs.createWriteStream(this.dataPath());

        return this;
    }

    public unlock(): this {
        removeSync(this.lockfilePath());
        this.isWriting = false;

        this._writeStream?.close();
        this._writeStream?.destroy();

        return this;
    }

    public resolve(path: string): string {
        return Path.resolve(this.rootPath, path);
    }

    public writeData(data: Uint8Array) {
        if (!this.isWriting)
            throw new Error("Failed to write to run data - can only write if run is locked!");

        if (!this._writeStream)
            throw new Error("Failed to write to run data - no write stream!");

        this._writeStream.write(data);
    }

    public writeStream() {
        if (!this.isWriting)
            throw new Error("Failed to write to run data - can only write if run is locked!");

        if (!this.writeStream)
            throw new Error("Failed to write to run data - no write stream!");

        return this.writeStream;
    }


    public getFrame(timestamp: number): Uint8Array {
        return new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }

    public dataPath() {
        return this.resolve(paths.data);
    }

    public lockfilePath() {
        return this.resolve(paths.lockFile);
    }

    getPlayStream(timestamp?: number, scale?: number): ReadableStream {
        return undefined as unknown as ReadableStream;
    }

    getHeader(): Uint8Array {
        return new Uint8Array([]);
    }
}
