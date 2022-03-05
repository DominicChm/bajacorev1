import {ModuleDefinition} from "./interfaces/ModuleDefinition";
import {TypedEmitter} from "tiny-typed-emitter";
import {ConfigT} from "../moduleTypes/SensorBrakePressure";
import {ModuleTypeDriver} from "./ModuleTypeDriver";
import {ModuleInstanceEvents} from "./interfaces/ModuleInstanceEvents";
import {bindThis} from "../Util/util";

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
        bindThis(ModuleInstance, this);

        // Definition is initialized a little later
        this._definition = {} as any;
        this._moduleType = moduleType;

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

    /**
     *
     * @param def
     * @return {boolean} - Whether the passed definition potentially broke bindings
     */
    public setDefinition(def: ModuleDefinition<ConfigT>): boolean {
        this._definition = this._moduleType.validateDefinition(def); //Deep copy definition to leave original intact
        return false;
    }

    /**
     * Returns this instance's config, encoded into binary.
     */
    public replicatedBinConfig() {
        return this._moduleType.replicatedConfigCType().allocLE(this.replicatedConfig());
    }

    public replicatedConfig() {
        return this._moduleType.validateReplicatedConfig(this.config());
    }

    public config(): ConfigT {
        return this._definition.config;
    }

    public mac() {
        return this._definition.mac;
    }

    public id() {
        return this._definition.id;
    }

    public name() {
        return this._definition.name;
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
        //TODO: PARSE TIMESTAMPS FROM DATA
        //console.log("RAW INPUT :D");
        const data = this._moduleType.rawCType().readLE(payload.buffer, payload.byteOffset);
        this.emit("raw_data", payload, 0);
        this.emit("data", data, 0);
        return data;
    }

    definition() {
        return this._definition;
    }

    typeDriver() {
        return this._moduleType;
    }

    stored2human(data: any) {
        return this._moduleType.stored2Human(data, this.config());
    }
}
