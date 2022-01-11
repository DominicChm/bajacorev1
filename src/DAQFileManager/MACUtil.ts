//https://blog.xaymar.com/2020/12/08/fastest-uint8array-to-hex-string-conversion-in-javascript/
const LUT_HEX_4b = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
// End Pre-Init
const LUT_HEX_8b = new Array(0x100);
for (let n = 0; n < 0x100; n++) {
    LUT_HEX_8b[n] = `${LUT_HEX_4b[(n >>> 4) & 0xF]}${LUT_HEX_4b[n & 0xF]}`;
}

export function buf2mac(buffer: Uint8Array): string {
    let out = '';
    for (let idx = 0, edx = (buffer as any).length; idx < edx; idx++) {
        out += LUT_HEX_8b[(buffer as any)[idx]];

        if (idx < edx - 1)
            out += ':'

    }
    return out;
}

const MAC_LEN = 6;

// Modified from https://stackoverflow.com/questions/68342525/javascript-what-is-the-fastest-hexadecimal-string-to-arraybuffer-algorithm
export function mac2buf(string: string) {
    if (string.length !== 17)
        throw new Error(`Expected MAC in standard form "XX:XX:XX:XX:XX:XX", got >${string}<`);

    string = string.toUpperCase();

    const bytes = new Uint8Array(MAC_LEN);
    for (let i = 0; i < MAC_LEN; i++) {
        const c1 = string.charCodeAt(i * 3);
        const c2 = string.charCodeAt(i * 3 + 1);

        const n1 = c1 - (c1 < 58 ? 48 : 55);
        const n2 = c2 - (c2 < 58 ? 48 : 55);

        bytes[i] = n1 * 16 + n2;
    }
    return bytes;
}

export function standardizeMac(mac: string) {
    const parts = mac
        .replace(/[\W_]+/g, '')
        .match(/(.{2})/g);

    if (!parts)
        throw new Error("Couldn't generate formatted MAC parts");

    return parts.join(":");
}
