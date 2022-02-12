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

    //TODO: MAKE SURE THIS LANDS ON A MULTIPLE OF THE TYPE.
    seekTo(time?: number): PlaybackManager {
        throw new Error("Can't seek a realtime run");
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
