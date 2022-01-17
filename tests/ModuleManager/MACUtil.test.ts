import {buf2mac, mac2buf, standardizeMac} from "../../src/ModuleManager/MACUtil";

describe("standardizeMac", () => {
    it("checks string length", () => {
        expect(() => standardizeMac("")).toThrow();
    });

    it("checks invalid chars", () => {
        expect(() => standardizeMac("\n@%")).toThrow();
    });

    test("throws on invalid length", () => {
        expect(() => standardizeMac("AA:BB:CC:DD:EE:F")).toThrow();
        expect(() => standardizeMac("AA:BB:CC:DD:EE:FF:FF")).toThrow();
        expect(() => standardizeMac("AA:BB:CC:DD:EE:FFF")).toThrow();

    });

    test("basic functionality", () => {
        expect(standardizeMac("AA:BB:CC:DD:EE:FF")).toBe("AA:BB:CC:DD:EE:FF");
        expect(standardizeMac("aa.bb.cc.dd.ee.ff")).toBe("AA:BB:CC:DD:EE:FF");
        expect(standardizeMac("aabbccddeeff")).toBe("AA:BB:CC:DD:EE:FF");
        expect(standardizeMac("aa-bb-cc-dd-ee-ff")).toBe("AA:BB:CC:DD:EE:FF");
    });
})
