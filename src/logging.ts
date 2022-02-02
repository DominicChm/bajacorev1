import * as winston from "winston";
import chalk from "chalk";

let labelLen = 0; //Used to align log messages.

export type log_fn_t = (msg: string, level?: level_keys_t) => void;

type level_keys_t = "fatal" | "alert" | "error" | "warn" | "info" | "debug" | "net" | "silly";

const loggerLevels: { [K in level_keys_t]: number } = {
    fatal: 0,
    alert: 1,
    error: 2,
    warn: 3,
    info: 4,
    debug: 5,
    net: 6,
    silly: 7,
};

class Random {
    private seed;

    constructor(seed?: number) {
        this.seed = (seed ?? 0) + 69;
    }

    random() {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    nextHexColor() {
        return `#${(Math.floor(this.random() * 0xBBBBBB) + 0x444444).toString(16)}`
    }
}

const hashCode = (s: string) => s.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0)

const format = winston.format.combine(
    winston.format(info => {
        info.level = info.level.toUpperCase();
        return info;
    })(),
    winston.format.colorize(),
    winston.format.printf(({level, message, label, labelColor}) => {
        const l = labelColor(`[${label}]`) //.padStart(labelLen + 3)
        return `${l} (${level}): ${message}`;
    })
);

const logging = winston.createLogger({
    transports: [new winston.transports.Console()],
    format: format,
    levels: loggerLevels,
});


export function logger(moduleName: string): log_fn_t {
    const color = `#` + (hashCode(moduleName) & 0xFFFFFF).toString(16).padStart(6, '0');
    labelLen = Math.max(labelLen, moduleName.length);
    return function log(msg: string, level: level_keys_t = "info") {
        logging.log({
            level: level,
            message: msg,
            label: moduleName,
            labelColor: chalk.hex(color)
        });
    };
}
