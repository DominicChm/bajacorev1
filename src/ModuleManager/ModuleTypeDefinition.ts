import Joi from "joi";
import {CType} from "c-type-util"

export interface ModuleTypeDefinition {
    typeName: string,
    persistentConfigSchema: Joi.ObjectSchema,
    replicatedConfigSchema: Joi.ObjectSchema,
    replicatedConfigCType: CType<any>,
    rawCType: CType<any>,
    storageCType: CType<any>,

    // Converts raw input data (from actual modules) into something intelligible by a human.
    // stored2Human is passed as a starting point for conversion (raw data should always have more or equal
    // fields to stored)
    raw2Human: (raw: any, config: any, stored2Human: any) => any;

    // Converts stored data into something intelligible by a human.
    stored2Human: (raw: any, config: any) => any;

}
