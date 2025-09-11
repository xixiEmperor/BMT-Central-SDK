/**
 * 性能监控类型定义
 */

// 性能指标类型
export type PerfMetricType = 
  | 'vitals'        // Core Web Vitals (LCP, FID, CLS, INP, TTFB, FCP)
  | 'navigation'    // 导航时间指标
  | 'resource'      // 资源加载时间
  | 'longtask'      // 长任务监控
  | 'memory'        // 内存使用情况
  | 'paint'         // 绘制时间 (FP, FCP)
  | 'layout-shift'  // 布局偏移
  | 'largest-contentful-paint'  // 最大内容绘制
  | 'first-input'   // 首次输入延迟
  | 'event'         // 事件处理时间
  | 'measure'       // 自定义测量
  | 'mark'          // 自定义标记
  | 'custom'        // 自定义指标

// 性能评级
export type PerfRating = 'good' | 'needs-improvement' | 'poor'

// 性能指标数据
export interface PerfMetric {
  /** 指标类型 */
  type: PerfMetricType
  /** 指标名称 */
  name: string
  /** 指标值 */
  value: number
  /** 单位 */
  unit?: 'ms' | 'bytes' | 'count' | 'percent' | 'score' | 'fps' | 'mbps' | 'cores' | 'gb' | 'pixels' | 'trend'
  /** 性能评级 */
  rating?: PerfRating
  /** 时间戳 */
  ts: number
  /** 指标来源 */
  source?: 'performance-observer' | 'performance-api' | 'user-timing' | 'custom' | 'web-vitals' | 'advanced-metrics'
  /** 附加属性 */
  attrs?: Record<string, any>
}

// 阈值配置
export interface PerfThresholds {
  // Web Vitals 阈值
  /** LCP 阈值 */
  lcp?: { good: number; poor: number }  // 默认 { good: 2500, poor: 4000 }
  /** FID 阈值 */
  fid?: { good: number; poor: number }  // 默认 { good: 100, poor: 300 }
  /** CLS 阈值 */
  cls?: { good: number; poor: number }  // 默认 { good: 0.1, poor: 0.25 }
  /** INP 阈值 */
  inp?: { good: number; poor: number }  // 默认 { good: 200, poor: 500 }
  /** TTFB 阈值 */
  ttfb?: { good: number; poor: number } // 默认 { good: 800, poor: 1800 }
  /** FCP 阈值 */
  fcp?: { good: number; poor: number }  // 默认 { good: 1800, poor: 3000 }
  
  // 其他性能阈值
  /** 长任务阈值（毫秒），默认 50 */
  longTaskMs?: number
  /** 资源加载时间阈值（毫秒），默认 1000 */
  resourceLoadMs?: number
  /** 内存使用阈值（MB），默认 100 */
  memoryUsageMB?: number
  /** 事件处理时间阈值（毫秒），默认 16 */
  eventHandlerMs?: number
}

// 导航时间指标
export interface NavigationMetrics {
  /** DNS 查询时间 */
  dnsLookup: number
  /** TCP 连接时间 */
  tcpConnect: number
  /** SSL 握手时间 */
  sslHandshake?: number
  /** 请求时间 */
  request: number
  /** 响应时间 */
  response: number
  /** DOM 处理时间 */
  domProcessing: number
  /** 资源加载时间 */
  resourceLoading: number
  /** 页面完全加载时间 */
  pageLoad: number
}

// 资源性能指标
export interface ResourceMetrics {
  /** 资源名称/URL */
  name: string
  /** 资源类型 */
  type: 'script' | 'stylesheet' | 'image' | 'font' | 'fetch' | 'xmlhttprequest' | 'other'
  /** 资源大小（字节） */
  size: number
  /** 传输大小（字节） */
  transferSize: number
  /** 加载时间（毫秒） */
  duration: number
  /** 开始时间 */
  startTime: number
  /** 是否缓存命中 */
  cached: boolean
}


// 长任务指标
export interface LongTaskMetrics {
  /** 任务持续时间（毫秒） */
  duration: number
  /** 任务开始时间 */
  startTime: number
  /** 任务类型 */
  name: string
  /** 阻塞时间 */
  blockingTime: number
}