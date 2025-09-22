function flatten(arr) {
    const res = []
    for (const item of arr) {
        if (Array.isArray(item)) {
            res.push(...flatten(item))
        } else {
            res.push(item)
        }
    }
    return res
}

const arr = [1, [2, [3, [4]], 5]]

const newArr = flatten(arr)
console.log(newArr)