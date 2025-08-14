/**
 * 重试机制 - 支持指数退避、Full Jitter
 */

import { sleep } from './utils.js'

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
  const {
    retries = 3,
    baseMs = 1000,
    capMs = 30000,
    strategy = 'exponential',
    jitter = true,
    shouldRetry,
  } = options

  const computeDelay = (attemptIndex: number): number => {
    let rawDelay: number
    if (strategy === 'fixed') {
      rawDelay = baseMs
    } else if (strategy === 'linear') {
      rawDelay = baseMs * (attemptIndex + 1)
    } else {
      // exponential: base * 2^attempt
      rawDelay = baseMs * Math.pow(2, attemptIndex)
    }
    const capped = Math.min(rawDelay, capMs)
    if (jitter) {
      // Full Jitter
      return Math.floor(Math.random() * capped)
    }
    return capped
  }

  const defaultShouldRetry = (error: unknown, attempt: number): boolean => {
    // 默认只要还有剩余次数就重试
    return attempt < retries
  }

  return async function retryExecute<T>(fn: () => Promise<T>): Promise<T> {
    const totalAttempts = retries + 1
    let lastError: unknown
    for (let attempt = 0; attempt < totalAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        const canRetry = (shouldRetry ?? defaultShouldRetry)(error, attempt)
        const isLastAttempt = attempt >= retries
        if (!canRetry || isLastAttempt) {
          throw error
        }
        const delay = computeDelay(attempt)
        await sleep(delay)
      }
    }
    // 理论上不会到达这里
    throw lastError
  }
}

/**
 * 为函数添加重试能力
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const retry = createRetry(options)
  return retry(fn)
}