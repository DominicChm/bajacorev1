import {RunManager} from "./RunManager/RunManager";
import {RunFileManager} from "./RunManager/RunFileManager";
import {ModuleManager} from "./ModuleManager/ModuleManager";
import {FrontendManager} from "./FrontendManager/FrontendManager";
import {DAQFileManager} from "./DAQFileManager";

(async () => {
    const daqFileManager = new DAQFileManager("./testData", true);
    const moduleManager = new ModuleManager();

    const runManager = new RunManager(daqFileManager.runFileManager(), moduleManager);
    const frontendManager = new FrontendManager(runManager);
})();
