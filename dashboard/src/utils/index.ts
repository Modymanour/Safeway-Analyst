export const toMonthKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
};

export const monthKeyToDate = (key: string) => {
    const [year, month] = key.split("-").map(Number);
    return new Date(year, month - 1, 1);
};

export const formatDuration = (seconds: number | null | undefined) => {
    if (seconds == null || !Number.isFinite(seconds)) return "—";
    const rounded = Math.round(seconds);
    return `${Math.floor(rounded / 60)}m ${String(rounded % 60).padStart(2, "0")}s`;
};
export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}