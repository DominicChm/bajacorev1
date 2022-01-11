import Joi from "joi";
import ctypes, {CType} from "c-type-util"
import {ModuleDefinition} from "./interfaces/ModuleDefinition";
import {IModuleInstance, ModuleInstance} from "./ModuleInstance";

export interface ModuleTypeOptions<StorageStruct, MqttStruct extends StorageStruct, ConfigT, InstanceT extends IModuleInstance<StorageStruct, MqttStruct, ConfigT>> {
    typename: string;
    configSchema: Joi.ObjectSchema<ConfigT>;
    storageStruct: CType<StorageStruct>,
    mqttStruct: CType<MqttStruct>,
    instance: InstanceT
}

export class ModuleType<StorageStruct, MqttStruct extends StorageStruct, ConfigT, InstanceT extends IModuleInstance<StorageStruct, MqttStruct, ConfigT>> {
    private readonly _opts: ModuleTypeOptions<StorageStruct, MqttStruct, ConfigT, InstanceT>;

    constructor(opts: ModuleTypeOptions<StorageStruct, MqttStruct, ConfigT, InstanceT>) {
        this._opts = opts;
    }

    public typename(): string {
        return this._opts.typename;
    }

    public validateConfig(obj: any): ConfigT {
        const {value, error} = this._opts.configSchema.validate(obj);
        if (error) throw error;

        return value as ConfigT;
    }

    public createInstance(def: ModuleDefinition<ConfigT>): ModuleInstance<StorageStruct, MqttStruct, ConfigT> {
        return new ModuleInstance(this, def);
    }
}
