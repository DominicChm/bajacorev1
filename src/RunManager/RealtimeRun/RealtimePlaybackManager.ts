import {PlaybackManager} from "../PlaybackManager";
import {RealtimeRun} from "./RealtimeRun";
import {bindThis} from "../../Util/util";


export class RealtimePlaybackManager extends PlaybackManager {
    private _run: RealtimeRun;

    constructor(run: RealtimeRun, convertData: boolean) {
        super("realtime", convertData);
        bindThis(RealtimePlaybackManager, this);

        this._run = run;
        this._run.on("destroyed", this.destroy);
        this._run.on("data", this.meterData);
    }

    destroy(): this {
        this.stop();
        this._run.off("data", this.meterData);
        this._run.off("destroyed", this.destroy);
        return this;
    }

    setScale(scale?: number): this {
        throw new Error("Can't scale a realtime run");
    }

    setFramerate(rate?: number): this {
        return super.setFramerate(rate);
    }

    seekTo(time?: number): this {
        throw new Error("Can't seek a realtime run");
    }

    play(): this {
        this._state.time = 0;
        return super.play();
    }

    stop(): this {
        return super.stop();
    }

    pause(): this {
        return this.stop();
    }

    protected meterData(data: any) {
        if (this._state.playing) this._state.time += this._run.schemaManager().frameInterval() ?? 0;
        super.meterData(data);
    }
}
