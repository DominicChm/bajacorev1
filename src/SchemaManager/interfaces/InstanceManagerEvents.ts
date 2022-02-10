import {ModuleInstance} from "../ModuleInstance";

export interface InstanceManagerEvents {
    bindInstance: (instance: ModuleInstance) => void;
    unbindInstance: (instance: ModuleInstance) => void;
    rebindInstance: (instance: ModuleInstance) => void;
}
