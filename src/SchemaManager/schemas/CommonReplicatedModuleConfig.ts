import Joi from "joi";

export const CommonReplicatedModuleConfig = {
    typeNameHash: Joi.number()
        .integer()
        .default(0),
    
    globalSampleInterval: Joi.number()
        .integer()
        .default(1000),
    
}