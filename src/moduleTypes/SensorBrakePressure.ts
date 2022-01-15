import Joi from "joi";
import * as ctypes from "c-type-util"
import {ModuleType} from "../ModuleManager/ModuleType";
import {cStruct, CType} from "c-type-util";
import {ModuleInstance} from "../ModuleManager/ModuleInstance";
import {ModuleDefinition} from "../ModuleManager/interfaces/ModuleDefinition";
import {connect} from "mqtt"
import {MqttRouter} from "../ModuleManager/MqttRouter";
import {Namespace, Server} from "socket.io";

export type StorageT = { analogRaw: number }
export type MqttT = { analogRaw: number }
export type ConfigT = { config_v: number }
export type HumanReadableT = { psi: number }
export type HumanReadableStorageT = { psi: number }

const t = new ModuleType<StorageT, MqttT, ConfigT>({
    typename: "brake_pressure",
    configSchema: Joi.object({
        config_v: Joi.number()
    }),
    rawStruct: cStruct({analogRaw: ctypes.uint16}),
    storageStruct: cStruct({analogRaw: ctypes.uint16}),
});

export class SensorBrakePressureInstance extends ModuleInstance<StorageT, MqttT, ConfigT, HumanReadableT, HumanReadableStorageT> {
    constructor(def: ModuleDefinition<ConfigT>) {
        super(t, def);
    }

    protected convertStored(data: StorageT): HumanReadableT {
        return {
            psi: 1
        };
    }

    //Can override if additional data needs to be converted with MQTT packets
    // protected convertMqtt(data: MqttT): HumanReadableStorageT {
    //     return this.convertStored(data);
    // }

    //Define API Here
    private printMessage(msg: string) {
        console.log(msg);
    }


}

export default {type: t, instance: SensorBrakePressureInstance}
