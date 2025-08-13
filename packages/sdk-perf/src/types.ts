/**
 * 性能监控类型定义
 */

// 性能指标类型
export type PerfMetricType = 'vitals' | 'longtask' | 'resource' | 'navigation' | 'custom'

// 性能评级
export type PerfRating = 'good' | 'ni' | 'poor'

// 性能指标数据
export interface PerfMetric {
  /** 指标类型 */
  type: PerfMetricType
  /** 指标名称 */
  name: string
  /** 指标值 */
  value: number
  /** 性能评级 */
  rating?: PerfRating
  /** 时间戳 */
  ts: number
  /** 附加属性 */
  attrs?: Record<string, any>
}

// 阈值配置
export interface PerfThresholds {
  /** 长任务阈值（毫秒），默认 50 */
  longTaskMs?: number
  /** LCP 差阈值（毫秒），默认 4000 */
  lcpPoorMs?: number
  /** CLS 差阈值，默认 0.25 */
  clsPoor?: number
  /** INP 差阈值（毫秒），默认 500 */
  inpPoorMs?: number
  /** TTFB 差阈值（毫秒），默认 1800 */
  ttfbPoorMs?: number
}