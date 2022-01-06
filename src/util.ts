import {readdir, readdirSync} from "fs-extra";

export async function isDirEmpty(dir: string): Promise<boolean> {
    return (await readdir(dir)).length <= 0
}

export function isDirEmptySync(dir: string): boolean {
    return readdirSync(dir).length <= 0;
}