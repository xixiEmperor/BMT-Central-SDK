class MyPromise {
    constructor(executor) {
        this.status = 'pending'
        this.value = null
        this.reason = null
        this.onFulfilledCallback = []
        this.onRejectedCallback = []

        const resolve = (value) => {
            this.status = 'fulfilled'
            this.value = value

            for (const l of this.onFulfilledCallback) {
                l(value)
            }
        }

        const reject = (reason) => {
            this.status = 'rejected'
            this.reason = reason

            for (const l of this.onRejectedCallback) {
                l(reason)
            }
        }

        try {
            executor(resolve, reject)
        } catch (error) {
            reject(error)
        }
    }

    then(onFulfilled, onError) {
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
        onError = typeof onError === 'function' ? onError : reason => new Error(reason)

        const promise2 = new MyPromise((resolve, reject) => {
            if (this.status === 'fulfilled') {
                setTimeout(() => {
                    try {
                        onFulfilled(this.value)
                    } catch (error) {
                        reject(error)
                    }
                }, 0)
            }

            if (this.status === 'rejected') {
                setTimeout(() => {
                    try {
                        onError(this.reason)
                    } catch (error) {
                        reject(error)
                    }
                }, 0);
            }

            if (this.status === 'pending') {
                this.onFulfilledCallback.push(() => {
                    setTimeout(() => {
                        try {
                            onFulfilled(this.value)
                        } catch (error) {
                            reject(error)
                        }
                    }, 0)
                })

                this.onRejectedCallback.push(() => {
                    setTimeout(() => {
                        try {
                            onError(this.reason)
                        } catch (error) {
                            reject(error)
                        }
                    }, 0);
                })
            }
        })

        return promise2
    }

    catch(onError) {
        return this.then(_, onError)
    }

    static all(promises) {
        let results = []
        let total = promises.length
        let completedCount = 0

        if (total === 0) {
            resolve(results)
            return
        }

        return new MyPromise((resolve, reject) => {
            promises.forEach((p, index) => {
                p.then(value => {
                    results[index] = value
                    completedCount++

                    if (completedCount === total) {
                        resolve(results)
                    }
                }).catch((error) => reject(error))
            });
        })
    }
}