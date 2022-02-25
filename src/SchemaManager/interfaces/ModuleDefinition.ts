export interface ModuleDefinition<ConfigT> {
    id: string,
    name: string,
    description: string,
    mac: string //MAC Id.
    version: number, //Unused for now
    type: string
    config: ConfigT,
}
