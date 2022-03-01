import Joi from "joi";

export interface IRunMetaSchema {
    name: string,
    description: string
}

export const RunMetaSchema = Joi.object<IRunMetaSchema>({
    name: Joi.string().default("New Run"),
    description: Joi.string().default("").allow(""),
});
