import Joi from "joi";
import {CType} from "c-type-util"

export interface ModuleTypeDefinition {
    typeName: string,
    persistentConfigSchema: Joi.ObjectSchema,
    replicatedConfigSchema: Joi.ObjectSchema,
    replicatedConfigCType: CType<any>,
    rawCType: CType<any>,
    storageCType: CType<any>,

    // Converts raw input data into something intelligible by a human.
    dataRaw2Human: (raw: any, config: any) => any;
}
