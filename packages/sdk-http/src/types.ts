/**
 * HTTP 客户端类型定义
 */

import type { AxiosRequestConfig, AxiosResponse } from 'axios'

// 通用 HTTP 错误类型
export type HttpErrorType = 'Network' | 'Timeout' | 'Http' | 'Validation' | 'ServiceUnavailable'

// HTTP 方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

// 请求配置扩展
export interface HttpRequestConfig extends AxiosRequestConfig {
  /** 是否跳过插件处理 */
  skipPlugins?: string[]
  /** 是否启用请求去重 */
  enableDedup?: boolean
  /** 自定义重试配置 */
  retryConfig?: {
    retries?: number
    baseMs?: number
    capMs?: number
  }
}

// 响应数据包装
export interface HttpResponse<T = unknown> extends AxiosResponse<T> {
  /** 是否来自缓存 */
  fromCache?: boolean
  /** 重试次数 */
  retryCount?: number
}