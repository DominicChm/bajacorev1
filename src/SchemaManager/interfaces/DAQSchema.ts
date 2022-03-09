import {ModuleDefinition} from "./ModuleDefinition";

export interface DAQSchema {
    name: string;
    frameInterval: number;
    modules: { [key: string]: ModuleDefinition };
}

export const defaultDAQSchema: DAQSchema = {
    name: "DEFAULT",
    frameInterval: 100,
    modules: {},
}
