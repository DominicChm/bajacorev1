import {readdir, readdirSync} from "fs-extra";

export async function isDirEmpty(dir: string): Promise<boolean> {
    return (await readdir(dir)).length <= 0
}

export function isDirEmptySync(dir: string): boolean {
    return readdirSync(dir).length <= 0;
}

export function checkDuplicates<T, idT>(arr: Array<T>, predicate: (value: T) => idT) {
    const ids = new Set<idT>();
    arr.forEach((v, i) => {
        const id = predicate(v);
        if (ids.has(id))
            throw new Error(`Duplicate: >${id}<`);
    });
}

export function bindThis(clazz: any, self: any) {
    const methodKeys = Reflect.ownKeys(clazz.prototype).filter(k => k !== "constructor");
    for (const k of methodKeys) self[k] = clazz.prototype[k].bind(self);
}
