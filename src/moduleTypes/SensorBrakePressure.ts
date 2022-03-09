import Joi from "joi";
import * as ctypes from "c-type-util"
import {CommonConfig, Module} from "../ModuleTypeRegistry/Module";
import {cStruct, CType, float, uint16} from "c-type-util";

type Data = {
    analog: number
}

interface Config {
    pressureMin: number,
    pressurePerTick: number,
}

const DataStruct = cStruct({
    analog: ctypes.uint16
});

const ConfigStruct: CType<Config> = cStruct({
    pressureMin: uint16,
    pressurePerTick: uint16,
});

export class SBP extends Module<Data, Config> {
    constructor() {
        super({
            binConfigSize: ConfigStruct.size,
            binDataSize: DataStruct.size,
        });
    }

    protected _encodeConfig(config: Config): ArrayBuffer {
        return ConfigStruct.allocLE(config);
    }

    protected _encodeData(data: Data): ArrayBuffer {
        return DataStruct.allocLE(data);
    }

    protected _parseConfig(buf: ArrayBuffer): Config {
        return ConfigStruct.readLE(buf);
    }

    protected _parseData(buf: ArrayBuffer): Data {
        return DataStruct.readLE(buf);
    }
}
