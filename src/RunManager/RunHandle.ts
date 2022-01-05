import * as Path from "path";

export abstract class RunHandle {
    private readonly _uuid;

    constructor(uuid: string) {
        this._uuid = uuid;
    }

    public abstract getHeader(): Uint8Array;

    public uuid(): string {
        return this._uuid;
    }

    public abstract getPlayStream(timestamp?: number, scale?: number): ReadableStream;
}
