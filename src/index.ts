import {RunManager} from "./RunManager/RunManager";
import {ModuleManager} from "./ModuleManager/ModuleManager";
import {FrontendManager} from "./FrontendManager/FrontendManager";
import {DAQPathManager} from "./DAQFileManager/DAQPathManager";
import {StoredRunManager} from "./RunManager/StoredRunManager";
import {TimeSyncServer} from "./TimeSync/TimeSyncServer";
import {SBP} from "./moduleTypes/SensorBrakePressure";

const daqFileManager = new DAQPathManager("./testData");
const storedRunManager = new StoredRunManager({
    runDataDirectory: daqFileManager.RunDataPath()
});

const moduleManager = new ModuleManager({
    schemaPath: daqFileManager.RealtimeSchemaPath(),
    realtimeMetaPath: daqFileManager.RealtimeMetaPath(),
    mqttUrl: "mqtt://localhost:1883",
    aggregationWindow: 1000,
});

const runManager = new RunManager(storedRunManager, moduleManager);
const frontendManager = new FrontendManager(runManager);
const timeServer = new TimeSyncServer();

let s = new SBP();

s.ingestBlock(Uint8Array.from([1,0,2,0,3,0]).buffer);
console.log(s.data(), s.config())
