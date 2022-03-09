import {Module} from "./Module";
import {Class} from "./Interfaces/Class";

export class ModuleTypeRegistry {
    private _moduleTypes: Map<string, Class<Module>>

    public registerModule<T extends Module>(clazz: Class<T>): this {
        this._moduleTypes.set(clazz.constructor.name, clazz);
        return this;
    }

    private validateModule<T extends Module>(clazz: Class<T>) {

    }
}
