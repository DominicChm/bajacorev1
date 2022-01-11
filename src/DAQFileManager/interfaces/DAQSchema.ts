import {ModuleDefinition} from "./ModuleDefinition";

export interface DAQSchema {
    name: string
    modules: ModuleDefinition[]
}

export const defaultDAQSchema: DAQSchema = {
    name: "DEFAULT",
    modules: []
}