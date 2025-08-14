/**
 * 限流插件 - 客户端请求频率控制
 */

import type { HttpPlugin } from './types.js'

export interface RateLimitOptions {
  /** 每秒请求数，默认 10 */
  rps?: number
  /** 突发请求缓冲区大小，默认等于 rps */
  burst?: number
  /** 等待队列最大长度，默认 100 */
  maxQueueSize?: number
}

/**
 * 创建限流插件
 */
export function rateLimitPlugin(options: RateLimitOptions = {}): HttpPlugin {
  const { rps = 10, burst = rps, maxQueueSize = 100 } = options
  let tokens = burst
  let lastRefill = Date.now()
  const queue: Array<() => void> = []

  const refill = () => {
    const now = Date.now()
    const elapsed = (now - lastRefill) / 1000
    const add = Math.floor(elapsed * rps)
    if (add > 0) {
      tokens = Math.min(tokens + add, burst)
      lastRefill = now
    }
  }

  const acquire = (): Promise<void> => {
    refill()
    if (tokens > 0) {
      tokens--
      return Promise.resolve()
    }
    if (queue.length >= maxQueueSize) {
      return Promise.reject(new Error('Rate limit queue overflow'))
    }
    return new Promise((resolve) => queue.push(resolve))
  }

  setInterval(() => {
    refill()
    while (tokens > 0 && queue.length > 0) {
      tokens--
      const next = queue.shift()!
      next()
    }
  }, 100)

  return {
    name: 'rate-limit',
    async onRequest(config) {
      await acquire()
      return config
    },
  }
}