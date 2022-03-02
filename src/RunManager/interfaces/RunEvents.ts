export interface RunEvents {
    destroyed: () => void;
    formatChanged: () => void;

    dataConverted: (data: any) => void;
    data: (data: any) => void;

    unlink: () => void;
    link: () => void;
}
