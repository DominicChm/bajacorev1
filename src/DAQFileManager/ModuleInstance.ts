import {ModuleDefinition} from "./interfaces/ModuleDefinition";
import {ModuleApiEntry, ModuleApiFunction, ModuleFunctionApi, ModuleType} from "../moduleTypes/interfaces/ModuleType";
import ctypes, {CType, uint16} from "c-type-util";

type ExtendOp<T> = { __op: number, data: CType<T> }

//Used to communicate channel info to frontend.
interface APIChannelInformation {
    channel: string,
    description: string,
}

export class ModuleInstance<StorageT, MqttT, ApiParamsT> {
    public api: ModuleFunctionApi<ApiParamsT>;
    public apiChannels:
    private md: ModuleDefinition;
    private isLe: boolean;

    constructor(mt: ModuleType<StorageT, MqttT, ApiParamsT>, md: ModuleDefinition) {
        const api = {};
        this.md = md;
        this.isLe = false;
        this.api = Object.fromEntries(Object
            .entries(mt.api)
            .map(([k, v]) => [k, this.generateApiFunction(v as any)])) as ModuleFunctionApi<ApiParamsT>;
    }

    private generateApiFunction<T>([k, apiDef]: [string, ModuleApiEntry<T>]): ModuleApiFunction<T> {
        const ct = ctypes.cStruct({
            __op: uint16,
            data: apiDef.ctype
        });

        const wrapper = (data: T) => {
            this.handleApiCall(apiDef.op, ct, data);
        };

        return wrapper;
    }

    private handleApiCall<CTypeT extends CType<any>, TData>(op: number, cType: CTypeT, data: TData) {
        cType.allocLE({
            __op: op,
            data
        });
        console.log("Call, op", op);
    }

    //Returns the MAC ID of the module.
    public id(): string {
        return this.md.id;
    }

}