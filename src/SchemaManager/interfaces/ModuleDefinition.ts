export interface ModuleDefinition {
    id: string,
    name: string,
    description: string,
    mac: string //MAC Id.
    version: number, //Unused for now
    type: string
    config: Object,
}
