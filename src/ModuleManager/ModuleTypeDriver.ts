import {ModuleTypeDefinition} from "./ModuleTypeDefinition";
import Joi from "joi";
import {SensorBrakePressure} from "../moduleTypes/SensorBrakePressure";
import {joiMac} from "./MACUtil";
import {CType} from "c-type-util";

/**
 * Drives and allows easy interaction with a ModuleTypeDefinition, which describes a type of module.
 */
export class ModuleTypeDriver {
    private readonly _typeDefinition: ModuleTypeDefinition;
    private readonly _combinedConfigSchema: Joi.ObjectSchema;
    private readonly _definitionSchema: Joi.ObjectSchema;

    constructor(typeDef: ModuleTypeDefinition) {
        this._typeDefinition = typeDef;
        this._combinedConfigSchema = this._typeDefinition.replicatedConfigSchema.concat(this._typeDefinition.persistentConfigSchema);
        this._definitionSchema = Joi.object({
            name: Joi.string()
                .default(`New ${typeDef.typeName}`),
            description: Joi.string()
                .allow("")
                .default(""),
            id: Joi.string()
                .custom(joiMac)
                .default("00:00:00:00:00:00"), //MAC Id.
            version: Joi.number()
                .integer()
                .default(0), //Unused for now
            type: Joi.string()
                .default(typeDef.typeName),
            config: typeDef.persistentConfigSchema
                .prefs({allowUnknown: true})
                .default(this.defaultConfig()),
        });
    }

    /**
     * Returns a default configuration for this type.
     */
    defaultConfig(): any {
        try {
            //2 validation passes - 1 to generate defaults, 2 to validate that the default config is valid.
            const cfg = Joi.attempt({}, this._combinedConfigSchema, {noDefaults: false});
            return this.validateConfig(cfg);
        } catch (e: any) {
            throw new Error(`Error creating a default config! MAKE SURE ALL CONFIG SCHEMA FIELDS IN >${this._typeDefinition.typeName}< HAVE A DEFAULT!!! - ${e.message}`);
        }
    }

    /**
     * Returns a default module definition for this type.
     */
    defaultDefinition() {
        try {
            const def = Joi.attempt({}, this._definitionSchema, {noDefaults: false});
            console.log(def);
            return this.validateDefinition(def);
        } catch (e: any) {
            throw new Error(`Error creating a default definition! MAKE SURE ALL CONFIG SCHEMA FIELDS IN >${this._typeDefinition.typeName}< HAVE A DEFAULT!!! - ${e.message}`);
        }
    }

    /**
     * Validates the passed config against this type's total (combined) configuration.
     * @param config
     */
    validateConfig(config: any) {
        return Joi.attempt(config, this._combinedConfigSchema, {noDefaults: true, presence: "required"});
    }

    /**
     * Validates a module definition for this type.
     * @param config
     */
    validateDefinition(config: any) {
        return Joi.attempt(config, this._definitionSchema, {noDefaults: true, presence: "required"});
    }

    typeName() {
        return this._typeDefinition.typeName;
    }

    typeDefinition() {
        return this._typeDefinition;
    }

    stored2Human(raw: any, config: any): any {
        return this._typeDefinition.stored2Human(raw, config);
    }

    raw2Human(raw: any, config: any): any {
        return this._typeDefinition.raw2Human(raw, config, this._typeDefinition.stored2Human);
    }

    rawStruct(): CType<any> {
        return this._typeDefinition.rawCType;
    }

}

const d = new ModuleTypeDriver(SensorBrakePressure);

console.log(d.defaultConfig());
