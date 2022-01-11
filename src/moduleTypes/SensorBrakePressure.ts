import Joi from "joi";
import * as ctypes from "c-type-util"
import {ModuleType} from "./ModuleType";
import {cStruct, CType} from "c-type-util";
import {ModuleInstance} from "./ModuleInstance";

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

// export const SensorBrakePressure: ModuleType<SBPStorage, SBPMqtt, Api> = {
//     moduleTypename: "brake_pressure",
//
//     configSchema: Joi.object({}),
//
//     storageStruct: ctypes.cStruct({
//         analogRaw: ctypes.uint16
//     }),
//
//     mqttStruct: ctypes.cStruct({
//         analogRaw: ctypes.uint16
//     }),
//
//     api: {
//         setOffset: {description: "Test - set offset", op: 0x03, ctype: ctypes.uint16},
//     }
// }
export type StorageT = { test: number }
export type MqttT = { test: number }
export type ConfigT = { config_v: number }

export class SensorBrakePressureInstance extends ModuleInstance<StorageT, MqttT, ConfigT>{

}
export const SensorBrakePressure = new ModuleType<StorageT, MqttT, ConfigT, SensorBrakePressureInstance>({
    typename: "brake_pressure",
    configSchema: Joi.object({}),
    mqttStruct: cStruct({test: ctypes.uint16}),
    storageStruct: cStruct({test: ctypes.uint16}),
    instance: SensorBrakePressureInstance
});

