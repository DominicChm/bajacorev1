import Joi from "joi";
import * as ctypes from "c-type-util"
import {ModuleType} from "./interfaces/ModuleType";
import {CType} from "c-type-util";

interface SBPStorage {
    analogRaw: number;
}

interface SBPMqtt {
    analogRaw: number
}

interface SBPConverted {
    pressurePsi: number;
}

interface Api {
    setOffset: number
}

interface SBPConfig {

}

export const SensorBrakePressure: ModuleType<SBPStorage, SBPMqtt, Api> = {
    moduleTypename: "brake_pressure",

    configSchema: Joi.object({}),

    storageStruct: ctypes.cStruct({
        analogRaw: ctypes.uint16
    }),

    mqttStruct: ctypes.cStruct({
        analogRaw: ctypes.uint16
    }),

    api: {
        setOffset: {description: "Test - set offset", op: 0x03, ctype: ctypes.uint16},
    }
}
