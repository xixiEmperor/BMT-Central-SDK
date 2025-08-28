/**
 * 适配器工具函数
 */

import type { ErrorHandler, RetryFn, DelayFn } from './types.js'

/**
 * 创建默认错误处理器
 */
export function createDefaultErrorHandler(options?: {
  onError?: (error: Error, context?: string) => void
  enableConsoleLog?: boolean
  enableTelemetry?: boolean
}): (error: Error, context?: string) => void {
  const { onError, enableConsoleLog = true, enableTelemetry = false } = options || {}
  
  return (error: Error, context?: string) => {
    // 控制台日志
    if (enableConsoleLog) {
      console.error('[Error Handler]:', error, context ? `(${context})` : '')
    }
    
    // 自定义错误处理
    if (onError) {
      onError(error, context)
    }
    
    // 遥测上报 (可选)
    if (enableTelemetry) {
      try {
        // 动态导入避免循环依赖
        import('@wfynbzlx666/sdk-telemetry').then(({ Telemetry }) => {
          if (Telemetry.isInitialized()) {
            Telemetry.trackError(error.name, error.message, error.stack)
          }
        }).catch(() => {
          // 忽略遥测错误
        })
      } catch {
        // 忽略遥测错误
      }
    }
  }
}

/**
 * 创建默认重试函数
 */
export function createDefaultRetryFn(options?: {
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  jitter?: boolean
}): (fn: () => Promise<any>, shouldRetry: (error: Error, attempt: number) => boolean) => Promise<any> {
  const { maxAttempts = 3, baseDelayMs = 1000, maxDelayMs = 30000, jitter = false } = options || {}
  
  return async (fn: () => Promise<any>, shouldRetry: (error: Error, attempt: number) => boolean) => {
    let lastError: Error
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        
        if (attempt >= maxAttempts || !shouldRetry(lastError, attempt)) {
          throw lastError
        }
        
        // 计算延迟时间
        let delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs)
        
        // 添加抖动
        if (jitter) {
          delay *= (0.5 + Math.random() * 0.5)
        }
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError!
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