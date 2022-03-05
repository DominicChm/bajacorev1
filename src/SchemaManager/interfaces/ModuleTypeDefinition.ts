import Joi, {SchemaMap} from "joi";
import {CType, StructMembers} from "c-type-util"

export interface ModuleTypeDefinition {
    typeName: string,
    persistentConfigSchema: SchemaMap,
    replicatedConfigSchema: SchemaMap,
    replicatedConfigCType: StructMembers<any>,
    rawCType: StructMembers<any>,
    storageCType: StructMembers<any>,

    // Converts raw input data (from actual modules) into something intelligible by a human.
    // stored2Human is passed as a starting point for conversion (raw data should always have more or equal
    // fields to stored)
    raw2Human: (raw: any, config: any, stored2Human: any) => any;

    // Converts stored data into something intelligible by a human.
    stored2Human: (raw: any, config: any) => any;

}
