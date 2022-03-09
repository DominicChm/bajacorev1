import {TypedEmitter} from "tiny-typed-emitter";
import {bindThis} from "../Util/util";
import {ModuleDefinition} from "../SchemaManager/interfaces/ModuleDefinition";

export interface ModuleEvents {
    configChanged: () => {}
    frame: (time: number, data: any, config: any) => void;
}

type StorageBlock<D, C> = { data: D, config: C }

interface ModuleOptions {
    binDataSize: number;
    binConfigSize: number;
}

export interface CommonConfig {
    sampleRate: number,
    typenameHash: number,
}

//D - Data Type, C - Config Type
export abstract class Module<D = any, C = any> extends TypedEmitter<ModuleEvents> {
    protected _config: C;
    protected _data: D;

    protected readonly _opts: ModuleOptions;
    private _stagedDefinition: ModuleDefinition;
    private _definition: ModuleDefinition;

    protected constructor(opts: ModuleOptions) {
        super();
        bindThis(Module, this);

        this._opts = opts;
    }

    public beginUpdate() {
        this._stagedDefinition = null;
    }

    public commitUpdate() {
        //TODO
    }

    public isUpdateValid() {
        return !!this._stagedDefinition && this._stagedDefinition.type === this._definition.type;
    }

    public updateDefinition(def: ModuleDefinition): Module | undefined {
        this._stagedDefinition = def; //TODO: VALIDATE
    }

    public definition() {

    }

    public destroy() {

    };

    public ingestBlock(buf: ArrayBuffer) {
        if (buf.byteLength < this.binBlockSize())
            throw new Error(`Recieved buffer was size ${buf.byteLength}, when size ${this.binBlockSize()} is needed to parse a block!`);

        this._data = this._parseData(buf);
        this._config = this._parseConfig(buf.slice(this.binDataSize()));
    }

    public ingestData(buf: ArrayBuffer) {
        if (buf.byteLength < this.binDataSize())
            throw new Error(`Recieved buffer was size ${buf.byteLength}, when size ${this.binBlockSize()} is needed to parse a block!`);

        this._data = this._parseData(buf);
    }

    public serializeBlock(buf: ArrayBuffer) {

    }

    public serializeData(buf: ArrayBuffer) {

    }

    protected abstract _parseData(buf: ArrayBuffer): D;

    protected abstract _encodeData(data: D): ArrayBuffer;

    protected abstract _parseConfig(buf: ArrayBuffer): C;

    protected abstract _encodeConfig(config: C): ArrayBuffer;

    //GETTERS
    binDataSize() {
        return this._opts.binDataSize;
    }

    binConfigSize() {
        return this._opts.binConfigSize;
    }

    binBlockSize() {
        return this._opts.binConfigSize + this._opts.binDataSize;
    }

    data() {
        return this._data;
    }

    config() {
        return this._config;
    }

    setConfig(config: C) {

    }
}
