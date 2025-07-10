
export function formatMemory(memoryUsage: number) {
    if (memoryUsage < 1024) {
        return `${memoryUsage} B`;
    } else if (memoryUsage < 1024 * 1024) {
        return `${(memoryUsage / 1024).toFixed(1)} KB`;
    } else if (memoryUsage < 1024 * 1024 * 1024) {
        return `${(memoryUsage / 1024 / 1024).toFixed(1)} MB`;
    } else {
        return `${(memoryUsage / 1024 / 1024 / 1024).toFixed(1)} GB`;
    }
}