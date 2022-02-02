import {ModuleDefinition} from "./interfaces/ModuleDefinition";
import {standardizeMac} from "./MACUtil";
import {cloneDeep} from "lodash"
import {TypedEmitter} from "tiny-typed-emitter";
import onChange from 'on-change';
import {ConfigT} from "../moduleTypes/SensorBrakePressure";
import {ModuleTypeDriver} from "./ModuleTypeDriver";

interface ModuleInstanceEvents {
    definitionUpdated: (definition: ModuleDefinition<any>, breaking: boolean) => void;

    //Called when a parameter that requires a full reload is changed (like ID)
    raw_data: (data: Buffer) => void;
    data: (data: any) => void;
}

/**
 * Manages individual module functions by merging a type definition with an instance definition.
 * Drives a ModuleTypeDefinition. Handles mutation of module definition and linking events,
 * as well as data serialization and deserialization.
 */
export class ModuleInstance extends TypedEmitter<ModuleInstanceEvents> {
    private readonly _moduleType: ModuleTypeDriver;
    private _definition: ModuleDefinition<ConfigT>;

    private _data: any | undefined;

    constructor(moduleType: ModuleTypeDriver, moduleDefinition: ModuleDefinition<ConfigT>) {
        super();
        this._moduleType = moduleType;

        // Definition is initialized a little later
        this._definition = {} as any;


        this.setDefinition = this.setDefinition.bind(this);
        this.feedRaw = this.feedRaw.bind(this);

        this.setDefinition(moduleDefinition);
    }

    /**
     * Converts stored data in JSON format (After the "feed" stage) into something understandable by humans.
     * EX: Converts and scales raw brake pressure values (0-1023) into PSI.
     * @protected
     * @param storedData
     */
    protected convertStored(storedData: any): any {
        this._moduleType.stored2Human(storedData, this.config());
    }

    /**
     * Converts raw data in JSON format (After the "feed" stage) into something understandable by humans.
     * EX: Converts and scales raw brake pressure values (0-1023) into PSI.
     * @protected
     * @param rawData
     */
    protected convertRaw(rawData: any): any {
        return this._moduleType.raw2Human(rawData, this.config());
    }

    private handleDefinitionChange() {
        this.emit("definitionUpdated", this.definition(), false);
    }

    public setDefinition(def: ModuleDefinition<ConfigT>) {
        console.log("DEF SET");
        const newDef = this._moduleType.validateDefinition(cloneDeep(def)); //Deep copy definition to leave original intact

        //Setup public definition
        this._definition = onChange(newDef, this.handleDefinitionChange.bind(this));

        this.handleDefinitionChange();
    }


    public config(): ConfigT {
        return this._definition.config;
    }

    public id() {
        return this._definition.id;
    }

    public data() {
        return this._data;
    }

    /**
     * Used to feed raw, binary data from a transport layer into the instance.
     * It parses the data and re-emits it as JSON as well as preserving it for future access.
     * @param payload
     * TODO: Emit parse errors using eventemitter
     */
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
}
