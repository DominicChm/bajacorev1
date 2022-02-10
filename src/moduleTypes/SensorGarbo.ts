import Joi from "joi";
import * as ctypes from "c-type-util"
import {cStruct} from "c-type-util"
import {ModuleTypeDefinition} from "../SchemaManager/interfaces/ModuleTypeDefinition";

export const SensorGarbo: ModuleTypeDefinition = {
    typeName: "garbo",

    // Config
    // Persistent config is stored and loaded from disk between restarts.
    // Replicated config is what is sent to the remote module, and has a corresponding serializer (ctype).
    // Persistent and replicated config do NOT need to be the same - this is desirable.
    // Identical keys between config types are merged (treated as same)
    // Persistent config takes priority over replicated!!!!
    persistentConfigSchema: Joi.object({
        techGarbage: Joi.number().default(0),
        randomGarbage: Joi.number().default(0),
    }),
    replicatedConfigSchema: Joi.object({
        randomGarbage: Joi.number().default(123),
    }),
    replicatedConfigCType: cStruct({
        randomGarbage: ctypes.uint16
    }),

    // Raw describes the binary data coming in from the module.
    // Storage describes the data being stored to/from disk.
    // Storage should be a sub-type of Raw, such that some raw values might not be stored.
    rawCType: cStruct({
        analog: ctypes.uint16
    }),
    storageCType: cStruct({
        analog: ctypes.uint16
    }),
    raw2Human(raw: any, config: any, stored2Human: any): any {
        return stored2Human(raw, config);
    },
    stored2Human(raw: any, config: any) {
        return {
            psi: raw.analog * config.psiPerVolt + config.minVoltage
        }
    }
}
