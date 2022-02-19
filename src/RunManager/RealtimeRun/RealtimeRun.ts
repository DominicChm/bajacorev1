import {RunHandle} from "../RunHandle";
import {PlaybackManager} from "../PlaybackManager";
import {RealtimePlaybackManager} from "./RealtimePlaybackManager";

/**
 * Describes a run that's happening "right now". Used for streaming data from modules in real-time.
 */
export class RealtimeRun extends RunHandle {
    constructor(uuid: string, schemaPath: string) {
        super("realtime", uuid, schemaPath);
    }

    //Raw JSON data
    feedData(data: any, timestamp: number) {
        //console.log(data);
        this.emit("data", data, timestamp);
    }

    getPlayManager(convertData: boolean): RealtimePlaybackManager {
        return new RealtimePlaybackManager(this, convertData);
    }
}
