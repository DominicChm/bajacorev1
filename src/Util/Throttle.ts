import {bindThis} from "./util";

const nil = Symbol("nil");

export class Throttle {
    private readonly _fn;
    private _lastArg: any = nil;
    private _callTimeout = null;
    private _interval: number = 100;

    constructor(fn: Function, interval: number) {
        bindThis(Throttle, this);
        this._fn = fn;
        this._interval = interval;
    }

    call(...args) {
        if (!this._callTimeout) this._fn(...args);
        else this._lastArg = args;

        this._callTimeout ||= setTimeout(this._execCall, this._interval);
    }

    private _execCall() {
        if (this._lastArg === nil) {
            this._callTimeout = null;
            return;
        }

        this._fn(...this._lastArg);

        this._lastArg = nil;
        clearTimeout(this._callTimeout);
        this._callTimeout = setTimeout(this._execCall, this._interval);
    }

}