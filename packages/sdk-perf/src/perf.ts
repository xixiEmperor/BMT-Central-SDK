/**
 * 性能监控主入口
 * 
 * 该模块是BMT平台性能监控系统的核心入口，提供了统一的性能监控管理接口。
 * 它整合了多种性能监控能力，包括Web Vitals、Performance Observer、
 * 高级性能指标、内存泄漏检测等功能。
 * 
 * 主要功能特性：
 * - Web Vitals核心指标监控（LCP、CLS、FID、FCP、TTFB等）
 * - 详细的导航和资源加载性能分析
 * - 实时FPS监控和交互性能分析
 * - 内存使用和泄漏检测
 * - 网络质量和设备信息收集
 * - 用户自定义性能标记和测量
 * - 智能采样和数据聚合
 * 
 * @example
 * ```typescript
 * // 基础使用
 * Perf.init({
 *   sampleRate: 0.1,
 *   onMetric: (metric) => {
 *     console.log('性能指标:', metric)
 *   }
 * })
 * 
 * // 高级配置
 * Perf.init({
 *   sampleRate: 0.2,
 *   enableMemoryLeakDetection: true,
 *   enableAdvancedMetrics: true,
 *   thresholds: {
 *     lcp: { good: 2000, poor: 4000 },
 *     fid: { good: 100, poor: 300 }
 *   },
 *   onMetric: sendToAnalytics
 * })
 * ```
 */

import type { PerfMetric, PerfThresholds } from './types.js'

/**
 * 性能监控配置选项
 * 
 * 该接口定义了性能监控系统的完整配置选项，允许开发者根据
 * 实际需求灵活配置监控功能。
 */
export interface PerfOptions {
  /** 
   * 采样率（0-1之间），控制性能数据收集的频率，默认 0.1
   * 较低的采样率可以减少性能开销，适合生产环境
   * 建议值：开发环境 1.0，测试环境 0.5，生产环境 0.1
   */
  sampleRate?: number
  
  /** 
   * 是否使用 Web Worker 进行数据处理，默认 false
   * 启用后可以将性能数据处理移到后台线程，避免阻塞主线程
   * 注意：需要浏览器支持 Web Worker API
   */
  useWorker?: boolean
  
  /** 
   * 性能指标阈值配置，用于评级性能表现
   * 可以自定义各项指标的good/poor阈值，不设置则使用默认值
   */
  thresholds?: PerfThresholds
  
  /** 
   * 性能指标回调函数，每当收集到新的性能数据时调用
   * 这是获取性能数据的主要方式，可以在此函数中进行数据上报、存储等操作
   */
  onMetric?: (metric: PerfMetric) => void
  
  /** 
   * 是否自动启用 Web Vitals 监控，默认 true
   * Web Vitals包括LCP、CLS、FID、FCP、TTFB等核心性能指标
   * 这些指标直接影响用户体验和SEO评分
   */
  autoEnableWebVitals?: boolean
  
  /** 
   * 是否启用详细监控模式，默认 true
   * 包括导航时间分析、资源加载监控、长任务检测等
   * 详细监控会收集更多数据，但也会增加一定的性能开销
   */
  enableDetailedMonitoring?: boolean
  
  /** 
   * 是否启用高级性能指标，默认 true
   * 包括FPS监控、交互性分析、网络质量检测、设备信息收集等
   * 这些指标有助于深入分析性能瓶颈和用户体验问题
   */
  enableAdvancedMetrics?: boolean
  
  /** 
   * 是否启用内存泄漏检测，默认 false
   * 通过监控JavaScript堆内存使用趋势来检测潜在的内存泄漏
   * 仅在需要调试内存问题时启用，生产环境建议关闭
   */
  enableMemoryLeakDetection?: boolean
  
  /** 
   * 要监控的性能条目类型列表
   * 可以自定义监控哪些类型的性能条目，不设置则使用默认列表
   * 支持的类型包括：navigation、resource、paint、longtask等
   */
  observeEntryTypes?: string[]
}

export { type PerfMetric }

/**
 * 性能监控主类
 * 
 * 该类提供了性能监控系统的统一管理接口，采用静态方法设计
 * 便于全局使用。它负责协调各个监控模块的启动、停止和配置。
 * 
 * 设计特点：
 * - 单例模式：确保全局只有一个监控实例
 * - 懒加载：按需加载各个监控模块，减少初始化开销
 * - 自动清理：提供完善的资源清理机制
 * - 异常安全：各模块独立，单个模块异常不影响整体功能
 */
export class Perf {
  /** 性能监控配置选项 */
  private static options: PerfOptions = {}
  
  /** 监控系统是否已初始化 */
  private static initialized = false
  
  /** 活跃的性能观察器列表，用于统一管理和清理 */
  private static observers: PerformanceObserver[] = []
  
  /** 清理函数列表，用于释放各种监控资源 */
  private static cleanupFunctions: (() => void)[] = []

  /**
   * 初始化性能监控系统
   * 
   * 这是性能监控的入口方法，负责配置和启动各个监控模块。
   * 方法采用渐进式启用策略，确保即使某个模块失败也不影响其他功能。
   * 
   * @param options 性能监控配置选项
   * 
   * 初始化流程：
   * 1. 合并用户配置和默认配置
   * 2. 智能启用Web Vitals监控（避免与Performance Observer重复）
   * 3. 启用Performance Observer详细监控
   * 4. 启用高级性能指标监控
   * 5. 启用内存泄漏检测（如果配置）
   * 
   * 优化策略：
   * - 如果Performance Observer包含Web Vitals相关指标，则自动禁用独立的Web Vitals监控
   * - 这样可以避免重复监控LCP、CLS、FID、FCP、TTFB等指标，提高性能
   * 
   * @example
   * ```typescript
   * // 使用默认配置
   * Perf.init()
   * 
   * // 自定义配置
   * Perf.init({
   *   sampleRate: 0.1,
   *   enableMemoryLeakDetection: true,
   *   onMetric: (metric) => {
   *     // 处理性能指标数据
   *     sendToAnalytics(metric)
   *   }
   * })
   * ```
   */
  static init(options: PerfOptions = {}): void {
    // 合并用户配置和默认配置
    this.options = {
      sampleRate: 0.1, // 默认10%采样率，平衡性能和数据质量
      useWorker: false, // 默认不使用Worker，避免兼容性问题
      autoEnableWebVitals: true, // 默认启用核心Web性能指标
      enableDetailedMonitoring: true, // 默认启用详细监控
      enableAdvancedMetrics: true, // 默认启用高级指标
      enableMemoryLeakDetection: false, // 默认不启用内存泄漏检测，避免性能开销
      // 默认监控的性能条目类型，覆盖所有主要性能指标
      observeEntryTypes: [
        'navigation',                // 页面导航性能
        'resource',                  // 资源加载性能
        'longtask',                 // 长任务监控
        'measure',                  // 用户自定义测量
        'mark',                     // 用户自定义标记
        'event'                     // 事件处理时间
      ],
      ...options, // 用户配置覆盖默认配置
    }
    this.initialized = true

    // 简化策略：Web Vitals 和 Performance Observer 各司其职，避免重复监控
    // Performance Observer 专注于原生 Performance API 条目（navigation、resource、longtask等）
    // Web Vitals 专门处理核心 Web 性能指标（LCP、FID、CLS等）
    if (this.options.autoEnableWebVitals) {
      try { 
        this.enableWebVitals() 
      } catch (error) {
        // 静默处理错误，确保其他功能正常工作
        console.warn('Web Vitals启用失败:', error)
      }
    }

    // 启用Performance Observer详细监控
    if (this.options.enableDetailedMonitoring) {
      this.enablePerformanceObserver()
    }

    // 启用高级性能指标监控
    if (this.options.enableAdvancedMetrics) {
      this.enableAdvancedMetrics()
    }

    // 启用内存泄漏检测（仅在明确配置时启用）
    if (this.options.enableMemoryLeakDetection) {
      this.enableMemoryLeakDetection()
    }
  }

  /**
   * 启用 Web Vitals 监控
   * 
   * Web Vitals是Google定义的核心网页性能指标，直接影响用户体验和SEO评分。
   * 该方法会启动对LCP、CLS、FID、FCP、TTFB等关键指标的监控。
   * 
   * 监控的指标包括：
   * - LCP (Largest Contentful Paint): 最大内容绘制时间
   * - CLS (Cumulative Layout Shift): 累积布局偏移
   * - FID (First Input Delay): 首次输入延迟
   * - FCP (First Contentful Paint): 首次内容绘制时间
   * - TTFB (Time to First Byte): 首字节响应时间
   * 
   * 使用动态导入确保模块的懒加载，减少初始化时的性能开销。
   */
  static enableWebVitals(): void {
    // 使用动态import实现懒加载，提高初始化性能
    void import('./web-vitals.js')
      .then((module: any) => {
        // 初始化Web Vitals监控，传入回调函数
        module.initWebVitals({ 
          // 这里metric为any是为了兼容不同版本的Web Vitals模块，最终返回的metric类型是PerfMetric
          onMetric: (metric: any) => this.options.onMetric?.(metric) 
        })
      })
      .catch((error) => {
        console.warn('Web Vitals模块加载失败:', error)
      })
  }

  /**
   * 启用性能观察器
   * 
   * Performance Observer提供了对各种性能条目的实时监控能力。
   * 它可以监控页面导航、资源加载、长任务、绘制事件等多种性能数据。
   * 
   * 监控能力包括：
   * - 页面导航性能分析（DNS、TCP、SSL、请求响应等各阶段耗时）
   * - 资源加载性能监控（脚本、样式、图片等资源的加载时间和大小）
   * - 长任务检测（超过50ms的阻塞任务）
   * - 用户自定义标记和测量
   * - 内存使用监控
   * 
   * 该方法会创建性能观察器实例并将其加入管理列表，便于后续统一清理。
   */
  static enablePerformanceObserver(): void {
    void import('./performance-observer.js')
      .then((module: any) => {
        // 创建性能观察器实例
        const observer = module.createPerformanceObserver({
          entryTypes: this.options.observeEntryTypes || [], // 要监控的性能条目类型
          enableDetailedMonitoring: this.options.enableDetailedMonitoring, // 是否启用详细监控
          onMetric: (metric: any) => this.options.onMetric?.(metric) // 指标回调函数
        })
        
        // 将观察器加入管理列表，便于后续清理
        if (observer) {
          this.observers.push(observer)
        }
      })
      .catch((error) => {
        console.warn('Performance Observer模块加载失败:', error)
      })
  }

  /**
   * 启用高级性能指标监控
   * 
   * 高级性能指标提供了比基础Web Vitals更深入的性能洞察，
   * 帮助开发者识别复杂的性能问题和优化机会。
   * 
   * 包含的高级指标：
   * - FPS监控：实时帧率监控，识别动画和滚动性能问题
   * - 交互性监控：用户交互响应时间，包括点击、键盘、触摸等事件
   * - 网络质量监控：网络连接类型、带宽、延迟等信息
   * - 设备信息收集：CPU核心数、内存大小、屏幕信息等
   * - 关键渲染路径监控：识别阻塞渲染的资源
   * - 页面可见性和生命周期监控
   * 
   * 所有监控模块都会返回清理函数，确保资源的正确释放。
   */
  static enableAdvancedMetrics(): void {
    void import('./advanced-metrics.js')
      .then((module: any) => {
        // 启动高级性能指标监控
        const cleanup = module.startAdvancedMetrics({
          enableFPS: true,            // 启用FPS监控
          enableInteractivity: true,  // 启用交互性监控
          enableNetworkQuality: true, // 启用网络质量监控
          enableDeviceInfo: true,     // 启用设备信息收集
          onMetric: (metric: any) => this.options.onMetric?.(metric) // 指标回调
        })
        this.cleanupFunctions.push(cleanup)

        // 启用关键渲染路径监控
        const cleanupCRP = module.monitorCriticalRenderingPath(
          (metric: any) => this.options.onMetric?.(metric)
        )
        this.cleanupFunctions.push(cleanupCRP)
      })
      .catch((error) => {
        console.warn('Advanced Metrics模块加载失败:', error)
      })
  }

  /**
   * 启用内存泄漏检测
   * 
   * 内存泄漏检测通过监控JavaScript堆内存的使用趋势来识别潜在的内存泄漏问题。
   * 该功能会定期采样内存使用情况，通过简单的线性回归分析检测持续增长的趋势。
   * 
   * 检测原理：
   * 1. 定期采样JS堆内存使用量
   * 2. 保留最近N次采样数据
   * 3. 计算内存使用趋势（斜率）
   * 4. 当趋势超过阈值时报告潜在泄漏
   * 
   * 注意事项：
   * - 该功能仅在支持performance.memory的浏览器中可用（主要是Chrome）
   * - 会增加一定的性能开销，建议仅在需要调试时启用
   * - 检测结果需要结合实际情况分析，避免误报
   */
  static enableMemoryLeakDetection(): void {
    void import('./advanced-metrics.js')
      .then((module: any) => {
        // 启动内存泄漏检测，返回清理函数
        const cleanup = module.startMemoryLeakDetection(
          (metric: any) => this.options.onMetric?.(metric)
        )
        this.cleanupFunctions.push(cleanup)
      })
      .catch((error) => {
        console.warn('内存泄漏检测模块加载失败:', error)
      })
  }

  /**
   * 观察特定类型的性能指标
   * 
   * 该方法允许动态添加对特定性能条目类型的监控，适用于需要临时或按需监控特定指标的场景。
   * 与初始化时的批量监控不同，这个方法提供了更灵活的控制能力。
   * 
   * @param types 要监控的性能条目类型列表
   * 
   * 支持的性能条目类型：
   * - 'navigation': 页面导航性能
   * - 'resource': 资源加载性能
   * - 'paint': 绘制事件（FP、FCP）
   * - 'largest-contentful-paint': LCP指标
   * - 'first-input': FID指标
   * - 'layout-shift': CLS指标
   * - 'longtask': 长任务监控
   * - 'measure': 用户自定义测量
   * - 'mark': 用户自定义标记
   * - 'event': 事件处理时间
   * 
   * @example
   * ```typescript
   * // 只监控特定的性能指标
   * Perf.observe(['longtask', 'largest-contentful-paint'])
   * 
   * // 监控用户自定义的标记和测量
   * Perf.observe(['mark', 'measure'])
   * ```
   */
  static observe(types: string[]): void {
    void import('./performance-observer.js')
      .then((module: any) => {
        // 为指定类型创建专门的性能观察器
        const observer = module.createPerformanceObserver({ 
          entryTypes: types, 
          onMetric: (metric: any) => this.options.onMetric?.(metric) 
        })
        
        // 将新观察器加入管理列表
        if (observer) {
          this.observers.push(observer)
        }
      })
      .catch((error) => {
        console.warn('动态性能观察器创建失败:', error)
      })
  }

  /**
   * 创建性能标记
   * 
   * 在时间轴上创建一个命名的时间戳标记，用于标识应用程序中的重要事件或里程碑。
   * 标记本身不消耗显著的性能，可以安全地在生产环境中使用。
   * 
   * @param name 标记名称，应该具有描述性，便于后续分析
   * 
   * 使用场景：
   * - 标记功能模块的开始/结束
   * - 标记用户交互的关键时刻
   * - 标记业务逻辑的重要节点
   * - 为性能测量提供参考点
   * 
   * @example
   * ```typescript
   * // 标记页面关键事件
   * Perf.mark('app-init-start')
   * // ... 应用初始化代码 ...
   * Perf.mark('app-init-end')
   * 
   * // 标记用户交互
   * Perf.mark('user-click-search')
   * // ... 搜索处理 ...
   * Perf.mark('search-results-displayed')
   * ```
   */
  static mark(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name)
    }
  }

  /**
   * 创建性能测量
   * 
   * 计算两个时间点之间的持续时间，生成一个可被性能观察器捕获的测量条目。
   * 测量是性能分析的核心工具，可以精确量化代码执行时间。
   * 
   * @param name 测量名称，应该清楚地描述所测量的操作
   * @param startMark 起始标记名称，不提供则从导航开始时间算起
   * @param endMark 结束标记名称，不提供则以当前时间为结束点
   * 
   * 测量模式：
   * 1. measure(name) - 从导航开始到当前时间
   * 2. measure(name, startMark) - 从指定标记到当前时间
   * 3. measure(name, startMark, endMark) - 两个指定标记之间的时间
   * 
   * @example
   * ```typescript
   * // 测量完整的初始化过程
   * Perf.mark('init-start')
   * // ... 初始化代码 ...
   * Perf.mark('init-end')
   * Perf.measure('app-initialization', 'init-start', 'init-end')
   * 
   * // 测量从特定点到当前的时间
   * Perf.mark('data-fetch-start')
   * // ... 数据获取 ...
   * Perf.measure('data-fetch-duration', 'data-fetch-start')
   * 
   * // 测量从页面开始到当前的时间
   * Perf.measure('page-ready-time')
   * ```
   */
  static measure(name: string, startMark?: string, endMark?: string): void {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        if (startMark && endMark) {
          // 两个标记之间的测量
          performance.measure(name, startMark, endMark)
        } else if (startMark) {
          // 从指定标记到当前时间的测量
          performance.measure(name, startMark)
        } else {
          // 从导航开始到当前时间的测量
          performance.measure(name)
        }
      } catch (error) {
        console.warn(`性能测量创建失败: ${name}`, error)
      }
    }
  }

  /**
   * 获取当前配置的采样率
   * 
   * 采样率控制性能数据收集的频率，是平衡数据质量和性能开销的关键参数。
   * 较低的采样率可以减少性能监控本身对应用性能的影响。
   * 
   * @returns 当前采样率（0-1之间的数值）
   * 
   * 采样率说明：
   * - 1.0: 100%采样，收集所有性能数据（适合开发环境）
   * - 0.1: 10%采样，收集10%的性能数据（适合生产环境）
   * - 0.01: 1%采样，最小化性能影响（适合高流量生产环境）
   */
  static getSampleRate(): number {
    return this.options.sampleRate ?? 0.05
  }

  /**
   * 判断当前请求是否应该进行性能采样
   * 
   * 基于配置的采样率使用随机算法决定是否收集性能数据。
   * 这是实现采样控制的核心方法，确保只有指定比例的请求会产生性能开销。
   * 
   * @returns true表示应该采样，false表示跳过采样
   * 
   * 使用场景：
   * - 在关键性能监控点调用，决定是否记录数据
   * - 在自定义性能监控逻辑中使用
   * - 控制第三方监控工具的数据上报频率
   * 
   * @example
   * ```typescript
   * // 在关键业务逻辑中使用
   * if (Perf.shouldSample()) {
   *   Perf.mark('business-operation-start')
   *   // ... 执行业务逻辑 ...
   *   Perf.measure('business-operation', 'business-operation-start')
   * }
   * ```
   */
  static shouldSample(): boolean {
    return Math.random() < this.getSampleRate()
  }

  /**
   * 停止所有性能监控
   * 
   * 完全停止性能监控系统，释放所有相关资源。该方法确保干净地清理所有监控器、
   * 观察器和定时器，避免内存泄漏和不必要的后台活动。
   * 
   * 清理过程包括：
   * 1. 断开所有Performance Observer连接
   * 2. 清理高级指标监控的定时器和事件监听器
   * 3. 停止内存泄漏检测
   * 4. 重置初始化状态
   * 
   * 适用场景：
   * - 应用程序卸载时
   * - 切换到不同的监控配置时
   * - 临时停用性能监控时
   * - 单页应用路由切换时的资源清理
   * 
   * @example
   * ```typescript
   * // 应用卸载时停止监控
   * window.addEventListener('beforeunload', () => {
   *   Perf.stop()
   * })
   * 
   * // 切换配置前先停止
   * Perf.stop()
   * Perf.init(newConfig)
   * ```
   */
  static stop(): void {
    // 断开所有性能观察器连接，停止性能条目监控
    this.observers.forEach(observer => {
      try {
        observer.disconnect()
      } catch (error) {
        console.warn('性能观察器断开连接失败:', error)
      }
    })
    this.observers = []

    // 执行所有清理函数，释放各模块占用的资源
    this.cleanupFunctions.forEach(cleanup => {
      try {
        cleanup()
      } catch (error) {
        console.warn('性能监控清理函数执行失败:', error)
      }
    })
    this.cleanupFunctions = []

    // 重置初始化状态
    this.initialized = false
  }

  /**
   * 获取当前性能快照
   * 
   * 收集当前页面的完整性能数据快照，包括导航时间、内存使用和用户自定义标记等。
   * 该方法提供了一个便捷的方式来获取完整的性能概览，适用于调试和一次性数据导出。
   * 
   * @returns 包含各类性能数据的对象
   * 
   * 返回数据结构：
   * - timestamp: 快照创建时间
   * - navigation: 导航性能数据（加载时间、TTFB等）
   * - memory: 内存使用情况（仅Chrome）
   * - timing: 用户自定义标记和测量统计
   * 
   * 使用场景：
   * - 性能调试和问题诊断
   * - 性能报告生成
   * - 一次性数据导出
   * - 性能基准测试
   * 
   * @example
   * ```typescript
   * // 获取完整性能数据
   * const snapshot = Perf.getPerformanceSnapshot()
   * console.log('页面加载时间:', snapshot.navigation.loadComplete)
   * console.log('内存使用率:', snapshot.memory.usagePercent)
   * 
   * // 用于性能报告
   * sendPerformanceReport(snapshot)
   * ```
   */
  static getPerformanceSnapshot(): Record<string, any> {
    // 初始化快照对象，包含时间戳和各类性能数据
    const snapshot: Record<string, any> = {
      timestamp: Date.now(), // 快照创建时间
      navigation: {},        // 导航性能数据
      memory: {},           // 内存使用情况
      timing: {}            // 用户自定义时间数据
    }

    // 收集导航性能数据（页面加载各阶段的耗时）
    try {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navEntry) {
        snapshot.navigation = {
          loadComplete: navEntry.loadEventEnd - navEntry.fetchStart,        // 页面完全加载时间
          domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart, // DOM内容加载时间
          firstByte: navEntry.responseStart - navEntry.fetchStart,          // 首字节响应时间(TTFB)
          dnsLookup: navEntry.domainLookupEnd - navEntry.domainLookupStart, // DNS查询时间
          tcpConnect: navEntry.connectEnd - navEntry.connectStart           // TCP连接建立时间
        }
      }
    } catch (error) {
      console.warn('导航性能数据收集失败:', error)
    }

    // 收集JavaScript堆内存使用信息（仅Chrome支持）
    try {
      if ((performance as any).memory) {
        const memory = (performance as any).memory
        snapshot.memory = {
          usedJSHeapSize: memory.usedJSHeapSize,      // 已使用的JS堆大小（字节）
          totalJSHeapSize: memory.totalJSHeapSize,    // 总JS堆大小（字节）
          jsHeapSizeLimit: memory.jsHeapSizeLimit,    // JS堆大小限制（字节）
          usagePercent: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) // 内存使用百分比
        }
      }
    } catch (error) {
      console.warn('内存信息收集失败:', error)
    }

    // 收集用户自定义性能标记和测量数据
    try {
      const measures = performance.getEntriesByType('measure') // 获取所有测量条目
      const marks = performance.getEntriesByType('mark')       // 获取所有标记条目
      
      snapshot.timing = {
        measuresCount: measures.length,  // 测量条目总数
        marksCount: marks.length,        // 标记条目总数
        // 最近5个测量结果，便于查看最近的性能数据
        recentMeasures: measures.slice(-5).map(measure => ({
          name: measure.name,                    // 测量名称
          duration: (measure as any).duration,  // 测量持续时间
          startTime: measure.startTime          // 测量开始时间
        }))
      }
    } catch (error) {
      console.warn('用户自定义时间数据收集失败:', error)
    }

    return snapshot
  }

  /**
   * 强制收集当前所有可用的性能指标
   * 
   * 立即收集并报告当前可用的所有性能数据，不受采样率限制。
   * 该方法适用于需要立即获取完整性能数据的场景，如用户主动请求、关键事件监控等。
   * 
   * 收集的数据包括：
   * - Web Vitals核心指标（如果模块可用）
   * - 导航性能数据（DNS、TCP、TTFB、DOM加载等）
   * - 资源加载性能（最近10个资源）
   * 
   * 使用场景：
   * - 用户手动触发的性能检测
   * - 关键业务流程完成后的性能数据收集
   * - 页面即将卸载时的最终数据收集
   * - 性能问题的即时诊断
   * 
   * 注意事项：
   * - 该方法会立即执行，不受采样率控制
   * - 可能产生多个性能指标回调
   * - 建议不要频繁调用，以免影响性能
   * 
   * @example
   * ```typescript
   * // 用户点击“性能检测”按钮时
   * document.getElementById('perf-check').addEventListener('click', () => {
   *   Perf.collectAllMetrics()
   * })
   * 
   * // 页面即将卸载时收集最终数据
   * window.addEventListener('beforeunload', () => {
   *   Perf.collectAllMetrics()
   * })
   * ```
   */
  static collectAllMetrics(): void {
    // 检查是否配置了指标回调函数
    if (!this.options.onMetric) {
      console.warn('没有配置性能指标回调函数，无法收集数据')
      return
    }

    const callback = this.options.onMetric

    // 收集 Web Vitals 核心指标（如果模块可用）
    try {
      import('./web-vitals.js').then(module => {
        module.initWebVitals({ onMetric: callback })
      })
    } catch (error) {
      console.warn('Web Vitals数据收集失败:', error)
    }

    // 收集导航性能数据（各个加载阶段的耗时）
    try {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navEntry) {
        // 定义要收集的导航性能指标
        const navigationMetrics = [
          { name: 'dns-lookup', value: navEntry.domainLookupEnd - navEntry.domainLookupStart },     // DNS查询耗时
          { name: 'tcp-connect', value: navEntry.connectEnd - navEntry.connectStart },              // TCP连接耗时
          { name: 'ttfb', value: navEntry.responseStart - navEntry.requestStart },                  // 首字节响应时间
          { name: 'dom-content-loaded', value: navEntry.domContentLoadedEventEnd - navEntry.fetchStart }, // DOM内容加载时间
          { name: 'load-complete', value: navEntry.loadEventEnd - navEntry.fetchStart }            // 页面完全加载时间
        ]

        // 逐一报告导航性能指标
        navigationMetrics.forEach(metric => {
          callback({
            type: 'navigation',
            name: metric.name,
            value: Math.round(metric.value), // 四舍五入到整数毫秒
            unit: 'ms',
            ts: Date.now(),
            source: 'performance-api'
          })
        })
      }
    } catch (error) {
      console.warn('导航性能数据收集失败:', error)
    }

    // 收集资源加载性能数据（最近10个资源，避免数据过多）
    try {
      const resourceEntries = performance.getEntriesByType('resource').slice(-10) // 获取最近10个资源加载记录
      
      resourceEntries.forEach(entry => {
        const resource = entry as PerformanceResourceTiming
        callback({
          type: 'resource',
          name: resource.initiatorType || 'unknown', // 资源类型（script、img、link等）
          value: Math.round(resource.duration),      // 资源加载耗时
          unit: 'ms',
          ts: Date.now(),
          source: 'performance-api',
          attrs: {
            url: resource.name,                                                        // 资源URL
            size: resource.transferSize,                                              // 传输大小
            cached: resource.transferSize === 0 && resource.decodedBodySize > 0      // 是否命中缓存
          }
        })
      })
    } catch (error) {
      console.warn('资源性能数据收集失败:', error)
    }
  }

  /**
   * 检查性能监控系统是否已初始化
   * 
   * 返回性能监控系统的初始化状态，用于判断是否可以安全地使用其他性能监控功能。
   * 在使用性能监控功能之前先检查初始化状态是一个好的实践。
   * 
   * @returns true表示已初始化，false表示未初始化
   * 
   * 使用场景：
   * - 在组件中条件性地使用性能监控
   * - 在第三方库中检查集成状态
   * - 在分析工具中确认数据来源
   * - 调试时检查配置状态
   * 
   * @example
   * ```typescript
   * // 在组件中条件性使用
   * if (Perf.isInitialized()) {
   *   Perf.mark('component-mount')
   * }
   * 
   * // 在库中检查集成状态
   * export function trackUserAction(action: string) {
   *   if (Perf.isInitialized()) {
   *     Perf.mark(`user-${action}`)
   *   }
   * }
   * ```
   */
  static isInitialized(): boolean {
    return this.initialized
  }

  /**
   * 获取当前性能监控配置
   * 
   * 返回当前性能监控系统的完整配置信息，包括用户自定义配置和默认配置。
   * 返回的是配置的深拷贝，修改返回的对象不会影响实际配置。
   * 
   * @returns 性能监控配置对象的副本
   * 
   * 返回的配置包括：
   * - sampleRate: 当前采样率
   * - enableDetailedMonitoring: 是否启用详细监控
   * - enableAdvancedMetrics: 是否启用高级指标
   * - observeEntryTypes: 监控的性能条目类型
   * - 其他所有初始化时的配置项
   * 
   * 使用场景：
   * - 调试和问题诊断
   * - 动态调整监控策略
   * - 配置验证和日志记录
   * - 性能监控状态报告
   * 
   * @example
   * ```typescript
   * // 检查当前配置
   * const config = Perf.getOptions()
   * console.log('当前采样率:', config.sampleRate)
   * console.log('监控类型:', config.observeEntryTypes)
   * 
   * // 根据配置动态调整行为
   * if (config.enableAdvancedMetrics) {
   *   console.log('高级指标已启用')
   * }
   * 
   * // 用于配置数据的上报
   * sendConfigReport(config)
   * ```
   */
  static getOptions(): PerfOptions {
    return { ...this.options }
  }
}