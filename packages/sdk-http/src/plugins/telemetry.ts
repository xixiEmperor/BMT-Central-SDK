/**
 * 遥测插件 - 自动上报 API 请求指标
 */

import type { HttpPlugin } from './types.js'

export interface TelemetryPluginOptions {
  /** 是否启用，默认 true */
  enabled?: boolean
  /** 采样率，默认 1.0 (100%) */
  sampleRate?: number
  /** 上报函数 */
  onApiCall?: (url: string, method: string, status: number, duration: number) => void
  /** 是否包含请求参数，默认 false */
  includeParams?: boolean
  /** 是否包含响应数据，默认 false */
  includeResponse?: boolean
}

/**
 * 创建遥测插件
 */
export function telemetryPlugin(options: TelemetryPluginOptions = {}): HttpPlugin {
  const {
    enabled = true,
    sampleRate = 1.0,
    onApiCall,
  } = options

  const shouldSample = () => Math.random() < sampleRate

  const plugin: HttpPlugin = {
    name: 'telemetry',
    async onResponse(resp) {
      if (!enabled) return resp.data
      const config = resp.config
      const url = config?.url ?? ''
      const method = (config?.method ?? 'GET').toUpperCase()
      const duration = (resp as any).duration ?? 0
      const status = resp.status
      if (shouldSample()) {
        onApiCall?.(url, method, status, duration)
      }
      return resp.data
    },
  }

  return plugin
}