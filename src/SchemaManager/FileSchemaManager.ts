import {SchemaManager} from "./SchemaManager";
import Path from "path";
import {DAQSchema} from "./interfaces/DAQSchema";
import * as fs from "fs-extra";

export class FileSchemaManager extends SchemaManager {
    private readonly _filePath: string;

    constructor(filePath: string) {
        super();
        this._filePath = Path.resolve(filePath);

        //Attach listeners to update/load events to write schema.
        this.on("update", this.writeSchema.bind(this));
        this.on("load", this.writeSchema.bind(this));

        const json: DAQSchema = fs.readJsonSync(this._filePath, {throws: false}) || {modules: [], name: "NEW_SCHEMA!"}
        this.load(json);
    }

    public writeSchema(schema: DAQSchema) {
        fs.outputJSONSync(this._filePath, schema, {spaces: 2});
    }

    public filePath() {
        return this._filePath;
    }
}
