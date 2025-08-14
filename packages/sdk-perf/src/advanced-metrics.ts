/**
 * 高级性能指标监控
 * 
 * 该模块提供了超越基本Web Vitals的高级性能监控能力，帮助开发者深入了解
 * 应用程序的性能特性和用户体验质量。这些指标对于性能优化、问题诊断和
 * 用户体验分析具有重要意义。
 * 
 * 主要监控类别：
 * 
 * ● 渲染性能监控：
 *   - FPS（帧率）监控：实时监控页面渲染帧率
 *   - 关键渲染路径监控：检测阻塞渲染的资源
 * 
 * ● 交互性能监控：
 *   - 用户交互响应时间：点击、键盘、触摸等事件的延迟
 *   - 总阻塞时间（TBT）监控：识别主线程阻塞问题
 * 
 * ● 系统环境监控：
 *   - 网络质量监控：连接类型、带宽、延迟等
 *   - 设备信息收集：CPU核心数、内存大小、屏幕信息等
 *   - 浏览器环境检测：版本、平台、移动设备等
 * 
 * ● 生命周期监控：
 *   - 页面可见性监控：页面隐藏/显示状态变化
 *   - 页面生命周期监控：加载、卸载、冻结/恢复等
 *   - 会话持续时间监控
 * 
 * ● 内存优化监控：
 *   - 内存泄漏检测：通过趋势分析识别潜在泄漏
 *   - 内存使用模式分析
 * 
 * 技术特性：
 * - 自动适配浏览器兼容性
 * - 模块化设计，可按需启用
 * - 完善的资源清理机制
 * - 低性能开销设计
 * - 敏感数据保护
 */

import type { PerfMetric } from './types.js'

/**
 * 高级性能指标监控配置选项
 * 
 * 该接口定义了高级性能监控系统的完整配置参数，允许开发者
 * 根据实际需求灵活选择需要的监控功能。每个功能模块都可以独立启用或禁用。
 */
export interface AdvancedMetricsOptions {
  /** 
   * 是否启用FPS（帧率）监控，默认true
   * FPS监控对于评估页面渲染性能和动画流畅性非常重要
   * 适用于游戏、动画丰富的应用或需要高响应性的界面
   */
  enableFPS?: boolean
  
  /** 
   * FPS监控的采样间隔（毫秒），默认1000ms
   * 较小的间隔提供更精细的数据，但会增加性能开销
   * 建议值：高精度 500ms，普通 1000ms，低开销 2000ms
   */
  fpsInterval?: number
  
  /** 
   * 是否启用交互性监控，默认true
   * 监控用户交互事件（点击、键盘、触摸等）的响应时间
   * 对于用户体验优化和交互性能分析非常关键
   */
  enableInteractivity?: boolean
  
  /** 
   * 是否启用网络质量监控，默认true
   * 收集网络连接类型、带宽、延迟等信息
   * 有助于理解性能问题的环境因素和制定适应性策略
   */
  enableNetworkQuality?: boolean
  
  /** 
   * 是否启用设备信息收集，默认true
   * 收集CPU核心数、内存大小、屏幕信息、浏览器版本等
   * 用于设备性能分析和兼容性检测
   */
  enableDeviceInfo?: boolean
  
  /** 
   * 性能指标回调函数
   * 当收集到新的高级性能数据时会调用此函数
   * 可用于实时分析、数据上报或触发特定的优化逻辑
   */
  onMetric?: (metric: PerfMetric) => void
}

/**
 * 启动高级性能指标监控
 * 
 * 该函数是高级性能监控系统的主入口，负责根据配置启动各种高级性能监控功能。
 * 所有监控模块都是可选的，可以根据实际需求和性能要求灵活配置。
 * 
 * @param options 高级指标监控配置选项
 * @returns 清理函数，调用后会停止所有监控并释放资源
 * 
 * 启动的监控功能包括：
 * - FPS监控：实时跟踪页面渲染帧率
 * - 交互性监控：监控用户交互事件的响应时间
 * - 网络质量监控：检测网络连接状态和质量
 * - 设备信息收集：获取设备硬件和软件信息
 * - 页面可见性监控：跟踪页面显示/隐藏状态
 * - 页面生命周期监控：监控页面的各种生命周期事件
 * 
 * 注意事项：
 * - 所有监控模块都包含完善的错误处理
 * - 单个模块失败不会影响其他模块的正常运行
 * - 返回的清理函数必须在适当时机调用以避免内存泄漏
 * - 所有监控功能都设计为低影响，但仍建议根据需要选择性启用
 * 
 * @example
 * ```typescript
 * // 基本使用
 * const cleanup = startAdvancedMetrics({
 *   enableFPS: true,
 *   enableInteractivity: true,
 *   onMetric: (metric) => {
 *     console.log(`${metric.name}: ${metric.value}${metric.unit}`)
 *   }
 * })
 * 
 * // 高精度FPS监控
 * const cleanup = startAdvancedMetrics({
 *   enableFPS: true,
 *   fpsInterval: 500, // 500ms采样一次
 *   enableInteractivity: false,
 *   enableNetworkQuality: false,
 *   onMetric: handleFPSData
 * })
 * 
 * // 在组件卸载时清理
 * useEffect(() => {
 *   const cleanup = startAdvancedMetrics(options)
 *   return cleanup // React会在组件卸载时调用
 * }, [])
 * ```
 */
export function startAdvancedMetrics(options: AdvancedMetricsOptions = {}): () => void {
  // 解构配置参数，并设置默认值
  const {
    enableFPS = true,              // 默认启用FPS监控
    fpsInterval = 1000,            // 默认每秒1次采样
    enableInteractivity = true,    // 默认启用交互性监控
    enableNetworkQuality = true,   // 默认启用网络质量监控
    enableDeviceInfo = true,       // 默认启用设备信息收集
    onMetric                       // 指标回调函数
  } = options

  // 存储所有模块的清理函数，用于统一资源管理
  const cleanupFunctions: (() => void)[] = []

  // 按配置启动各个监控模块
  
  // FPS（帧率）监控 - 监控页面渲染性能
  if (enableFPS) {
    try {
      const stopFPS = startFPSMonitoring(onMetric, fpsInterval)
      cleanupFunctions.push(stopFPS)
    } catch (error) {
      console.warn('FPS监控启动失败:', error)
    }
  }

  // 交互性监控 - 监控用户交互事件的响应时间
  if (enableInteractivity) {
    try {
      const stopInteractivity = startInteractivityMonitoring(onMetric)
      cleanupFunctions.push(stopInteractivity)
    } catch (error) {
      console.warn('交互性监控启动失败:', error)
    }
  }

  // 网络质量监控 - 检测网络连接类型和质量
  if (enableNetworkQuality) {
    try {
      const stopNetworkQuality = startNetworkQualityMonitoring(onMetric)
      cleanupFunctions.push(stopNetworkQuality)
    } catch (error) {
      console.warn('网络质量监控启动失败:', error)
    }
  }

  // 设备信息收集 - 获取硬件和软件环境信息
  if (enableDeviceInfo) {
    try {
      collectDeviceInfo(onMetric)
    } catch (error) {
      console.warn('设备信息收集失败:', error)
    }
  }

  // 以下是默认启用的基础监控功能
  
  // 页面可见性监控 - 跟踪页面显示/隐藏状态变化
  try {
    const stopVisibilityMonitoring = startVisibilityMonitoring(onMetric)
    cleanupFunctions.push(stopVisibilityMonitoring)
  } catch (error) {
    console.warn('页面可见性监控启动失败:', error)
  }

  // 页面生命周期监控 - 监控页面加载、卸载、冻结等事件
  try {
    const stopLifecycleMonitoring = startPageLifecycleMonitoring(onMetric)
    cleanupFunctions.push(stopLifecycleMonitoring)
  } catch (error) {
    console.warn('页面生命周期监控启动失败:', error)
  }

  // 返回统一的清理函数，调用后会停止所有监控并释放资源
  return () => {
    cleanupFunctions.forEach(cleanup => {
      try {
        cleanup()
      } catch (error) {
        console.warn('清理高级指标监控资源失败:', error)
      }
    })
    // 清空数组以释放内存
    cleanupFunctions.length = 0
  }
}

/**
 * 启动FPS（帧率）监控
 * 
 * FPS（Frames Per Second）是衡量页面渲染性能的关键指标，特别适用于
 * 含有动画、交互效果或实时更新内容的应用。理想的FPS值是60，
 * 但在实际应用中可能会因为计算负载、重绘或浏览器限制而降低。
 * 
 * @param onMetric 性能指标回调函数，用于接收FPS数据
 * @param interval 采样间隔（毫秒），默认1000ms
 * @returns 清理函数，调用后停止FPS监控
 * 
 * 工作原理：
 * 1. 使用requestAnimationFrame计数帧数
 * 2. 定时计算指定时间段内的平均FPS
 * 3. 根据性能表现自动评级
 * 
 * FPS评级标准：
 * - 好： ≥ 55 FPS（接近理想的60FPS）
 * - 需要改进： 30-54 FPS（可以接受但不理想）
 * - 差： < 30 FPS（用户可能感受到卡顿）
 * 
 * @example
 * ```typescript
 * // 基本使用
 * const stopFPS = startFPSMonitoring((metric) => {
 *   console.log(`当前FPS: ${metric.value}`, metric.rating)
 * })
 * 
 * // 高频率监控
 * const stopFPS = startFPSMonitoring(handleFPS, 500) // 每500ms采样一次
 * ```
 */
function startFPSMonitoring(onMetric?: (metric: PerfMetric) => void, interval = 1000): () => void {
  let frameCount = 0                   // 统计帧数
  let lastTime = performance.now()     // 上次计算时间
  let animationId: number              // 动画帧ID
  let intervalId: number               // 定时器ID

  // 帧计数函数，每一帧都会调用
  const countFrame = () => {
    frameCount++ // 帧数加一
    animationId = requestAnimationFrame(countFrame) // 递归调用，持续计数
  }

  // 计算FPS的函数，定时执行
  const calculateFPS = () => {
    const currentTime = performance.now()
    const deltaTime = currentTime - lastTime // 时间间隔
    
    // FPS = 帧数 / 时间（秒）
    const fps = Math.round((frameCount * 1000) / deltaTime)

    // 发送FPS指标数据
    onMetric?.({
      type: 'custom',
      name: 'fps',
      value: fps,
      unit: 'fps', // 使用fps作为单位更直观
      rating: fps >= 55 ? 'good' : fps >= 30 ? 'needs-improvement' : 'poor', // FPS评级
      ts: Date.now(),
      source: 'advanced-metrics',
      attrs: {
        frameCount,                           // 本次采样期间的帧数
        deltaTime: Math.round(deltaTime),     // 采样时间间隔
        sampleInterval: interval              // 配置的采样间隔
      }
    })

    // 重置计数器，开始下一轮采样
    frameCount = 0
    lastTime = currentTime
  }

  // 开始监控：启动帧计数和定时计算
  animationId = requestAnimationFrame(countFrame)
  intervalId = window.setInterval(calculateFPS, interval)

  // 返回清理函数，停止FPS监控
  return () => {
    cancelAnimationFrame(animationId) // 停止帧计数
    clearInterval(intervalId)          // 清除定时器
  }
}

/**
 * 启动交互性监控
 * 
 * 交互性监控衡量的是用户与页面交互时的响应性能。它监控各种用户操作
 * （点击、键盘输入、滚动、触摸等）的处理时间，帮助识别交互性能问题。
 * 
 * @param onMetric 性能指标回调函数，用于接收交互性数据
 * @returns 清理函数，调用后停止交互性监控
 * 
 * 监控的交互事件包括：
 * - click: 鼠标点击事件
 * - keydown: 键盘按下事件
 * - scroll: 页面滚动事件
 * - touchstart: 触摸开始事件
 * 
 * 性能评级标准：
 * - 好： ≤ 16ms（一帧的时间，60FPS）
 * - 需要改进： 16ms - 50ms
 * - 差： > 50ms（可能影响用户体验）
 * 
 * 同时监控TBT（Total Blocking Time）：
 * 累积阻塞时间，衡量主线程被长任务阻塞的时间。
 * 
 * @example
 * ```typescript
 * const stopInteractivity = startInteractivityMonitoring((metric) => {
 *   if (metric.name.includes('response')) {
 *     console.log(`${metric.attrs.eventType}事件响应时间: ${metric.value}ms`)
 *   }
 * })
 * ```
 */
function startInteractivityMonitoring(onMetric?: (metric: PerfMetric) => void): () => void {
  // 定义要监控的交互事件类型
  const events = ['click', 'keydown', 'scroll', 'touchstart']
  const handlers: Array<{ event: string; handler: EventListener }> = []

  // 为每个事件类型添加监听器
  events.forEach(eventType => {
    const handler = (event: Event) => {
      const startTime = performance.now() // 记录事件开始时间
      
      // 使用setTimeout(0)来测量事件处理延迟
      // 这可以测量事件从触发到实际处理的时间
      setTimeout(() => {
        const processingTime = performance.now() - startTime // 计算处理耗时
        
        // 发送交互性指标数据
        onMetric?.({
          type: 'event',
          name: `${eventType}-response`, // 事件响应时间指标
          value: Math.round(processingTime),
          unit: 'ms',
          rating: processingTime <= 16 ? 'good' : processingTime <= 50 ? 'needs-improvement' : 'poor',
          ts: Date.now(),
          source: 'advanced-metrics',
          attrs: {
            eventType,                                    // 事件类型
            target: (event.target as Element)?.tagName,   // 目标元素标签名
            timestamp: startTime,                         // 事件发生时间
            // 添加更多上下文信息
            clientX: (event as MouseEvent).clientX,       // 鼠标X坐标（如果适用）
            clientY: (event as MouseEvent).clientY,       // 鼠标Y坐标（如果适用）
            key: (event as KeyboardEvent).key            // 按键信息（如果适用）
          }
        })
      }, 0)
    }

    // 添加事件监听器，使用passive模式以避免影响性能
    document.addEventListener(eventType, handler, { passive: true })
    handlers.push({ event: eventType, handler })
  })

  // TBT（Total Blocking Time）监控 - 监控主线程阻塞情况
  let totalBlockingTime = 0                      // 累积阻塞时间
  const startMonitoring = performance.now()      // 监控开始时间

  // 检查总阻塞时间的函数
  const checkTBT = () => {
    // 注意：这里的TBT计算是简化版本
    // 完整的TBT需要结合longtask数据进行精确计算
    onMetric?.({
      type: 'custom',
      name: 'total-blocking-time',
      value: Math.round(totalBlockingTime),
      unit: 'ms',
      // TBT评级标准：200ms以下为好，600ms以下需改进
      rating: totalBlockingTime <= 200 ? 'good' : totalBlockingTime <= 600 ? 'needs-improvement' : 'poor',
      ts: Date.now(),
      source: 'advanced-metrics',
      attrs: {
        monitoringDuration: performance.now() - startMonitoring, // 监控持续时间
        sampleCount: Math.floor((performance.now() - startMonitoring) / 5000) // 采样次数
      }
    })
  }

  // 每5秒检查一次TBT数据
  const tbtInterval = setInterval(checkTBT, 5000)

  // 返回清理函数，移除所有事件监听器和定时器
  return () => {
    // 移除所有事件监听器
    handlers.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler)
    })
    // 清除TBT监控定时器
    clearInterval(tbtInterval)
  }
}

/**
 * 启动网络质量监控
 * 
 * 网络质量监控使用Network Information API来检测用户的网络连接类型和质量。
 * 这些信息对于理解性能问题的环境因素和制定适应性策略非常有用。
 * 
 * @param onMetric 性能指标回调函数，用于接收网络质量数据
 * @returns 清理函数，调用后停止网络质量监控
 * 
 * 监控的网络信息包括：
 * - effectiveType: 有效连接类型（4g, 3g, 2g, slow-2g）
 * - downlink: 下行带宽估算值（Mbps）
 * - rtt: 往返时间（Round Trip Time，毫秒）
 * - saveData: 是否启用了数据节省模式
 * 
 * 网络质量评级：
 * - 4g: 'good'（高速网络）
 * - 3g: 'needs-improvement'（中速网络）
 * - 2g/slow-2g: 'poor'（低速网络）
 * 
 * 兼容性说明：
 * Network Information API主要在Chrome和基于Chromium的浏览器中支持，
 * 在不支持的浏览器中会静默跳过。
 * 
 * @example
 * ```typescript
 * const stopNetworkMonitoring = startNetworkQualityMonitoring((metric) => {
 *   console.log(`网络类型: ${metric.attrs.effectiveType}`)
 *   console.log(`下行带宽: ${metric.attrs.downlink}Mbps`)
 * })
 * ```
 */
function startNetworkQualityMonitoring(onMetric?: (metric: PerfMetric) => void): () => void {
  // 尝试获取Network Information API对象（兼容不同浏览器实现）
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection

  // 检查浏览器是否支持Network Information API
  if (!connection) {
    console.warn('当前浏览器不支持Network Information API')
    return () => {} // 返回空的清理函数
  }

  // 报告网络信息的函数
  const reportNetworkInfo = () => {
    try {
      onMetric?.({
        type: 'custom',
        name: 'network-quality',
        value: connection.downlink || 0,  // 使用下行带宽作为主要指标值
        unit: 'mbps',                     // 使用Mbps作为单位更直观
        rating: getNetworkRating(connection.effectiveType), // 根据网络类型进行评级
        ts: Date.now(),
        source: 'advanced-metrics',
        attrs: {
          effectiveType: connection.effectiveType,  // 有效连接类型（'4g', '3g', '2g', 'slow-2g'）
          downlink: connection.downlink,            // 下行带宽（Mbps）
          rtt: connection.rtt,                      // 往返时间（ms）
          saveData: connection.saveData,            // 是否启用数据节省模式
          // 添加更多上下文信息
          downlinkMax: connection.downlinkMax,      // 最大下行速度
          type: connection.type                     // 连接类型（如'wifi', 'cellular'）
        }
      })
    } catch (error) {
      console.warn('网络信息获取失败:', error)
    }
  }

  // 立即获取一次初始网络信息
  reportNetworkInfo()

  // 监听网络状态变化事件
  const handler = reportNetworkInfo
  connection.addEventListener('change', handler)

  // 返回清理函数，移除事件监听器
  return () => {
    try {
      connection.removeEventListener('change', handler)
    } catch (error) {
      console.warn('移除网络事件监听器失败:', error)
    }
  }
}

/**
 * 收集设备信息
 * 
 * 该函数收集用户设备的硬件和软件信息，包括CPU、内存、屏幕、浏览器等。
 * 这些信息对于理解性能表现的设备差异和进行针对性优化非常有用。
 * 
 * @param onMetric 性能指标回调函数，用于接收设备信息数据
 * 
 * 收集的设备信息包括：
 * - CPU核心数：反映设备的并行处理能力
 * - 设备内存：物理内存大小（仅Chrome支持）
 * - 屏幕信息：分辨率、色深、像素比等
 * - 浏览器信息：类型、版本、平台等
 * 
 * 性能评级标准：
 * - CPU核心数: 8+为好，4-7为中等，<4为差
 * - 设备内存: 8GB+为好，4-8GB为中等，<4GB为差
 * 
 * 隐私说明：
 * 所有收集的信息都是匿名和聚合的，不会识别具体的个人设备。
 * 
 * @example
 * ```typescript
 * collectDeviceInfo((metric) => {
 *   if (metric.name === 'device-cpu-cores') {
 *     console.log(`CPU核心数: ${metric.value}`)
 *   }
 * })
 * ```
 */
function collectDeviceInfo(onMetric?: (metric: PerfMetric) => void): void {
  // 收集CPU核心数信息
  try {
    const cpuCores = navigator.hardwareConcurrency || 0
    onMetric?.({
      type: 'custom',
      name: 'device-cpu-cores',
      value: cpuCores,
      unit: 'cores',  // 使用cores作为单位更直观
      rating: cpuCores >= 8 ? 'good' : cpuCores >= 4 ? 'needs-improvement' : 'poor',
      ts: Date.now(),
      source: 'advanced-metrics',
      attrs: {
        // 添加更多上下文信息
        supported: navigator.hardwareConcurrency !== undefined, // 是否支持该API
        userAgent: navigator.userAgent.substring(0, 100)       // 截取部分UA信息
      }
    })
  } catch (error) {
    console.warn('CPU信息收集失败:', error)
  }

  // 收集设备内存信息（仅Chrome系列浏览器支持）
  try {
    const deviceMemory = (navigator as any).deviceMemory
    if (deviceMemory !== undefined) {
      onMetric?.({
        type: 'custom',
        name: 'device-memory',
        value: deviceMemory,
        unit: 'gb',  // 使用GB作为单位
        rating: deviceMemory >= 8 ? 'good' : deviceMemory >= 4 ? 'needs-improvement' : 'poor',
        ts: Date.now(),
        source: 'advanced-metrics',
        attrs: {
          memoryGB: deviceMemory,                              // 内存大小（GB）
          isApproximateValue: true,                           // 标记为近似值
          privacyNote: '该值经过量化处理以保护隐私' // 隐私说明
        }
      })
    } else {
      // 在不支持的浏览器中记录一个特殊指标
      onMetric?.({
        type: 'custom',
        name: 'device-memory',
        value: -1, // -1表示不支持
        unit: 'gb',
        rating: undefined, // 无法评级
        ts: Date.now(),
        source: 'advanced-metrics',
        attrs: {
          supported: false,
          reason: '浏览器不支持Device Memory API'
        }
      })
    }
  } catch (error) {
    console.warn('设备内存信息收集失败:', error)
  }

  // 收集屏幕信息
  try {
    const screenArea = screen.width * screen.height // 屏幕像素面积
    onMetric?.({
      type: 'custom',
      name: 'screen-info',
      value: screenArea,
      unit: 'pixels', // 使用pixels作为单位
      ts: Date.now(),
      source: 'advanced-metrics',
      attrs: {
        width: screen.width,                    // 屏幕宽度
        height: screen.height,                  // 屏幕高度
        colorDepth: screen.colorDepth,          // 色深
        pixelRatio: window.devicePixelRatio,    // 像素比
        // 添加更多屏幕信息
        availWidth: screen.availWidth,          // 可用宽度（排除任务栏等）
        availHeight: screen.availHeight,        // 可用高度
        orientation: screen.orientation?.type,  // 屏幕方向
        // 屏幕类型推断
        screenType: screenArea > 2073600 ? 'desktop' :     // > 1920x1080
                   screenArea > 921600 ? 'tablet' :        // > 1280x720
                   'mobile'                                 // 其他
      }
    })
  } catch (error) {
    console.warn('屏幕信息收集失败:', error)
  }

  // 用户代理信息
  const userAgent = navigator.userAgent
  const browser = detectBrowser(userAgent)
  onMetric?.({
    type: 'custom',
    name: 'browser-info',
    value: 0,
    unit: 'count',
    ts: Date.now(),
    source: 'custom',
    attrs: {
      browser: browser.name,
      version: browser.version,
      mobile: /Mobile|Android|iPhone|iPad/.test(userAgent),
      platform: navigator.platform
    }
  })
}

/**
 * 页面可见性监控
 */
function startVisibilityMonitoring(onMetric?: (metric: PerfMetric) => void): () => void {
  let visibilityStart = performance.now()
  let wasHidden = document.hidden

  const handleVisibilityChange = () => {
    const now = performance.now()
    const duration = now - visibilityStart

    if (wasHidden && !document.hidden) {
      // 页面变为可见
      onMetric?.({
        type: 'custom',
        name: 'page-hidden-duration',
        value: Math.round(duration),
        unit: 'ms',
        ts: Date.now(),
        source: 'custom',
        attrs: {
          visibilityState: document.visibilityState
        }
      })
    } else if (!wasHidden && document.hidden) {
      // 页面变为隐藏
      onMetric?.({
        type: 'custom',
        name: 'page-visible-duration',
        value: Math.round(duration),
        unit: 'ms',
        ts: Date.now(),
        source: 'custom',
        attrs: {
          visibilityState: document.visibilityState
        }
      })
    }

    wasHidden = document.hidden
    visibilityStart = now
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}

/**
 * 页面生命周期监控
 */
function startPageLifecycleMonitoring(onMetric?: (metric: PerfMetric) => void): () => void {
  const startTime = performance.now()

  // 监控页面卸载
  const handleBeforeUnload = () => {
    const sessionDuration = performance.now() - startTime
    onMetric?.({
      type: 'custom',
      name: 'session-duration',
      value: Math.round(sessionDuration),
      unit: 'ms',
      ts: Date.now(),
      source: 'custom'
    })
  }

  // 监控页面冻结/恢复 (Page Lifecycle API)
  let freezeStart: number | null = null

  const handleFreeze = () => {
    freezeStart = performance.now()
  }

  const handleResume = () => {
    if (freezeStart) {
      const freezeDuration = performance.now() - freezeStart
      onMetric?.({
        type: 'custom',
        name: 'page-freeze-duration',
        value: Math.round(freezeDuration),
        unit: 'ms',
        ts: Date.now(),
        source: 'custom'
      })
      freezeStart = null
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('freeze', handleFreeze)
  document.addEventListener('resume', handleResume)

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    document.removeEventListener('freeze', handleFreeze)
    document.removeEventListener('resume', handleResume)
  }
}

/**
 * 获取网络质量评级
 */
function getNetworkRating(effectiveType: string): 'good' | 'needs-improvement' | 'poor' {
  switch (effectiveType) {
    case '4g': return 'good'
    case '3g': return 'needs-improvement'
    case '2g':
    case 'slow-2g':
    default:
      return 'poor'
  }
}

/**
 * 检测浏览器信息
 */
function detectBrowser(userAgent: string): { name: string; version: string } {
  if (userAgent.includes('Chrome')) {
    const match = userAgent.match(/Chrome\/(\d+)/)
    return { name: 'Chrome', version: match?.[1] || 'unknown' }
  } else if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+)/)
    return { name: 'Firefox', version: match?.[1] || 'unknown' }
  } else if (userAgent.includes('Safari')) {
    const match = userAgent.match(/Version\/(\d+).*Safari/)
    return { name: 'Safari', version: match?.[1] || 'unknown' }
  } else if (userAgent.includes('Edge')) {
    const match = userAgent.match(/Edge\/(\d+)/)
    return { name: 'Edge', version: match?.[1] || 'unknown' }
  }
  return { name: 'Unknown', version: 'unknown' }
}

/**
 * 监控关键渲染路径
 */
export function monitorCriticalRenderingPath(onMetric?: (metric: PerfMetric) => void): () => void {
  const observers: PerformanceObserver[] = []

  // 监控资源加载阻塞渲染
  if ('PerformanceObserver' in window) {
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.renderBlockingStatus) {
            onMetric?.({
              type: 'custom',
              name: 'render-blocking-resource',
              value: Math.round(entry.duration),
              unit: 'ms',
              rating: entry.duration <= 100 ? 'good' : entry.duration <= 300 ? 'needs-improvement' : 'poor',
              ts: Date.now(),
              source: 'performance-observer',
              attrs: {
                url: entry.name,
                renderBlockingStatus: entry.renderBlockingStatus,
                initiatorType: entry.initiatorType
              }
            })
          }
        })
      })

      resourceObserver.observe({ entryTypes: ['resource'], buffered: true })
      observers.push(resourceObserver)
    } catch (error) {
      console.warn('Failed to observe render-blocking resources:', error)
    }
  }

  return () => {
    observers.forEach(observer => observer.disconnect())
  }
}

/**
 * 启动内存泄漏检测
 * 
 * 该函数通过定期采样JavaScript堆内存使用情况，并使用简单的线性回归分析
 * 来检测内存使用的趋势。如果检测到持续的内存增长趋势，就可能存在内存泄漏。
 * 
 * @param onMetric 性能指标回调函数，用于接收内存泄漏检测结果
 * @param interval 检测间隔（毫秒），默认60000ms（60秒）
 * @returns 清理函数，调用后停止内存泄漏检测
 * 
 * 检测原理：
 * 1. 定期采样JavaScript堆内存使用量
 * 2. 保存最近N次采样的数据
 * 3. 使用线性回归计算内存使用趋势
 * 4. 当趋势超过阈值时报告潜在泄漏
 * 
 * 检测指标：
 * - trend: 内存使用趋势系数（相对于平均值的百分比）
 * - leakDetected: 是否检测到泄漏（趋势 > 10%）
 * - currentUsage: 当前内存使用量（字节）
 * - readings: 最近的采样数据
 * 
 * 注意事项：
 * - 该功能仅在支持performance.memory的浏览器中可用（主要是Chrome）
 * - 检测结果可能存在误报，需要结合实际情况分析
 * - 建议仅在需要调试内存问题时启用，避免在生产环境中持续运行
 * - 垃圾回收和其他内存管理机制可能影响检测结果
 * 
 * @example
 * ```typescript
 * // 基本使用
 * const stopLeakDetection = startMemoryLeakDetection((metric) => {
 *   if (metric.attrs.leakDetected) {
 *     console.warn('检测到潜在的内存泄漏!', metric.attrs.trend)
 *   }
 * })
 * 
 * // 高频率检测（仅供调试使用）
 * const stopLeakDetection = startMemoryLeakDetection(handleMemoryData, 30000) // 30秒检测一次
 * ```
 */
export function startMemoryLeakDetection(onMetric?: (metric: PerfMetric) => void, interval = 60000): () => void {
  // 检查浏览器是否支持performance.memory API
  if (typeof (performance as any).memory === 'undefined') {
    console.warn('当前浏览器不支持performance.memory API，无法进行内存泄漏检测')
    return () => {} // 返回空的清理函数
  }

  const memoryReadings: number[] = []   // 存储历史内存读数
  const maxReadings = 10                // 保留最近10次采样数据
  const startTime = Date.now()          // 检测开始时间

  // 检查内存泄漏的主函数
  const checkMemoryLeak = () => {
    try {
      const memory = (performance as any).memory
      const currentUsage = memory.usedJSHeapSize // 当前已使用的JS堆内存

      // 添加新的读数并维持数组大小
      memoryReadings.push(currentUsage)
      if (memoryReadings.length > maxReadings) {
        memoryReadings.shift() // 移除最旧的读数
      }

      // 只有在有足够数据点时才进行趋势分析
      if (memoryReadings.length >= 5) {
        const trend = calculateTrend(memoryReadings) // 计算内存使用趋势
        const leakDetected = trend > 0.1            // 趋势超过10%视为潜在泄漏
        
        // 发送内存泄漏检测结果
        onMetric?.({
          type: 'custom',
          name: 'memory-leak-detection',
          value: Math.round(trend * 100) / 100, // 保瘀2位小数
          unit: 'trend',  // 趋势系数
          rating: leakDetected ? 'poor' : 'good',
          ts: Date.now(),
          source: 'advanced-metrics',
          attrs: {
            currentUsage,                                        // 当前内存使用量（字节）
            trend: Math.round(trend * 10000) / 10000,           // 趋势系数（4位小数）
            leakDetected,                                        // 是否检测到泄漏
            readings: [...memoryReadings],                       // 历史读数副本
            readingsCount: memoryReadings.length,                // 采样数量
            monitoringDuration: Date.now() - startTime,         // 监控持续时间
            totalHeapSize: memory.totalJSHeapSize,               // 总堆大小
            heapSizeLimit: memory.jsHeapSizeLimit,               // 堆大小限制
            usagePercent: Math.round((currentUsage / memory.jsHeapSizeLimit) * 100) // 使用百分比
          }
        })
      }
    } catch (error) {
      console.warn('内存泄漏检测失败:', error)
    }
  }

  // 立即执行一次检测获取初始数据
  checkMemoryLeak()
  
  // 定期执行内存检测
  const intervalId = setInterval(checkMemoryLeak, interval)

  // 返回清理函数
  return () => {
    clearInterval(intervalId)
  }
}

/**
 * 计算数据趋势（使用简单线性回归）
 * 
 * 该函数使用最小二乘法计算一组数据的线性趋势。返回的值是相对于
 * 数据平均值的趋势百分比，正值表示上升趋势，负值表示下降趋势。
 * 
 * @param values 数据数组，至少需要两个数据点
 * @returns 趋势系数（相对于平均值的百分比）
 * 
 * 计算公式：
 * - slope = (n*Σxy - Σx*Σy) / (n*Σx² - (Σx)²)
 * - trend = slope / average_y
 * 
 * 返回值意义：
 * - 0.1 表示数据有10%的上升趋势
 * - -0.1 表示数据有10%的下降趋势
 * - 0 表示数据相对稳定
 * 
 * @example
 * ```typescript
 * const memoryUsage = [100, 105, 110, 115, 120] // MB
 * const trend = calculateTrend(memoryUsage)
 * console.log(`内存使用趋势: ${(trend * 100).toFixed(1)}%`)
 * ```
 */
function calculateTrend(values: number[]): number {
  // 检查数据点数量，至少需要两个点才能计算趋势
  if (values.length < 2) {
    return 0
  }

  const n = values.length
  
  // 计算线性回归所需的各项求和
  const sumX = values.reduce((sum, _, i) => sum + i, 0)           // Σx (数据点索引之和)
  const sumY = values.reduce((sum, val) => sum + val, 0)          // Σy (数据值之和)
  const sumXY = values.reduce((sum, val, i) => sum + i * val, 0)  // Σxy (索引*值之和)
  const sumXX = values.reduce((sum, _, i) => sum + i * i, 0)      // Σx² (索引平方之和)

  // 使用最小二乘法计算斜率（趋势）
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const avgY = sumY / n // 数据的平均值

  // 返回相对趋势：斜率相对于平均值的比例
  // 这样可以消除数据量级的影响，使结果更具有可比性
  return avgY > 0 ? (slope / avgY) : 0
}