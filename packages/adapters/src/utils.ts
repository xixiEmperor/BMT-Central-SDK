/**
 * 适配器工具函数
 */

import type { ErrorHandler, RetryFn, DelayFn } from './types.js'

/**
 * 创建默认错误处理器
 */
export function createDefaultErrorHandler(): ErrorHandler {
  return (error: Error) => {
    // TODO: 集成 Telemetry.trackError
    console.error('Query error:', error)
  }
}

/**
 * 创建默认重试函数
 */
export function createDefaultRetryFn(): RetryFn {
  return (failureCount: number, error: Error) => {
    // 最多重试 3 次
    if (failureCount >= 3) {
      return false
    }
    
    // 检查是否为可重试错误
    return isRetryableError(error)
  }
}

/**
 * 创建默认延迟函数（指数退避）
 */
export function createDefaultDelayFn(): DelayFn {
  return (attemptIndex: number) => {
    // 指数退避: 1s, 2s, 4s, 8s...
    return Math.min(1000 * Math.pow(2, attemptIndex), 30000)
  }
}

/**
 * 判断错误是否可重试
 */
export function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const httpError = error as any
  
  // 网络错误可重试
  if (httpError.type === 'Network') {
    return true
  }
  
  // 超时错误可重试
  if (httpError.type === 'Timeout') {
    return true
  }
  
  // 特定 HTTP 状态码可重试
  if (httpError.type === 'Http' && httpError.status) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504]
    return retryableStatuses.includes(httpError.status)
  }
  
  return false
}