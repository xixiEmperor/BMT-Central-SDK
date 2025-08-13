/**
 * 性能监控主入口
 */

import type { PerfMetric, PerfThresholds } from './types.js'

export interface PerfOptions {
  /** 采样率，默认 0.05 */
  sampleRate?: number
  /** 是否使用 Worker，默认 true */
  useWorker?: boolean
  /** 阈值配置 */
  thresholds?: PerfThresholds
  /** 指标回调函数 */
  onMetric?: (metric: PerfMetric) => void
  /** 是否自动启用 Web Vitals，默认 true */
  autoEnableWebVitals?: boolean
}

export { type PerfMetric }

export class Perf {
  private static options: PerfOptions = {}
  private static initialized = false

  /**
   * 初始化性能监控
   */
  static init(options: PerfOptions = {}): void {
    // TODO: 实现性能监控初始化
    throw new Error('Perf.init not implemented yet')
  }

  /**
   * 启用 Web Vitals 监控
   */
  static enableWebVitals(): void {
    // TODO: 实现 Web Vitals 启用
    throw new Error('Perf.enableWebVitals not implemented yet')
  }

  /**
   * 观察性能指标
   */
  static observe(types: string[]): void {
    // TODO: 实现性能观察
    throw new Error('Perf.observe not implemented yet')
  }

  /**
   * 标记时间点
   */
  static mark(name: string): void {
    // TODO: 实现性能标记
    throw new Error('Perf.mark not implemented yet')
  }

  /**
   * 测量时间间隔
   */
  static measure(name: string, startMark?: string, endMark?: string): void {
    // TODO: 实现性能测量
    throw new Error('Perf.measure not implemented yet')
  }

  /**
   * 获取采样率
   */
  static getSampleRate(): number {
    return this.options.sampleRate ?? 0.05
  }

  /**
   * 检查是否应该采样
   */
  static shouldSample(): boolean {
    return Math.random() < this.getSampleRate()
  }
}