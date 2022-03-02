import {PlaybackManager} from "../PlaybackManager";
import {StoredRun} from "./StoredRun";
import {pipeline, Readable, Stream, Writable} from "stream";
import {bindThis} from "../../Util/util";

import {ChunkCounter, ChunkLimiter, EventStreamConsumer, FramerateLimiter, TemporalStream} from "../../StreamUtils";
import {StreamPauser} from "../../StreamUtils/StreamPauser";
import WritableStream = NodeJS.WritableStream;
import {pipeChunks} from "../../StreamUtils/PipeChunks";
import {Throttle} from "../../Util/Throttle";


export class StoredPlaybackManager extends PlaybackManager {
    private _run: StoredRun;
    private _stream: Writable | null;
    private _streamChunks: any;

    private _seekThrottle: Throttle;

    constructor(run: StoredRun, convertData: boolean) {
        super("stored", convertData);
        bindThis(StoredPlaybackManager, this);

        this._run = run;
        this._run.on("destroyed", this.destroy);

        this._seekThrottle = new Throttle(this._execSeek, 100);
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

        this._state.time = time;

        this._seekThrottle.call();

        return this;
    }

    _execSeek() {
        try {
            this.stop();
            this.setFrameLimit(1);
            this.play();
        } catch (e) {
            console.error(e);
        }

    }

    createStreamChunks() {
        if (this._stream)
            this.stop();

        if (this._run.size() <= this.position()) throw new Error("Attempt to start oversize file stream");

        return {
            readStream: this._run.getDataStream(this.time(), this.convertingEnabled()),
            temporalStream: new TemporalStream(this._run.schemaManager().frameInterval() * this._state.scale),
            counter: new ChunkCounter(this.time(), this._run.schemaManager().frameInterval(), "time"),
            limiter: new FramerateLimiter(1000 / this._state.framerate)
        }
    }


    pause() {
        if (!this._stream || !this._streamChunks.temporalStream) throw new Error("Can't play - Playback is stopped!");
        this._streamChunks.temporalStream.pauseStream();
        console.log("PAUSE");
        return super.pause();
    }

    play(): this {
        if (this._stream)  //Handle an un-pause.
            this._streamChunks.temporalStream.resumeStream();

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

            this._stream = pipeChunks(this._streamChunks);
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
        this._streamChunks = null;

        return super.stop();
    }
}
