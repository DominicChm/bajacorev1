import {TypedEmitter} from "tiny-typed-emitter";

export interface ModuleEvents {
    configChanged: () => {}
    frame: (time: number, data: any, config: any) => void;
}

type StorageBlock<D, C> = { data: D, config: C }

interface ModuleOptions {
    binDataSize: number;
    binConfigSize: number;
}

//D - Data Type, C - Config Type
export abstract class Module<D, C> extends TypedEmitter<ModuleEvents> {
    protected _config: C;
    protected _data: D;

    protected _opts: ModuleOptions;

    constructor(opts) {
        super();
    }

    ingestBlock(buf: ArrayBuffer) {

    }

    ingestData(buf: ArrayBuffer) {

    }

    serializeBlock(buf: ArrayBuffer) {

    }

    serializeData(buf: ArrayBuffer) {

    }
    
    abstract _parseData(buf: ArrayBuffer): D;

    abstract _encodeData(data: D): ArrayBuffer;

    abstract _parseConfig(buf: ArrayBuffer): C;

    abstract _encodeConfig(config: C): ArrayBuffer;


    //GETTERS
    binDataSize() {
        return this._opts.binDataSize;
    }

    binConfigSize() {
        return this._opts.binConfigSize;
    }

    binStorageBlockSize() {
        return this._opts.binConfigSize + this._opts.binDataSize;
    }
}

