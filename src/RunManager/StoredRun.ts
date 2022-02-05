import * as Path from "path";
import fs from "fs-extra";
import {PlayOptions, RunHandle} from "./RunHandle";
import {RealtimeRun} from "./RealtimeRun";

export const paths = {
    lockFile: "lock",
    data: "data.daq",
    schema: "schema.json"
}

/**
 * Describes a run that happened in the past. Allows playback and writing of data.
 */
export class StoredRun extends RunHandle {
    private readonly rootPath: string;
    private isWriting: boolean;
    private _writeStream: fs.WriteStream | undefined;
    private _size: number = 0;

    constructor(uuid: string, rootPath: string) {
        super("stored", uuid, Path.resolve(rootPath, paths.schema));
        this.unlink = this.unlink.bind(this);

        this.rootPath = rootPath;
        this.isWriting = fs.existsSync(this.resolve(paths.lockFile));
    }

    public lockForWriting(): this {
        fs.ensureFileSync(this.lockfilePath());
        this.isWriting = true;
        this._writeStream = fs.createWriteStream(this.dataPath());

        return this;
    }

    public unlock(): this {
        fs.removeSync(this.lockfilePath());
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

    public writeRaw(data: Uint8Array) {
        if (!this.isWriting)
            throw new Error("Failed to write to run data - can only write if run is locked!");

        if (!this._writeStream)
            throw new Error("Failed to write to run data - no write stream!");

        this._writeStream.write(data);
    }

    /**
     * Encodes and writes data that matches this run's schema.
     * @param data
     */
    public writeFrame(data: any) {
        const buf = this.schemaManager().storedCType().allocLE(data);
        console.log(buf);
        this.writeRaw(new Uint8Array(buf));
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

    play(opts: PlayOptions, callback: (frame: any) => void): any {
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

        //Copy the schema from the run we're linking to.
        this.schemaManager().load(run.schemaManager().schema());
        const pm = run.play({}, frame => {
            this.writeFrame(frame);
        });

        this.unlink = () => {
            this.unlock();
            pm.stop();
            this.emit("unlink");
            return this;
        }

        run.on("formatChanged", this.unlink);
        return this;
    }

    unlink(): this {
        this.unlock();
        this.emit("unlink");
        return this;
    }

    delete(): this {
        this.unlock();
        fs.rmSync(this.rootPath, {recursive: true});
        this.destroy();
        return this;
    }

    //TODO: Implement periodic size polling.
    size(): number {
        if (this.destroyed())
            return 0;

        if ((this.isWriting || !this._size) && fs.existsSync(this.dataPath())) //Only update size if actively writing or no previous size.
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
