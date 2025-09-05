# @wfynbzlx666/sdk-perf

> 🚀 BMT 平台性能监控 SDK - 全面的 Web 性能监控解决方案

[![npm version](https://img.shields.io/npm/v/@wfynbzlx666/sdk-perf.svg)](https://www.npmjs.com/package/@wfynbzlx666/sdk-perf)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## 📋 目录

- [简介](#简介)
- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [最小可用用例](#最小可用用例)
- [API 详细说明](#api-详细说明)
- [高级用法](#高级用法)
- [性能指标说明](#性能指标说明)
- [配置参考](#配置参考)
- [浏览器兼容性](#浏览器兼容性)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

## 📖 简介

`@wfynbzlx666/sdk-perf` 是 BMT 平台提供的前端性能监控 SDK，为 Web 应用提供全面、精确的性能监控能力。它整合了 Web Vitals、Performance Observer、高级性能指标等多种监控技术，帮助开发者深入了解和优化应用性能。

### 🎯 设计目标

- **全面覆盖**：从基础 Web Vitals 到高级性能指标的完整监控
- **低性能开销**：智能采样和异步处理，最小化对应用性能的影响
- **易于集成**：简单的 API 设计，支持各种集成方式
- **生产就绪**：经过大规模验证，适合生产环境使用
- **高度可配置**：灵活的配置选项，满足不同场景需求

## ✨ 功能特性

### 🌟 核心功能

#### Web Vitals 监控
- **LCP** (Largest Contentful Paint) - 最大内容绘制
- **FID** (First Input Delay) - 首次输入延迟  
- **CLS** (Cumulative Layout Shift) - 累积布局偏移
- **FCP** (First Contentful Paint) - 首次内容绘制
- **TTFB** (Time to First Byte) - 首字节响应时间
- **INP** (Interaction to Next Paint) - 交互到下次绘制

#### 详细性能分析
- **导航性能**：DNS 查询、TCP 连接、SSL 握手、请求响应等各阶段耗时
- **资源加载**：脚本、样式、图片、字体等资源的加载性能监控
- **长任务监控**：检测超过 50ms 的阻塞任务
- **内存监控**：JavaScript 堆内存使用情况

#### 高级性能指标
- **FPS 监控**：实时帧率监控，评估渲染性能
- **交互性分析**：用户交互响应时间监控
- **网络质量**：连接类型、带宽、延迟等网络信息
- **设备信息**：CPU 核心数、内存大小、屏幕信息等
- **内存泄漏检测**：通过趋势分析识别潜在内存泄漏

#### 用户自定义监控
- **性能标记**：User Timing API 封装，创建自定义时间戳
- **性能测量**：精确测量代码执行时间
- **灵活查询**：按名称或类型查询性能数据

### 💡 技术特性

- **🔧 模块化设计**：按需加载，减少包体积
- **⚡ 异步处理**：不阻塞主线程
- **🎯 智能采样**：可配置采样率，平衡数据质量和性能
- **🛡️ 异常安全**：完善的错误处理和容错机制
- **🧹 自动清理**：完善的资源管理和清理机制
- **📱 响应式**：支持桌面和移动设备
- **🌐 跨浏览器**：兼容所有现代浏览器

## 🚀 快速开始

### 安装

```bash
# 使用 npm
npm install @wfynbzlx666/sdk-perf

# 使用 yarn
yarn add @wfynbzlx666/sdk-perf

# 使用 pnpm
pnpm add @wfynbzlx666/sdk-perf
```

### 基础使用

```typescript
import { Perf } from '@wfynbzlx666/sdk-perf'

// 初始化性能监控
Perf.init({
  // 回调函数，处理性能数据
  onMetric: (metric) => {
    console.log('性能指标:', metric)
    // 这里可以将数据发送到分析平台
  }
})
```

## 🎮 最小可用用例

### 1. 基础 Web Vitals 监控

最简单的用法，只监控核心 Web Vitals 指标：

```typescript
import { Perf } from '@wfynbzlx666/sdk-perf'

// 最小配置
Perf.init({
  onMetric: (metric) => {
    if (metric.type === 'vitals') {
      console.log(`${metric.name}: ${metric.value}${metric.unit} (${metric.rating})`)
      // 输出示例: LCP: 1500ms (good)
    }
  }
})
```

**说明**：
- 自动监控 LCP、FID、CLS、FCP、TTFB 等核心指标
- 每个指标都有 `good`、`needs-improvement`、`poor` 的评级
- 无需任何额外配置即可获得完整的 Web Vitals 数据

### 2. 用户交互性能监控

监控用户操作的响应时间：

```typescript
import { Perf } from '@wfynbzlx666/sdk-perf'

// 初始化
Perf.init({
  onMetric: (metric) => {
    console.log(`${metric.type}/${metric.name}: ${metric.value}${metric.unit}`)
  }
})

// 在用户操作时添加性能标记
document.getElementById('searchBtn').addEventListener('click', async () => {
  // 标记搜索开始
  Perf.mark('search-start')
  
  try {
    // 执行搜索逻辑
    const results = await searchAPI.query(searchTerm)
    
    // 标记搜索结束并测量时间
    Perf.mark('search-end')
    Perf.measure('search-duration', 'search-start', 'search-end')
    
    renderResults(results)
  } catch (error) {
    console.error('搜索失败:', error)
  }
})
```

**说明**：
- 使用 `mark()` 创建时间戳标记关键时刻
- 使用 `measure()` 计算两个时间点之间的持续时间
- 性能测量结果会自动通过 `onMetric` 回调返回

### 3. 页面加载性能分析

详细分析页面加载各个阶段的耗时：

```typescript
import { Perf } from '@wfynbzlx666/sdk-perf'

Perf.init({
  onMetric: (metric) => {
    // 根据指标类型进行不同处理
    switch (metric.type) {
      case 'navigation':
        console.log(`导航指标 - ${metric.name}: ${metric.value}ms`)
        break
      case 'resource':
        console.log(`资源加载 - ${metric.name}: ${metric.value}ms`)
        if (metric.attrs?.cached) {
          console.log('  ✅ 缓存命中')
        }
        break
      case 'vitals':
        console.log(`Web Vitals - ${metric.name}: ${metric.value}${metric.unit} (${metric.rating})`)
        break
    }
  }
})

// 页面加载完成后获取完整性能快照
window.addEventListener('load', () => {
  setTimeout(() => {
    const snapshot = Perf.getPerformanceSnapshot()
    console.log('性能快照:', {
      loadTime: snapshot.navigation.loadComplete + 'ms',
      domReady: snapshot.navigation.domContentLoaded + 'ms',
      memoryUsage: snapshot.memory.usagePercent + '%'
    })
  }, 1000) // 等待1秒确保所有指标都已收集
})
```

**说明**：
- 自动收集页面导航的各个阶段耗时（DNS、TCP、SSL、请求响应等）
- 监控所有资源（JS、CSS、图片等）的加载性能
- 通过 `getPerformanceSnapshot()` 获取完整的性能数据概览

### 4. 组件性能监控

监控 React/Vue 组件的渲染性能：

```typescript
import { Perf } from '@wfynbzlx666/sdk-perf'

// 初始化性能监控
Perf.init({
  sampleRate: 0.1, // 10% 采样率，适合生产环境
  onMetric: (metric) => {
    if (metric.type === 'measure') {
      // 只关注组件相关的测量
      if (metric.name.startsWith('component-')) {
        sendToAnalytics(metric)
      }
    }
  }
})

// React 组件示例
function UserProfile({ userId }) {
  React.useEffect(() => {
    Perf.mark('component-profile-mount-start')
    
    // 组件挂载完成
    return () => {
      Perf.mark('component-profile-mount-end')
      Perf.measure('component-profile-mount', 'component-profile-mount-start', 'component-profile-mount-end')
    }
  }, [])
  
  React.useEffect(() => {
    if (userId) {
      Perf.mark('component-profile-data-fetch-start')
      
      fetchUserData(userId).then(() => {
        Perf.mark('component-profile-data-fetch-end')
        Perf.measure('component-profile-data-fetch', 'component-profile-data-fetch-start', 'component-profile-data-fetch-end')
      })
    }
  }, [userId])
  
  return <div>用户资料...</div>
}
```

**说明**：
- 使用采样率控制性能监控的频率，避免过度监控
- 在组件生命周期的关键节点添加性能标记
- 使用统一的命名规范便于数据分析和过滤

### 5. 生产环境配置

适合生产环境的完整配置示例：

```typescript
import { Perf } from '@wfynbzlx666/sdk-perf'

// 生产环境配置
Perf.init({
  // 低采样率，减少性能影响
  sampleRate: 0.05, // 5% 采样
  
  // 启用关键监控功能
  enableDetailedMonitoring: true,
  enableAdvancedMetrics: false, // 生产环境可关闭高级指标
  enableMemoryLeakDetection: false, // 仅在需要时开启
  
  // 自定义阈值
  thresholds: {
    lcp: { good: 2000, poor: 4000 },
    fid: { good: 100, poor: 300 },
    cls: { good: 0.1, poor: 0.25 }
  },
  
  // 处理性能数据
  onMetric: (metric) => {
    // 只上报重要指标，减少数据传输
    if (shouldReportMetric(metric)) {
      sendToAnalytics({
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        timestamp: metric.ts,
        userAgent: navigator.userAgent.substring(0, 200), // 限制长度
        url: location.pathname
      })
    }
  }
})

// 判断是否应该上报指标
function shouldReportMetric(metric) {
  // 只上报 Web Vitals 和重要的自定义指标
  if (metric.type === 'vitals') return true
  if (metric.type === 'navigation' && ['ttfb', 'load-complete'].includes(metric.name)) return true
  if (metric.type === 'measure' && metric.name.startsWith('critical-')) return true
  
  return false
}

// 错误处理
function sendToAnalytics(data) {
  try {
    // 异步发送，不阻塞主线程
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true // 确保页面卸载时数据也能发送
    }).catch(error => {
      console.warn('性能数据上报失败:', error)
    })
  } catch (error) {
    console.warn('性能数据处理失败:', error)
  }
}

// 页面卸载时的清理
window.addEventListener('beforeunload', () => {
  Perf.stop() // 清理所有监控资源
})
```

**说明**：
- 使用低采样率（5%）平衡数据质量和性能影响
- 有选择性地上报指标，减少网络传输和存储成本
- 使用异步发送和错误处理确保稳定性
- 在页面卸载时正确清理资源

### 6. 开发环境调试

开发环境的详细监控配置：

```typescript
import { Perf } from '@wfynbzlx666/sdk-perf'

// 开发环境配置
if (process.env.NODE_ENV === 'development') {
  Perf.init({
    sampleRate: 1.0, // 100% 采样，获取完整数据
    enableDetailedMonitoring: true,
    enableAdvancedMetrics: true,
    enableMemoryLeakDetection: true,
    
    onMetric: (metric) => {
      // 开发环境详细日志
      console.group(`🔍 性能指标: ${metric.type}/${metric.name}`)
      console.log('数值:', metric.value + (metric.unit || ''))
      console.log('评级:', metric.rating || 'N/A')
      console.log('时间戳:', new Date(metric.ts).toISOString())
      if (metric.attrs) {
        console.log('附加属性:', metric.attrs)
      }
      console.groupEnd()
      
      // 性能警告
      if (metric.rating === 'poor') {
        console.warn(`⚠️ 性能问题: ${metric.name} 指标表现较差`)
      }
    }
  })
  
  // 开发工具集成
  window.__PERF_DEBUG__ = {
    getSnapshot: () => Perf.getPerformanceSnapshot(),
    collectAll: () => Perf.collectAllMetrics(),
    isInitialized: () => Perf.isInitialized(),
    getConfig: () => Perf.getOptions()
  }
  
  console.log('🚀 性能监控已启动 (开发模式)')
  console.log('使用 window.__PERF_DEBUG__ 进行调试')
}
```

**说明**：
- 开发环境使用 100% 采样率获取完整数据
- 启用所有监控功能，包括内存泄漏检测
- 提供详细的控制台日志和调试工具
- 暴露调试接口到全局 window 对象

## 📚 API 详细说明

### 主要类和接口

#### `Perf` 类（主入口）

性能监控系统的主入口类，提供静态方法进行系统管理。

```typescript
class Perf {
  // 系统管理
  static init(options?: PerfOptions): void
  static stop(): void
  static isInitialized(): boolean
  
  // 配置管理
  static getOptions(): PerfOptions
  static getSampleRate(): number
  static shouldSample(): boolean
  
  // 性能标记和测量
  static mark(name: string): void
  static measure(name: string, startMark?: string, endMark?: string): void
  
  // 数据收集
  static observe(types: string[]): void
  static collectAllMetrics(): void
  static getPerformanceSnapshot(): Record<string, any>
}
```

##### 方法详解

**`init(options?: PerfOptions)`**

初始化性能监控系统。

```typescript
interface PerfOptions {
  sampleRate?: number                    // 采样率 (0-1)，默认 0.1
  useWorker?: boolean                    // 是否使用 Web Worker，默认 false
  thresholds?: PerfThresholds           // 性能阈值配置
  onMetric?: (metric: PerfMetric) => void // 指标回调函数
  autoEnableWebVitals?: boolean         // 自动启用 Web Vitals，默认 true
  enableDetailedMonitoring?: boolean    // 启用详细监控，默认 true
  enableAdvancedMetrics?: boolean       // 启用高级指标，默认 true
  enableMemoryLeakDetection?: boolean   // 启用内存泄漏检测，默认 false
  observeEntryTypes?: string[]          // 要监控的性能条目类型
}
```

**`mark(name: string)`**

创建性能标记，在时间轴上标记一个时间戳。

```typescript
// 标记业务流程的关键时刻
Perf.mark('user-login-start')
Perf.mark('api-request-sent')
Perf.mark('data-processed')
```

**`measure(name: string, startMark?: string, endMark?: string)`**

创建性能测量，计算两个时间点之间的持续时间。

```typescript
// 测量两个标记之间的时间
Perf.measure('login-duration', 'user-login-start', 'user-login-end')

// 测量从特定标记到当前时间
Perf.measure('processing-time', 'data-start')

// 测量从页面开始到当前时间
Perf.measure('total-time')
```

**`getPerformanceSnapshot()`**

获取当前的完整性能快照。

```typescript
const snapshot = Perf.getPerformanceSnapshot()
console.log('导航性能:', snapshot.navigation)
console.log('内存使用:', snapshot.memory)
console.log('自定义时间:', snapshot.timing)
```

#### 独立函数

**Web Vitals 监控**

```typescript
import { initWebVitals } from '@wfynbzlx666/sdk-perf'

initWebVitals({
  onMetric: (metric) => {
    console.log(`${metric.name}: ${metric.value}${metric.unit}`)
  }
})
```

**User Timing API**

```typescript
import { mark, measure, clearMarks, clearMeasures, getEntriesByName, getEntriesByType } from '@wfynbzlx666/sdk-perf'

// 创建标记和测量
mark('custom-start')
// ... 执行代码 ...
mark('custom-end')
measure('custom-duration', 'custom-start', 'custom-end')

// 查询性能条目
const measures = getEntriesByType('measure')
const specificEntry = getEntriesByName('custom-duration')

// 清理
clearMarks('custom-start')
clearMeasures('custom-duration')
```

**高级性能指标**

```typescript
import { startAdvancedMetrics, monitorCriticalRenderingPath, startMemoryLeakDetection } from '@wfynbzlx666/sdk-perf'

// 启动高级指标监控
const cleanup1 = startAdvancedMetrics({
  enableFPS: true,
  enableInteractivity: true,
  enableNetworkQuality: true,
  enableDeviceInfo: true,
  onMetric: (metric) => console.log(metric)
})

// 监控关键渲染路径
const cleanup2 = monitorCriticalRenderingPath((metric) => {
  console.log('关键资源:', metric)
})

// 内存泄漏检测
const cleanup3 = startMemoryLeakDetection((metric) => {
  console.log('内存趋势:', metric)
})

// 清理资源
cleanup1()
cleanup2()
cleanup3()
```

**Performance Observer**

```typescript
import { createPerformanceObserver } from '@wfynbzlx666/sdk-perf'

const observer = createPerformanceObserver({
  entryTypes: ['navigation', 'resource', 'longtask'],
  enableDetailedMonitoring: true,
  onMetric: (metric) => {
    console.log(`${metric.type}: ${metric.name} = ${metric.value}${metric.unit}`)
  }
})

// 停止观察
if (observer) {
  observer.disconnect()
}
```

## 🔧 高级用法

### 自定义阈值配置

```typescript
Perf.init({
  thresholds: {
    // Web Vitals 阈值
    lcp: { good: 2000, poor: 4000 },
    fid: { good: 100, poor: 300 },
    cls: { good: 0.1, poor: 0.25 },
    inp: { good: 200, poor: 500 },
    ttfb: { good: 800, poor: 1800 },
    fcp: { good: 1800, poor: 3000 },
    
    // 其他性能阈值
    longTaskMs: 50,
    resourceLoadMs: 1000,
    memoryUsageMB: 100,
    eventHandlerMs: 16
  },
  onMetric: (metric) => {
    // 根据自定义阈值进行评级
    console.log(`${metric.name}: ${metric.rating}`)
  }
})
```

### 条件监控

```typescript
// 仅在特定条件下启用监控
const shouldMonitor = () => {
  // 例如：仅在桌面端启用高级指标
  return window.innerWidth > 768
}

if (shouldMonitor()) {
  Perf.init({
    enableAdvancedMetrics: true,
    enableMemoryLeakDetection: true,
    onMetric: handleMetric
  })
}
```

### 自定义指标收集

```typescript
// 创建自定义指标
function createCustomMetric(name: string, value: number, type: string = 'custom') {
  const metric: PerfMetric = {
    type: type as any,
    name,
    value,
    ts: Date.now(),
    source: 'custom'
  }
  
  // 手动触发指标回调
  const options = Perf.getOptions()
  if (options.onMetric) {
    options.onMetric(metric)
  }
}

// 使用自定义指标
createCustomMetric('bundle-size', bundleSize, 'resource')
createCustomMetric('api-errors', errorCount, 'custom')
```

### 动态配置更新

```typescript
// 运行时动态添加监控
Perf.observe(['longtask', 'event'])

// 根据用户行为调整采样率
if (userIsVIP) {
  // VIP 用户使用更高的采样率
  Perf.stop()
  Perf.init({
    sampleRate: 0.5,
    onMetric: handleVIPMetrics
  })
}
```

## 📊 性能指标说明

### Web Vitals 核心指标

| 指标 | 描述 | 良好阈值 | 改进阈值 | 单位 |
|------|------|----------|----------|------|
| **LCP** | 最大内容绘制时间 | ≤ 2.5s | ≤ 4.0s | ms |
| **FID** | 首次输入延迟 | ≤ 100ms | ≤ 300ms | ms |
| **CLS** | 累积布局偏移 | ≤ 0.1 | ≤ 0.25 | score |
| **FCP** | 首次内容绘制 | ≤ 1.8s | ≤ 3.0s | ms |
| **TTFB** | 首字节响应时间 | ≤ 800ms | ≤ 1.8s | ms |
| **INP** | 交互到下次绘制 | ≤ 200ms | ≤ 500ms | ms |

### 导航性能指标

| 指标 | 描述 | 说明 |
|------|------|------|
| **dns-lookup** | DNS 查询时间 | 域名解析耗时 |
| **tcp-connect** | TCP 连接时间 | 建立连接耗时 |
| **ssl-handshake** | SSL 握手时间 | HTTPS 握手耗时 |
| **ttfb** | 首字节时间 | 服务器响应时间 |
| **dom-content-loaded** | DOM 加载时间 | DOM 结构构建完成 |
| **load-complete** | 页面加载完成 | 所有资源加载完成 |

### 资源性能指标

| 指标 | 描述 | 类型 |
|------|------|------|
| **script** | JavaScript 文件 | 脚本加载时间 |
| **stylesheet** | CSS 文件 | 样式表加载时间 |
| **image** | 图片资源 | 图片加载时间 |
| **font** | 字体文件 | 字体加载时间 |
| **fetch/xhr** | API 请求 | 数据请求时间 |

### 高级性能指标

| 指标 | 描述 | 单位 | 良好阈值 |
|------|------|------|----------|
| **FPS** | 帧率 | fps | ≥ 60 |
| **memory-usage** | 内存使用率 | percent | ≤ 70% |
| **network-rtt** | 网络往返时间 | ms | ≤ 100 |
| **device-memory** | 设备内存 | GB | - |
| **cpu-cores** | CPU 核心数 | cores | - |

## ⚙️ 配置参考

### 完整配置选项

```typescript
interface PerfOptions {
  // 基础配置
  sampleRate?: number                   // 采样率，0-1 之间，默认 0.1
  useWorker?: boolean                   // 是否使用 Web Worker，默认 false
  
  // 功能开关
  autoEnableWebVitals?: boolean         // 自动启用 Web Vitals，默认 true
  enableDetailedMonitoring?: boolean    // 启用详细监控，默认 true
  enableAdvancedMetrics?: boolean       // 启用高级指标，默认 true
  enableMemoryLeakDetection?: boolean   // 启用内存泄漏检测，默认 false
  
  // 监控配置
  observeEntryTypes?: string[]          // 要监控的性能条目类型
  thresholds?: PerfThresholds          // 性能阈值配置
  
  // 回调函数
  onMetric?: (metric: PerfMetric) => void // 性能指标回调
}
```

### 环境配置建议

**开发环境**
```typescript
{
  sampleRate: 1.0,
  enableDetailedMonitoring: true,
  enableAdvancedMetrics: true,
  enableMemoryLeakDetection: true
}
```

**测试环境**
```typescript
{
  sampleRate: 0.5,
  enableDetailedMonitoring: true,
  enableAdvancedMetrics: false,
  enableMemoryLeakDetection: false
}
```

**生产环境**
```typescript
{
  sampleRate: 0.05,
  enableDetailedMonitoring: true,
  enableAdvancedMetrics: false,
  enableMemoryLeakDetection: false
}
```

## 🌐 浏览器兼容性

### 支持的浏览器

| 浏览器 | 版本 | Web Vitals | Performance Observer | 高级指标 |
|--------|------|------------|---------------------|----------|
| **Chrome** | 60+ | ✅ | ✅ | ✅ |
| **Firefox** | 58+ | ✅ | ✅ | ⚠️ |
| **Safari** | 12+ | ✅ | ✅ | ⚠️ |
| **Edge** | 79+ | ✅ | ✅ | ✅ |

### 功能支持说明

- **✅ 完全支持**：所有功能正常工作
- **⚠️ 部分支持**：核心功能支持，部分高级功能可能不可用
- **❌ 不支持**：功能不可用，但不会影响应用运行

### 特性检测

SDK 内置了完善的特性检测机制，在不支持的环境中会自动降级：

```typescript
// 内置特性检测示例
if (typeof PerformanceObserver !== 'undefined') {
  // 使用 Performance Observer
} else {
  // 降级到基础 Performance API
}

if ((performance as any).memory) {
  // 支持内存监控（仅 Chrome）
} else {
  // 跳过内存相关功能
}
```

## 💡 最佳实践

### 1. 采样率设置

```typescript
// 根据环境设置不同的采样率
const getSampleRate = () => {
  if (process.env.NODE_ENV === 'development') return 1.0
  if (process.env.NODE_ENV === 'staging') return 0.5
  return 0.05 // 生产环境
}

Perf.init({
  sampleRate: getSampleRate(),
  onMetric: handleMetric
})
```

### 2. 性能预算

```typescript
// 设置性能预算，超出时发出警告
const PERFORMANCE_BUDGET = {
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  bundleSize: 250 * 1024 // 250KB
}

Perf.init({
  onMetric: (metric) => {
    const budget = PERFORMANCE_BUDGET[metric.name]
    if (budget && metric.value > budget) {
      console.warn(`⚠️ 性能预算超标: ${metric.name} = ${metric.value}, 预算: ${budget}`)
      // 发送告警
      sendAlert(`Performance budget exceeded: ${metric.name}`)
    }
  }
})
```

### 3. 智能上报

```typescript
// 避免重复上报相同数据
const reportedMetrics = new Set()

Perf.init({
  onMetric: (metric) => {
    const key = `${metric.type}-${metric.name}-${Math.floor(metric.value / 100) * 100}`
    
    // 避免上报过于相似的数据
    if (reportedMetrics.has(key)) {
      return
    }
    reportedMetrics.add(key)
    
    // 批量上报，减少网络请求
    batchReporter.add(metric)
  }
})
```

### 4. 错误处理

```typescript
// 完善的错误处理
Perf.init({
  onMetric: (metric) => {
    try {
      processMetric(metric)
    } catch (error) {
      console.warn('性能数据处理失败:', error)
      // 记录错误但不影响应用运行
      errorLogger.log('perf-processing-error', error)
    }
  }
})

// 监控初始化失败
try {
  Perf.init(perfConfig)
} catch (error) {
  console.warn('性能监控初始化失败:', error)
  // 应用继续正常运行
}
```

### 5. 内存管理

```typescript
// 及时清理资源
window.addEventListener('beforeunload', () => {
  Perf.stop() // 清理所有监控资源
})

// 单页应用路由切换时的清理
router.beforeEach(() => {
  // 停止当前页面的监控
  Perf.stop()
})

router.afterEach(() => {
  // 为新页面启动监控
  Perf.init(perfConfig)
})
```

## 🔧 故障排除

### 常见问题

#### Q: 为什么没有收到性能数据？

A: 检查以下几点：
1. 确认已正确配置 `onMetric` 回调函数
2. 检查采样率设置，过低的采样率可能导致数据稀少
3. 确认浏览器支持相关 API
4. 检查控制台是否有错误信息

```typescript
// 调试用配置
Perf.init({
  sampleRate: 1.0, // 临时提高采样率
  onMetric: (metric) => {
    console.log('收到指标:', metric) // 添加调试日志
  }
})
```

#### Q: 如何验证监控是否正常工作？

A: 使用以下方法验证：

```typescript
// 检查初始化状态
console.log('监控状态:', Perf.isInitialized())

// 手动收集指标
Perf.collectAllMetrics()

// 获取性能快照
console.log('性能快照:', Perf.getPerformanceSnapshot())

// 创建测试标记
Perf.mark('test-mark')
Perf.measure('test-measure', 'test-mark')
```

#### Q: 如何减少性能监控的开销？

A: 采用以下优化策略：

```typescript
Perf.init({
  sampleRate: 0.01, // 降低采样率
  enableAdvancedMetrics: false, // 关闭高级指标
  enableMemoryLeakDetection: false, // 关闭内存检测
  
  // 只监控关键指标
  observeEntryTypes: ['navigation', 'largest-contentful-paint', 'first-input'],
  
  onMetric: (metric) => {
    // 异步处理，避免阻塞主线程
    setTimeout(() => processMetric(metric), 0)
  }
})
```

#### Q: 如何在 SSR 环境中使用？

A: SDK 会自动检测环境，在服务端安全降级：

```typescript
// 通用配置，客户端和服务端都可用
if (typeof window !== 'undefined') {
  Perf.init(perfConfig)
} else {
  // 服务端环境，跳过初始化
  console.log('服务端环境，跳过性能监控')
}
```

### 调试技巧

#### 1. 启用详细日志

```typescript
// 开发环境启用详细日志
if (process.env.NODE_ENV === 'development') {
  Perf.init({
    sampleRate: 1.0,
    onMetric: (metric) => {
      console.group(`📊 性能指标: ${metric.name}`)
      console.table(metric)
      console.groupEnd()
    }
  })
}
```

#### 2. 性能时间线可视化

```typescript
// 在浏览器开发者工具中查看性能时间线
Perf.mark('app-start')
// ... 应用逻辑 ...
Perf.mark('app-ready')
Perf.measure('app-init-time', 'app-start', 'app-ready')

// 打开 DevTools → Performance → 查看 User Timing 部分
```

#### 3. 数据导出

```typescript
// 导出性能数据用于分析
function exportPerformanceData() {
  const data = {
    snapshot: Perf.getPerformanceSnapshot(),
    config: Perf.getOptions(),
    timestamp: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-data-${Date.now()}.json`
  a.click()
  
  URL.revokeObjectURL(url)
}

// 添加导出按钮（开发环境）
if (process.env.NODE_ENV === 'development') {
  window.__exportPerfData__ = exportPerformanceData
}
```

---

## 📝 更新日志

### v0.0.1 (2025-08-15)
- 首次发布
- 完整的 Web Vitals 监控
- erformance Observer 支持
- 高级性能指标监控
- 用户自定义性能标记
- 内存泄漏检测
- TypeScript 完整支持

### v0.0.2

### v0.0.3

### v0.0.4

### v1.0.0 (2025-9-5)
- 对整个SDK进行了一个大的优化
- web-vitals只负责LCP，FCP，FID，CLS，TTFB的监控
- 开启detailMonitoring后监测的数据不再包裹web-vitals里面的数据，防止重复监测，现在他专注于监测导航相关指标，内存泄漏监控等高级功能
---

<div align="center">

**@wfynbzlx666/sdk-perf** 由 **wfynbzlx666** 用 ❤️ 制作


</div>