/**
 * Performance Observer - 性能条目观察器
 * 
 * 该模块提供了一个统一的性能监控接口，用于观察和处理各种类型的性能条目。
 * 支持的性能条目类型包括：
 * - navigation: 导航时间指标（DNS查询、TCP连接、页面加载等）
 * - resource: 资源加载性能（脚本、样式表、图片等）
 * - longtask: 长任务监控（超过50ms的任务）
 * - largest-contentful-paint: 最大内容绘制时间（LCP）
 * - first-input: 首次输入延迟（FID）
 * - layout-shift: 累积布局偏移（CLS）
 * - paint: 绘制时间（FP、FCP）
 * - measure/mark: 用户自定义时间标记和测量
 * - event: 事件处理时间
 * - memory: 内存使用情况监控
 */

import type { PerfMetric, PerfMetricType, NavigationMetrics, ResourceMetrics, MemoryMetrics, LongTaskMetrics } from './types.js'

/**
 * 性能观察器配置选项
 */
export interface PerformanceObserverOptions {
  /** 要观察的性能条目类型列表，如 ['navigation', 'resource', 'longtask'] */
  entryTypes: string[]
  /** 是否启用缓冲区模式，为true时会获取历史条目，默认true */
  buffered?: boolean
  /** 性能指标回调函数，每当收集到新的性能数据时会被调用 */
  onMetric?: (metric: PerfMetric) => void
  /** 是否启用详细监控模式，包括内存监控和导航时间分析，默认true */
  enableDetailedMonitoring?: boolean
  /** 内存监控的采样间隔（毫秒），默认30000ms（30秒） */
  memoryMonitorInterval?: number
}

/**
 * 创建性能观察器
 * 
 * 该函数创建并配置一个PerformanceObserver实例，用于监控指定类型的性能条目。
 * 观察器会自动处理收集到的性能数据，并通过回调函数通知调用者。
 * 
 * @param options 观察器配置选项
 * @returns 创建的PerformanceObserver实例，如果浏览器不支持则返回null
 * 
 * @example
 * ```typescript
 * const observer = createPerformanceObserver({
 *   entryTypes: ['navigation', 'resource', 'longtask'],
 *   onMetric: (metric) => console.log('性能指标:', metric),
 *   enableDetailedMonitoring: true
 * })
 * ```
 */
export function createPerformanceObserver(options: PerformanceObserverOptions): PerformanceObserver | null {
  // 检查浏览器是否支持PerformanceObserver API
  if (typeof PerformanceObserver === 'undefined') return null
  
  const { entryTypes, onMetric, enableDetailedMonitoring = true, memoryMonitorInterval = 30000 } = options
  
  // 创建性能观察器实例，设置条目处理回调
  const po = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    // 遍历处理每个性能条目
    for (const entry of entries) {
      processPerformanceEntry(entry, onMetric, enableDetailedMonitoring)
    }
  })
  
  try {
    // 开始观察指定类型的性能条目
    po.observe({ entryTypes, buffered: options.buffered ?? true })
    
    // 如果启用详细监控且包含内存监控，启动内存监控
    if (enableDetailedMonitoring && entryTypes.includes('memory')) {
      startMemoryMonitoring(onMetric, memoryMonitorInterval)
    }
    
    // 如果启用详细监控且包含导航监控，启动导航时间监控
    if (enableDetailedMonitoring && entryTypes.includes('navigation')) {
      monitorNavigationTiming(onMetric)
    }
    
    return po
  } catch (error) {
    console.warn('Failed to create PerformanceObserver:', error)
    return null
  }
}

/**
 * 处理性能条目
 * 
 * 该函数是性能数据处理的核心，根据不同的条目类型执行相应的处理逻辑。
 * 支持处理多种类型的性能条目，包括导航、资源、长任务、Web Vitals等。
 * 
 * @param entry 性能条目对象，包含具体的性能数据
 * @param onMetric 可选的指标回调函数，用于接收处理后的性能指标
 * @param enableDetailedMonitoring 是否启用详细监控，影响某些条目的处理深度
 * 
 * 处理的条目类型包括：
 * - navigation: 页面导航性能（DNS、TCP、SSL、请求响应等）
 * - resource: 资源加载性能（脚本、样式、图片等）
 * - longtask: 长任务监控（>50ms的阻塞任务）
 * - largest-contentful-paint: LCP指标
 * - first-input: FID指标
 * - layout-shift: CLS指标
 * - paint: 绘制时间（FP、FCP）
 * - measure/mark: 用户自定义测量
 * - event: 事件处理时间
 */
function processPerformanceEntry(
  entry: PerformanceEntry, 
  onMetric?: (metric: PerfMetric) => void,
  enableDetailedMonitoring = true
): void {
  // 构建基础指标对象，包含通用属性
  const baseMetric = {
    ts: Date.now(), // 当前时间戳
    source: 'performance-observer' as const, // 数据来源标识
    attrs: {
      entryType: entry.entryType, // 条目类型
      startTime: entry.startTime, // 条目开始时间
    }
  }

  // 根据条目类型进行不同的处理
  switch (entry.entryType) {
    case 'navigation':
      // 处理页面导航性能数据（仅在详细监控模式下）
      if (enableDetailedMonitoring) {
        processNavigationEntry(entry as PerformanceNavigationTiming, baseMetric, onMetric)
      }
      break
      
    case 'resource':
      // 处理资源加载性能数据（仅在详细监控模式下）
      if (enableDetailedMonitoring) {
        processResourceEntry(entry as PerformanceResourceTiming, baseMetric, onMetric)
      }
      break
      
    case 'longtask':
      // 处理长任务数据（超过50ms的阻塞任务）
      processLongTaskEntry(entry as any, baseMetric, onMetric)
      break
      
    case 'largest-contentful-paint':
      // 处理最大内容绘制（LCP）指标
      onMetric?.({
        ...baseMetric,
        type: 'largest-contentful-paint',
        name: 'LCP', // 最大内容绘制时间
        value: Math.round(entry.startTime),
        unit: 'ms',
        rating: getRating(entry.startTime, { good: 2500, poor: 4000 }), // LCP评级标准
        attrs: {
          ...baseMetric.attrs,
          size: (entry as any).size, // 元素大小
          id: (entry as any).id, // 元素ID
          url: (entry as any).url // 资源URL（如果是图片）
        }
      })
      break
      
    case 'first-input':
      // 处理首次输入延迟（FID）指标
      const fidEntry = entry as any
      const fidValue = fidEntry.processingStart - fidEntry.fetchStart // 计算输入延迟时间
      onMetric?.({
        ...baseMetric,
        type: 'first-input',
        name: 'FID', // 首次输入延迟
        value: Math.round(fidValue),
        unit: 'ms',
        rating: getRating(fidValue, { good: 100, poor: 300 }), // FID评级标准
        attrs: {
          ...baseMetric.attrs,
          processingStart: fidEntry.processingStart, // 处理开始时间
          target: fidEntry.target?.tagName // 目标元素标签名
        }
      })
      break
      
    case 'layout-shift':
      // 处理累积布局偏移（CLS）指标
      const clsEntry = entry as any
      // 只记录非用户输入引起的布局偏移
      if (!clsEntry.hadRecentInput) {
        onMetric?.({
          ...baseMetric,
          type: 'layout-shift',
          name: 'CLS', // 累积布局偏移
          value: Math.round(clsEntry.value * 1000) / 1000, // 保留3位小数
          unit: 'score',
          rating: getRating(clsEntry.value, { good: 0.1, poor: 0.25 }), // CLS评级标准
          attrs: {
            ...baseMetric.attrs,
            hadRecentInput: clsEntry.hadRecentInput, // 是否由用户输入引起
            sources: clsEntry.sources?.map((s: any) => ({
              node: s.node?.tagName, // 发生偏移的元素
              currentRect: s.currentRect, // 当前位置
              previousRect: s.previousRect // 之前位置
            }))
          }
        })
      }
      break
      
    case 'paint':
      // 处理绘制时间指标（FP和FCP）
      onMetric?.({
        ...baseMetric,
        type: 'paint',
        name: entry.name, // 'first-paint'（首次绘制）或 'first-contentful-paint'（首次内容绘制）
        value: Math.round(entry.startTime),
        unit: 'ms',
        // 只对FCP进行评级，FP不评级
        rating: entry.name === 'first-contentful-paint' 
          ? getRating(entry.startTime, { good: 1800, poor: 3000 }) // FCP评级标准
          : undefined
      })
      break
      
    case 'measure':
      // 处理用户自定义测量指标
      onMetric?.({
        ...baseMetric,
        type: 'measure',
        name: entry.name, // 测量名称
        value: Math.round((entry as any).duration || 0), // 测量持续时间
        unit: 'ms',
        attrs: {
          ...baseMetric.attrs,
          duration: (entry as any).duration, // 原始持续时间
          detail: (entry as any).detail // 附加详情
        }
      })
      break
      
    case 'mark':
      // 处理用户自定义时间标记
      onMetric?.({
        ...baseMetric,
        type: 'mark',
        name: entry.name, // 标记名称
        value: Math.round(entry.startTime), // 标记时间点
        unit: 'ms',
        attrs: {
          ...baseMetric.attrs,
          detail: (entry as any).detail // 附加详情
        }
      })
      break
      
    case 'event':
      // 处理事件处理时间指标
      const eventEntry = entry as any
      onMetric?.({
        ...baseMetric,
        type: 'event',
        name: eventEntry.name, // 事件名称
        value: Math.round(eventEntry.duration || 0), // 事件处理时长
        unit: 'ms',
        rating: getRating(eventEntry.duration || 0, { good: 16, poor: 50 }), // 事件处理时间评级（16ms为一帧）
        attrs: {
          ...baseMetric.attrs,
          duration: eventEntry.duration, // 事件持续时间
          processingStart: eventEntry.processingStart, // 处理开始时间
          processingEnd: eventEntry.processingEnd, // 处理结束时间
          cancelable: eventEntry.cancelable, // 是否可取消
          target: eventEntry.target?.tagName // 目标元素标签名
        }
      })
      break
      
    default:
      // 处理其他未明确分类的性能条目类型
      onMetric?.({
        ...baseMetric,
        type: 'custom',
        name: entry.name || entry.entryType, // 使用条目名称或类型作为指标名
        value: Math.round((entry as any).duration || entry.startTime || 0), // 优先使用持续时间，否则使用开始时间
        unit: 'ms',
        attrs: {
          ...baseMetric.attrs,
          duration: (entry as any).duration, // 持续时间（如果有）
          ...extractRelevantProperties(entry) // 提取其他相关属性
        }
      })
  }
}

/**
 * 处理导航条目
 * 
 * 该函数专门处理页面导航性能数据，将PerformanceNavigationTiming条目转换为
 * 多个具体的导航性能指标。这些指标帮助分析页面加载过程中各个阶段的耗时。
 * 
 * @param entry PerformanceNavigationTiming条目，包含完整的导航时间数据
 * @param baseMetric 基础指标对象，包含通用属性
 * @param onMetric 指标回调函数，用于接收处理后的各项导航指标
 * 
 * 生成的导航指标包括：
 * - dnsLookup: DNS查询时间
 * - tcpConnect: TCP连接建立时间
 * - sslHandshake: SSL握手时间（HTTPS）
 * - request: 请求发送时间
 * - response: 响应接收时间
 * - domProcessing: DOM处理时间
 * - resourceLoading: 资源加载时间
 * - pageLoad: 页面完全加载时间
 * - TTFB: 首字节时间
 */
function processNavigationEntry(
  entry: PerformanceNavigationTiming,
  baseMetric: any,
  onMetric?: (metric: PerfMetric) => void
): void {
  // 计算各个导航阶段的耗时
  const metrics: NavigationMetrics = {
    dnsLookup: entry.domainLookupEnd - entry.domainLookupStart, // DNS查询耗时
    tcpConnect: entry.connectEnd - entry.connectStart, // TCP连接耗时
    sslHandshake: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : undefined, // SSL握手耗时（仅HTTPS）
    request: entry.responseStart - entry.requestStart, // 请求发送耗时
    response: entry.responseEnd - entry.responseStart, // 响应接收耗时
    domProcessing: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart, // DOM处理耗时
    resourceLoading: entry.loadEventStart - entry.domContentLoadedEventEnd, // 资源加载耗时
    pageLoad: entry.loadEventEnd - entry.fetchStart // 页面完全加载耗时
  }

  // 遍历并发送各个导航性能指标
  Object.entries(metrics).forEach(([name, value]) => {
    // 只发送有效的正数指标值
    if (value !== undefined && value >= 0) {
      onMetric?.({
        ...baseMetric,
        type: 'navigation',
        name: name, // 指标名称（如dnsLookup、tcpConnect等）
        value: Math.round(value), // 四舍五入到整数毫秒
        unit: 'ms',
        rating: getNavigationRating(name, Math.round(value)), // 根据指标类型获取性能评级
        attrs: {
          ...baseMetric.attrs,
          navigationType: getNavigationType(typeof entry.type === 'number' ? entry.type : 0), // 导航类型（navigate、reload等）
          redirectCount: entry.redirectCount // 重定向次数
        }
      })
    }
  })

  // 计算并发送TTFB（首字节时间）指标
  const ttfb = entry.responseStart - entry.requestStart
  onMetric?.({
    ...baseMetric,
    type: 'vitals', // 归类为核心性能指标
    name: 'TTFB', // Time to First Byte
    value: Math.round(ttfb),
    unit: 'ms',
    rating: getRating(ttfb, { good: 800, poor: 1800 }) // TTFB评级标准
  })
}

/**
 * 处理资源条目
 * 
 * 该函数专门处理资源加载性能数据，分析各种类型资源（脚本、样式表、图片、字体等）
 * 的加载性能，包括加载时间、文件大小、缓存状态等关键指标。
 * 
 * @param entry PerformanceResourceTiming条目，包含资源加载的详细时间数据
 * @param baseMetric 基础指标对象，包含通用属性
 * @param onMetric 指标回调函数，用于接收处理后的资源性能指标
 * 
 * 分析的资源指标包括：
 * - 资源类型识别（script、stylesheet、image、font等）
 * - 加载时间分析
 * - 文件大小统计（原始大小vs传输大小）
 * - 缓存命中检测
 * - 性能评级
 */
function processResourceEntry(
  entry: PerformanceResourceTiming,
  baseMetric: any,
  onMetric?: (metric: PerfMetric) => void
): void {
  // 构建资源性能指标对象
  const resourceMetrics: ResourceMetrics = {
    name: entry.name, // 资源URL
    type: getResourceType(entry.name, entry.initiatorType), // 资源类型识别
    size: entry.decodedBodySize || 0, // 解码后的资源大小（字节）
    transferSize: entry.transferSize || 0, // 网络传输大小（字节，包含头部）
    duration: entry.responseEnd - entry.startTime, // 总加载时间
    startTime: entry.startTime, // 开始加载时间
    cached: entry.transferSize === 0 && entry.decodedBodySize > 0 // 缓存命中判断
  }

  // 发送资源加载性能指标
  onMetric?.({
    ...baseMetric,
    type: 'resource',
    name: resourceMetrics.type, // 使用资源类型作为指标名称
    value: Math.round(resourceMetrics.duration), // 加载时间（毫秒）
    unit: 'ms',
    rating: getRating(resourceMetrics.duration, { good: 500, poor: 1000 }), // 资源加载时间评级
    attrs: {
      ...baseMetric.attrs,
      url: resourceMetrics.name, // 资源完整URL
      size: resourceMetrics.size, // 资源解码后大小
      transferSize: resourceMetrics.transferSize, // 网络传输大小
      cached: resourceMetrics.cached, // 是否命中缓存
      initiatorType: entry.initiatorType // 资源发起者类型（script、link、img等）
    }
  })
}

/**
 * 处理长任务条目
 * 
 * 该函数专门处理长任务性能数据。长任务是指执行时间超过50毫秒的JavaScript任务，
 * 这些任务会阻塞主线程，影响用户交互的响应性。监控长任务有助于识别性能瓶颈。
 * 
 * @param entry 长任务性能条目，包含任务执行的时间信息
 * @param baseMetric 基础指标对象，包含通用属性
 * @param onMetric 指标回调函数，用于接收处理后的长任务指标
 * 
 * 长任务指标包括：
 * - 任务总持续时间
 * - 任务开始时间
 * - 阻塞时间（超过50ms的部分）
 * - 任务归因信息（如果可用）
 * 
 * 注意：长任务总是被评级为'poor'，因为它们对用户体验有负面影响
 */
function processLongTaskEntry(
  entry: any,
  baseMetric: any,
  onMetric?: (metric: PerfMetric) => void
): void {
  // 构建长任务性能指标对象
  const longTaskMetrics: LongTaskMetrics = {
    duration: entry.duration, // 任务总持续时间
    startTime: entry.startTime, // 任务开始时间
    name: entry.name || 'unknown', // 任务名称（通常为'unknown'）
    blockingTime: Math.max(0, entry.duration - 50) // 阻塞时间：超过50ms的部分被视为阻塞
  }

  // 发送长任务性能指标
  onMetric?.({
    ...baseMetric,
    type: 'longtask',
    name: 'long-task', // 统一的长任务指标名称
    value: Math.round(longTaskMetrics.duration), // 任务持续时间（毫秒）
    unit: 'ms',
    rating: 'poor', // 长任务总是被评级为'poor'，因为它们影响用户体验
    attrs: {
      ...baseMetric.attrs,
      blockingTime: longTaskMetrics.blockingTime, // 实际阻塞时间（>50ms的部分）
      taskName: longTaskMetrics.name, // 任务名称
      attribution: entry.attribution // 任务归因信息（如果可用，包含脚本URL等）
    }
  })
}

/**
 * 启动内存监控
 * 
 * 该函数启动JavaScript堆内存的定期监控。通过定时采样内存使用情况，
 * 可以帮助识别内存泄漏和内存使用异常。
 * 
 * @param onMetric 指标回调函数，用于接收内存使用指标
 * @param interval 监控间隔（毫秒），默认30000ms（30秒）
 * 
 * 监控的内存指标包括：
 * - usedJSHeapSize: 已使用的JS堆大小
 * - totalJSHeapSize: 总JS堆大小
 * - jsHeapSizeLimit: JS堆大小限制
 * - memoryUsagePercent: 内存使用百分比
 * 
 * 注意：此功能仅在支持performance.memory的浏览器中可用（主要是Chrome）
 */
function startMemoryMonitoring(
  onMetric?: (metric: PerfMetric) => void,
  interval = 30000
): void {
  // 检查浏览器是否支持performance.memory API
  if (typeof (performance as any).memory === 'undefined') return

  // 内存监控函数
  const monitor = () => {
    try {
      const memory = (performance as any).memory
      // 构建内存使用指标
      const memoryMetrics: MemoryMetrics = {
        usedJSHeapSize: memory.usedJSHeapSize, // 已使用的JS堆大小（字节）
        totalJSHeapSize: memory.totalJSHeapSize, // 总JS堆大小（字节）
        jsHeapSizeLimit: memory.jsHeapSizeLimit, // JS堆大小限制（字节）
        memoryUsagePercent: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) // 内存使用百分比
      }

      // 发送内存使用指标
      onMetric?.({
        type: 'memory',
        name: 'js-heap-usage', // JS堆内存使用指标
        value: memoryMetrics.usedJSHeapSize, // 使用已用内存大小作为主要指标值
        unit: 'bytes',
        rating: getRating(memoryMetrics.memoryUsagePercent, { good: 50, poor: 80 }), // 基于使用百分比评级
        ts: Date.now(),
        source: 'performance-api',
        attrs: {
          totalJSHeapSize: memoryMetrics.totalJSHeapSize, // 总堆大小
          jsHeapSizeLimit: memoryMetrics.jsHeapSizeLimit, // 堆大小限制
          memoryUsagePercent: memoryMetrics.memoryUsagePercent // 使用百分比
        }
      })
    } catch (error) {
      console.warn('Memory monitoring failed:', error)
    }
  }

  // 立即执行一次监控，获取初始内存状态
  monitor()
  
  // 启动定时监控，按指定间隔持续监控内存使用情况
  setInterval(monitor, interval)
}

/**
 * 监控导航时间
 * 
 * 该函数负责在适当的时机收集页面导航性能数据。它会检查页面加载状态，
 * 并在页面完全加载后收集导航时间指标。
 * 
 * @param onMetric 指标回调函数，用于接收导航性能指标
 * 
 * 工作流程：
 * 1. 检查页面是否已完全加载
 * 2. 如果已加载，立即收集导航时间
 * 3. 如果未加载，等待load事件后收集
 * 4. 添加小延迟确保所有性能指标都可用
 */
function monitorNavigationTiming(onMetric?: (metric: PerfMetric) => void): void {
  // 检查页面加载状态，决定何时收集导航时间
  if (document.readyState === 'complete') {
    // 页面已完全加载，立即收集导航时间
    collectNavigationTiming(onMetric)
  } else {
    // 页面未完全加载，等待load事件
    window.addEventListener('load', () => {
      // 稍微延迟确保所有性能指标都已可用
      setTimeout(() => collectNavigationTiming(onMetric), 100)
    })
  }
}

/**
 * 收集导航时间
 * 
 * 该函数从Performance API获取导航时间条目，并调用processNavigationEntry
 * 进行详细的导航性能分析。
 * 
 * @param onMetric 指标回调函数，用于接收处理后的导航指标
 * 
 * 注意：此函数假设页面已完全加载，导航时间数据已可用
 */
function collectNavigationTiming(onMetric?: (metric: PerfMetric) => void): void {
  try {
    // 获取导航性能条目（通常只有一个）
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navEntry) {
      // 处理导航条目，生成详细的导航性能指标
      processNavigationEntry(navEntry, {
        ts: Date.now(),
        source: 'performance-api', // 标记数据来源
        attrs: { entryType: 'navigation' }
      }, onMetric)
    }
  } catch (error) {
    console.warn('Navigation timing collection failed:', error)
  }
}

/**
 * 获取性能评级
 * 
 * 该函数根据给定的阈值对性能指标进行三级评级。评级标准遵循Web性能最佳实践，
 * 帮助快速识别性能问题的严重程度。
 * 
 * @param value 性能指标值
 * @param thresholds 评级阈值配置，包含good和poor两个边界值
 * @returns 性能评级：'good'（良好）、'needs-improvement'（需要改进）、'poor'（差）
 * 
 * 评级规则：
 * - value <= good: 'good' - 性能良好
 * - good < value <= poor: 'needs-improvement' - 需要改进
 * - value > poor: 'poor' - 性能差，需要优化
 */
function getRating(value: number, thresholds: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * 获取导航评级
 * 
 * 该函数为不同的导航性能指标提供专门的评级标准。每种导航指标都有
 * 其特定的性能阈值，基于Web性能优化的最佳实践制定。
 * 
 * @param metricName 导航指标名称
 * @param value 指标值（毫秒）
 * @returns 性能评级，如果指标名称未知则返回undefined
 * 
 * 支持的导航指标及其阈值（毫秒）：
 * - dnsLookup: DNS查询时间 (good: ≤20, poor: >100)
 * - tcpConnect: TCP连接时间 (good: ≤20, poor: >100)
 * - sslHandshake: SSL握手时间 (good: ≤50, poor: >200)
 * - request: 请求时间 (good: ≤200, poor: >500)
 * - response: 响应时间 (good: ≤200, poor: >500)
 * - domProcessing: DOM处理时间 (good: ≤500, poor: >1500)
 * - resourceLoading: 资源加载时间 (good: ≤1000, poor: >3000)
 * - pageLoad: 页面加载时间 (good: ≤2000, poor: >5000)
 */
function getNavigationRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' | undefined {
  // 定义各导航指标的性能阈值
  const thresholds: Record<string, { good: number; poor: number }> = {
    dnsLookup: { good: 20, poor: 100 }, // DNS查询时间阈值
    tcpConnect: { good: 20, poor: 100 }, // TCP连接时间阈值
    sslHandshake: { good: 50, poor: 200 }, // SSL握手时间阈值
    request: { good: 200, poor: 500 }, // 请求时间阈值
    response: { good: 200, poor: 500 }, // 响应时间阈值
    domProcessing: { good: 500, poor: 1500 }, // DOM处理时间阈值
    resourceLoading: { good: 1000, poor: 3000 }, // 资源加载时间阈值
    pageLoad: { good: 2000, poor: 5000 } // 页面加载时间阈值
  }

  const threshold = thresholds[metricName]
  return threshold ? getRating(value, threshold) : undefined
}

/**
 * 获取导航类型
 * 
 * 该函数将PerformanceNavigationTiming的数字类型转换为可读的字符串描述。
 * 这有助于理解用户是如何到达当前页面的，对性能分析很有价值。
 * 
 * @param type 导航类型数字代码（来自PerformanceNavigationTiming.type）
 * @returns 导航类型的字符串描述
 * 
 * 导航类型说明：
 * - navigate: 正常导航（点击链接、输入URL、表单提交等）
 * - reload: 页面重新加载（F5、刷新按钮等）
 * - back_forward: 前进/后退导航（浏览器前进后退按钮）
 * - prerender: 预渲染页面（通过<link rel="prerender">等方式）
 * - unknown: 未知导航类型
 */
function getNavigationType(type: number): string {
  switch (type) {
    case 0: return 'navigate' // 正常导航
    case 1: return 'reload' // 页面重新加载
    case 2: return 'back_forward' // 前进/后退导航
    case 255: return 'prerender' // 预渲染页面
    default: return 'unknown' // 未知类型
  }
}

/**
 * 获取资源类型
 * 
 * 该函数通过分析资源的URL和initiatorType来确定资源的具体类型。
 * 准确的资源类型分类有助于性能分析和优化。
 * 
 * @param url 资源URL地址
 * @param initiatorType 资源发起者类型（由浏览器提供）
 * @returns 资源类型字符串
 * 
 * 支持的资源类型：
 * - script: JavaScript脚本文件
 * - stylesheet: CSS样式表文件
 * - image: 图片资源
 * - font: 字体文件
 * - fetch: Fetch API请求
 * - xmlhttprequest: XMLHttpRequest请求
 * - other: 其他未分类资源
 * 
 * 识别策略：
 * 1. 优先使用initiatorType进行分类（最可靠的方式）
 * 2. 对于link类型，进一步根据URL扩展名细分为stylesheet或font
 * 3. 如果initiatorType为其他值，则根据文件扩展名进行判断
 */
function getResourceType(url: string, initiatorType: string): ResourceMetrics['type'] {
  // 基于发起者类型进行初步判断（最可靠的方式）
  switch (initiatorType) {
    case 'script': return 'script' // JavaScript脚本文件
    case 'link': 
      // link标签可能加载CSS或字体，需要进一步判断
      if (url.includes('.css')) return 'stylesheet' // CSS样式表
      if (url.includes('.woff') || url.includes('.ttf') || url.includes('.otf')) return 'font' // 字体文件
      return 'other' // 其他link资源
    case 'img': return 'image' // 图片资源
    case 'fetch': return 'fetch' // Fetch API请求
    case 'xmlhttprequest': return 'xmlhttprequest' // XMLHttpRequest请求
    default:
      // 如果initiatorType不明确，根据文件扩展名进行二次判断
      if (url.match(/\.(js|mjs)$/)) return 'script' // JavaScript文件扩展名
      if (url.match(/\.css$/)) return 'stylesheet' // CSS文件扩展名
      if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image' // 图片文件扩展名
      if (url.match(/\.(woff|woff2|ttf|otf|eot)$/)) return 'font' // 字体文件扩展名
      return 'other' // 无法识别的资源类型
  }
}

/**
 * 提取相关属性
 * 
 * 该函数从性能条目中提取有用的属性，过滤掉无关或未定义的属性。
 * 这有助于减少数据传输量，同时保留对性能分析有价值的信息。
 * 
 * @param entry 性能条目对象
 * @returns 包含相关属性的对象
 * 
 * 提取的属性包括：
 * - duration: 持续时间
 * - transferSize: 传输大小（包含HTTP头）
 * - decodedBodySize: 解码后的响应体大小
 * - encodedBodySize: 编码后的响应体大小
 * - initiatorType: 发起者类型
 * - nextHopProtocol: 下一跳协议（如HTTP/2、HTTP/3）
 * - renderBlockingStatus: 渲染阻塞状态
 * - responseStatus: HTTP响应状态码
 * - deliveryType: 交付类型
 */
function extractRelevantProperties(entry: any): Record<string, any> {
  const relevantProps: Record<string, any> = {}
  
  // 定义对性能分析有价值的属性列表
  const usefulProps = [
    'duration', // 持续时间
    'transferSize', // 传输大小
    'decodedBodySize', // 解码后大小
    'encodedBodySize', // 编码后大小
    'initiatorType', // 发起者类型
    'nextHopProtocol', // 网络协议
    'renderBlockingStatus', // 渲染阻塞状态
    'responseStatus', // HTTP状态码
    'deliveryType' // 交付类型
  ]
  
  // 遍历并提取存在且有定义的属性
  usefulProps.forEach(prop => {
    if (prop in entry && entry[prop] !== undefined) {
      relevantProps[prop] = entry[prop]
    }
  })
  
  return relevantProps
}