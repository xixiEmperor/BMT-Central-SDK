function debounce(fn, delay) {
    let timer = null
    return function (...arg) {
        if (timer) {
            clearTimeout(timer)
        }
        timer = setTimeout(() => {
            fn.call(this, ...arg)
        }, delay);
    }
}

// 修正后的版本（基于你的原始代码）
function throttle(fn, delay) {
    let last = 0
    return function (...arg) {
        let now = Date.now()
        if (now - last >= delay) {
            last = now
            return fn.call(this, ...arg)  // 直接返回，不需要额外的res变量
        }
        // 修正：冷却期间也返回undefined，保持返回值一致性
        return undefined
    }
}