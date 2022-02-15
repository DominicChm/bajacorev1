import {PlaybackManager} from "../PlaybackManager";
import {RealtimeRun} from "../RealtimeRun/RealtimeRun";
import {StoredRun} from "./StoredRun";
import fs from "fs-extra";
import {CTypeStream} from "../CTypeStream";
import {StreamMeter} from "../StreamMeter";

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

    destroy(): PlaybackManager {
        this.stop();
        this._run.off("destroyed", this.destroy.bind(this));
        return this;
    }

    setScale(scale?: number): PlaybackManager {
        return super.setScale(scale);
    }

    setFramerate(rate?: number): PlaybackManager {
        return super.setFramerate(rate);
    }

    //Seeks to a point in the run. Time should be in ms.
    seekTo(time?: number): PlaybackManager {
        let frameInterval = this._run.schemaManager().frameInterval();

        if (time == null || frameInterval == null) return this;
        const position = Math.floor(time / frameInterval);
        super.seekTo(position);

        // Read the current frame and callback it to update the client.
        fs.open(this._run.dataPath(), 'r', (status, fd) => {
            if (status) throw new Error(status.message);
            const ct = this._run.schemaManager().storedCType();
            const b = Buffer.alloc(ct.size);
            fs.read(fd, b, 0, ct.size, position * ct.size, (err, num) => {
                console.log(b);
                this._callback(ct.readLE(b), time);
            });
        });

        return this;
    }

    play(): PlaybackManager {
        this._streamMeter = fs.createReadStream(this._run.dataPath())
            .pipe(new CTypeStream(this._run.schemaManager().storedCType()))
            .pipe(new StreamMeter(this._run.schemaManager().frameInterval()))
            .on("data", this.meterData);

        return super.play();
    }

    stop(): PlaybackManager {
        this._streamMeter?.destroy();
        return super.stop();
    }
}
