export interface ModuleInstanceEvents {
    //Called when a parameter that requires a full reload is changed (like ID)
    raw_data: (data: Buffer, timestamp: number) => void;
    data: (data: any, timestamp: number) => void;
}
