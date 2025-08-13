/**
 * 重试机制 - 支持指数退避、Full Jitter
 */

export interface RetryOptions {
  /** 重试次数，默认 3 */
  retries?: number
  /** 基础延迟（毫秒），默认 1000 */
  baseMs?: number
  /** 最大延迟（毫秒），默认 30000 */
  capMs?: number
  /** 重试策略，默认 'exponential' */
  strategy?: 'fixed' | 'exponential' | 'linear'
  /** 是否使用 Full Jitter，默认 true */
  jitter?: boolean
  /** 判断是否应该重试的函数 */
  shouldRetry?: (error: unknown, attempt: number) => boolean
}

export interface RetryContext {
  attempt: number
  totalAttempts: number
  delay: number
  error: unknown
}

/**
 * 创建重试函数
 */
export function createRetry(options: RetryOptions = {}) {
  // TODO: 实现重试逻辑
  throw new Error('Retry mechanism not implemented yet')
}

/**
 * 为函数添加重试能力
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // TODO: 实现重试包装器
  throw new Error('withRetry not implemented yet')
}