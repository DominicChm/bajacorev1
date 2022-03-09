import Joi from "joi";

export const DAQSchemaValidator = Joi.object({
    name: Joi.string(),
    frameInterval: Joi.number().min(10).max(1000),
    modules: Joi.object().pattern(Joi.string(), Joi.any()),
});
