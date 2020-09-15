export function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve()
        }, ms)
    })
}

export function delay(seconds) {
    return async result => {
        await sleep(seconds * 1000)
        return result
    }
}

export function debounce(func, delay) {
    let timeout
    return function () {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
            func.apply(this, arguments)
        }, delay)
    }
}

export function throttle(func, delay) {
    let run = true
    return function () {
        if (!run) {
            return
        }
        run = false
        setTimeout(() => {
            func.apply(this, arguments)
            run = true
        }, delay)
    }
}
