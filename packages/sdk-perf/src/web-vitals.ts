/**
 * Web Vitals 监控 - LCP、CLS、INP、TTFB
 */

import type { PerfMetric } from './types.js'

export interface WebVitalsOptions {
  /** 是否启用，默认 true */
  enabled?: boolean
  /** 指标回调 */
  onMetric?: (metric: PerfMetric) => void
}

/**
 * 初始化 Web Vitals 监控
 */
export function initWebVitals(options: WebVitalsOptions = {}): void {
  // TODO: 实现 Web Vitals 监控
  throw new Error('Web Vitals not implemented yet')
}