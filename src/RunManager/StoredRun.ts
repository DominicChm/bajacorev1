import * as Path from "path";
import fs, {ensureFile, ensureFileSync, remove, removeSync, existsSync} from "fs-extra";
import {RunHandle} from "./RunHandle";
import {RealtimeRun} from "./RealtimeRun";
import {DAQSchema} from "../ModuleManager/interfaces/DAQSchema";

export const paths = {
    lockFile: "lock",
    data: "data.daq",
}

const testSchema: DAQSchema = {
    name: "Schema",
    modules: [
        {
            name: "Brake Pressure",
            id: "AA:BB:CC:DD:EE:FF",
            description: "Test brake pressure sensor",
            version: 0,
            type: "brake_pressure",
            config: {
                config_v: 1
            }
        }
    ]
}

export class StoredRun extends RunHandle {
    private readonly rootPath: string;
    private isWriting: boolean;
    private _writeStream: fs.WriteStream | undefined;
    private _size: number = 0;

    constructor(uuid: string, rootPath: string) {
        //TODO: Read stored schema!
        super("stored", uuid, testSchema);
        this.rootPath = rootPath;
        this.isWriting = existsSync(this.resolve(paths.lockFile));
        this.schemaManager().load({name: "STOREDRUNSCHEM", modules: []});
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

    public locked(): boolean {
        return this.isWriting;
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

    getPlayStream(timestamp?: number, scale?: number): any {
        return undefined as unknown as any;
    }

    getHeader(): Uint8Array {
        return new Uint8Array([]);
    }

    //Links this stored run to a realtime run. It will write chunks from the realtime run until stopped.
    link(run: RealtimeRun): this {
        if (!run)
            throw new Error("Link failed - Run doesn't exist!");

        this.lockForWriting();
        this.writeData(run.getHeader());

        return this;
    }

    unlink(): this {
        this.unlock();
        return this;
    }

    delete(): this {
        this.unlock();
        fs.rmSync(this.rootPath, {recursive: true});
        this.destroy();
        return this;
    }

    size(): number {
        if (this.destroyed())
            return 0;

        if ((this.isWriting || !this._size) && existsSync(this.dataPath())) //Only update size if actively writing or no previous size.
            return this._size = fs.statSync(this.dataPath()).size;
        else
            return this._size;
    }

    public toJSON() {
        return {
            ...super.toJSON(),
            locked: this.locked(),
            size: this.size(),
        }
    }

    destroy() {
        this.unlink();
        super.destroy();

    }
}
