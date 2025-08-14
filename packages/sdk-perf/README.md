# SDK Performance 性能监控模块

## 概述

`@bmt-central/sdk-perf` 是一个全面的Web性能监控SDK，提供Core Web Vitals监控、高级性能指标收集、用户计时API以及性能观察器等功能。

## 特性

- 🎯 **Core Web Vitals监控** - 支持LCP、CLS、FID、FCP、TTFB等关键指标
- 📊 **高级性能指标** - 内存使用、长任务、资源加载等深度分析
- ⏱️ **用户计时API** - 自定义性能标记和测量
- 🔍 **性能观察器** - 实时性能事件监控
- 📈 **数据可视化** - 性能趋势分析和报告
- 🌐 **跨浏览器兼容** - 支持主流浏览器
- 🚀 **轻量级** - 最小化性能开销

## 安装

```bash
npm install @bmt-central/sdk-perf
```

## 快速开始

### 基础用法

```typescript
import { initWebVitals, initPerformanceMonitor } from '@bmt-central/sdk-perf'

// 初始化 Web Vitals 监控
initWebVitals({
  onMetric: (metric) => {
    console.log(`${metric.name}: ${metric.value}${metric.unit}`)
    // 发送到分析服务
    analytics.track('web-vital', metric)
  }
})

// 初始化性能监控
const monitor = initPerformanceMonitor({
  enableResourceTiming: true,
  enableLongTaskMonitoring: true,
  enableMemoryMonitoring: true
})
```

### 自定义监控

```typescript
import { createUserTiming, observePerformance } from '@bmt-central/sdk-perf'

// 自定义性能标记
const timing = createUserTiming()
timing.mark('api-start')
await fetchData()
timing.mark('api-end')
timing.measure('api-duration', 'api-start', 'api-end')

// 自定义性能观察
observePerformance({
  entryTypes: ['navigation', 'resource', 'paint'],
  onEntry: (entry) => {
    console.log('Performance entry:', entry)
  }
})
```

## 为什么您的Web Vitals数据与Lighthouse不同？

### 重要说明：实验室数据 vs 现场数据

在使用本SDK时，您可能会发现收集到的FCP、LCP等指标与Chrome开发者工具中Lighthouse的结果存在差异。这是**完全正常**的现象，主要原因如下：

#### 1. 数据类型的根本差异

| 对比项 | 本SDK（现场数据） | Lighthouse（实验室数据） |
|--------|------------------|-------------------------|
| **数据来源** | 真实用户访问时的实际性能 | 受控环境下的模拟测试 |
| **测量环境** | 用户的真实设备和网络 | 预定义的设备和网络条件 |
| **数据变异性** | 高（反映真实世界的多样性） | 低（可重复的受控测试） |
| **优化目标** | 改善真实用户体验 | 识别性能问题和优化机会 |

#### 2. 具体差异原因

##### 🎯 **LCP（最大内容绘制）差异**

```typescript
// 本SDK的LCP测量 - 反映真实用户体验
const observer = new PerformanceObserver((list) => {
  const entries = list.getEntries()
  const lastEntry = entries[entries.length - 1]
  
  if (lastEntry) {
    const value = lastEntry.startTime // 真实环境下的LCP时间
    onMetric?.({
      name: 'LCP',
      value: Math.round(value),
      rating: value > 4000 ? 'poor' : value > 2500 ? 'needs-improvement' : 'good'
    })
  }
})
```

**差异原因：**
- **LCP元素不同**：不同屏幕尺寸、个性化内容、A/B测试可能导致不同的LCP元素
- **缓存状态**：真实用户可能有缓存，而Lighthouse通常使用冷缓存
- **用户交互影响**：用户快速交互会停止LCP更新，可能得到更好的数值
- **网络条件**：真实用户的网络条件千差万别

##### 🎨 **FCP（首次内容绘制）差异**

```typescript
// 本SDK的FCP测量
observer.observe({ type: 'paint', buffered: true })

for (const entry of entries) {
  if (entry.name === 'first-contentful-paint') {
    const value = entry.startTime // 真实浏览器环境的FCP
    onMetric?.({
      name: 'FCP',
      value: Math.round(value),
      rating: value > 3000 ? 'poor' : value > 1800 ? 'needs-improvement' : 'good'
    })
  }
}
```

**差异原因：**
- **资源加载优化**：浏览器缓存、HTTP/2推送、预加载等真实优化
- **设备性能**：真实设备的CPU、GPU性能差异
- **网络变化**：动态网络条件vs固定的网络模拟

##### 📐 **CLS（累积布局偏移）差异**

```typescript
// 本SDK的CLS测量 - 包含完整用户会话
let clsValue = 0
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) {
      clsValue += entry.value // 累积真实的布局偏移
    }
  }
})
```

**差异原因：**
- **测量范围**：Lighthouse只测量加载期间，本SDK测量整个会话
- **个性化内容**：广告、推荐内容等动态内容影响
- **字体加载**：真实字体缓存状态的影响

#### 3. 如何正确理解和使用这些差异

##### 📊 **数据优先级建议**

1. **现场数据（本SDK）优先**：反映真实用户体验，是优化的主要目标
2. **实验室数据（Lighthouse）辅助**：用于问题诊断和优化验证

##### 🔧 **实用策略**

```typescript
// 增强的监控配置
initWebVitals({
  onMetric: (metric) => {
    // 添加环境上下文
    const enhancedMetric = {
      ...metric,
      context: {
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        connection: navigator.connection?.effectiveType,
        deviceMemory: navigator.deviceMemory,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        // 检测测试环境
        isLighthouse: navigator.userAgent.includes('Chrome-Lighthouse'),
        isSyntheticTest: window.name === 'lighthouse'
      }
    }
    
    // 发送到分析服务
    sendToAnalytics(enhancedMetric)
  }
})
```

##### 📈 **数据分析建议**

```typescript
// 数据分段分析
function analyzeMetrics(metrics) {
  const segments = {
    mobile: metrics.filter(m => m.context.viewport.width < 768),
    desktop: metrics.filter(m => m.context.viewport.width >= 768),
    slow3G: metrics.filter(m => m.context.connection === 'slow-2g'),
    fast4G: metrics.filter(m => m.context.connection === '4g'),
    cached: metrics.filter(m => m.context.isCacheHit),
    fresh: metrics.filter(m => !m.context.isCacheHit)
  }
  
  // 分别分析不同条件下的性能
  return segments
}
```

#### 4. 最佳实践建议

##### ✅ **正确的心态**
- 现场数据反映真实情况，是优化的最终目标
- 实验室数据帮助发现和诊断问题
- 两者结合使用，获得完整的性能视图

##### 🎯 **优化策略**
- 如果现场数据良好但实验室数据差：考虑支持更多边缘情况用户
- 如果实验室数据良好但现场数据差：重点关注真实用户问题
- 定期对比两种数据，识别优化机会

##### 📝 **监控建议**
- 设置现场数据监控告警
- 定期运行实验室测试验证优化效果
- 按用户群体细分性能数据
- 关注性能趋势而非单次测量

### 性能指标解读

#### Core Web Vitals 标准

| 指标 | 良好 | 需改进 | 差 | 描述 |
|------|------|--------|----|----|
| **LCP** | ≤ 2.5s | 2.5s - 4.0s | > 4.0s | 最大内容绘制时间 |
| **FID** | ≤ 100ms | 100ms - 300ms | > 300ms | 首次输入延迟 |
| **CLS** | ≤ 0.1 | 0.1 - 0.25 | > 0.25 | 累积布局偏移 |
| **FCP** | ≤ 1.8s | 1.8s - 3.0s | > 3.0s | 首次内容绘制 |
| **TTFB** | ≤ 800ms | 800ms - 1.8s | > 1.8s | 首字节时间 |

## API 参考

### Web Vitals

#### `initWebVitals(options)`

初始化Web Vitals监控。

```typescript
interface WebVitalsOptions {
  enabled?: boolean
  onMetric?: (metric: PerfMetric) => void
}
```

### 高级监控

#### `initPerformanceMonitor(options)`

初始化高级性能监控。

```typescript
interface PerformanceMonitorOptions {
  enableResourceTiming?: boolean
  enableLongTaskMonitoring?: boolean  
  enableMemoryMonitoring?: boolean
  enableNavigationTiming?: boolean
  sampleRate?: number
}
```

### 用户计时

#### `createUserTiming()`

创建用户计时实例。

```typescript
const timing = createUserTiming()
timing.mark(name: string)
timing.measure(name: string, startMark?: string, endMark?: string)
timing.clearMarks(name?: string)
timing.clearMeasures(name?: string)
```

### 性能观察器

#### `observePerformance(options)`

创建性能观察器。

```typescript
interface ObserverOptions {
  entryTypes: string[]
  onEntry: (entry: PerformanceEntry) => void
  buffered?: boolean
}
```

## 浏览器兼容性

| 特性 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| Web Vitals | 77+ | ❌ | ❌ | 79+ |
| Performance Observer | 52+ | 57+ | 11+ | 79+ |
| Navigation Timing | 57+ | 58+ | 11+ | 79+ |
| Resource Timing | 43+ | 35+ | 11+ | 12+ |
| User Timing | 25+ | 38+ | 11+ | 12+ |

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解详细的更新历史。