/**
 * @platform/sdk-perf
 * BMT 平台 SDK 性能监控模块
 * 
 * 该模块是BMT平台性能监控系统的完整实现，提供了从基础到高级的
 * 全面性能监控能力。旨在帮助开发者全面了解和优化Web应用的性能表现。
 * 
 * 核心功能特性：
 * 
 * ● Web Vitals 核心指标监控：
 *   - LCP (Largest Contentful Paint) - 最大内容绘制
 *   - CLS (Cumulative Layout Shift) - 累积布局偏移
 *   - FID (First Input Delay) - 首次输入延迟
 *   - FCP (First Contentful Paint) - 首次内容绘制
 *   - TTFB (Time to First Byte) - 首字节响应时间
 * 
 * ● 全面的Performance Observer监控：
 *   - 导航性能分析（DNS、TCP、SSL、请求响应等各阶段）
 *   - 资源加载性能监控（脚本、样式、图片、字体等）
 *   - 长任务检测和分析（>50ms的阻塞任务）
 *   - 内存使用监控和泄漏检测
 * 
 * ● 用户自定义性能标记：
 *   - User Timing API 封装（mark、measure、clear等）
 *   - 灵活的性能标记和测量功能
 *   - 支持复杂业务流程的性能分析
 * 
 * ● 高级性能指标：
 *   - FPS（帧率）实时监控
 *   - 用户交互响应性分析
 *   - 网络质量和设备信息检测
 *   - 页面生命周期和可见性监控
 * 
 * 技术特性：
 * - 模块化设计，支持按需加载
 * - 完善的TypeScript支持
 * - 高度可配置和可扩展
 * - 低性能影响设计
 * - 支持现代浏览器和Node.js环境
 * - 完善的错误处理和容错机制
 * 
 * @version 1.0.0
 * @author BMT Platform Team
 * @license MIT
 */

// 导出所有性能监控相关类型定义
export type * from './types.js'

// 导出性能监控主入口类和相关类型
// Perf 类是整个性能监控系统的统一入口，提供了初始化、配置和管理所有监控功能的能力
export { Perf } from './perf.js'
export type { PerfOptions, PerfMetric } from './perf.js'

// 导出Web Vitals核心指标监控相关函数和类型
// initWebVitals 用于独立初始化Web Vitals监控，适用于只需要核心指标的场景
export { initWebVitals } from './web-vitals.js'
export type { WebVitalsOptions } from './web-vitals.js'

// 导出 Performance Observer 相关函数和类型
// createPerformanceObserver 用于创建自定义的性能观察器，支持灵活的性能条目监控
export { createPerformanceObserver } from './performance-observer.js'
export type { PerformanceObserverOptions } from './performance-observer.js'

// 导出User Timing API相关函数
// 这些函数对浏览器原生User Timing API进行了封装，提供了更安全和便捷的性能标记和测量功能
export { 
  mark,              // 创建性能标记
  measure,           // 创建性能测量
  clearMarks,        // 清除性能标记
  clearMeasures,     // 清除性能测量
  getEntriesByName,  // 按名称查询性能条目
  getEntriesByType   // 按类型查询性能条目
} from './user-timing.js'

// 导出高级性能指标监控相关函数和类型
// 这些是超越基础Web Vitals的高级性能监控功能，适用于深入的性能分析和问题诊断
export { 
  startAdvancedMetrics,         // 启动全面的高级性能指标监控
  monitorCriticalRenderingPath, // 监控关键渲染路径和阻塞资源
  startMemoryLeakDetection      // 启动内存泄漏检测（仅在需要时使用）
} from './advanced-metrics.js'
export type { AdvancedMetricsOptions } from './advanced-metrics.js'

// 导出扩展性能数据类型
// 这些类型定义了各种具体的性能数据结构，方便开发者进行类型安全的数据处理
export type { 
  NavigationMetrics,  // 导航性能数据结构（DNS、TCP、请求响应等各阶段耗时）
  ResourceMetrics,    // 资源加载性能数据结构（大小、类型、缓存状态等）
  MemoryMetrics,      // 内存使用数据结构（已用、总量、限制等）
  LongTaskMetrics,    // 长任务性能数据结构（持续时间、阻塞时间等）
  PerfThresholds      // 性能指标阈值配置（用于自定义评级标准）
} from './types.js'