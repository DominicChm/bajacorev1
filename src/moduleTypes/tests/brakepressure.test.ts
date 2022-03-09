import {Module} from "../../ModuleTypeRegistry/Module";
import {SBP} from "../SensorBrakePressure";

describe("Test brakepressure", () => {
    it("Correctly parses bin data", () => {
        let s = new SBP();

        s.ingestBlock(Uint8Array.from([1, 0, 2, 0, 3, 0]).buffer);
        expect(s.data().analog).toBe(1);
        expect(s.config().pressureMin).toBe(2);
        expect(s.config().pressurePerTick).toBe(3);
    });

    it("Correctly serializes a block", () => {
        let s = new SBP();

        s.ingestBlock(Uint8Array.from([1, 0, 2, 0, 3, 0]).buffer);
        expect(s.data().analog).toBe(1);
        expect(s.config().pressureMin).toBe(2);
        expect(s.config().pressurePerTick).toBe(3);
    });
})
