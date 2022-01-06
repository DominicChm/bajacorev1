import {RealtimeRun} from "../RunManager/RealtimeRun";
import {v4} from "uuid"

export class ModuleManager {
    //Links to MQTT and handles status and data aggregation and encoding
    _dummyRun = new RealtimeRun(v4());

    getRuns(): RealtimeRun[] {
        return [this._dummyRun];
    }
}
