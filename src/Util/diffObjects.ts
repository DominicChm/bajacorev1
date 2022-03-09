import {isEqual} from "lodash";

type diffKeysReturn = {
    added: string[],
    deleted: string[],
    changed: string[],
}

export function diffObjects(previous: Object, current: Object): diffKeysReturn {
    return {
        added: Object.keys(current).filter(k => !Object.keys(previous).includes(k)),
        deleted: Object.keys(previous).filter(k => !Object.keys(current).includes(k)),
        changed: Object.entries(current)
            .filter(([k, v]) => previous[k] != null && !isEqual(previous[k], v))
            .map(([k, v]) => k),
    }
}
