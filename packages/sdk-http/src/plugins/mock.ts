/**
 * Mock 插件 - 使用 Axios adapter 短路返回伪造响应
 */

import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import type { HttpPlugin } from './types.js'

export interface MockRoute {
  /** 命中判断 */
  test: (config: AxiosRequestConfig) => boolean
  /** 返回数据 */
  response: (config: AxiosRequestConfig) => any | Promise<any>
  /** HTTP 状态码，默认 200 */
  status?: number
  /** 延迟毫秒 */
  delayMs?: number
  /** 额外头 */
  headers?: Record<string, string>
}

export interface MockPluginOptions {
  enabled?: boolean
  routes: MockRoute[]
}

export function mockPlugin(options: MockPluginOptions): HttpPlugin {
  const { enabled = true, routes } = options
  return {
    name: 'mock',
    async onRequest(config) {
      if (!enabled) return config
      const matched = routes.find(r => r.test(config))
      if (!matched) return config
      const { delayMs = 0, status = 200, headers = {} } = matched
      const originalAdapter = (config as any).adapter
      ;(config as any).adapter = async () => {
        const data = await matched.response(config)
        if (delayMs) await new Promise(r => setTimeout(r, delayMs))
        const resp = {
          data,
          status,
          statusText: String(status),
          headers,
          config: config as any,
          request: null,
        } as any as AxiosResponse
        return resp
      }
      // 保存以便链上其它插件可见（可选）
      ;(config as any).__mocked = true
      ;(config as any).__originalAdapter = originalAdapter
      return config
    },
  }
}

