export interface ModuleDefinition {
    name: string,
    description: string,
    id: string //MAC Id.
    version: number, //Unused for now
    config: any,
}