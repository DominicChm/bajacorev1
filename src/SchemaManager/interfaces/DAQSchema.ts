import {ModuleDefinition} from "./ModuleDefinition";

export interface DAQSchema {
    name: string
    modules: ModuleDefinition<any>[]
}

export const defaultDAQSchema: DAQSchema = {
    name: "DEFAULT",
    modules: []
}
