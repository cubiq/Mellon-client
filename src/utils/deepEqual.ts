
export const deepEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (a == null || b == null) return false;

    const bothAreObjects = a && b && typeof a === "object" && typeof b === "object";
    return bothAreObjects &&
        Object.keys(a).length === Object.keys(b).length &&
        Object.keys(a).every(key => deepEqual(a[key], b[key]));
};
