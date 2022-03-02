import {Stream, Writable} from "stream";

export function pipeChunks(chunks: { [key: string]: Stream }) {
    let stream = null;

    for (const v of Object.values(chunks)) {
        if (stream)
            stream = stream.pipe(v as Writable);
        else
            stream = v as Writable;
    }

    return stream;
}