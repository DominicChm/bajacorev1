import {RunManager} from "./RunManager/RunManager";
import {FileManager} from "./RunManager/FileManager";
import {ModuleManager} from "./ModuleManager/ModuleManager";
import {FrontendManager} from "./FrontendManager/FrontendManager";

(async () => {
    const fileManager = new FileManager("C:\\Users\\Domo2\\Documents\\Webstorm\\bajacore\\testData");
    const moduleManager = new ModuleManager();

    const runManager = new RunManager(fileManager, null);
    const frontendManager = new FrontendManager(runManager);
})()
