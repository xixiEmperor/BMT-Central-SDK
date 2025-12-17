# Lighthouse Node.js API 深度学习文档

> 深入理解 Lighthouse 在 Node.js 中的编程接口和核心概念

## 📋 目录

- [核心概念](#核心概念)
- [lighthouse() 函数详解](#lighthouse-函数详解)
- [Options 配置对象深度解析](#options-配置对象深度解析)
- [Config 配置对象详解](#config-配置对象详解)
- [返回结果 RunnerResult 详解](#返回结果-runnerresult-详解)
- [Lighthouse Result (LHR) 数据结构](#lighthouse-result-lhr-数据结构)
- [Chrome Launcher 详解](#chrome-launcher-详解)
- [核心概念深入](#核心概念深入)

---

## 核心概念

### Lighthouse 在 Node.js 中的工作原理

```
┌─────────────────┐
│   Node.js 脚本   │
└────────┬────────┘
         │ 1. 启动 Chrome
         ↓
┌─────────────────┐
│ chrome-launcher  │
└────────┬────────┘
         │ 2. 获取调试端口
         ↓
┌─────────────────┐
│   lighthouse()   │
└────────┬────────┘
         │ 3. 连接 Chrome
         │ 4. 运行审计
         │ 5. 收集数据
         ↓
┌─────────────────┐
│  RunnerResult    │ ← 审计结果
└─────────────────┘
```

### 基础导入

```javascript
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
```

---

## lighthouse() 函数详解

### 函数签名

```typescript
async function lighthouse(
  url: string,
  flags?: Flags,
  config?: Config,
  connection?: Connection
): Promise<RunnerResult>
```

### 参数详解

#### 1. url (string) - 必需

**作用**: 要审计的页面 URL

**示例**:
```javascript
await lighthouse('https://example.com')
await lighthouse('https://example.com/page?query=value')
await lighthouse('http://localhost:3000')
```

**注意事项**:
- 必须包含协议 (`http://` 或 `https://`)
- 可以包含查询参数和 hash
- 本地开发服务器也可以

---

#### 2. flags (Flags) - 可选

**作用**: 运行时标志和配置选项

这是**最重要的配置对象**，包含大量配置选项。

### Flags 对象的核心属性

#### 📊 输出控制

##### output (string | string[])

**含义**: 指定输出格式

**可选值**:
- `'json'` - JSON 格式的完整数据
- `'html'` - HTML 报告
- `'csv'` - CSV 表格（仅性能指标）

**示例**:
```javascript
// 单个格式
flags: { output: 'json' }

// 多个格式
flags: { output: ['html', 'json'] }
```

**返回位置**:
```javascript
const result = await lighthouse(url, { output: 'html' })
// result.report 是 HTML 字符串

const result = await lighthouse(url, { output: ['html', 'json'] })
// result.report 是数组: [htmlString, jsonString]
```

---

##### outputPath (string)

**含义**: 输出文件保存路径

**特点**:
- 如果不指定，不会自动保存文件
- 多格式输出会根据扩展名自动处理

**示例**:
```javascript
flags: {
  output: 'html',
  outputPath: './lighthouse-report.html'
}

// 多格式
flags: {
  output: ['html', 'json'],
  outputPath: './report.html'  
  // 会生成 report.html 和 report.json
}
```

---

#### 🖥️ 浏览器连接

##### port (number)

**含义**: Chrome 调试协议的端口号

**重要性**: ⭐⭐⭐⭐⭐ (必须正确设置)

**使用场景**:
```javascript
// 场景 1: 使用 chrome-launcher
const chrome = await chromeLauncher.launch()
const flags = { port: chrome.port }  // 使用 launcher 返回的端口

// 场景 2: 连接已运行的 Chrome
// chrome --remote-debugging-port=9222
const flags = { port: 9222 }
```

**底层原理**:
- Lighthouse 通过 Chrome DevTools Protocol 与浏览器通信
- 端口号用于建立 WebSocket 连接
- 格式: `ws://localhost:${port}/devtools/browser`

---

##### hostname (string)

**含义**: Chrome 调试服务器的主机名

**默认值**: `'localhost'`

**使用场景**:
```javascript
// 远程 Chrome 实例
flags: {
  hostname: '192.168.1.100',
  port: 9222
}
```

---

#### 📱 设备模拟

##### formFactor (string)

**含义**: 设备类型

**可选值**:
- `'mobile'` - 移动设备（默认）
- `'desktop'` - 桌面设备

**影响**:
- 屏幕尺寸
- 用户代理字符串
- 触摸事件支持

**示例**:
```javascript
// 移动端审计
flags: { formFactor: 'mobile' }

// 桌面端审计
flags: { formFactor: 'desktop' }
```

**对应的屏幕配置**:
```javascript
// mobile
{
  width: 375,
  height: 667,
  deviceScaleFactor: 2,
  mobile: true
}

// desktop
{
  width: 1350,
  height: 940,
  deviceScaleFactor: 1,
  mobile: false
}
```

---

##### screenEmulation (Object)

**含义**: 自定义屏幕模拟参数

**属性**:
```typescript
interface ScreenEmulation {
  mobile: boolean           // 是否为移动设备
  width: number            // 屏幕宽度(px)
  height: number           // 屏幕高度(px)
  deviceScaleFactor: number // 设备像素比
  disabled: boolean        // 是否禁用屏幕模拟
}
```

**示例**:
```javascript
// iPhone 12 Pro
flags: {
  screenEmulation: {
    mobile: true,
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    disabled: false
  }
}

// iPad
flags: {
  screenEmulation: {
    mobile: false,
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    disabled: false
  }
}

// 禁用屏幕模拟（使用实际屏幕）
flags: {
  screenEmulation: {
    disabled: true
  }
}
```

---

##### emulatedUserAgent (string)

**含义**: 自定义 User Agent 字符串

**默认值**: 根据 `formFactor` 自动设置

**示例**:
```javascript
flags: {
  emulatedUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'
}
```

---

#### 🌐 网络节流

##### throttlingMethod (string)

**含义**: 节流实现方式

**可选值**:
- `'simulate'` - 模拟节流（默认，推荐）
- `'devtools'` - 使用 DevTools 真实节流
- `'provided'` - 不进行节流

**区别**:

| 方式 | 速度 | 准确性 | 适用场景 |
|------|------|--------|----------|
| simulate | 快 | 较准确 | CI/CD，快速测试 |
| devtools | 慢 | 最准确 | 深度分析 |
| provided | 最快 | 取决于实际网络 | 本地快速测试 |

**原理**:
- `simulate`: 在计算性能分数时模拟网络延迟
- `devtools`: 真实地限制网络速度
- `provided`: 使用实际网络条件

**示例**:
```javascript
// 模拟节流（快速，推荐）
flags: { throttlingMethod: 'simulate' }

// 真实节流（慢但准确）
flags: { throttlingMethod: 'devtools' }

// 不节流（测试本地性能）
flags: { throttlingMethod: 'provided' }
```

---

##### throttling (Object)

**含义**: 自定义节流参数

**属性**:
```typescript
interface ThrottlingSettings {
  // 往返时延 (Round Trip Time)
  rttMs: number
  
  // 吞吐量 (Kilobits per second)
  throughputKbps: number
  
  // 请求延迟
  requestLatencyMs: number
  
  // 下载速度
  downloadThroughputKbps: number
  
  // 上传速度
  uploadThroughputKbps: number
  
  // CPU 减速倍数
  cpuSlowdownMultiplier: number
}
```

**预设配置**:

```javascript
// Slow 3G (较慢)
const slow3G = {
  rttMs: 150,
  throughputKbps: 1.6 * 1024,
  requestLatencyMs: 150 * 3.75,
  downloadThroughputKbps: 1.6 * 1024,
  uploadThroughputKbps: 750,
  cpuSlowdownMultiplier: 4
}

// Fast 3G
const fast3G = {
  rttMs: 40,
  throughputKbps: 10 * 1024,
  requestLatencyMs: 40 * 3.75,
  downloadThroughputKbps: 10 * 1024,
  uploadThroughputKbps: 5 * 1024,
  cpuSlowdownMultiplier: 4
}

// 4G
const fourG = {
  rttMs: 20,
  throughputKbps: 20 * 1024,
  requestLatencyMs: 20 * 3.75,
  downloadThroughputKbps: 20 * 1024,
  uploadThroughputKbps: 10 * 1024,
  cpuSlowdownMultiplier: 1
}

// 无节流
const noThrottling = {
  rttMs: 0,
  throughputKbps: 0,
  cpuSlowdownMultiplier: 1
}
```

**示例**:
```javascript
flags: {
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    cpuSlowdownMultiplier: 4
  }
}
```

**参数详解**:

- **rttMs** (Round Trip Time):
  - 含义: 数据包往返一次的时间
  - 影响: 网络延迟感知
  - 典型值: 40ms (4G), 150ms (3G)

- **throughputKbps**:
  - 含义: 网络吞吐量
  - 单位: Kilobits per second
  - 典型值: 10240 (10 Mbps), 1638.4 (1.6 Mbps)

- **cpuSlowdownMultiplier**:
  - 含义: CPU 减速倍数
  - 影响: JavaScript 执行速度
  - 典型值: 4 (模拟低端设备), 1 (不减速)

---

#### 🎯 审计控制

##### onlyCategories (string[])

**含义**: 只运行指定类别的审计

**可选值**:
- `'performance'` - 性能
- `'accessibility'` - 可访问性
- `'best-practices'` - 最佳实践
- `'seo'` - SEO
- `'pwa'` - PWA

**影响**:
- 减少审计时间
- 减少内存占用
- 聚焦特定指标

**示例**:
```javascript
// 只审计性能
flags: { onlyCategories: ['performance'] }

// 性能 + 可访问性
flags: { onlyCategories: ['performance', 'accessibility'] }

// 全部类别
flags: { 
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'] 
}
```

---

##### skipAudits (string[])

**含义**: 跳过指定的审计项

**示例**:
```javascript
flags: {
  skipAudits: [
    'uses-http2',           // 跳过 HTTP/2 检查
    'uses-text-compression' // 跳过文本压缩检查
  ]
}
```

**常用跳过项**:
- `'screenshot-thumbnails'` - 截图
- `'final-screenshot'` - 最终截图
- `'network-requests'` - 网络请求列表

---

#### 🔐 认证和请求头

##### extraHeaders (Object)

**含义**: 添加自定义 HTTP 请求头

**使用场景**:
- Bearer Token 认证
- API Key
- 自定义 Cookie
- CORS 配置

**示例**:
```javascript
// Bearer Token 认证
flags: {
  extraHeaders: {
    'Authorization': 'Bearer your-token-here'
  }
}

// API Key
flags: {
  extraHeaders: {
    'X-API-Key': 'your-api-key'
  }
}

// 多个请求头
flags: {
  extraHeaders: {
    'Authorization': 'Bearer token',
    'X-Custom-Header': 'value',
    'Accept-Language': 'zh-CN'
  }
}
```

**注意**: 
- 请求头会应用到所有请求
- 不能设置某些浏览器保护的请求头（如 `User-Agent`，需用 `emulatedUserAgent`）

---

##### disableStorageReset (boolean)

**含义**: 禁用存储重置

**默认值**: `false` (每次审计前清空存储)

**影响**:
- `true`: 保留 Cookies、LocalStorage、SessionStorage、IndexedDB
- `false`: 每次审计前清空所有存储

**使用场景**:
```javascript
// 场景 1: 需要登录状态
// 先手动登录，再审计需要登录的页面
flags: {
  disableStorageReset: true
}

// 场景 2: 测试缓存性能
flags: {
  disableStorageReset: true  // 保留缓存
}
```

---

#### ⏱️ 时间控制

##### maxWaitForLoad (number)

**含义**: 等待页面加载的最大时间（毫秒）

**默认值**: `45000` (45 秒)

**示例**:
```javascript
// 慢速页面，增加等待时间
flags: { maxWaitForLoad: 90000 }  // 90 秒

// 快速失败
flags: { maxWaitForLoad: 30000 }  // 30 秒
```

---

##### maxWaitForFcp (number)

**含义**: 等待 First Contentful Paint 的最大时间

**默认值**: `30000` (30 秒)

---

#### 🔍 调试和日志

##### logLevel (string)

**含义**: 日志级别

**可选值**:
- `'silent'` - 无输出
- `'error'` - 仅错误
- `'warn'` - 警告和错误
- `'info'` - 信息、警告、错误（默认）
- `'verbose'` - 详细输出

**示例**:
```javascript
// 生产环境：只看错误
flags: { logLevel: 'error' }

// 开发调试：详细输出
flags: { logLevel: 'verbose' }

// 完全静默
flags: { logLevel: 'silent' }
```

---

##### channel (string)

**含义**: Chrome 发布渠道

**可选值**:
- `'wpt'` - WebPageTest
- `'devtools'` - Chrome DevTools
- `'lr'` - Lighthouse Runner

**影响**: 某些审计项的评分标准

---

### Flags 完整示例

```javascript
const flags = {
  // 输出控制
  output: ['html', 'json'],
  outputPath: './report.html',
  
  // 浏览器连接
  port: chrome.port,
  hostname: 'localhost',
  
  // 设备模拟
  formFactor: 'mobile',
  screenEmulation: {
    mobile: true,
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    disabled: false
  },
  emulatedUserAgent: 'Mozilla/5.0...',
  
  // 网络节流
  throttlingMethod: 'simulate',
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    cpuSlowdownMultiplier: 4
  },
  
  // 审计控制
  onlyCategories: ['performance', 'accessibility'],
  skipAudits: ['screenshot-thumbnails'],
  
  // 认证
  extraHeaders: {
    'Authorization': 'Bearer token'
  },
  disableStorageReset: false,
  
  // 时间控制
  maxWaitForLoad: 45000,
  maxWaitForFcp: 30000,
  
  // 日志
  logLevel: 'info',
  channel: 'devtools'
}
```

---

## Config 配置对象详解

**作用**: 深度定制 Lighthouse 的行为

### Config 基础结构

```javascript
const config = {
  extends: 'lighthouse:default',  // 继承默认配置
  settings: {},                    // 运行时设置
  passes: [],                      // 自定义收集阶段
  audits: [],                      // 自定义审计
  categories: {}                   // 自定义类别
}
```

### extends (string)

**含义**: 继承预设配置

**可选值**:
- `'lighthouse:default'` - 默认完整配置
- `'lighthouse:full'` - 完整配置
- 自定义配置的路径

**示例**:
```javascript
const config = {
  extends: 'lighthouse:default',
  settings: {
    // 覆盖默认配置
    onlyCategories: ['performance']
  }
}
```

---

### settings (Object)

**含义**: 运行时设置，覆盖 flags 中的配置

**可配置项**:

```javascript
settings: {
  // 与 flags 相同的选项
  formFactor: 'mobile',
  throttling: { /* ... */ },
  onlyCategories: ['performance'],
  skipAudits: ['...'],
  
  // Config 特有选项
  locale: 'zh-CN',
  blockedUrlPatterns: ['*.ads.com'],
  additionalTraceCategories: ['devtools.timeline']
}
```

#### blockedUrlPatterns (string[])

**含义**: 阻止加载匹配的 URL

**使用场景**: 屏蔽广告、追踪脚本

**示例**:
```javascript
config: {
  settings: {
    blockedUrlPatterns: [
      '*.google-analytics.com',
      '*.facebook.com',
      '*doubleclick.net'
    ]
  }
}
```

---

### audits (string[] | AuditDefn[])

**含义**: 添加自定义审计或指定要运行的审计

**示例**:
```javascript
config: {
  audits: [
    'metrics/first-contentful-paint',
    'metrics/largest-contentful-paint',
    // 或自定义审计
    // './my-custom-audit.js'
  ]
}
```

---

### categories (Object)

**含义**: 自定义审计类别和评分权重

**结构**:
```javascript
categories: {
  'my-category': {
    title: '我的类别',
    description: '自定义类别描述',
    auditRefs: [
      { id: 'first-contentful-paint', weight: 10 },
      { id: 'largest-contentful-paint', weight: 25 }
    ]
  }
}
```

**权重说明**:
- 权重相加应该等于 100
- 每个审计的得分 × 权重 = 该审计对总分的贡献

---

### passes (Array)

**含义**: 自定义数据收集阶段

**默认**: Lighthouse 有一个默认的 pass（加载页面并收集数据）

**高级用法**: 可以添加多个 passes 进行多次页面访问

---

## 返回结果 RunnerResult 详解

### 结构

```typescript
interface RunnerResult {
  lhr: LighthouseResult    // Lighthouse Result (核心数据)
  report: string | string[] // 报告内容
  artifacts: Artifacts      // 原始收集的数据
}
```

### lhr - Lighthouse Result

**最重要的返回值**，包含所有审计数据

### report

**含义**: 生成的报告内容

**类型**:
- 单个格式: `string`
- 多个格式: `string[]`

**示例**:
```javascript
const result = await lighthouse(url, { output: 'html' })
console.log(typeof result.report)  // 'string'

const result = await lighthouse(url, { output: ['html', 'json'] })
console.log(Array.isArray(result.report))  // true
console.log(result.report.length)  // 2
```

### artifacts

**含义**: Lighthouse 收集的原始数据

**包含**:
- 网络请求
- JavaScript 执行追踪
- 屏幕截图
- 等等...

---

## Lighthouse Result (LHR) 数据结构

### 完整结构概览

```javascript
{
  lighthouseVersion: "11.0.0",
  requestedUrl: "https://example.com",
  finalUrl: "https://example.com/",
  fetchTime: "2024-01-01T00:00:00.000Z",
  
  categories: {        // 类别评分
    performance: {},
    accessibility: {},
    // ...
  },
  
  audits: {           // 所有审计结果
    'first-contentful-paint': {},
    'largest-contentful-paint': {},
    // ...
  },
  
  timing: {},         // 审计耗时
  configSettings: {}, // 使用的配置
  environment: {}     // 环境信息
}
```

---

### categories (Object)

**含义**: 各类别的评分

**结构**:
```javascript
categories: {
  performance: {
    id: 'performance',
    title: 'Performance',
    score: 0.95,              // 0-1 之间，null 表示不适用
    description: '...',
    manualDescription: '...',
    auditRefs: [              // 该类别包含的审计项
      {
        id: 'first-contentful-paint',
        weight: 10,
        group: 'metrics'
      }
    ]
  }
}
```

**score 解读**:
- `0.9 - 1.0` (90-100): 优秀（绿色）
- `0.5 - 0.89` (50-89): 需要改进（橙色）
- `0 - 0.49` (0-49): 差（红色）
- `null`: 不适用

**示例使用**:
```javascript
const lhr = result.lhr

// 获取性能分数
const perfScore = lhr.categories.performance.score * 100
console.log(`性能分数: ${perfScore.toFixed(1)}`)

// 获取所有分数
Object.entries(lhr.categories).forEach(([id, category]) => {
  if (category.score !== null) {
    console.log(`${category.title}: ${(category.score * 100).toFixed(1)}`)
  }
})
```

---

### audits (Object)

**含义**: 所有单项审计的详细结果

**结构**:
```javascript
audits: {
  'first-contentful-paint': {
    id: 'first-contentful-paint',
    title: 'First Contentful Paint',
    description: '...',
    score: 0.99,                    // 该审计的得分
    scoreDisplayMode: 'numeric',    // 显示模式
    numericValue: 1234.567,         // 数值（毫秒）
    numericUnit: 'millisecond',     // 单位
    displayValue: '1.2 s',          // 显示值
    details: {}                     // 详细信息
  }
}
```

#### scoreDisplayMode

**可选值**:
- `'numeric'` - 数值型（有具体分数）
- `'binary'` - 二进制（通过/不通过）
- `'manual'` - 手动（需要人工检查）
- `'informative'` - 信息型（仅供参考）
- `'notApplicable'` - 不适用
- `'error'` - 错误

---

### 核心性能指标提取

```javascript
const lhr = result.lhr

// Core Web Vitals
const metrics = {
  // FCP - First Contentful Paint
  fcp: lhr.audits['first-contentful-paint'].numericValue,
  
  // LCP - Largest Contentful Paint  
  lcp: lhr.audits['largest-contentful-paint'].numericValue,
  
  // TBT - Total Blocking Time
  tbt: lhr.audits['total-blocking-time'].numericValue,
  
  // CLS - Cumulative Layout Shift
  cls: lhr.audits['cumulative-layout-shift'].numericValue,
  
  // Speed Index
  speedIndex: lhr.audits['speed-index'].numericValue,
  
  // TTI - Time to Interactive
  tti: lhr.audits['interactive'].numericValue
}

console.log('FCP:', metrics.fcp, 'ms')
console.log('LCP:', metrics.lcp, 'ms')
console.log('CLS:', metrics.cls)
```

---

### 性能指标详解

#### First Contentful Paint (FCP)

**定义**: 浏览器首次绘制任何文本、图像、非白色 canvas 或 SVG 的时间

**意义**: 用户感知页面开始加载的时间

**评分标准**:
- 好: < 1.8s
- 需要改进: 1.8s - 3.0s
- 差: > 3.0s

---

#### Largest Contentful Paint (LCP)

**定义**: 可视区域内最大的内容元素完全渲染的时间

**意义**: 页面主要内容加载完成的时间

**评分标准**:
- 好: < 2.5s
- 需要改进: 2.5s - 4.0s
- 差: > 4.0s

---

#### Total Blocking Time (TBT)

**定义**: FCP 和 TTI 之间所有长任务的阻塞时间总和

**意义**: 页面响应用户输入的能力

**评分标准**:
- 好: < 200ms
- 需要改进: 200ms - 600ms
- 差: > 600ms

---

#### Cumulative Layout Shift (CLS)

**定义**: 页面加载过程中所有意外布局偏移的累计分数

**意义**: 视觉稳定性

**评分标准**:
- 好: < 0.1
- 需要改进: 0.1 - 0.25
- 差: > 0.25

---

#### Speed Index

**定义**: 页面内容可视填充的速度

**意义**: 用户感知页面加载速度

**评分标准**:
- 好: < 3.4s
- 需要改进: 3.4s - 5.8s
- 差: > 5.8s

---

### 优化建议提取

```javascript
const lhr = result.lhr

// 提取所有有优化机会的审计
const opportunities = Object.values(lhr.audits)
  .filter(audit => 
    audit.details && 
    audit.details.type === 'opportunity' && 
    audit.numericValue > 0
  )
  .map(audit => ({
    id: audit.id,
    title: audit.title,
    description: audit.description,
    // 可节省的时间（毫秒）
    savingsMs: audit.numericValue,
    // 显示值
    displayValue: audit.displayValue
  }))
  .sort((a, b) => b.savingsMs - a.savingsMs)  // 按节省时间排序

// 输出前 5 个优化建议
opportunities.slice(0, 5).forEach((opp, index) => {
  console.log(`${index + 1}. ${opp.title}`)
  console.log(`   可节省: ${(opp.savingsMs / 1000).toFixed(2)}s`)
})
```

---

### timing (Object)

**含义**: Lighthouse 运行的各阶段耗时

```javascript
lhr.timing: {
  total: 12345,        // 总耗时（毫秒）
  entries: [           // 各阶段详情
    { name: 'lh:init:config', duration: 100 },
    { name: 'lh:gather:loadPage', duration: 5000 },
    // ...
  ]
}
```

---

### environment (Object)

**含义**: 审计时的环境信息

```javascript
lhr.environment: {
  networkUserAgent: '...',       // 网络请求使用的 UA
  hostUserAgent: '...',          // 宿主环境 UA
  benchmarkIndex: 1234,          // 基准性能指数
  credits: {}                    // 使用的工具版本
}
```

---

## Chrome Launcher 详解

### 基础用法

```javascript
import * as chromeLauncher from 'chrome-launcher'

// 启动 Chrome
const chrome = await chromeLauncher.launch({
  chromeFlags: ['--headless']
})

// 获取端口
console.log(chrome.port)  // 例如: 9222

// 关闭 Chrome
await chrome.kill()
```

---

### LaunchOptions 详解

```typescript
interface LaunchOptions {
  // Chrome 启动参数
  chromeFlags?: string[]
  
  // Chrome 可执行文件路径
  chromePath?: string
  
  // 调试端口（0 表示随机）
  port?: number
  
  // 处理 SIGINT 信号
  handleSIGINT?: boolean
  
  // 日志级别
  logLevel?: 'verbose' | 'info' | 'error' | 'silent'
  
  // 启动连接超时
  connectionPollInterval?: number
  maxConnectionRetries?: number
  
  // 用户数据目录
  userDataDir?: string | boolean
}
```

---

### chromeFlags (string[])

**常用标志**:

```javascript
chromeFlags: [
  // 无头模式
  '--headless',
  
  // 禁用沙盒（Docker/CI 环境）
  '--no-sandbox',
  '--disable-setuid-sandbox',
  
  // 性能优化
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-software-rasterizer',
  
  // 窗口大小
  '--window-size=1920,1080',
  
  // 禁用扩展
  '--disable-extensions',
  
  // 代理
  '--proxy-server=http://proxy:8080',
  
  // 禁用图片
  '--blink-settings=imagesEnabled=false',
  
  // 语言
  '--lang=zh-CN'
]
```

---

### chromePath (string)

**作用**: 指定 Chrome 可执行文件路径

**使用场景**:
- 使用特定版本的 Chrome
- 使用系统已安装的 Chrome

**示例**:
```javascript
// macOS
chromePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

// Windows
chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

// Linux
chromePath: '/usr/bin/google-chrome'
```

---

### port (number)

**作用**: 指定调试端口

**默认**: `0` (随机端口)

**示例**:
```javascript
// 使用固定端口
const chrome = await chromeLauncher.launch({
  port: 9222
})
```

---

### userDataDir (string | boolean)

**作用**: Chrome 用户数据目录

**可选值**:
- `false`: 使用临时目录（默认）
- `true`: 使用系统默认目录
- `string`: 指定目录路径

**使用场景**:
```javascript
// 保留用户数据（Cookies、缓存等）
const chrome = await chromeLauncher.launch({
  userDataDir: './chrome-profile'
})
```

---

## 核心概念深入

### 1. 性能评分算法

Lighthouse 性能分数是加权平均：

```javascript
performanceScore = 
  FCP_score * 0.10 +
  LCP_score * 0.25 +
  TBT_score * 0.30 +
  CLS_score * 0.25 +
  SI_score  * 0.10
```

**权重分布**:
- TBT (30%): 最重要
- LCP (25%): 很重要
- CLS (25%): 很重要
- FCP (10%): 重要
- Speed Index (10%): 重要

---

### 2. 节流的意义

**为什么需要节流？**

1. **一致性**: 不同网络环境下结果可比较
2. **模拟真实用户**: 大多数用户不在理想网络环境
3. **发现问题**: 慢速网络会放大性能问题

**simulate vs devtools**:

```javascript
// simulate: 快速（推荐）
// - 在正常速度下加载页面
// - 在计算指标时应用节流模型
// - 适合 CI/CD

// devtools: 准确
// - 真实限制网络速度
// - 页面加载变慢
// - 适合深度分析
```

---

### 3. 设备模拟的本质

**屏幕模拟**:
```javascript
// 实际上是设置 viewport 和 deviceScaleFactor
await page.setViewport({
  width: 375,
  height: 667,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true
})
```

**User Agent**:
```javascript
// 影响服务器返回的内容
// 移动端可能返回简化版页面
await page.setUserAgent('Mobile User Agent')
```

---

### 4. 典型工作流

```javascript
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'

async function auditWebsite(url) {
  // 1. 启动 Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox']
  })
  
  try {
    // 2. 配置 Lighthouse
    const flags = {
      port: chrome.port,
      output: 'json',
      onlyCategories: ['performance']
    }
    
    const config = {
      extends: 'lighthouse:default',
      settings: {
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4
        }
      }
    }
    
    // 3. 运行审计
    const result = await lighthouse(url, flags, config)
    
    // 4. 提取数据
    const lhr = result.lhr
    const perfScore = lhr.categories.performance.score * 100
    
    // 5. 返回结果
    return {
      score: perfScore,
      metrics: {
        fcp: lhr.audits['first-contentful-paint'].numericValue,
        lcp: lhr.audits['largest-contentful-paint'].numericValue
      }
    }
    
  } finally {
    // 6. 清理：关闭 Chrome
    await chrome.kill()
  }
}
```

---

## 实践建议

### 1. 选择合适的配置

```javascript
// CI/CD：快速
flags: {
  formFactor: 'mobile',
  throttlingMethod: 'simulate',
  onlyCategories: ['performance'],
  logLevel: 'error'
}

// 深度分析：准确
flags: {
  formFactor: 'mobile',
  throttlingMethod: 'devtools',
  logLevel: 'verbose'
}

// 本地开发：无节流
flags: {
  formFactor: 'desktop',
  throttlingMethod: 'provided',
  onlyCategories: ['performance']
}
```

---

### 2. 复用 Chrome 实例

```javascript
// ❌ 不好：每次都启动新的 Chrome
for (const url of urls) {
  const chrome = await chromeLauncher.launch()
  await lighthouse(url, { port: chrome.port })
  await chrome.kill()
}

// ✅ 好：复用同一个 Chrome
const chrome = await chromeLauncher.launch()
for (const url of urls) {
  await lighthouse(url, { port: chrome.port })
}
await chrome.kill()
```

---

### 3. 错误处理

```javascript
async function safeLighthouse(url, flags) {
  const chrome = await chromeLauncher.launch()
  
  try {
    const result = await lighthouse(url, {
      ...flags,
      port: chrome.port
    })
    return { success: true, result }
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
    
  } finally {
    await chrome.kill()
  }
}
```

---

## 总结

### 核心要点

1. **lighthouse()** 是主函数，接收 URL、flags、config
2. **flags** 控制运行时行为（设备、网络、输出）
3. **config** 深度定制审计项和评分
4. **LHR** (Lighthouse Result) 包含所有审计数据
5. **chrome-launcher** 负责启动和管理 Chrome

### 最佳实践

✅ 复用 Chrome 实例提高性能  
✅ 根据场景选择合适的节流方式  
✅ 使用 `onlyCategories` 减少不必要的审计  
✅ 妥善处理错误和清理资源  
✅ 理解指标含义，而不只是看分数  

### 进阶学习

- 研究 Lighthouse 源码理解评分算法
- 学习如何编写自定义审计
- 掌握性能优化最佳实践
- 了解 Web Vitals 最新标准

**Happy Learning! 🚀**

