import Joi from "joi";
import {joiMac} from "../../Util/MACUtil";

export interface ModuleDefinitionValidatorOpts {
    typename: string,
    defaultName: string,
    configSchema: any,
    defaultConfig: any,
}

export const ModuleDefinitionSchema = (opts: ModuleDefinitionValidatorOpts) => Joi.object({
    id: Joi.string(),
    name: Joi.string()
        .default(opts.defaultName),
    description: Joi.string()
        .allow("")
        .default(""),
    mac: Joi.string()
        .custom(joiMac)
        .default("00:00:00:00:00:00"), //MAC Id.
    version: Joi.number()
        .integer()
        .default(0), //Unused for now
    type: Joi.string()
        .default(opts.typename),
    config: opts.configSchema
        .prefs({allowUnknown: true})
        .default(opts.defaultConfig),
})
