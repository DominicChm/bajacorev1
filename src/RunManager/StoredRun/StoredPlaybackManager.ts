import {PlaybackManager} from "../PlaybackManager";
import {RealtimeRun} from "../RealtimeRun/RealtimeRun";
import {StoredRun} from "./StoredRun";
import fs from "fs-extra";
import {CTypeStream} from "../CTypeStream";
import {StreamMeter} from "../StreamMeter";
import {EventStreamConsumer} from "../EventStreamConsumer";
import {Stream, Writable} from "stream";
import {DataConverterStream} from "../DataConverterStream";
import {bindClass} from "../../Util/util";

export class StoredPlaybackManager extends PlaybackManager {
    private _run: StoredRun;
    private _stream: Writable | null = null;


    constructor(run: StoredRun, convertData: boolean) {
        super("stored", convertData);
        bindClass(this);

        this._run = run;
        this._run.on("destroyed", this.destroy);
    }

    destroy(): this {
        this.stop();
        this._run.off("destroyed", this.destroy);
        return this;
    }

    setScale(scale?: number): this {
        return super.setScale(scale);
    }

    setFramerate(rate?: number): this {
        return super.setFramerate(rate);
    }

    //Seeks to a point in the run. Time should be in ms.
    seekTo(time?: number): this {
        let frameInterval = this._run.schemaManager().frameInterval();

        if (time == null || frameInterval == null) return this;

        return super.seekTo(time);
    }

    createPlayStream() {
        if (this._stream)
            this.stop();

        if (this._run.size() <= this.position()) throw new Error("Attempt to start oversize file stream");
        this._stream = fs.createReadStream(this._run.dataPath(), {start: this.position()})
            .pipe(new CTypeStream(this._run.schemaManager().storedCType()))
            .pipe(new StreamMeter((this._run.schemaManager().frameInterval() ?? 1) * this._state.scale))

        if (this.convertingEnabled())
            return this._stream.pipe(new DataConverterStream(this._run.schemaManager()));
        else
            return this._stream;
    }

    pause() {
        if (!this._stream) throw new Error("Can't play - Playback is stopped!");
        this._stream.cork();

        return super.pause();
    }

    play(): this {
        if (this._stream)  //Handle an un-pause.
            this._stream.uncork();

        else this.createPlayStream()
            .pipe(new EventStreamConsumer())
            .on("data", this.meterData)
            .on("drain", this.stop)
            .on("close", this.stop)
            .on("finish", this.stop);

        return super.play();
    }


    position(): number {
        let frameInterval = this._run.schemaManager().frameInterval();
        if (frameInterval == null) throw new Error("Schema frameinterval is null.");
        return Math.floor(this.time() / frameInterval) * this._run.schemaManager().storedCType().size;
    }

    stop(): this {
        this._stream?.destroy();
        this._stream = null;
        return super.stop();
    }

    protected meterData(data: any) {
        if (this.shouldIncrementTime()) this._state.time += this._run.schemaManager().frameInterval() ?? 0;
        super.meterData(data);
    }
}
