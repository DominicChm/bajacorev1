import {SchemaManager} from "./SchemaManager";
import Path from "path";
import {DAQSchema} from "../ModuleManager/interfaces/DAQSchema";
import * as fs from "fs-extra";

export class FileSchemaManager extends SchemaManager {
    private _filePath: string;

    constructor(filePath: string) {
        super();
        this._filePath = Path.resolve(filePath);
        this.on("update", this.writeSchema.bind(this));
        this.on("load", this.writeSchema.bind(this));

        const json: DAQSchema = fs.readJsonSync(this._filePath, {throws: false}) || {modules: [], name: "NEW_SCHEMA!"}
        this.load(json);
    }

    writeSchema(schema: DAQSchema) {
        fs.outputJSONSync(this._filePath, schema, {spaces: 2});
    }
}
