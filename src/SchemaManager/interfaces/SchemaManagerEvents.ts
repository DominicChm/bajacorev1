import {DAQSchema} from "./DAQSchema";

export interface SchemaManagerEvents {
    load: (schema: DAQSchema) => void;
    update: (schema: DAQSchema) => void;
    unload: (schema: DAQSchema) => void;

    // Emitted when a change that breaks the binary format happens, like a module being added or removed.
    formatBroken: (schema: DAQSchema) => void;
}
