export abstract class RunHandle {
    private readonly _uuid;
    private readonly _runType;

    constructor(runType: string, uuid: string) {
        this._uuid = uuid;
        this._runType = runType;
    }

    public abstract getHeader(): Uint8Array;

    public uuid(): string {
        return this._uuid;
    }

    public abstract getPlayStream(timestamp?: number, scale?: number): ReadableStream;

    public toJSON() {
        return {
            uuid: this._uuid,
            type: this._runType,
        }
    }
}
