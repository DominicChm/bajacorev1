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

export function bindClass(c: any) {
    // Get all defined class methods
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(c));

    // Bind all methods
    methods
        .filter(method => (method !== 'constructor'))
        .forEach((method) => {
            c[method] = c[method].bind(c);
        });
}