/**
 * HTTP 插件系统类型定义
 */

import type { AxiosRequestConfig, AxiosResponse } from 'axios'

export interface HttpPlugin {
  /** 插件名称 */
  name: string
  /** 请求前处理 */
  onRequest?(config: AxiosRequestConfig): AxiosRequestConfig | Promise<AxiosRequestConfig>
  /** 响应后处理 */
  onResponse?<T = any>(response: AxiosResponse<T>): T | Promise<T>
  /** 错误处理 */
  onError?(error: any): never | Promise<never>
  /** 插件初始化 */
  setup?(): void | Promise<void>
  /** 插件销毁 */
  teardown?(): void | Promise<void>
}