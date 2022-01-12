import Joi from "joi";
import * as ctypes from "c-type-util"
import {ModuleType} from "../ModuleManager/ModuleType";
import {cStruct, CType} from "c-type-util";
import {ModuleInstance} from "../ModuleManager/ModuleInstance";
import {ModuleDefinition} from "../ModuleManager/interfaces/ModuleDefinition";
import {connect} from "mqtt"
import {MqttRouter} from "../ModuleManager/MqttRouter";

export type StorageT = { test: number }
export type MqttT = { test: number }
export type ConfigT = { config_v: number }

const t = new ModuleType<StorageT, MqttT, ConfigT>({
    typename: "brake_pressure",
    configSchema: Joi.object({
        config_v: Joi.number()
    }),
    mqttStruct: cStruct({test: ctypes.uint16}),
    storageStruct: cStruct({test: ctypes.uint16}),
});

export class SensorBrakePressureInstance extends ModuleInstance<StorageT, MqttT, ConfigT> {
    constructor(def: ModuleDefinition<ConfigT>) {
        super(t, def);
    }

    //Define API Here

}

export default {type: t, instance: SensorBrakePressureInstance}

const client = connect("mqtt://localhost:1883");
const router = new MqttRouter(client);

client.on('connect', function () {
    console.log("Connected!");
    const test = new SensorBrakePressureInstance({
        id: "AB:CD:EF:11:22:12",
        config: {
            config_v: 1
        },
        version: 1,
        name: "brake",
        description: "testdesc"
    }).linkMQTT(router);
})

console.log("Connecting instance")
