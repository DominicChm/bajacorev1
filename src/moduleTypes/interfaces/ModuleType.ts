import Joi from "joi";
import ctypes, {CType} from "c-type-util"

export interface ModuleApiEntry<T> {
    description: string,
    op: number,
    ctype: CType<T>,
}

type ModuleApi<ApiParamsT> = {
    [K in keyof ApiParamsT]: ModuleApiEntry<ApiParamsT[K]>
}

export type ModuleApiFunction<ApiDataT> = (data: ApiDataT) => void

export type ModuleFunctionApi<ApiParamsT> = {
    [K in keyof ApiParamsT]: ModuleApiFunction<ApiParamsT[K]>;
}

const test: ModuleApi<{cvt: number}> = {
    cvt: {
        description: "",
        op: 0,
        ctype: ctypes.uint16
    }
}

//type test = Record<number, CType<any>>


export interface ModuleType<StorageT, MqttT, ApiParamsT> {
    moduleTypename: string,
    configSchema: Joi.Schema,

    storageStruct: CType<StorageT>,
    mqttStruct: CType<MqttT>

    api: ModuleApi<ApiParamsT>
}

