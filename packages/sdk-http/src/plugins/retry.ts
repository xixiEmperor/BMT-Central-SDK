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
  // TODO: 实现重试插件
  throw new Error('Retry plugin not implemented yet')
}