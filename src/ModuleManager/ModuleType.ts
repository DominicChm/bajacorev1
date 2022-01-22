import Joi, {ValidationOptions} from "joi";
import ctypes, {CType} from "c-type-util"

export interface ModuleTypeOptions<StorageStruct,
    RawStruct extends StorageStruct,
    ConfigT> {
    typename: string;
    configSchema: Joi.ObjectSchema<ConfigT>;
    storageStruct: CType<StorageStruct>,
    rawStruct: CType<RawStruct>,
}

/**
 * Stores static properties of a given module type, like binary types, config schema, and typename.
 */
export class ModuleType<StorageStruct, MqttStruct extends StorageStruct, ConfigT> {
    private readonly _opts: ModuleTypeOptions<StorageStruct, MqttStruct, ConfigT>;

    constructor(opts: ModuleTypeOptions<StorageStruct, MqttStruct, ConfigT>) {
        this._opts = opts;
    }

    public typename(): string {
        return this._opts.typename;
    }

    public validateConfig(obj: any, opts?: ValidationOptions): ConfigT {
        const {value, error} = this._opts.configSchema.validate(obj, opts);
        if (error) throw error;

        return value as ConfigT;
    }

    public storageStruct(): CType<StorageStruct> {
        return this._opts.storageStruct
    }

    public rawStruct(): CType<MqttStruct> {
        return this._opts.rawStruct
    }
}
