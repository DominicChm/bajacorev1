import {TypedEmitter} from "tiny-typed-emitter";
import onChange from "on-change";
import {PlaybackManagerEvents} from "./interfaces/PlayManagerEvents";
import {PlaybackManagerState} from "./interfaces/PlayManagerState";
import * as Process from "process";
import {performance} from "perf_hooks";

export abstract class PlaybackManager extends TypedEmitter<PlaybackManagerEvents> {
    private _frameIsDebounced: boolean = false;
    protected _state: PlaybackManagerState;
    protected _callback: (frame: any) => void;

    protected constructor(playType: "realtime" | "stored") {
        super();
        this._callback = () => {
        };
        this._state = onChange({
            time: 0,
            playing: false,
            scale: 1,
            framerate: 10,
            playType
        }, this.onStateChange.bind(this));
    }

    onStateChange() {
        this.emit("stateChanged", this);
    }

    play(): this {
        this._state.playing = true;
        return this;
    }

    callback(cb: (frame: any) => void): this {
        this._callback = cb;
        return this;
    }

    stop(): this {
        this._frameIsDebounced = false;
        this._state.playing = false;
        return this;
    };

    seekTo(time: number): this {
        this.stop();
        this._state.time = time;
        return this;
    };

    setFramerate(rate?: number): this {
        if (rate != null) this._state.framerate = rate;
        this._frameIsDebounced = false;
        return this;
    };

    setScale(scale?: number): this {
        if (scale != null) this._state.scale = scale;
        return this;
    };

    abstract destroy(): this;

    public state(): PlaybackManagerState {
        return this._state;
    }

    public time() {
        return this._state.time;
    }

    /**
     * Should be fed frames at a constant interval. Limits frame emission to a
     * set framerate so that readers aren't overwhelmed. Doesn't control
     * speed of playback.
     */
    protected meterData(data: any) {
        if (!this.state().playing)
            return;

        if (this._frameIsDebounced)
            return;

        if (this._state.framerate > 0) {
            this._frameIsDebounced = true;
            let l = setTimeout(() => {
                this._frameIsDebounced = false
            }, 1000 / this._state.framerate);
        }

        this._callback(data);
    }

    public allFrames(): this {
        return this.setFramerate(0);
    }

    public noMeter(): this {
        return this.setScale(0);
    }
}
