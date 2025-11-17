# @wfynbzlx666/sdk-perf

> 🚀 浏览器端性能监控 SDK - Web Vitals、Performance Observer

[![npm version](https://img.shields.io/npm/v/@wfynbzlx666/sdk-perf.svg)](https://www.npmjs.com/package/@wfynbzlx666/sdk-perf)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

---

## ⚠️ 重要升级说明（v1.0.4）

### 致用户的说明和道歉

非常抱歉给您带来的不便！我们在 v3.0.0 版本中进行了重大重构，以解决之前版本存在的严重问题：

#### 🔴 之前版本的问题

在 v2.x 版本中，我们将浏览器端功能和 Node.js 端功能（Puppeteer + Lighthouse 性能审计）打包在同一个包中，这导致了：

- ❌ **无法在浏览器中使用**：因为包含了 Puppeteer 和 Lighthouse 依赖
- ❌ **包体积巨大**：Puppeteer 约 300MB，即使不使用审计功能也必须安装
- ❌ **安装缓慢**：下载和安装依赖耗时很长
- ❌ **Web Vitals 仅适用于 MPA**：在 SPA 中无法正确监控路由切换后的性能

#### ✅ v1.0.4 的改进

我们已经将包拆分为两个独立的包：

1. **`@wfynbzlx666/sdk-perf@1.0.4`**（当前包）

   - ✅ 纯浏览器端性能监控
   - ✅ 移除所有 Node.js 依赖
   - ✅ 可以在浏览器中正常使用
   - ⚠️ **Web Vitals 功能仅适用于 MPA（多页应用）**
2. **`@wfynbzlx666/sdk-perf-spa`**（推荐 SPA 使用）

   - 🆕 专为 SPA（单页应用）设计
   - ✅ 支持路由切换后的性能监控
   - ✅ 正确处理 SPA 场景下的 Web Vitals
   - ✅ 轻量级，无 Node.js 依赖

---

### 📌 MPA vs SPA - 如何选择？

#### 什么是 MPA（多页应用）？

多页应用是传统的 Web 应用架构，每次导航都会重新加载完整的 HTML 页面。

**特征：**

- ✅ 每个页面都有独立的 URL
- ✅ 页面切换时会刷新整个页面
- ✅ 浏览器地址栏会重新加载
- ✅ 典型技术：传统 HTML、PHP、Django、Rails、JSP 等

**示例：**

```
https://example.com/index.html  → 加载 index.html
https://example.com/about.html  → 完整刷新，加载 about.html
https://example.com/contact.html → 完整刷新，加载 contact.html
```

#### 什么是 SPA（单页应用）？

单页应用只加载一次 HTML，后续页面切换通过 JavaScript 动态更新 DOM，不刷新整个页面。

**特征：**

- ✅ 使用前端路由（React Router、Vue Router、Angular Router）
- ✅ 页面切换时不刷新，只更新部分内容
- ✅ 地址栏 URL 改变但页面不重新加载
- ✅ 典型技术：React、Vue、Angular、Svelte 等

**示例：**

```
https://example.com/          → 加载 index.html（包含完整应用）
https://example.com/#/about   → JavaScript 更新 DOM，不刷新页面
https://example.com/#/contact → JavaScript 更新 DOM，不刷新页面
```

#### 如何判断我的应用是 MPA 还是 SPA？

**简单测试：**

1. 打开浏览器开发者工具 → Network 标签
2. 点击应用中的导航链接
3. 观察 Network 标签：
   - 如果看到 **整个 HTML 文档重新加载** → MPA
   - 如果 **只有 XHR/Fetch 请求，没有 HTML 加载** → SPA

#### 选择正确的包

| 应用类型                  | 推荐包                        | 说明                        |
| ------------------------- | ----------------------------- | --------------------------- |
| **MPA（多页应用）** | `@wfynbzlx666/sdk-perf`     | 当前包，适用于传统多页应用  |
| **SPA（单页应用）** | `@wfynbzlx666/sdk-perf-spa` | 专为 SPA 设计，支持路由监控 |
| **混合应用**        | `@wfynbzlx666/sdk-perf-spa` | 使用 SPA 版本以确保兼容性   |

---

### 🔄 迁移指南

#### 从 v2.x 迁移到 v3.0.0

##### 1. MPA 应用（无需修改代码）

如果您的应用是传统的多页应用，只需更新依赖版本：

```bash
# 更新到最新版本
npm install @wfynbzlx666/sdk-perf@^3.0.0
```

代码无需任何修改：

```typescript
// 完全兼容，无需修改
import { Perf } from '@wfynbzlx666/sdk-perf'

Perf.init({
  onMetric: (metric) => console.log(metric)
})
```

##### 2. SPA 应用（切换到 SPA 包）

如果您的应用是单页应用（React、Vue、Angular 等），请切换到 SPA 专用包：

```bash
# 卸载旧包
npm uninstall @wfynbzlx666/sdk-perf

# 安装 SPA 专用包
npm install @wfynbzlx666/sdk-perf-spa
```

更新代码导入：

```typescript
// 之前
import { Perf } from '@wfynbzlx666/sdk-perf'

// 现在
import { Perf } from '@wfynbzlx666/sdk-perf-spa'

// API 完全相同，无需修改其他代码
Perf.init({
  onMetric: (metric) => console.log(metric)
})
```

##### 3. 使用审计功能（功能已移除）

如果您之前使用了性能审计功能（Puppeteer + Lighthouse），该功能已从当前包中移除：

```typescript
// ❌ v2.x 中可用，v3.x 已移除
import { auditPages, generateReport } from '@wfynbzlx666/sdk-perf'
```

**替代方案：**

- 直接使用 [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse)
- 使用 [Puppeteer](https://pptr.dev/) + [Lighthouse 库](https://github.com/GoogleChrome/lighthouse)
- 或等待我们后续推出的独立审计工具包

---

## 📖 简介

`@wfynbzlx666/sdk-perf` 是为 MPA（多页应用）设计的浏览器端性能监控 SDK，提供：

- ✅ Web Vitals 核心指标监控（LCP、FID、CLS、FCP、TTFB）
- ✅ Performance Observer 详细性能分析
- ✅ 用户自定义性能标记和测量
- ✅ 高级性能指标（FPS、内存、网络质量等）
- ✅ 低性能开销，生产环境可用
- ✅ 完整的 TypeScript 支持

### ⚠️ 重要提示

- 此包 **仅支持浏览器环境**
- Web Vitals 功能 **仅适用于 MPA（多页应用）**
- 如果您的应用是 **SPA（单页应用）**，请使用 `@wfynbzlx666/sdk-perf-spa`

---

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
  onMetric: (metric) => {
    console.log('性能指标:', metric)
    // 将数据发送到分析平台
  }
})
```

---

## ✨ 功能特性

### 🌟 核心功能

#### Web Vitals 监控（仅 MPA）

- **LCP** (Largest Contentful Paint) - 最大内容绘制
- **FID** (First Input Delay) - 首次输入延迟
- **CLS** (Cumulative Layout Shift) - 累积布局偏移
- **FCP** (First Contentful Paint) - 首次内容绘制
- **TTFB** (Time to First Byte) - 首字节响应时间

#### 详细性能分析

- **导航性能**：DNS 查询、TCP 连接、SSL 握手、请求响应等各阶段耗时
- **资源加载**：脚本、样式、图片、字体等资源的加载性能监控
- **长任务监控**：检测超过 50ms 的阻塞任务
- **内存监控**：JavaScript 堆内存使用情况

#### 高级性能指标

- **FPS 监控**：实时帧率监控
- **交互性分析**：用户交互响应时间
- **网络质量**：连接类型、带宽、延迟
- **设备信息**：CPU 核心数、内存大小
- **内存泄漏检测**：趋势分析识别潜在问题

#### 用户自定义监控

- **性能标记**：User Timing API 封装
- **性能测量**：精确测量代码执行时间
- **灵活查询**：按名称或类型查询性能数据

---

## 📚 API 文档

### Perf 类（主入口）

```typescript
class Perf {
  // 系统管理
  static init(options?: PerfOptions): void
  static stop(): void
  static isInitialized(): boolean
  
  // 性能标记和测量
  static mark(name: string): void
  static measure(name: string, startMark?: string, endMark?: string): void
  
  // 数据收集
  static collectAllMetrics(): void
  static getPerformanceSnapshot(): Record<string, any>
}
```

### 配置选项

```typescript
interface PerfOptions {
  sampleRate?: number                    // 采样率 (0-1)，默认 0.1
  onMetric?: (metric: PerfMetric) => void // 指标回调函数
  autoEnableWebVitals?: boolean         // 自动启用 Web Vitals，默认 true
  enableDetailedMonitoring?: boolean    // 启用详细监控，默认 true
  enableAdvancedMetrics?: boolean       // 启用高级指标，默认 true
  enableMemoryLeakDetection?: boolean   // 启用内存泄漏检测，默认 false
  observeEntryTypes?: string[]          // 要监控的性能条目类型
}
```

---

## 🎮 使用示例

### 基础 Web Vitals 监控

```typescript
import { Perf } from '@wfynbzlx666/sdk-perf'

Perf.init({
  onMetric: (metric) => {
    if (metric.type === 'vitals') {
      console.log(`${metric.name}: ${metric.value}${metric.unit} (${metric.rating})`)
    }
  }
})
```

### 用户交互性能监控

```typescript
import { Perf } from '@wfynbzlx666/sdk-perf'

Perf.init({
  onMetric: (metric) => console.log(metric)
})

// 监控搜索性能
document.getElementById('searchBtn').addEventListener('click', async () => {
  Perf.mark('search-start')
  
  const results = await searchAPI.query(searchTerm)
  
  Perf.mark('search-end')
  Perf.measure('search-duration', 'search-start', 'search-end')
})
```

### 生产环境配置

```typescript
import { Perf } from '@wfynbzlx666/sdk-perf'

Perf.init({
  sampleRate: 0.05, // 5% 采样
  enableDetailedMonitoring: true,
  enableAdvancedMetrics: false,
  enableMemoryLeakDetection: false,
  
  onMetric: (metric) => {
    if (shouldReportMetric(metric)) {
      sendToAnalytics(metric)
    }
  }
})

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  Perf.stop()
})
```

---

## 📊 性能指标说明

### Web Vitals 核心指标

| 指标           | 描述             | 良好阈值 | 改进阈值 | 单位  |
| -------------- | ---------------- | -------- | -------- | ----- |
| **LCP**  | 最大内容绘制时间 | ≤ 2.5s  | ≤ 4.0s  | ms    |
| **FID**  | 首次输入延迟     | ≤ 100ms | ≤ 300ms | ms    |
| **CLS**  | 累积布局偏移     | ≤ 0.1   | ≤ 0.25  | score |
| **FCP**  | 首次内容绘制     | ≤ 1.8s  | ≤ 3.0s  | ms    |
| **TTFB** | 首字节响应时间   | ≤ 800ms | ≤ 1.8s  | ms    |

---

## 🌐 浏览器兼容性

| 浏览器            | 版本 | Web Vitals | Performance Observer | 高级指标 |
| ----------------- | ---- | ---------- | -------------------- | -------- |
| **Chrome**  | 60+  | ✅         | ✅                   | ✅       |
| **Firefox** | 58+  | ✅         | ✅                   | ⚠️     |
| **Safari**  | 12+  | ✅         | ✅                   | ⚠️     |
| **Edge**    | 79+  | ✅         | ✅                   | ✅       |

---

## 💡 最佳实践

### 1. 根据环境设置采样率

```typescript
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

### 2. 避免重复上报

```typescript
const reportedMetrics = new Set()

Perf.init({
  onMetric: (metric) => {
    const key = `${metric.type}-${metric.name}`
    if (reportedMetrics.has(key)) return
  
    reportedMetrics.add(key)
    sendToAnalytics(metric)
  }
})
```

### 3. 及时清理资源

```typescript
window.addEventListener('beforeunload', () => {
  Perf.stop()
})
```

---

## 🔧 故障排除

### Q: 为什么没有收到性能数据？

A: 检查以下几点：

1. 确认已正确配置 `onMetric` 回调函数
2. 检查采样率设置
3. 确认浏览器支持相关 API
4. 检查控制台是否有错误信息

### Q: 在 SPA 中使用出现问题？

A: 请使用 `@wfynbzlx666/sdk-perf-spa` 包，该包专为 SPA 设计。

### Q: 如何在 SSR 环境中使用？

A: 只在客户端初始化：

```typescript
if (typeof window !== 'undefined') {
  Perf.init(perfConfig)
}
```

---

## 📦 相关包

- **`@wfynbzlx666/sdk-perf-spa`** - SPA 专用性能监控包
- **`@wfynbzlx666/sdk-core`** - 核心工具库

---

## 📄 License

MIT © [wfynbzlx666](https://github.com/xixiEmperor)

---

<div align="center">

**再次感谢您的理解和支持！**

如有任何问题，欢迎在 [GitHub Issues](https://github.com/xixiEmperor/BMT-Central-SDK/issues) 中反馈。

</div>
