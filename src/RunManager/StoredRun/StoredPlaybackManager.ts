import {PlaybackManager} from "../PlaybackManager";
import {StoredRun} from "./StoredRun";
import {pipeline, Readable, Stream, Writable} from "stream";
import {bindThis} from "../../Util/util";

import {ChunkCounter, ChunkLimiter, EventStreamConsumer, FramerateLimiter, TemporalStream} from "../../StreamUtils";
import {StreamPauser} from "../../StreamUtils/StreamPauser";
import WritableStream = NodeJS.WritableStream;


export class StoredPlaybackManager extends PlaybackManager {
    private _run: StoredRun;
    private _stream: Writable | null;
    private _streamChunks: any;

    constructor(run: StoredRun, convertData: boolean) {
        super("stored", convertData);
        bindThis(StoredPlaybackManager, this);

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

    createStreamChunks() {
        if (this._stream)
            this.stop();

        if (this._run.size() <= this.position()) throw new Error("Attempt to start oversize file stream");

        return {
            readStream: this._run.getDataStream(this.time(), this.convertingEnabled()),
            pauseStream: new StreamPauser(),
            temporalStream: new TemporalStream(this._run.schemaManager().frameInterval() * this._state.scale),
            counter: new ChunkCounter(this.time(), this._run.schemaManager().frameInterval(), "time"),
            limiter: new FramerateLimiter(1000 / this._state.framerate)
        }
    }


    pause() {
        if (!this._stream || !this._streamChunks.pauseStream) throw new Error("Can't play - Playback is stopped!");
        this._streamChunks.pauseStream.pauseStream();
        console.log("PAUSE");
        return super.pause();
    }

    play(): this {
        if (this._stream)  //Handle an un-pause.
            this._streamChunks.pauseStream.resumeStream();

        else {
            this._streamChunks = {
                ...this.createStreamChunks(),
                target: new EventStreamConsumer()
                    .on("data", this.runCB)
                    .on("data", console.log)
                    .on("drain", this.stop)
                    .on("close", this.stop)
                    .on("finish", this.stop)
            }

            this._stream = null;
            for (const v of Object.values(this._streamChunks)) {
                if (this._stream)
                    this._stream = this._stream.pipe(v as Writable);
                else
                    this._stream = v as Writable;
            }
        }

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
}
