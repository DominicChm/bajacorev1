import {PlaybackManager, PlayOptions, RunHandle} from "./RunHandle";
import {Stream} from "stream";
import {DAQSchema} from "../ModuleManager/interfaces/DAQSchema";


export class RealtimeRun extends RunHandle {
    constructor(uuid: string, schemaPath: string) {
        super("realtime", uuid, schemaPath);
    }

    play(opts: PlayOptions, callback: (frame: any) => void) {
        if (!opts)
            throw new Error("No play options passed!");

        if (opts.scale && opts.scale !== 1)
            throw new Error("Can't play a RealtimeRun at a scale not equal to 1!");

        if (opts.tEnd || opts.tStart)
            throw new Error("Can't specify RealtimeRun start/stop!");

        const stopCB = () => {
            this.off("data", callback);
        };

        this.on("data", callback);

        return new PlaybackManager(stopCB);
    }

    feedData(data: any) {

    }
}
