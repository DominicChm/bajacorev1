import * as Path from "path";
import fs from "fs-extra";
import {RunHandle} from "../RunHandle";
import {RealtimeRun} from "../RealtimeRun/RealtimeRun";
import {cpSync} from "fs";
import {StoredPlaybackManager} from "./StoredPlaybackManager";
import {bindThis} from "../../Util/util";
import {Readable, Stream} from "stream";
import {CTypeStream, DataConverterStream} from "../../StreamUtils";

export const paths = {
    lockFile: "lock",
    data: "data.daq",
    schema: "schema.json",
    meta: "meta.json",
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
        super("stored", uuid, Path.resolve(rootPath, paths.schema), Path.resolve(rootPath, paths.meta), false);
        bindThis(StoredRun, this);

        this._rootPath = rootPath;
        this._isWriting = fs.existsSync(this.resolve(paths.lockFile));
        this.schemaManager().setAllowBreaking(false);
    }

    getPlayManager(convertData: boolean): StoredPlaybackManager {
        return new StoredPlaybackManager(this, convertData);
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
        this.writeRaw(new Uint8Array(buf));
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
            .getPlayManager(false)
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
        this.destroy();
        fs.rmSync(this._rootPath, {recursive: true});
        return this;
    }

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

    getDataStream(time: number, convert: boolean): Readable {
        let frameInterval = this.schemaManager().frameInterval();
        if (frameInterval == null) throw new Error("Schema frameinterval is null.");
        let startPosition = Math.floor(time / frameInterval) * this.schemaManager().storedCType().size;

        const s = fs.createReadStream(this.dataPath(), {start: startPosition})
            .pipe(new CTypeStream(this.schemaManager().storedCType()));

        if (convert)
            return s.pipe(new DataConverterStream(this.schemaManager().instanceManager()));
        else
            return s;
    }

    getRawStream(time: number) {
        let frameInterval = this.schemaManager().frameInterval();
        if (frameInterval == null) throw new Error("Schema frameinterval is null.");
        let startPosition = Math.floor(time / frameInterval) * this.schemaManager().storedCType().size;

        return fs.createReadStream(this.dataPath(), {start: startPosition})
    }
}
