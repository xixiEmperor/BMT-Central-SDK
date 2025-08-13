/**
 * @platform/sdk-perf
 * BMT 平台 SDK 性能监控
 * 
 * 提供：
 * - Web Vitals 监控
 * - Performance Observer
 * - User Timing API
 * - Worker 聚合
 */

// 导出类型
export type * from './types.js'

// 导出主要 API
export { Perf } from './perf.js'
export type { PerfOptions, PerfMetric } from './perf.js'

// 导出 Web Vitals
export { initWebVitals } from './web-vitals.js'
export type { WebVitalsOptions } from './web-vitals.js'

// 导出 Performance Observer
export { createPerformanceObserver } from './performance-observer.js'
export type { PerformanceObserverOptions } from './performance-observer.js'

// 导出 User Timing
export { 
  mark, 
  measure, 
  clearMarks, 
  clearMeasures,
  getEntriesByName,
  getEntriesByType 
} from './user-timing.js'