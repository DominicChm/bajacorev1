export interface ModuleDefinition<ConfigT> {
    name: string,
    description: string,
    id: string //MAC Id.
    version: number, //Unused for now
    type: string
    config: ConfigT,
}
