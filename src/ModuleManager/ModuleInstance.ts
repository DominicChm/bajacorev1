import {ModuleType} from "./ModuleType";
import {ModuleDefinition} from "./interfaces/ModuleDefinition";
import {MqttClient} from "mqtt"
import {standardizeMac} from "./MACUtil";
import {MqttRouter} from "./MqttRouter";
import EventEmitter from "events";
import TypedEmitter from "typed-emitter";
import {merge} from "lodash"

import onChange from 'on-change';
import {Namespace, Server, Socket} from "socket.io";

//TODO: Pass this as an arg?
const baseModuleChannel = "car"

interface ModuleInstanceState {
    connected: boolean;
}

interface ModuleInstanceEvents {
    definition_updated: (definition: ModuleDefinition<any>) => void;

    //Called when a parameter that requires a full reload is changed (like ID)
    definition_updated_breaking: (definition: ModuleDefinition<any>) => void;
    raw_data: (data: Buffer) => void;
    data: (data: any) => void;
}

export const CHANNELS = {
    SET_DESCRIPTION: "set_desc",
    SET_ID: "set_id",
    SET_NAME: "set_name",
    SET_VERSION: "set_version",
}

/**
 * Base class for management and interaction with physical modules through MQTT, as well as their local config and data.
 */
export abstract class ModuleInstance<StorageStruct,
    RawStruct extends StorageStruct,
    ConfigT,
    HumanReadableStorageT,
    HumanReadableMqttT extends HumanReadableStorageT> extends (EventEmitter as new () => TypedEmitter<ModuleInstanceEvents>) {

    private readonly _definition: ModuleDefinition<ConfigT>;
    private readonly _moduleType: ModuleType<StorageStruct, RawStruct, ConfigT>
    private _mqtt: MqttRouter | undefined;
    private _namespace: Namespace | undefined;
    private _metaState: ModuleInstanceState;
    private _data: RawStruct | undefined;
    private _definitionUpdated: boolean = false;

    public _watchedDefinition: ModuleDefinition<ConfigT>;

    protected constructor(moduleType: ModuleType<StorageStruct, RawStruct, ConfigT>, moduleDefinition: ModuleDefinition<ConfigT>) {
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

    protected convertRaw(data: RawStruct): HumanReadableMqttT {
        return this.convertStored(data) as HumanReadableMqttT;
    }

    private handleDefinitionChange(path: string, value: unknown, previousValue: unknown, applyData: any) {
        this._definitionUpdated = true;

        console.log('path:', path);
        console.log('value:', value);
        console.log('previousValue:', previousValue);
        console.log('applyData:', applyData);
    }

    public config(): ConfigT {
        return JSON.parse(JSON.stringify(this._definition.config));
    }

    public setConfig(cfg: Partial<ConfigT>): this {
        const merged = merge(this.config(), cfg);
        this._watchedDefinition.config = this._moduleType.validateConfig(merged);
        return this;
    }

    public id() {
        return this._watchedDefinition.id;
    }

    public data() {
        return this._data;
    }

    // public channelPath(channel: string): string {
    //     return [baseModuleChannel, this.id(), channel].join("/");
    // }

    // public linkMQTT(mqtt: MqttRouter): this {
    //     this._mqtt = mqtt;
    //     this._mqtt.on(this.channelPath("raw"), this.handleRawInput.bind(this));
    //
    //     return this;
    // }
    //
    // public linkSocketIo(sioServer: Server): Namespace {
    //     const namespace = this._namespace = sioServer.of(`/${this.id()}`);
    //     namespace.on("connection", (socket => {
    //         console.log(`SIO Connection to >${this.id()}<`);
    //         socket.on(CHANNELS.SET_ID, this.setId.bind(this));
    //         socket.on(CHANNELS.SET_DESCRIPTION, this.setDescription.bind(this));
    //         socket.on(CHANNELS.SET_NAME, this.setName.bind(this));
    //         socket.on(CHANNELS.SET_VERSION, this.setVersion.bind(this));
    //     }));
    //
    //     return namespace;
    // }

    //TODO: Emit parse errors using eventemitter
    public handleRawInput(payload: Buffer): RawStruct {
        console.log("RAW INPUT :D");
        this.emit("raw_data", payload);

        const data = this._moduleType.rawStruct().readLE(payload.buffer, payload.byteOffset);
        this.emit("data", data);

        console.log(payload);
        console.log(data);

        return data;
    }

    definition() {
        return JSON.parse(JSON.stringify(this._definition));
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
}
