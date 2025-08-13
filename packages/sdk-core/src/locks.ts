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
  // TODO: 实现互斥锁
  throw new Error('Lock mechanism not implemented yet')
}