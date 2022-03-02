import {RunHandle} from "../RunHandle";
import {RealtimePlaybackManager} from "./RealtimePlaybackManager";
import {Readable} from "stream";
import {DataConverterStream} from "../../StreamUtils";
import {noop} from "lodash";

/**
 * Describes a run that's happening "right now". Used for streaming data from modules in real-time.
 */
export class RealtimeRun extends RunHandle {
    private _rootConvertedStream;

    constructor(uuid: string, schemaPath: string, metaPath: string) {
        super("realtime", uuid, schemaPath, metaPath, true);
        this._rootConvertedStream = new DataConverterStream(this.schemaManager().instanceManager());

    }

    //Raw JSON data
    feedData(data: any) {
        this.emit("data", data);
        this.emit("dataConverted", this.schemaManager().instanceManager().raw2human(data));
    }

    getPlayManager(convertData: boolean): RealtimePlaybackManager {
        return new RealtimePlaybackManager(this, convertData);
    }

    getDataStream(time: number, convert: boolean) {
        const s = new Readable({read: noop, objectMode: true});
        if (convert)
            this.on("dataConverted", s.push.bind(s));
        else
            this.on("data", s.push.bind(s));

        this.on("destroyed", s.destroy.bind(s));
        return s;
    }
}
