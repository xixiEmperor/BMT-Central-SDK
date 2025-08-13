/**
 * 遥测主入口
 */

import type { TelemetryEvent, TelemetryUser } from './types.js'
import type { PerfMetric } from '@platform/sdk-perf'

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

  /**
   * 初始化遥测
   */
  static init(options: TelemetryOptions): void {
    // TODO: 实现遥测初始化
    throw new Error('Telemetry.init not implemented yet')
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
    // TODO: 实现页面浏览跟踪
    throw new Error('Telemetry.trackPageView not implemented yet')
  }

  /**
   * 跟踪自定义事件
   */
  static trackEvent(name: string, props?: Record<string, any>): void {
    // TODO: 实现自定义事件跟踪
    throw new Error('Telemetry.trackEvent not implemented yet')
  }

  /**
   * 跟踪错误
   */
  static trackError(name: string, message?: string, stack?: string): void {
    // TODO: 实现错误跟踪
    throw new Error('Telemetry.trackError not implemented yet')
  }

  /**
   * 跟踪 API 调用
   */
  static trackApi(url: string, status: number, duration: number): void {
    // TODO: 实现 API 跟踪
    throw new Error('Telemetry.trackApi not implemented yet')
  }

  /**
   * 跟踪性能指标
   */
  static trackPerf(metric: PerfMetric): void {
    // TODO: 实现性能指标跟踪
    throw new Error('Telemetry.trackPerf not implemented yet')
  }

  /**
   * 强制上报
   */
  static flush(): Promise<void> {
    // TODO: 实现强制上报
    throw new Error('Telemetry.flush not implemented yet')
  }

  /**
   * 获取队列状态
   */
  static getQueueStatus(): { pending: number; failed: number } {
    // TODO: 实现队列状态
    return { pending: 0, failed: 0 }
  }
}