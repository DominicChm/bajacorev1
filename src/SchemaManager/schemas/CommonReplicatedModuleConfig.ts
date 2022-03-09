import Joi from "joi";
import {uint32} from "c-type-util";

export const CommonReplicatedModuleConfig = {
    typeNameHash: Joi.number()
        .integer()
        .default(0),

    globalSampleInterval: Joi.number()
        .integer()
        .default(1000),

}

export const CommonConfigCTypes = {
    typeNameHash: uint32,
}
