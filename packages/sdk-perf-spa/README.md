# @wfynbzlx666/sdk-perf-spa

> Node.js 端性能审计 SDK - Puppeteer + Lighthouse 自动化页面性能审计

[![npm version](https://img.shields.io/npm/v/@wfynbzlx666/sdk-perf-spa.svg)](https://www.npmjs.com/package/@wfynbzlx666/sdk-perf-spa)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 📖 简介

`@wfynbzlx666/sdk-perf-spa` 是一个专为 Node.js 环境设计的自动化页面性能审计工具。基于 **Puppeteer** 和 **Lighthouse**，提供完整的 Web 性能分析能力，支持批量审计、并发控制、多格式报告输出等功能。

**适用场景：**
- 🎯 SPA（单页应用）性能审计
- 📊 批量页面性能测试
- 🔍 CI/CD 性能监控
- 📈 性能趋势分析
- 🚀 性能优化建议生成

---

## ✨ 核心特性

### 🚀 自动化审计
- 基于 Puppeteer 和 Lighthouse 的自动化页面性能审计
- 支持移动端和桌面端设备模拟
- 可自定义网络节流配置

### 📊 完整指标
- **Core Web Vitals**: LCP、FID、CLS
- **性能指标**: FCP、TTFB、TBT、Speed Index
- **多维度评分**: 性能、可访问性、SEO、最佳实践、PWA

### 🎯 优化建议
- 自动生成性能优化建议
- 按节省时间排序
- 详细的改进方向说明

### 📈 批量审计
- 支持多页面批量审计
- 并发控制和任务队列
- 失败重试机制

### 📝 多格式报告
- **JSON**: 完整的结构化数据
- **HTML**: 美观的可视化报告
- **CSV**: 便于数据分析和导入

### 📡 进度监控
- 实时进度回调
- 详细的状态通知
- 自定义日志输出

---

## 📦 安装

```bash
# 使用 npm
npm install @wfynbzlx666/sdk-perf-spa

# 使用 yarn
yarn add @wfynbzlx666/sdk-perf-spa

# 使用 pnpm
pnpm add @wfynbzlx666/sdk-perf-spa
```

---

## 🚀 快速开始

### 1️⃣ 快速审计单个页面

```typescript
import { quickAudit } from '@wfynbzlx666/sdk-perf-spa'

// 使用默认配置快速审计
const result = await quickAudit('https://example.com')

console.log('性能分数:', result.scores?.performance)
console.log('LCP:', result.metrics?.lcp)
console.log('优化建议:', result.opportunities)
```

### 2️⃣ 自定义配置审计

```typescript
import { auditSinglePage } from '@wfynbzlx666/sdk-perf-spa'

const result = await auditSinglePage('https://example.com', {
  lighthouse: {
    formFactor: 'desktop',      // 桌面设备
    throttling: 'none',          // 不进行网络节流
    categories: ['performance', 'accessibility', 'seo']
  },
  puppeteer: {
    headless: true,
    timeout: 60000
  },
  output: {
    format: 'html',
    path: './reports/audit-report.html',
    verbose: true
  }
})
```

### 3️⃣ 批量审计多个页面

```typescript
import { auditPages } from '@wfynbzlx666/sdk-perf-spa'

const summary = await auditPages({
  urls: [
    'https://example.com',
    'https://example.com/about',
    'https://example.com/contact'
  ],
  lighthouse: {
    formFactor: 'mobile',
    categories: ['performance']
  },
  concurrency: 2,           // 同时审计 2 个页面
  retryCount: 1,            // 失败重试 1 次
  output: {
    format: 'html',
    path: './reports/batch-report.html',
    verbose: true
  },
  onProgress: (progress) => {
    console.log(`[${progress.current}/${progress.total}] ${progress.url}: ${progress.status}`)
  }
})

console.log('审计完成:', summary.success, '/', summary.total)
console.log('平均性能分数:', summary.averagePerformanceScore)
```

### 4️⃣ 生成多格式报告

```typescript
import { auditPages, generateReport } from '@wfynbzlx666/sdk-perf-spa'

// 执行审计
const summary = await auditPages({
  urls: ['https://example.com', 'https://example.com/about']
})

// 生成 JSON 报告
await generateReport(summary, 'json', './reports/audit.json')

// 生成 HTML 报告
await generateReport(summary, 'html', './reports/audit.html')

// 生成 CSV 报告
await generateReport(summary, 'csv', './reports/audit.csv')
```

---

## 📚 API 文档

### `quickAudit(urls)`

快速审计页面，使用默认配置。

**参数：**
- `urls`: `string | string[]` - 要审计的 URL（单个或数组）

**返回：**
- `Promise<AuditResult | AuditSummary>` - 审计结果

---

### `auditSinglePage(url, config?)`

审计单个页面，支持完整配置。

**参数：**
- `url`: `string` - 要审计的页面 URL
- `config`: `Partial<AuditConfig>` - 可选的审计配置

**返回：**
- `Promise<AuditResult>` - 审计结果

---

### `auditPages(config)`

批量审计多个页面。

**参数：**
- `config`: `AuditOptions` - 审计配置对象

**配置选项：**

```typescript
interface AuditConfig {
  // 必填：要审计的 URL 数组
  urls: string[]
  
  // 可选：用户本地 Chrome 浏览器路径
  chromePath?: string
  
  // Lighthouse 配置
  lighthouse?: {
    formFactor?: 'mobile' | 'desktop'           // 设备类型
    throttling?: 'mobile3G' | 'mobile4G' | 'none'  // 网络节流
    categories?: ('performance' | 'accessibility' | 'best-practices' | 'seo' | 'pwa')[]
    customConfig?: any                           // 自定义 Lighthouse 配置
  }
  
  // Puppeteer 配置
  puppeteer?: {
    headless?: boolean       // 无头模式
    timeout?: number         // 超时时间
    launchOptions?: any      // 自定义启动选项
  }
  
  // 输出配置
  output?: {
    format?: 'json' | 'html' | 'csv'  // 报告格式
    path?: string                      // 输出路径
    verbose?: boolean                  // 详细日志
  }
  
  // 并发控制
  concurrency?: number     // 并发数量，默认 3
  retryCount?: number      // 失败重试次数，默认 1
  
  // 进度回调
  onProgress?: (progress: AuditProgress) => void
}
```

**返回：**
- `Promise<AuditSummary>` - 审计结果汇总

---

### `generateReport(results, format, outputPath?, options?)`

生成审计报告。

**参数：**
- `results`: `AuditResult[] | AuditSummary` - 审计结果
- `format`: `'json' | 'html' | 'csv'` - 报告格式
- `outputPath`: `string` - 可选的输出路径
- `options`: `{ includeLighthouseResult?: boolean }` - 可选配置

**返回：**
- `Promise<string>` - 报告内容字符串

---

## 🎯 审计结果示例

### AuditResult

```typescript
interface AuditResult {
  url: string                    // 审计的 URL
  timestamp: number              // 审计时间戳
  success: boolean               // 审计是否成功
  error?: string                 // 错误信息（如果失败）
  duration?: number              // 审计耗时（毫秒）
  
  // Core Web Vitals 指标
  metrics?: {
    lcp: number | null          // Largest Contentful Paint (ms)
    fid: number | null          // First Input Delay (ms)
    cls: number | null          // Cumulative Layout Shift (score)
    fcp: number | null          // First Contentful Paint (ms)
    ttfb: number | null         // Time to First Byte (ms)
    tbt: number | null          // Total Blocking Time (ms)
    speedIndex: number | null   // Speed Index
  }
  
  // 各类别评分（0-100）
  scores?: {
    performance: number | null
    accessibility: number | null
    bestPractices: number | null
    seo: number | null
    pwa: number | null
  }
  
  // 优化建议
  opportunities?: Array<{
    id: string
    title: string
    description: string
    savings?: number            // 可节省时间（毫秒）
    score: number | null
  }>
}
```

### AuditSummary

```typescript
interface AuditSummary {
  total: number                      // 总审计页面数
  success: number                    // 成功数量
  failed: number                     // 失败数量
  totalDuration: number              // 总耗时（毫秒）
  averagePerformanceScore: number | null  // 平均性能分数
  results: AuditResult[]             // 所有审计结果
}
```

---

## 🌐 使用场景示例

### 场景 1：CI/CD 集成

```typescript
import { auditPages } from '@wfynbzlx666/sdk-perf-spa'

// 在 CI/CD 中运行性能审计
const summary = await auditPages({
  urls: [
    'https://staging.example.com',
    'https://staging.example.com/products'
  ],
  lighthouse: {
    formFactor: 'mobile',
    categories: ['performance']
  },
  output: {
    format: 'json',
    path: './ci-reports/perf-audit.json',
    verbose: true
  }
})

// 如果性能分数低于阈值，则失败
if (summary.averagePerformanceScore && summary.averagePerformanceScore < 80) {
  console.error('❌ 性能分数低于阈值 80')
  process.exit(1)
}

console.log('✅ 性能审计通过')
```

### 场景 2：多环境对比

```typescript
import { auditSinglePage } from '@wfynbzlx666/sdk-perf-spa'

const environments = {
  '开发环境': 'https://dev.example.com',
  '测试环境': 'https://staging.example.com',
  '生产环境': 'https://example.com'
}

const results = await Promise.all(
  Object.entries(environments).map(async ([name, url]) => {
    const result = await auditSinglePage(url, {
      lighthouse: { formFactor: 'mobile', categories: ['performance'] },
      output: { verbose: false }
    })
    return { name, result }
  })
)

console.log('性能对比:')
results.forEach(({ name, result }) => {
  console.log(`${name}: 性能分数 ${result.scores?.performance?.toFixed(1)}`)
})
```

### 场景 3：定时性能监控

```typescript
import { auditPages, generateReport } from '@wfynbzlx666/sdk-perf-spa'
import { scheduleJob } from 'node-schedule'

// 每天凌晨 2 点执行性能审计
scheduleJob('0 2 * * *', async () => {
  console.log('开始定时性能审计...')
  
  const summary = await auditPages({
    urls: ['https://example.com', 'https://example.com/products'],
    lighthouse: { formFactor: 'mobile', categories: ['performance'] },
    output: { verbose: true }
  })
  
  // 保存报告
  const date = new Date().toISOString().split('T')[0]
  await generateReport(summary, 'html', `./reports/audit-${date}.html`)
  
  console.log('✅ 定时审计完成')
})
```

---

## ⚙️ 配置说明

### Lighthouse 配置

#### 设备类型（formFactor）
- `'mobile'`: 移动设备（默认）
- `'desktop'`: 桌面设备

#### 网络节流（throttling）
- `'mobile3G'`: 模拟 3G 移动网络
- `'mobile4G'`: 模拟 4G 移动网络（默认）
- `'none'`: 不进行节流

#### 审计类别（categories）
- `'performance'`: 性能（默认）
- `'accessibility'`: 可访问性
- `'best-practices'`: 最佳实践
- `'seo'`: SEO 优化
- `'pwa'`: 渐进式 Web 应用

### Puppeteer 配置

#### 无头模式（headless）
- `true`: 无头模式（默认，不显示浏览器窗口）
- `false`: 有头模式（显示浏览器窗口，用于调试）

#### 超时时间（timeout）
- 默认: 30000 ms（30 秒）
- 建议: 根据页面复杂度调整

#### 自定义 Chrome 路径（chromePath）
- 如果系统未安装 Chrome，可指定本地 Chrome 可执行文件路径

### 输出配置（Output）

#### 报告格式（format）
- `'json'`: JSON 格式（默认），返回完整的结构化数据
- `'html'`: HTML 格式，生成可视化的审计报告
- `'csv'`: CSV 格式，适合表格导入和数据分析

**重要说明：** 
- `format` 参数会被传递给 Lighthouse API，用于控制报告的输出格式
- 当配置了 `format` 和 `path` 时，Lighthouse 会自动将报告保存到指定路径

#### 输出路径（path）
- 指定报告文件的保存路径（可选）
- 如果不指定，审计结果只会在内存中返回，不会保存到文件
- 路径可以是相对路径或绝对路径
- **示例：** `'./reports/audit-report.html'`

**工作原理：**
```typescript
// 配置示例
output: {
  format: 'html',
  path: './reports/audit-report.html'
}

// Lighthouse 会：
// 1. 生成 HTML 格式的报告
// 2. 自动保存到 ./reports/audit-report.html
// 3. 同时在返回结果中包含完整的审计数据
```

#### 详细日志（verbose）
- `true`: 输出详细的审计过程日志（包括 Lighthouse 的 info 级别日志）
- `false`: 只输出错误日志（默认）

**日志级别映射：**
- `verbose: true` → Lighthouse `logLevel: 'info'`
- `verbose: false` → Lighthouse `logLevel: 'error'`

#### 完整示例

```typescript
import { auditPages } from '@wfynbzlx666/sdk-perf-spa'

const summary = await auditPages({
  urls: ['https://example.com'],
  output: {
    format: 'html',              // 生成 HTML 报告
    path: './reports/perf.html', // 保存到本地文件
    verbose: true                // 输出详细日志
  }
})

// 结果：
// 1. Lighthouse 会生成 HTML 报告并保存到 ./reports/perf.html
// 2. 控制台会输出详细的审计过程
// 3. summary 中仍然包含完整的 JSON 格式审计数据
```

---

## 🔧 高级用法

### 使用自定义 Lighthouse 配置

```typescript
import { auditSinglePage } from '@wfynbzlx666/sdk-perf-spa'

const result = await auditSinglePage('https://example.com', {
  lighthouse: {
    customConfig: {
      extends: 'lighthouse:default',
      settings: {
        onlyCategories: ['performance'],
        skipAudits: ['uses-http2']
      }
    }
  }
})
```

### 使用自定义 Puppeteer 启动选项

```typescript
import { auditSinglePage } from '@wfynbzlx666/sdk-perf-spa'

const result = await auditSinglePage('https://example.com', {
  chromePath: '/usr/bin/google-chrome',  // 自定义 Chrome 路径
  puppeteer: {
    headless: true,
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    }
  }
})
```

---

## 📊 性能指标说明

### Core Web Vitals

| 指标 | 全称 | 说明 | 优秀阈值 |
|------|------|------|----------|
| **LCP** | Largest Contentful Paint | 最大内容绘制时间 | ≤ 2.5s |
| **FID** | First Input Delay | 首次输入延迟 | ≤ 100ms |
| **CLS** | Cumulative Layout Shift | 累积布局偏移 | ≤ 0.1 |

### 其他关键指标

| 指标 | 全称 | 说明 |
|------|------|------|
| **FCP** | First Contentful Paint | 首次内容绘制时间 |
| **TTFB** | Time to First Byte | 首字节时间 |
| **TBT** | Total Blocking Time | 总阻塞时间 |
| **Speed Index** | - | 速度指数 |

---

## 🤝 与其他 SDK 配合使用

### 与 @wfynbzlx666/sdk-perf 配合

```typescript
// Node.js 审计（sdk-perf-spa）
import { auditPages } from '@wfynbzlx666/sdk-perf-spa'

const summary = await auditPages({
  urls: ['https://example.com']
})

// 浏览器端监控（sdk-perf）
import { createPerformanceMonitor } from '@wfynbzlx666/sdk-perf'

const monitor = createPerformanceMonitor({
  onMetric: (metric) => {
    console.log('实时指标:', metric)
  }
})
```

---

## 🐛 常见问题

### 1. Puppeteer 安装失败？

```bash
# 设置 Puppeteer 镜像
npm config set puppeteer_download_host=https://cdn.npmmirror.com/binaries/chrome-for-testing
pnpm install
```

### 2. Chrome 路径找不到？

```typescript
const result = await auditSinglePage('https://example.com', {
  chromePath: '/path/to/your/chrome'  // 指定 Chrome 路径
})
```

### 3. 审计超时？

```typescript
const result = await auditSinglePage('https://example.com', {
  puppeteer: {
    timeout: 120000  // 增加超时时间到 120 秒
  }
})
```

---

## 📄 许可证

MIT © [wfynbzlx666](https://github.com/xixiEmperor)

---

## 🔗 相关链接

- [NPM Package](https://www.npmjs.com/package/@wfynbzlx666/sdk-perf-spa)
- [GitHub Repository](https://github.com/xixiEmperor/BMT-Central-SDK)
- [Lighthouse 文档](https://github.com/GoogleChrome/lighthouse)
- [Puppeteer 文档](https://pptr.dev/)

---

## 💬 贡献

欢迎提交 Issue 和 Pull Request！

---

**Happy Auditing! 🚀**

