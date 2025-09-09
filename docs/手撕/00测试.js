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
        return new MyPromise((resolve, reject) => {
            let results = []
            let total = promises.length
            let compliteCount = 0

            if(total === 0){
                resolve(results)
                return
            }

            promises.forEach((p, index) => {
                MyPromise.resolve(p.then(value => {
                    results[index] = value
                    compliteCount++

                    if(compliteCount === total){
                        resolve(results)
                        return
                    }
                }).catch(error => reject(error)))
            })
        })
    }
    
    static race(promises) {
        return new MyPromise((resolve, reject) => {
            promises.forEach(p => {
                MyPromise.resolve(p).then(value => resolve(value)).catch(error => reject(error))
            })
        })
    }

    static allSettled(promises) {
        return new Promise((resolve) => {
            let results = []
            let completedCount = 0
            let total = promises.length

            if(total === 0) {
                resolve(results)
                return
            }

            promises.forEach((p, index) => {
                Promise.resolve(p).then(value => {
                    results[index] = {
                        statu: 'fulfilled',
                        value
                    }
                    completedCount++

                    if(completedCount === total){
                        resolve(results)
                        return
                    }
                }).catch(error => {
                    results[index] = {
                        statu: 'rejected',
                        error
                    }
                    completedCount++

                    if(completedCount === total){
                        resolve(results)
                        return
                    }
                })
            })
        })
    }
}