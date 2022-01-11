export function sliceU8(buf: Uint8Array, start: number, stop: number): Uint8Array {
    return new Uint8Array(buf.buffer, buf.byteOffset + start, buf.byteOffset + stop - start);
}

export function createDv(buf: Uint8Array): DataView
export function createDv(buf: Uint8Array, start?: number, stop?: number): DataView {
    if (start === undefined || stop === undefined)
        return new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    else
        return new DataView(buf.buffer, buf.byteOffset + start, buf.byteOffset + stop - start);
}
