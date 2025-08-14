/**
 * 互斥锁 - 基于 navigator.locks，降级到单标签页模式
 */

export interface LockOptions {
  /** 锁名称 */
  name: string
  /** 超时时间（毫秒），默认 10000 */
  timeout?: number
  /** 是否可以被其他锁中断，默认 false */
  ifAvailable?: boolean
}

/**
 * 使用互斥锁执行函数
 */
export async function withLock<T>(
  key: string,
  fn: () => Promise<T>,
  options: Omit<LockOptions, 'name'> = {}
): Promise<T> {
  const { timeout = 10_000, ifAvailable = false } = options

  // navigator.locks 支持
  if (typeof navigator !== 'undefined' && (navigator as any).locks && typeof (navigator as any).locks.request === 'function') {
    return new Promise<T>((resolve, reject) => {
      let timer: any
      const onTimeout = () => reject(new Error(`Lock '${key}' timeout after ${timeout}ms`))
      timer = setTimeout(onTimeout, timeout)
      ;(navigator as any).locks
        .request(
          key,
          { ifAvailable, mode: 'exclusive', steal: false },
          async (lock: any | null) => {
            if (!lock && ifAvailable) {
              clearTimeout(timer)
              // 未获取到锁且允许 ifAvailable，则直接执行 fn（非互斥）
              resolve(await fn())
              return
            }
            try {
              const result = await fn()
              clearTimeout(timer)
              resolve(result)
            } catch (e) {
              clearTimeout(timer)
              reject(e)
            }
          }
        )
        .catch((err: any) => {
          clearTimeout(timer)
          reject(err)
        })
    })
  }

  // 降级：单 Tab 模式，直接执行
  return fn()
}