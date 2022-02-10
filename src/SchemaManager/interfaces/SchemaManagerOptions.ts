import {ModuleTypeDefinition} from "./ModuleTypeDefinition";

export interface SchemaManagerOptions {
    moduleTypes: ModuleTypeDefinition[],
    breakingAllowed: boolean,
}
