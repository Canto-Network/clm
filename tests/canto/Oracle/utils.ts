export function min(a: bigint, b: bigint) {
    if (a < b) {
        return a
    }
    return b
}

export function avg(arr: Array<any>, idx: any) {
    let sum : any = BigInt(0)
    for(var i = idx; i < arr.length - 1; i++) {
        sum += BigInt(arr[i])
    }
    return BigInt(sum) / (BigInt(arr.length) - BigInt(idx + 1))
}

// newton's iterative sqrt: x_{n+1} = 0.5(x_n + a/x_n), a = value
export function sqrt(value : any) {  
    function iterative(value, xn : any) {
        let xn_1 = (BigInt(xn) + BigInt(value) / BigInt(xn)) / BigInt(2)
        if(diff(BigInt(xn), BigInt(xn_1)) <= 1) {
            return BigInt(xn)
        }
        return iterative(value, xn_1)
    }
    return iterative(value, BigInt(1))
}



export function diff(x: bigint, y: bigint) {
    if (x > y) {
        return x - y;
    }
    return y - x;
}