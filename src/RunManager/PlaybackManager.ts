import {TypedEmitter} from "tiny-typed-emitter";
import onChange from "on-change";

export interface PlaybackManagerEvents {
    stateChanged: (manager: PlaybackManager) => void;
}

export interface PlaybackManagerState {
    position: number;
    playing: boolean;
    scale: number;
    framerate: number;
}

export abstract class PlaybackManager extends TypedEmitter<PlaybackManagerEvents> {
    private _state: PlaybackManagerState;
    protected _frameIsDebounced: boolean = false;
    protected _callback: (frame: any, time: number) => void;

    protected constructor(playType: "realtime" | "stored") {
        super();
        this._callback = () => {
        };
        this._state = onChange({
            position: 0,
            playing: false,
            scale: 1,
            framerate: 1,
            playType
        }, this.onStateChange.bind(this));
    }

    onStateChange() {
        this.emit("stateChanged", this);
    }

    play(): PlaybackManager {
        this._state.playing = true;
        return this;
    }

    callback(cb: (frame: any, time: number) => void): PlaybackManager {
        this._callback = cb;
        return this;
    }

    stop(): PlaybackManager {
        this._state.playing = false;
        this._frameIsDebounced = false;
        return this;
    };

    seekTo(time?: number): PlaybackManager {
        this.stop();
        if (time != null) this._state.position = time;
        return this;
    };

    setFramerate(rate?: number): PlaybackManager {
        if (rate != null) this._state.framerate = rate;
        this._frameIsDebounced = false;
        return this;
    };

    setScale(scale?: number): PlaybackManager {
        if (scale != null) this._state.scale = scale;
        return this;
    };

    abstract destroy(): PlaybackManager;

    state(): PlaybackManagerState {
        return this._state;
    }

    protected meterData(data: any, time: number) {
        if (!this.state().playing)
            return;

        if (this._frameIsDebounced)
            return;

        if (this._state.framerate > 0) {
            let l = setTimeout(() => {
                this._frameIsDebounced = false
            }, 1000 / this._state.framerate);
            this._frameIsDebounced = true;
        }

        this._callback(data, time);
    }

}
