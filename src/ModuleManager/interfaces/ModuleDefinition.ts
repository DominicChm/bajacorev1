export interface ModuleDefinition<ConfigT> {
    uuid: string,
    name: string,
    description: string,
    id: string //MAC Id.
    version: number, //Unused for now
    type: string
    config: ConfigT,
}
