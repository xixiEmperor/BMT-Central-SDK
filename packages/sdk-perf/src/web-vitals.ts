/**
 * Web Vitals 核心性能指标监控
 * 
 * Web Vitals是Google定义的一组核心网页性能指标，直接反映用户体验质量。
 * 这些指标不仅影响用户满意度，还会直接影响SEO排名和搜索引擎优化。
 * 
 * 支持的核心指标：
 * 
 * ● LCP (Largest Contentful Paint) - 最大内容绘制时间
 *   • 衡量页面主要内容的加载速度
 *   • 好: ≤ 2.5s, 需改进: 2.5s-4.0s, 差: > 4.0s
 *   • 影响因素：图片优化、服务器响应、资源阻塞
 * 
 * ● CLS (Cumulative Layout Shift) - 累积布局偏移
 *   • 衡量页面布局的稳定性，避免意外的内容移动
 *   • 好: ≤ 0.1, 需改进: 0.1-0.25, 差: > 0.25
 *   • 影响因素：动态内容插入、字体加载、图片尺寸
 * 
 * ● FID (First Input Delay) - 首次输入延迟
 *   • 衡量页面的交互响应性，用户首次交互的延迟
 *   • 好: ≤ 100ms, 需改进: 100ms-300ms, 差: > 300ms
 *   • 影响因素：JavaScript执行时间、第三方代码、主线程阻塞
 * 
 * ● FCP (First Contentful Paint) - 首次内容绘制时间
 *   • 衡量页面首次渲染内容的速度
 *   • 好: ≤ 1.8s, 需改进: 1.8s-3.0s, 差: > 3.0s
 *   • 影响因素：网络延迟、资源加载、服务器响应
 * 
 * ● TTFB (Time to First Byte) - 首字节响应时间
 *   • 衡量服务器响应速度
 *   • 好: ≤ 800ms, 需改进: 800ms-1.8s, 差: > 1.8s
 *   • 影响因素：服务器性能、CDN配置、网络质量
 * 
 * 未来将支持的指标：
 * ● INP (Interaction to Next Paint) - 交互到下一次绘制时间
 * ● TTI (Time to Interactive) - 可交互时间  
 * ● TBT (Total Blocking Time) - 总阻塞时间
 */

import type { PerfMetric } from './types.js'

/**
 * Web Vitals 监控配置选项
 * 
 * 用于配置Web Vitals核心指标的监控行为和数据处理方式。
 */
export interface WebVitalsOptions {
  /** 
   * 是否启用Web Vitals监控，默认 true
   * 设置false可以在不需要时关闭Web Vitals收集，减少性能开销
   */
  enabled?: boolean
  
  /** 
   * 性能指标回调函数
   * 当收集到Web Vitals数据时会调用此函数，可用于数据上报、分析和存储
   */
  onMetric?: (metric: PerfMetric) => void
}

/**
 * 初始化 Web Vitals 核心指标监控
 * 
 * 该函数是Web Vitals监控的主入口，负责启动对所有核心性能指标的监控。
 * 它会根据浏览器支持情况自动选择适当的监控方式，确保最大兼容性。
 * 
 * @param options Web Vitals监控配置选项
 * 
 * 初始化流程：
 * 1. 检查配置是否启用监控
 * 2. 验证运行环境（浏览器支持）
 * 3. 逐个启动各项指标的监控
 * 4. 各指标监控独立运行，互不影响
 * 
 * 兼容性说明：
 * - 不支持的指标会静默跳过
 * - 单个指标失败不影响其他指标
 * - 自动适配不同浏览器的API差异
 * 
 * @example
 * ```typescript
 * // 基础使用
 * initWebVitals({
 *   onMetric: (metric) => {
 *     console.log(`${metric.name}: ${metric.value}${metric.unit}`)
 *   }
 * })
 * 
 * // 结合数据上报
 * initWebVitals({
 *   onMetric: (metric) => {
 *     // 发送到分析服务
 *     analytics.track('web-vital', {
 *       name: metric.name,
 *       value: metric.value,
 *       rating: metric.rating
 *     })
 *   }
 * })
 * ```
 */
export function initWebVitals(options: WebVitalsOptions = {}): void {
  const { enabled = true, onMetric } = options
  
  // 检查是否启用Web Vitals监控
  if (!enabled) {
    return
  }

  // 检查运行环境是否支持性能监控
  if (typeof window === 'undefined' || typeof performance === 'undefined') {
    console.warn('Web Vitals: 当前环境不支持Performance API')
    return
  }

  try {
    // 启动各项Web Vitals指标监控
    // 每个指标独立监控，互不影响
    
    // LCP - 最大内容绘制时间
    observeLCP(onMetric)
    
    // CLS - 累积布局偏移
    observeCLS(onMetric)
    
    // FID - 首次输入延迟
    observeFID(onMetric)
    
    // FCP - 首次内容绘制时间
    observeFCP(onMetric)
    
    // TTFB - 首字节响应时间
    observeTTFB(onMetric)
    
  } catch (error) {
    console.warn('Web Vitals 初始化失败:', error)
  }
}

/**
 * 监控LCP（Largest Contentful Paint）- 最大内容绘制时间
 * 
 * LCP衡量的是页面主要内容的加载性能。它标记了在视口内可见的最大元素的渲染时间点。
 * 这个指标对用户体验非常重要，因为它反映了用户何时能看到页面的主要内容。
 * 
 * @param onMetric 性能指标回调函数
 * 
 * LCP元素可能包括：
 * - <img> 元素
 * - <video> 元素的封面图
 * - 带有背景图片的块级元素
 * - 包含文本节点的块级元素
 * 
 * 评分标准：
 * - 好： ≤ 2500ms
 * - 需要改进： 2500ms - 4000ms
 * - 差： > 4000ms
 * 
 * 优化建议：
 * - 优化图片加载（使用WebP、懒加载、适当尺寸）
 * - 优化服务器响应时间
 * - 移除渲染阻塞资源
 * - 使用CDN加速资源加载
 */
function observeLCP(onMetric?: (metric: PerfMetric) => void): void {
  // 检查浏览器是否支持PerformanceObserver API
  if (!('PerformanceObserver' in window)) {
    console.warn('LCP: 浏览器不支持PerformanceObserver')
    return
  }
  
  try {
    // 创建LCP观察器
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() // 等价于performance.getEntriesByType('largest-contentful-paint')
      // LCP会随着页面加载进程更新，我们取最后一个值作为最终结果
      const lastEntry = entries[entries.length - 1]
      
      if (lastEntry) {
        const value = lastEntry.startTime
        
        // 根据Google的Web Vitals标准进行评级
        onMetric?.({
          type: 'vitals',
          name: 'LCP',
          value: Math.round(value), // 四舍五入到整数毫秒
          unit: 'ms',
          rating: value > 4000 ? 'poor' : value > 2500 ? 'needs-improvement' : 'good',
          ts: Date.now(),
          source: 'web-vitals'
        })
      }
    })
    
    // 开始观察 LCP 指标，buffered: true 表示获取历史条目
    observer.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch (error) {
    console.warn('LCP监控初始化失败:', error)
  }
}

/**
 * 监控CLS（Cumulative Layout Shift）- 累积布局偏移
 * 
 * CLS衡量的是页面布局稳定性。它量化了用户在页面生命周期内遇到的
 * 所有意外布局偏移的累积得分。低的CLS值确保用户不会因为内容突然移动而误操作。
 * 
 * @param onMetric 性能指标回调函数
 * 
 * 布局偏移的常见原因：
 * - 没有尺寸的图片
 * - 没有尺寸的广告、嵌入式内容和 iframe
 * - 动态注入的内容
 * - 导致FOIT/FOUT的Web字体
 * - 在更新DOM之前等待网络响应的操作
 * 
 * 评分标准：
 * - 好： ≤ 0.1
 * - 需要改进： 0.1 - 0.25
 * - 差： > 0.25
 * 
 * 优化建议：
 * - 始终在图片和video元素上包含尺寸属性
 * - 不要在现有内容上方插入内容
 * - 首选使用转换动画而不是触发布局偏移的属性动画
 */
function observeCLS(onMetric?: (metric: PerfMetric) => void): void {
  // 检查浏览器是否支持PerformanceObserver API
  if (!('PerformanceObserver' in window)) {
    console.warn('CLS: 浏览器不支持PerformanceObserver')
    return
  }
  
  try {
    let clsValue = 0 // 累积布局偏移值
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShiftEntry = entry as any
        
        // 只计算非用户输入引起的布局偏移
        // 用户交互后500ms内的布局偏移不计入CLS
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value
        }
      }
      
      // 每次更新都报告当前的累积值
      onMetric?.({
        type: 'vitals',
        name: 'CLS',
        value: Math.round(clsValue * 1000) / 1000, // 保瘀3位小数
        unit: 'score',
        rating: clsValue > 0.25 ? 'poor' : clsValue > 0.1 ? 'needs-improvement' : 'good',
        ts: Date.now(),
        source: 'web-vitals'
      })
    })
    
    // 开始观察布局偏移事件
    observer.observe({ type: 'layout-shift', buffered: true })
  } catch (error) {
    console.warn('CLS监控初始化失败:', error)
  }
}

/**
 * 监控FID（First Input Delay）- 首次输入延迟
 * 
 * FID衡量的是从用户首次与页面交互（点击链接、点击按钮、使用自定义控件等）
 * 到浏览器实际能够开始处理事件处理程序之间的时间。
 * 
 * @param onMetric 性能指标回调函数
 * 
 * FID只测量首次输入事件的延迟，包括：
 * - 鼠标点击
 * - 触摸屏轻触
 * - 按键操作
 * 
 * 不包括连续交互（滚动、缩放）
 * 
 * 评分标准：
 * - 好： ≤ 100ms
 * - 需要改进： 100ms - 300ms
 * - 差： > 300ms
 * 
 * 影响因素：
 * - 较大的JavaScript任务阻塞主线程
 * - 第三方代码执行时间过长
 * - JavaScript执行时间过长
 * - 过大的CSS文件
 * 
 * 优化建议：
 * - 分解长任务
 * - 优化页面以支持交互就绪
 * - 使用Web Worker处理重型任务
 * - 减少JavaScript执行时间
 */
function observeFID(onMetric?: (metric: PerfMetric) => void): void {
  // 检查浏览器是否支持PerformanceObserver API
  if (!('PerformanceObserver' in window)) {
    console.warn('FID: 浏览器不支持PerformanceObserver')
    return
  }
  
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      
      for (const entry of entries) {
        const fidEntry = entry as any
        // 计算输入延迟：从事件发生到浏览器开始处理的时间
        const value = fidEntry.processingStart - fidEntry.startTime
        
        onMetric?.({
          type: 'vitals',
          name: 'FID',
          value: Math.round(value),
          unit: 'ms',
          rating: value > 300 ? 'poor' : value > 100 ? 'needs-improvement' : 'good',
          ts: Date.now(),
          source: 'web-vitals',
          attrs: {
            processingStart: fidEntry.processingStart,
            startTime: fidEntry.startTime,
            target: fidEntry.target?.tagName // 交互目标元素
          }
        })
      }
    })
    
    // 开始观察首次输入事件
    observer.observe({ type: 'first-input', buffered: true })
  } catch (error) {
    console.warn('FID监控初始化失败:', error)
  }
}

/**
 * 监控FCP（First Contentful Paint）- 首次内容绘制时间
 * 
 * FCP衡量的是浏览器首次渲染任何文本、图像、非空白的canvas或SVG的时间点。
 * 这个指标有助于理解用户何时开始看到页面内容，是用户体验的重要指标。
 * 
 * @param onMetric 性能指标回调函数
 * 
 * FCP测量的内容包括：
 * - 文本（包括任何字体加载的文本）
 * - 图像（包括背景图像）
 * - 非空白的canvas元素
 * - SVG元素
 * 
 * 与其他指标的关系：
 * - FCP ≤ LCP（LCP是最大内容的绘制时间）
 * - FCP ≥ FP（FP是首次绘制时间）
 * 
 * 评分标准：
 * - 好： ≤ 1800ms
 * - 需要改进： 1800ms - 3000ms
 * - 差： > 3000ms
 * 
 * 优化建议：
 * - 清除阻塞渲染的资源
 * - 缩小CSS文件大小
 * - 移除未使用的CSS
 * - 预连接所需的源站
 */
function observeFCP(onMetric?: (metric: PerfMetric) => void): void {
  // 检查浏览器是否支持PerformanceObserver API
  if (!('PerformanceObserver' in window)) {
    console.warn('FCP: 浏览器不支持PerformanceObserver')
    return
  }
  
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      
      for (const entry of entries) {
        // 查找首次内容绘制事件
        if (entry.name === 'first-contentful-paint') {
          const value = entry.startTime
          
          onMetric?.({
            type: 'vitals',
            name: 'FCP',
            value: Math.round(value),
            unit: 'ms',
            rating: value > 3000 ? 'poor' : value > 1800 ? 'needs-improvement' : 'good',
            ts: Date.now(),
            source: 'web-vitals'
          })
          
          // FCP只需记录一次，找到后可以停止观察
          break
        }
      }
    })
    
    // 观察绘制事件，包括FP和FCP
    observer.observe({ type: 'paint', buffered: true })
  } catch (error) {
    console.warn('FCP监控初始化失败:', error)
  }
}

/**
 * 监控TTFB（Time to First Byte）- 首字节响应时间
 * 
 * TTFB衡量的是从用户发起请求到收到响应的第一个字节的时间。
 * 这个指标反映了服务器响应速度和网络延迟，是衡量服务器性能的关键指标。
 * 
 * @param onMetric 性能指标回调函数
 * 
 * TTFB包含的时间组成：
 * - 重定向时间（如果有）
 * - Service Worker启动时间（如果有）
 * - DNS查询时间
 * - 连接和手动时间
 * - 从请求开始到响应开始的时间
 * 
 * 评分标准：
 * - 好： ≤ 800ms
 * - 需要改进： 800ms - 1800ms  
 * - 差： > 1800ms
 * 
 * 影响因素：
 * - 服务器处理时间
 * - 数据库查询效率
 * - CDN配置
 * - 网络延迟和带宽
 * 
 * 优化建议：
 * - 使用更快的服务器
 * - 优化数据库查询
 * - 使用CDN
 * - 升级网络带宽
 */
function observeTTFB(onMetric?: (metric: PerfMetric) => void): void {
  try {
    // 获取导航性能条目
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (navEntry) {
      // TTFB = 响应开始时间 - 导航开始时间
      // 这包含了所有组件：重定向、DNS查询、连接建立、请求等待等
      const value = navEntry.responseStart - navEntry.fetchStart
      
      onMetric?.({
        type: 'vitals',
        name: 'TTFB',
        value: Math.round(value),
        unit: 'ms',
        rating: value > 1800 ? 'poor' : value > 800 ? 'needs-improvement' : 'good',
        ts: Date.now(),
        source: 'web-vitals',
        attrs: {
          fetchStart: navEntry.fetchStart,
          responseStart: navEntry.responseStart,
          // TTFB的各个组成部分
          redirectTime: navEntry.redirectEnd - navEntry.redirectStart,
          dnsLookup: navEntry.domainLookupEnd - navEntry.domainLookupStart,
          tcpConnect: navEntry.connectEnd - navEntry.connectStart,
          sslHandshake: navEntry.secureConnectionStart > 0 
            ? navEntry.connectEnd - navEntry.secureConnectionStart 
            : 0,
          requestWait: navEntry.responseStart - navEntry.requestStart,
          // 用于验证计算
          totalTTFB: navEntry.responseStart - navEntry.fetchStart
        }
      })
    } else {
      console.warn('TTFB: 无法获取导航性能数据')
    }
  } catch (error) {
    console.warn('TTFB监控初始化失败:', error)
  }
}