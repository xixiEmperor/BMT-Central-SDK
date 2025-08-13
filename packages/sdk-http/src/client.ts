/**
 * HTTP 客户端主入口
 */

import type { HttpPlugin } from './plugins/types.js'
import type { HttpRequestConfig } from './types.js'
import type { RetryOptions } from '@platform/sdk-core'

export interface HttpClientOptions {
  /** API 基础地址 */
  baseURL: string
  /** 插件列表 */
  plugins?: HttpPlugin[]
  /** 默认重试配置 */
  retry?: RetryOptions
  /** 限流配置 */
  rateLimit?: {
    rps: number
  }
  /** 是否启用请求去重，默认 true */
  requestDedup?: boolean
  /** 请求超时时间，默认 10000ms */
  timeout?: number
}

export interface HttpClient {
  get<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T>
  post<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>
  put<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>
  delete<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T>
  patch<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>
  head<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T>
  options<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T>
}

let httpInstance: HttpClient | null = null

/**
 * 初始化 HTTP 客户端
 */
export function initHttp(options: HttpClientOptions): HttpClient {
  // TODO: 实现 HTTP 客户端
  throw new Error('HTTP client not implemented yet')
}

/**
 * 获取 HTTP 客户端单例
 */
export const http: HttpClient = {
  get: () => {
    throw new Error('HTTP client not initialized. Call initHttp() first.')
  },
  post: () => {
    throw new Error('HTTP client not initialized. Call initHttp() first.')
  },
  put: () => {
    throw new Error('HTTP client not initialized. Call initHttp() first.')
  },
  delete: () => {
    throw new Error('HTTP client not initialized. Call initHttp() first.')
  },
  patch: () => {
    throw new Error('HTTP client not initialized. Call initHttp() first.')
  },
  head: () => {
    throw new Error('HTTP client not initialized. Call initHttp() first.')
  },
  options: () => {
    throw new Error('HTTP client not initialized. Call initHttp() first.')
  },
}