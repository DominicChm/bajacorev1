import {TypedEmitter} from "tiny-typed-emitter";
import onChange from "on-change";
import {PlaybackManagerEvents} from "./interfaces/PlayManagerEvents";
import {PlaybackManagerState} from "./interfaces/PlayManagerState";
import * as Process from "process";
import {performance} from "perf_hooks";
import {bindThis} from "../Util/util";

export abstract class PlaybackManager extends TypedEmitter<PlaybackManagerEvents> {
    private readonly _convertingEnabled: boolean;
    private _frameIsDebounced: boolean = false;
    protected _state: PlaybackManagerState;
    protected _callback: (frame: any) => void;
    private _frameLimit: number = 0; // Number of frames to play. 0 = disabled.
    protected _firstFrameSent = false;

    private _seekDebounced = false;
    private _seekTimeout: any = undefined;

    protected constructor(playType: "realtime" | "stored", convertingEnabled: boolean) {
        super();
        bindThis(PlaybackManager, this);

        this._callback = () => {
        };
        this._state = onChange({
            time: 0,
            playing: false,
            paused: false,
            scale: 1,
            framerate: 10,
            playType
        }, this.onStateChange.bind(this));
        this._convertingEnabled = convertingEnabled;
    }

    convertingEnabled(): boolean {
        return this._convertingEnabled;
    }

    onStateChange() {
        this.emit("stateChanged", this);
    }

    pause(): this {
        this._state.paused = true;
        this._state.playing = false;
        return this;
    }

    play(): this {
        this._state.playing = true;
        this._state.paused = false;
        this._frameIsDebounced = false;
        this._firstFrameSent = false;
        return this;
    }

    callback(cb: (frame: any) => void): this {
        this._callback = cb;
        return this;
    }

    stop(): this {
        this._frameIsDebounced = false;
        this._state.playing = false;
        this._state.paused = false;

        this.setFrameLimit(0);
        return this;
    };

    seekTo(time: number): this {
        if (time == null) return this;

        this._state.time = time;

        if (!this._seekTimeout) this._execSeek();
        this._seekTimeout ||= setTimeout(this._execSeek, 100);

        return this;
    };

    //Internal seekto handler
    private _execSeek() {
        this.stop();

        this.setFrameLimit(1);
        this.play();
    }

    setFramerate(rate?: number): this {
        if (rate != null) this._state.framerate = rate;
        this._frameIsDebounced = false;
        return this;
    };

    setScale(scale?: number): this {
        if (scale != null) this._state.scale = scale;
        return this;
    };

    setFrameLimit(frames: number) {
        this._frameLimit = frames;
    }

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
    protected runCB(data: any) {
        if (!this.state().playing)
            return;

        this._callback(data);
    }

    protected shouldIncrementTime(): boolean {
        return this._state.playing && this._firstFrameSent;
    }

    public allFrames(): this {
        return this.setFramerate(0);
    }

    public noMeter(): this {
        return this.setScale(0);
    }
}
