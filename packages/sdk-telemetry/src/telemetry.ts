/**
 * 遥测主入口
 */

import type { TelemetryEvent, TelemetryUser } from './types.js'
import type { PerfMetric } from '@platform/sdk-perf'
import { createTelemetryStorage, type TelemetryStorage } from './storage.js'
import { generateId } from '@platform/sdk-core'

export interface TelemetryOptions {
  /** 上报端点 */
  endpoint: string
  /** 应用名称 */
  app: string
  /** 版本号 */
  release: string
  /** 采样率，默认 1.0 */
  sampleRate?: number
  /** 批量上报阈值，默认 20 */
  batchSize?: number
  /** 上报间隔（毫秒），默认 10000 */
  flushInterval?: number
  /** 最大缓存数量，默认 1000 */
  maxCacheSize?: number
  /** 是否启用跨标签页去重，默认 true */
  enableDedup?: boolean
}

export { type TelemetryEvent }

export class Telemetry {
  private static options: TelemetryOptions | null = null
  private static user: TelemetryUser | null = null
  private static sessionId: string | null = null
  private static storage: TelemetryStorage = createTelemetryStorage()
  private static flushTimer: any = null

  /**
   * 初始化遥测
   */
  static init(options: TelemetryOptions): void {
    this.options = {
      sampleRate: 1.0,
      batchSize: 20,
      flushInterval: 10_000,
      maxCacheSize: 1000,
      enableDedup: true,
      ...options,
    }
    this.sessionId = this.sessionId ?? generateId()
    if (this.flushTimer) clearInterval(this.flushTimer)
    this.flushTimer = setInterval(() => {
      this.flush().catch(() => void 0)
    }, this.options.flushInterval)
  }

  /**
   * 设置用户信息
   */
  static setUser(user: TelemetryUser | null): void {
    this.user = user
  }

  /**
   * 跟踪页面浏览
   */
  static trackPageView(routeName: string, props?: Record<string, any>): void {
    this.enqueue({ type: 'page', name: routeName, props })
  }

  /**
   * 跟踪自定义事件
   */
  static trackEvent(name: string, props?: Record<string, any>): void {
    this.enqueue({ type: 'event', name, props })
  }

  /**
   * 跟踪错误
   */
  static trackError(name: string, message?: string, stack?: string): void {
    this.enqueue({ type: 'error', name, props: { message, stack } })
  }

  /**
   * 跟踪 API 调用
   */
  static trackApi(url: string, status: number, duration: number): void {
    this.enqueue({ type: 'api', name: url, props: { status, duration } })
  }

  /**
   * 跟踪性能指标
   */
  static trackPerf(metric: PerfMetric): void {
    this.enqueue({ type: 'perf', name: metric.name, props: { value: metric.value, rating: metric.rating } })
  }

  /**
   * 强制上报
   */
  static flush(): Promise<void> {
    if (!this.options) return Promise.resolve()
    const endpoint = this.options.endpoint
    const batchSize = this.options.batchSize ?? 20
    return (async () => {
      const batch = await this.storage.getBatch(batchSize)
      if (batch.length === 0) return
      const body = JSON.stringify(batch)
      // 优先 sendBeacon
      if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
        const ok = (navigator as any).sendBeacon(endpoint, new Blob([body], { type: 'application/json' }))
        if (ok) {
          await this.storage.remove(batch.map(b => b.id!).filter(Boolean))
          return
        }
      }
      // 回退 fetch
      await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body })
      await this.storage.remove(batch.map(b => b.id!).filter(Boolean))
    })()
  }

  /**
   * 获取队列状态
   */
  static async getQueueStatus(): Promise<{ pending: number; failed: number }> {
    if (!this.options) return { pending: 0, failed: 0 }
    try {
      const pending = await this.storage.getCount()
      return { pending, failed: 0 }
    } catch {
      return { pending: 0, failed: 0 }
    }
  }

  /**
   * 检查是否已初始化
   */
  static isInitialized(): boolean {
    return this.options !== null
  }

  private static async enqueue(partial: Omit<TelemetryEvent, 'app' | 'release' | 'ts' | 'id' | 'sessionId'> & { props?: Record<string, any> }) {
    if (!this.options) return
    const event: TelemetryEvent = {
      ...(partial as any),
      app: this.options.app,
      release: this.options.release,
      ts: Date.now(),
      id: generateId(),
      sessionId: this.sessionId ?? generateId(),
      user: this.user ?? undefined,
    }
    await this.storage.add(event)
  }
}