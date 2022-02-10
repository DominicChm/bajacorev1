export interface RunEvents {
    destroyed: () => void;
    formatChanged: () => void;
    raw_data: (data: ArrayBuffer, timestamp: number) => void;
    data: (data: any, timestamp: number) => void;

    unlink: () => void;
    link: () => void;
}
