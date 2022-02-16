import {PlaybackManager} from "../PlaybackManager";
import {RealtimeRun} from "../RealtimeRun/RealtimeRun";
import {StoredRun} from "./StoredRun";
import fs from "fs-extra";
import {CTypeStream} from "../CTypeStream";
import {StreamMeter} from "../StreamMeter";
import {EventStreamConsumer} from "../EventStreamConsumer";

export class StoredPlaybackManager extends PlaybackManager {
    private _run: StoredRun;
    private _streamMeter: StreamMeter | undefined;

    constructor(run: StoredRun) {
        super("stored");
        this.meterData = this.meterData.bind(this);
        this.destroy = this.destroy.bind(this);

        this._run = run;
        this._run.on("destroyed", this.destroy);
    }

    destroy(): this {
        this.stop();
        this._run.off("destroyed", this.destroy.bind(this));
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
        super.seekTo(time);


        // Read the current frame and callback it to update the client.
        fs.open(this._run.dataPath(), 'r', (status, fd) => {
            if (status) throw new Error(status.message);
            const ct = this._run.schemaManager().storedCType();
            const b = Buffer.alloc(ct.size);
            fs.read(fd, b, 0, ct.size, this.position() * ct.size, (err, num) => {
                //console.log(b);
                this._callback(ct.readLE(b.buffer, b.byteOffset));
            });
        });

        return this;
    }

    play(): this {
        this._streamMeter = fs.createReadStream(this._run.dataPath(), {start: this.position()})
            .pipe(new CTypeStream(this._run.schemaManager().storedCType()))
            .pipe(new StreamMeter(this._run.schemaManager().frameInterval()))

        this._streamMeter.pipe(new EventStreamConsumer())
            .on("data", this.meterData);


        return super.play();
    }

    position(): number {
        let frameInterval = this._run.schemaManager().frameInterval();
        if (frameInterval == null) throw new Error("Schema frameinterval is null.");
        return Math.floor(this.time() / frameInterval);
    }

    stop(): this {
        this._streamMeter?.destroy();
        return super.stop();
    }
}
