import {ModuleTypeDefinition} from "daq-parse-libv2";
import {Parser} from "binary-parser";
import Joi from "joi";
import {DAQModuleTypeDefinition} from "./interfaces/ModuleType";

interface SBPRaw {
    analogValue: number;
}

interface SBPConverted {
    pressurePsi: number;
}

interface SBPConfig {

}

export const SensorBrakePressure: DAQModuleTypeDefinition<SBPConfig, SBPConverted, SBPRaw> = {
    encode(raw: SBPRaw, cfg, dv, offset: number): number {
        dv.setUint16(offset, raw.analogValue, true);
        return 2;
    },

    moduleTypeName: "brake_pressure",

    cfgSchema: Joi.object({}),

    parser: new Parser()
        .endianess("little")
        .uint16("analogValue"),

    convert: (rawData, config) => ({
        pressurePsi: rawData.analogValue * 2
    })
}
