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
    }

    destroy(): this {
        this.stop();
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
        this._run.getDataStream(0, this.convertingEnabled()).on("data", this.runCB.bind(this));
        return super.play();
    }

    stop(): this {
        return super.stop();
    }

    pause(): this {
        return this.stop();
    }

    createPlayStream() {
        throw new Error("Method not implemented.");
    }
}
