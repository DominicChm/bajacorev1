import {SchemaManager} from "./SchemaManager";
import {ModuleDefinition} from "./interfaces/ModuleDefinition";
import {checkDuplicates} from "../Util/util";
import {ModuleInstance} from "./ModuleInstance";
import {isEqual} from "lodash";
import {logger} from "../Util/logging";
import {TypedEmitter} from "tiny-typed-emitter";
import {InstanceManagerEvents} from "./interfaces/InstanceManagerEvents";

const log = logger("InstanceManager");

/**
 * Creates and manages updates for ModuleInstances
 */
export class InstanceManager extends TypedEmitter<InstanceManagerEvents> {
    private _schemaManager: SchemaManager;
    private _instances: Map<string, ModuleInstance> = new Map();
    private _converters: Map<string, any>;

    constructor(manager: SchemaManager) {
        super();
        this._schemaManager = manager;
    }

    /**
     * Checks a module instance against a new definition for any entirely incompatible changes,
     * like a type change.
     * @private
     */
    private isInstanceInvalid(instance: ModuleInstance, definition: ModuleDefinition): boolean {
        return instance.definition().type !== definition.type;
    }

    private definitionToMap(def: ModuleDefinition[]) {
        return new Map(def.map(d => [d.id, d]));
    }

    /**
     * Loads and validates passed definitions
     * @param defs
     * @param throwOnBreak
     */
    loadModuleDefinitions(defs: ModuleDefinition[], throwOnBreak: boolean = false) {
        checkDuplicates(defs, (m) => m.id);

        const mappedDefs = this.preprocessDefinition(this.definitionToMap(defs), throwOnBreak);
        let instances = new Map(this._instances);

        // Track IDs that have been modified
        const creations = new Map<string, ModuleInstance>();
        const changes = new Map<string, ModuleInstance>();
        const deletions = new Map<string, ModuleInstance>();

        for (const [uuid, definition] of mappedDefs) {
            //Updates and creates instances.
            let instance = this.instance(uuid);
            const driver = this._schemaManager.findDriver(definition.type);

            if (!instance) {
                instance = new ModuleInstance(driver, definition)
                instances.set(uuid, instance);
                creations.set(uuid, instance);

                if (throwOnBreak) throw new Error("Attempted creation of instance when schema breaking isn't allowed!");

                log(`CREATE >${uuid}<`);

            } else if (!isEqual(instance.definition(), definition)) {
                instance.setDefinition(definition);
                changes.set(uuid, instance);

                log(`UPDATE >${uuid}<`);
            }
        }

        // Identify uuids to be deleted.
        for (const [uuid, instance] of instances) {
            if (!mappedDefs.has(uuid)) {
                deletions.set(uuid, instance);

                if (throwOnBreak) throw new Error("Attempted deletion of instance when schema breaking isn't allowed!");

                log(`DELETE >${uuid}<`);
            }
        }

        // At this point, instances holds both previous (deleted) and new (created) instances.
        deletions.forEach((i, uuid) => instances.delete(uuid));
        this._instances = instances;

        //Now that this class will return completely updated information, emit events and handle pre-load.
        deletions.forEach(i => this.emit("unbindInstance", i));
        creations.forEach(i => this.emit("bindInstance", i));
        changes.forEach(i => this.emit("rebindInstance", i));

        this._converters = new Map()
        for (const instance of this.instances()) {
            this._converters.set(instance.id(), instance.stored2human)
        }

        return {
            definitions: this.moduleDefinitions(),
            loadResults: {
                created: creations.size,
                changed: changes.size,
                deleted: deletions.size
            }
        };
    }

    /**
     * Returns mapped definitions with type changed definitions replaced with new instances.
     * Replaced definitions have new UUIDs so old instances are picked up by the cleanup code.
     * @param mappedDefs
     * @param throwOnBreak
     * @private
     */
    private preprocessDefinition(mappedDefs: Map<string, ModuleDefinition>, throwOnBreak: boolean = false): Map<string, ModuleDefinition> {
        for (const [uuid, definition] of mappedDefs) {
            const driver = this._schemaManager.findDriver(definition.type);
            const instance = this.instance(uuid);

            // Replace an invalid definition with an entirely new one.
            if (instance && this.isInstanceInvalid(instance, definition)) {
                if (throwOnBreak) throw new Error("Attempted type-change of instance when schema breaking isn't allowed!");

                mappedDefs.delete(uuid);

                const derivedDef = driver.deriveDefinition(definition);
                mappedDefs.set(derivedDef.id, derivedDef);

                log(`TYPECHANGED >${instance.id()}<`)
            }
        }

        return mappedDefs;
    }

    private moduleDefinitions(): ModuleDefinition[] {
        return Array.from(this._instances).map(([uuid, instance]) => instance.definition());
    }

    /**
     * Find an instance based on the passed MAC ID.
     * @param uuid
     */
    instance(uuid: string): ModuleInstance | undefined {
        return this._instances.get(uuid);
    }

    instances() {
        return Array.from(this._instances.values());
    }

    public raw2human(rawData: any) {
        const convertedData: any = {};
        for (const [uuid, converter] of this._converters) {
            convertedData[uuid] = converter(rawData[uuid]);
        }

        return convertedData;
    }
}
