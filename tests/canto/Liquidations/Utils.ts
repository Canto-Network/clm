

export function diff(x: bigint, y: bigint) {
    if (x > y) {
        return x - y;
    }
    return y - x;
}