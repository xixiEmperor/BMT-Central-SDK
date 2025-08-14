/**
 * 重试插件 - 对可重试的 HTTP 方法进行指数退避重试
 */

import type { HttpPlugin } from './types.js'
import type { RetryOptions } from '@platform/sdk-core'

export interface RetryPluginOptions extends RetryOptions {
  /** 可重试的 HTTP 方法，默认 ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'] */
  retryableMethods?: string[]
  /** 可重试的状态码，默认 [408, 429, 500, 502, 503, 504] */
  retryableStatusCodes?: number[]
}

/**
 * 创建重试插件
 */
export function retryPlugin(options: RetryPluginOptions = {}): HttpPlugin {
  const {
    retryableMethods = ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'],
    retryableStatusCodes = [408, 429, 500, 502, 503, 504],
    retries = 3,
    baseMs = 300,
    capMs = 10_000,
    strategy = 'exponential',
    jitter = true,
  } = options

  return {
    name: 'retry',
    async onRequest(config) {
      ;(config as any).__retry = { retries, baseMs, capMs, strategy, jitter }
      return config
    },
    async onResponse(resp) {
      return resp.data as any
    },
    async onError(error) {
      // 交由 http 客户端的 withRetry 统一处理，这里不吞掉错误
      throw error
    },
  }
}