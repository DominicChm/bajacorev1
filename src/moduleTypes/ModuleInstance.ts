import {ModuleType} from "./ModuleType";
import {ModuleDefinition} from "./interfaces/ModuleDefinition";

interface ModuleInstanceState {
    connected: boolean;
}

export interface IModuleInstance<StorageStruct, MqttStruct extends StorageStruct, ConfigT> {
    new(moduleType: ModuleType<StorageStruct, MqttStruct, ConfigT, any>, moduleDefinition: ModuleDefinition<ConfigT>): ModuleInstance<StorageStruct, MqttStruct, ConfigT>
}

export class ModuleInstance<StorageStruct, MqttStruct extends StorageStruct, ConfigT> {
    private _state: ModuleInstanceState;
    private _data: MqttStruct | undefined;

    constructor(moduleType: ModuleType<StorageStruct, MqttStruct, ConfigT, any>, moduleDefinition: ModuleDefinition<ConfigT>) {
        this._state = {
            connected: false
        }

        //Validate definition on construction
        moduleDefinition.config = moduleType.validateConfig(moduleDefinition.config);
    }

}
