/**
 * 熔断器插件 - 基于错误率和超时自动熔断
 */

import type { HttpPlugin } from './types.js'

export interface CircuitBreakerOptions {
  /** 失败阈值（百分比），默认 50 */
  failureThreshold?: number
  /** 超时阈值（毫秒），默认 10000 */
  timeoutThreshold?: number
  /** 最小请求数，默认 10 */
  minimumRequests?: number
  /** 半开状态重试间隔（毫秒），默认 30000 */
  retryInterval?: number
  /** 状态重置间隔（毫秒），默认 60000 */
  resetInterval?: number
}

/**
 * 创建熔断器插件
 */
export function circuitBreakerPlugin(options: CircuitBreakerOptions = {}): HttpPlugin {
  const {
    failureThreshold = 50,
    minimumRequests = 10,
    retryInterval = 30_000,
    resetInterval = 60_000,
  } = options

  type State = 'closed' | 'open' | 'half-open'
  let state: State = 'closed'
  let lastOpenedAt = 0
  let windowStart = Date.now()
  let total = 0
  let failed = 0

  const resetWindow = () => {
    windowStart = Date.now()
    total = 0
    failed = 0
  }

  setInterval(() => {
    // 定期重置统计窗口
    resetWindow()
  }, resetInterval)

  return {
    name: 'circuit-breaker',
    async onRequest(config) {
      if (state === 'open') {
        const now = Date.now()
        if (now - lastOpenedAt > retryInterval) {
          state = 'half-open'
        } else {
          // 直接拒绝
          throw { type: 'ServiceUnavailable', message: 'Circuit breaker open' }
        }
      }
      return config
    },
    async onResponse(resp) {
      total++
      if (state === 'half-open') {
        // 成功则关闭
        state = 'closed'
        resetWindow()
      }
      return resp.data as any
    },
    async onError(error) {
      total++
      failed++
      const percent = total > 0 ? (failed / total) * 100 : 0
      if (total >= minimumRequests && percent >= failureThreshold && state !== 'open') {
        state = 'open'
        lastOpenedAt = Date.now()
      }
      throw error
    },
  }
}