import {ModuleType} from "./ModuleType";
import {ModuleDefinition} from "./interfaces/ModuleDefinition";
import {MqttClient} from "mqtt"
import {standardizeMac} from "./MACUtil";
import {MqttRouter} from "./MqttRouter";
import EventEmitter from "events";
import TypedEmitter from "typed-emitter";

import onChange from 'on-change';

//TODO: Pass this as an arg?
const baseModuleChannel = "car"

interface ModuleInstanceState {
    connected: boolean;
}

interface ModuleInstanceEvents {
    definition_updated: (definition: ModuleDefinition<any>) => void;
    raw_data: (data: Buffer) => void;
    data: (data: any) => void;
}

/**
 * Base class for management and interaction with physical modules through MQTT, as well as their local config and data.
 */
export abstract class ModuleInstance<
    StorageStruct,
    MqttStruct extends StorageStruct,
    ConfigT,
    HumanReadableStorageT,
    HumanReadableMqttT extends HumanReadableStorageT> extends (EventEmitter as new () => TypedEmitter<ModuleInstanceEvents>) {
    private readonly _definition: ModuleDefinition<ConfigT>;
    private readonly _moduleType: ModuleType<StorageStruct, MqttStruct, ConfigT>
    private _metaState: ModuleInstanceState;
    private _data: MqttStruct | undefined;
    private _definitionUpdated: boolean = false;

    public _watchedDefinition: ModuleDefinition<ConfigT>;

    protected constructor(moduleType: ModuleType<StorageStruct, MqttStruct, ConfigT>, moduleDefinition: ModuleDefinition<ConfigT>) {
        super();
        this._moduleType = moduleType;
        this._metaState = {
            connected: false
        }

        this._definition = JSON.parse(JSON.stringify(moduleDefinition)); //Deep copy definition to leave original intact

        //Validate definition on construction
        this._definition.config = moduleType.validateConfig(this._definition.config);

        //Standardize MAC
        this._definition.id = standardizeMac(this._definition.id);

        //Setup public definition
        this._watchedDefinition = onChange(this._definition, this.handleDefinitionChange.bind(this));
    }

    protected abstract convertStored(data: StorageStruct): HumanReadableStorageT;

    protected convertMqtt(data: MqttStruct): HumanReadableMqttT {
        return this.convertStored(data) as HumanReadableMqttT;
    }

    private handleDefinitionChange(path: string, value: unknown, previousValue: unknown, applyData: any) {
        this._definitionUpdated = true;

        console.log('path:', path);
        console.log('value:', value);
        console.log('previousValue:', previousValue);
        console.log('applyData:', applyData);
    }

    public config() {
        return this._watchedDefinition.config;
    }

    public id() {
        return this._watchedDefinition.id;
    }

    public data() {
        return this._data;
    }

    protected sendMQTT(channel: string, data: string | Uint8Array) {

    }

    public channelPath(channel: string): string {
        return [baseModuleChannel, this.id(), channel].join("/");
    }

    public linkMQTT(mqtt: MqttRouter): this {
        mqtt.on(this.channelPath("raw"), this.handleMqttRawInput.bind(this));
        return this;
    }

    public linkSocketIo() {

    }

    //TODO: Emit parse errors using eventemitter
    public handleMqttRawInput(payload: Buffer) {
        console.log("MQTT INPUT :D");
        this.emit("raw_data", payload);

        const data = this._moduleType.storageStruct().readLE(payload.buffer, payload.byteOffset);
        this.emit("data", data);

        console.log(payload);
        console.log(data);
    }

    public unlinkMQTT() {
    }

    toJSON() {
        return this._definition; //When serializing, return the definition.
    }
}
