import * as Path from "path";
import fs from "fs-extra";
import {RunHandle} from "../RunHandle";
import {RealtimeRun} from "../RealtimeRun/RealtimeRun";
import {cpSync} from "fs";
import {PlaybackManager} from "../PlaybackManager";
import {StoredRunManager} from "../StoredRunManager";
import {StoredPlaybackManager} from "./StoredPlaybackManager";

export const paths = {
    lockFile: "lock",
    data: "data.daq",
    schema: "schema.json"
}

/**
 * Describes a run that happened in the past. Allows playback and writing of data.
 */
export class StoredRun extends RunHandle {
    private readonly _rootPath: string;
    private _isWriting: boolean;
    private _writeStream: fs.WriteStream | undefined;
    private _size: number = 0;

    constructor(uuid: string, rootPath: string) {
        super("stored", uuid, Path.resolve(rootPath, paths.schema));
        this.unlink = this.unlink.bind(this);
        this.writeFrame = this.writeFrame.bind(this);

        this._rootPath = rootPath;
        this._isWriting = fs.existsSync(this.resolve(paths.lockFile));
        this.schemaManager().setAllowBreaking(false);
    }

    getPlayManager(): StoredPlaybackManager {
        return new StoredPlaybackManager(this);
    }

    public lockForWriting(): this {
        fs.ensureFileSync(this.lockfilePath());
        this._isWriting = true;
        this._writeStream = fs.createWriteStream(this.dataPath());

        return this;
    }

    public unlock(): this {
        fs.removeSync(this.lockfilePath());
        this._isWriting = false;
        this._writeStream?.close();
        this._writeStream?.destroy();

        return this;
    }

    public locked(): boolean {
        return this._isWriting;
    }

    public resolve(path: string): string {
        return Path.resolve(this._rootPath, path);
    }

    public writeRaw(data: Uint8Array) {
        if (!this._isWriting)
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
        //console.log(buf);
        this.writeRaw(new Uint8Array(buf));
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

    //Links this stored run to a realtime run. It will write chunks from the realtime run until stopped.
    link(run: RealtimeRun): this {
        if (!run)
            throw new Error("Link failed - Run doesn't exist!");

        this.lockForWriting();

        //Copy the schema from the run we're linking to.
        this.schemaManager()
            .setAllowBreaking(true)
            .load(run.schemaManager().schema())
            .setAllowBreaking(false);

        const pm = run
            .getPlayManager()
            .callback(this.writeFrame)
            .setFramerate(0)
            .play();

        this.unlink = () => {
            this.unlock();
            pm.stop();
            this.emit("unlink");
            return this;
        }

        //Save a copy of the original schema in case future changes bork it.
        cpSync(this.schemaManager().filePath(), Path.resolve(Path.dirname(this.schemaManager().filePath()), "schema.json.bak"));

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
        fs.rmSync(this._rootPath, {recursive: true});
        this.destroy();
        return this;
    }

    //TODO: Implement periodic size polling.
    size(): number {
        if (this.destroyed())
            return 0;

        if ((this._isWriting || !this._size) && fs.existsSync(this.dataPath())) //Only update size if actively writing or no previous size.
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
