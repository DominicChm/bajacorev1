import {Module} from "./Module";
import {Class} from "./Interfaces/Class";

export class ModuleTypeRegistry {
    private _moduleTypes: Map<string, Module>

    public registerModule<T extends Module>(lel: Class<T>) {

    }

    private validateModule<T extends Module>(lel: Class<T>) {

    }
}
