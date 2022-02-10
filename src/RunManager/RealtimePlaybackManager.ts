import {PlaybackManager} from "./PlaybackManager";
import {RealtimeRun} from "./RealtimeRun";

export class RealtimePlaybackManager extends PlaybackManager {
    private _run: RealtimeRun;

    constructor(run: RealtimeRun) {
        super("realtime");
        this.meterData = this.meterData.bind(this);
        this.destroy = this.destroy.bind(this);

        this._run = run;
        this._run.on("destroyed", this.destroy);
        this._run.on("data", this.meterData);
    }

    destroy(): PlaybackManager {
        this.stop();
        this._run.off("data", this.meterData);
        this._run.off("destroyed", this.destroy.bind(this));
        return this;
    }

    setScale(scale?: number): PlaybackManager {
        throw new Error("Can't scale a realtime run");
    }

    setFramerate(rate?: number): PlaybackManager {
        return super.setFramerate(rate);
    }

    seekTo(time?: number): PlaybackManager {
        throw new Error("Can't seek a realtime run");
    }

    play(): PlaybackManager {
        return super.play();
    }

    stop(): PlaybackManager {
        return super.stop();
    }
}
