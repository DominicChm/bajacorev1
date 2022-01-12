import Joi from "joi";
import ctypes, {CType} from "c-type-util"

export interface ModuleTypeOptions<StorageStruct,
    MqttStruct extends StorageStruct,
    ConfigT> {
    typename: string;
    configSchema: Joi.ObjectSchema<ConfigT>;
    storageStruct: CType<StorageStruct>,
    mqttStruct: CType<MqttStruct>,
}

export class ModuleType<StorageStruct, MqttStruct extends StorageStruct, ConfigT> {
    private readonly _opts: ModuleTypeOptions<StorageStruct, MqttStruct, ConfigT>;

    constructor(opts: ModuleTypeOptions<StorageStruct, MqttStruct, ConfigT>) {
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

    public storageStruct(): CType<StorageStruct> {
        return this._opts.storageStruct
    }

    public mqttStruct(): CType<MqttStruct> {
        return this._opts.mqttStruct
    }
}
