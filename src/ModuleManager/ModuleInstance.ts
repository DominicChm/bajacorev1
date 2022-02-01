import {ModuleDefinition} from "./interfaces/ModuleDefinition";
import {standardizeMac} from "./MACUtil";
import {cloneDeep} from "lodash"
import {TypedEmitter} from "tiny-typed-emitter";
import onChange from 'on-change';
import {ConfigT} from "../moduleTypes/SensorBrakePressure";
import {ModuleTypeDriver} from "./ModuleTypeDriver";

interface ModuleInstanceEvents {
    definition_updated: (definition: ModuleDefinition<any>, breaking: boolean) => void;

    //Called when a parameter that requires a full reload is changed (like ID)
    raw_data: (data: Buffer) => void;
    data: (data: any) => void;
    destroyed: () => void;
}

export class ModuleInstance extends TypedEmitter<ModuleInstanceEvents> {

    private readonly _moduleType: ModuleTypeDriver
    private _data: any | undefined;
    private _destroyed = false;

    public _watchedDefinition: ModuleDefinition<ConfigT>;
    private _definition: ModuleDefinition<ConfigT>;

    constructor(moduleType: ModuleTypeDriver, moduleDefinition: ModuleDefinition<ConfigT>) {
        super();
        this._moduleType = moduleType;

        this._watchedDefinition = {} as any;
        this._definition = {} as any;

        this.setDefinition = this.setDefinition.bind(this);
        this.feedRaw = this.feedRaw.bind(this);

        this.setDefinition(moduleDefinition);
    }

    protected convertStored(rawData: any): any {

    }

    protected convertRaw(data: any): any {
        return this._moduleType.dataRaw2Human(data, this.config());
    }

    private handleDefinitionChange() {
        this.emit("definition_updated", this.definition(), false);
    }

    public setDefinition(def: ModuleDefinition<ConfigT>) {
        console.log("DEF SET");
        const newDef = cloneDeep(def); //Deep copy definition to leave original intact
        //Validate definition on construction
        newDef.config = this._moduleType.validateConfig(newDef.config);

        //Standardize MAC
        newDef.id = standardizeMac(newDef.id);

        //Setup public definition
        this._definition = newDef;
        this._watchedDefinition = onChange(this._definition, this.handleDefinitionChange.bind(this));

        this.handleDefinitionChange();
    }


    public config(): ConfigT {
        return JSON.parse(JSON.stringify(this._definition.config));
    }

    public id() {
        return this._watchedDefinition.id;
    }

    public data() {
        return this._data;
    }

    //TODO: Emit parse errors using eventemitter
    public feedRaw(payload: Buffer): any {
        console.log("RAW INPUT :D");
        this.emit("raw_data", payload);

        const data = this._moduleType.rawStruct().readLE(payload.buffer, payload.byteOffset);
        this.emit("data", data);

        console.log(payload);
        console.log(data);

        return data;
    }

    definition() {
        return this._definition;
    }

    toJSON() {
        return this._definition; //When serializing, return the definition.
    }

    //TODO: API type/validity Checks
    setId(id: string) {
        this._watchedDefinition.id = id;
    }

    setName(name: string) {
        this._watchedDefinition.name = name;
    }

    setDescription(description: string) {
        this._watchedDefinition.description = description;
    }

    setVersion(version: number) {
        this._watchedDefinition.version = version;
    }

    destroy() { //TODO: ADD DESTROYED CHECKS TO EVERYTHING
        this._destroyed = true;
        this.emit("destroyed");
    }
}
