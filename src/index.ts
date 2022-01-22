import {RunManager} from "./RunManager/RunManager";
import {RunFileManager} from "./RunManager/RunFileManager";
import {ModuleManager} from "./ModuleManager/ModuleManager";
import {FrontendManager} from "./FrontendManager/FrontendManager";
import {DAQFileManager} from "./DAQFileManager/DAQFileManager";
import SensorBrakePressure from "./moduleTypes/SensorBrakePressure";
import {SchemaManager} from "./ModuleManager/SchemaManager";

(async () => {
    const daqFileManager = new DAQFileManager("./testData", true);
    const schemaManager = new SchemaManager({moduleTypes: [SensorBrakePressure]});
    const moduleManager = new ModuleManager({
        schemaManager: schemaManager,
        mqttUrl: "mqtt://localhost:1833",
    });

    const runManager = new RunManager(daqFileManager.runFileManager(), moduleManager);
    const frontendManager = new FrontendManager(runManager);
})();
