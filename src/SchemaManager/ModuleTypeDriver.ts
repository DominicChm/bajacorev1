import {ModuleTypeDefinition} from "./interfaces/ModuleTypeDefinition";
import Joi from "joi";
import {cStruct, CType} from "c-type-util";
import {v4} from "uuid";
import {ModuleDefinition} from "./interfaces/ModuleDefinition";
import {ModuleDefinitionSchema} from "./schemas/ModuleDefinition";
import {CommonReplicatedModuleConfig} from "./schemas/CommonReplicatedModuleConfig";
import {hashCode} from "../Util/util";

/**
 * Drives and allows easy interaction with a ModuleTypeDefinition, which describes a type of module.
 */
export class ModuleTypeDriver {
    private readonly _typeDefinition: ModuleTypeDefinition;
    private readonly _totalConfigSchema: Joi.ObjectSchema;
    private readonly _persistentDefinitionSchema: Joi.ObjectSchema;
    private readonly _replicatedConfigSchema: Joi.ObjectSchema;
    private readonly _persistentConfigSchema: Joi.ObjectSchema;
    private readonly _definitionSchema: Joi.ObjectSchema;

    constructor(typeDef: ModuleTypeDefinition) {
        this._typeDefinition = typeDef;

        // Schema that's used to validate incoming schema sets.
        this._totalConfigSchema = Joi.object({
            ...CommonReplicatedModuleConfig,
            ...this._typeDefinition.replicatedConfigSchema,
            ...this._typeDefinition.persistentConfigSchema
        });

        this._replicatedConfigSchema = Joi.object({
            ...CommonReplicatedModuleConfig,
            ...this._typeDefinition.replicatedConfigSchema
        })

        this._persistentConfigSchema = Joi.object(this._typeDefinition.persistentConfigSchema);

        this._persistentDefinitionSchema = ModuleDefinitionSchema({
            configSchema: this._persistentConfigSchema,
            typename: typeDef.typeName,
            defaultName: `New ${typeDef.typeName}`,
            defaultConfig: this.defaultConfig(),
        });

        // The schema used to do validation at runtime.
        this._definitionSchema = ModuleDefinitionSchema({
            configSchema: this._totalConfigSchema,
            typename: typeDef.typeName,
            defaultName: `New ${typeDef.typeName}`,
            defaultConfig: this.defaultConfig(),
        });
    }

    public typeHash() {
        return hashCode(this.typeName());
    }

    /**
     * Returns a default configuration for this type.
     */
    defaultConfig(): any {
        try {
            //2 validation passes - 1 to generate defaults, 2 to validate that the default config is valid.
            const cfg = Joi.attempt({
                typeNameHash: hashCode(this.typeName())
            }, this._totalConfigSchema, {noDefaults: false});

            return this.validateTotalConfig(cfg);
        } catch (e: any) {
            throw new Error(`Error creating a default config! MAKE SURE ALL CONFIG SCHEMA FIELDS IN >${this._typeDefinition.typeName}< HAVE A DEFAULT!!! - ${e.message}`);
        }
    }

    /**
     * Returns a default module definition for this type.
     */
    newDefinition(id = v4()) {
        try {
            const def = Joi.attempt({id}, this._persistentDefinitionSchema, {noDefaults: false});
            return this.validateDefinition(def);
        } catch (e: any) {
            throw new Error(`Error creating a default definition! MAKE SURE ALL CONFIG SCHEMA FIELDS IN >${this._typeDefinition.typeName}< HAVE A DEFAULT!!! - ${e.message}`);
        }
    }

    /**
     * Creates a new definition of this type with the same name, uuid, id, etc... as the passed.
     */
    deriveDefinition(definition: ModuleDefinition): ModuleDefinition {
        return {
            ...this.newDefinition(),
            name: definition.name,
            description: definition.description,
            mac: definition.mac,
        }
    }

    /**
     * Validates the passed config against this type's total (combined) configuration.
     * @param config
     */
    validateTotalConfig(config: any) {
        return Joi.attempt(config, this._totalConfigSchema, {noDefaults: true, presence: "required"});
    }

    validateReplicatedConfig(config: any) {
        return Joi.attempt(config, this._replicatedConfigSchema, {
            noDefaults: true,
            presence: "required",
            stripUnknown: true
        });
    }

    validatePersistentConfig(config: any) {
        return Joi.attempt(config, this._persistentConfigSchema, {
            noDefaults: true,
            presence: "required",
            stripUnknown: true
        });
    }

    /**
     * Validates a module definition for this type.
     * @param config
     */
    validatePersistentDefinition(config: any) {
        return Joi.attempt(config, this._persistentDefinitionSchema, {
            noDefaults: true,
            presence: "required",
            stripUnknown: true
        });
    }

    validateDefinition(config: any) {
        return Joi.attempt(config, this._definitionSchema, {
            noDefaults: true,
            presence: "required",
            stripUnknown: true
        });
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

    rawCType(): CType<any> {
        return cStruct(this._typeDefinition.rawCType);
    }

    storageCType(): CType<any> {
        return cStruct(this._typeDefinition.storageCType);
    }

    replicatedConfigCType(): CType<any> {
        return cStruct(this._typeDefinition.replicatedConfigCType);
    }
}
