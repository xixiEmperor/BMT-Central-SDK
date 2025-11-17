# @wfynbzlx666/sdk-perf-spa 快速开始

## 📦 安装

```bash
pnpm add @wfynbzlx666/sdk-perf-spa
```

## 🚀 5 分钟上手

### 1. 最简单的使用方式

```javascript
import { quickAudit } from '@wfynbzlx666/sdk-perf-spa'

// 审计单个页面
const result = await quickAudit('https://example.com')
console.log('性能分数:', result.scores?.performance)
```

### 2. 批量审计多个页面

```javascript
import { auditPages } from '@wfynbzlx666/sdk-perf-spa'

const summary = await auditPages({
  urls: [
    'https://example.com',
    'https://example.com/about',
    'https://example.com/products'
  ],
  lighthouse: {
    formFactor: 'mobile',      // 移动端审计
    categories: ['performance'] // 只审计性能
  },
  concurrency: 2,               // 并发数量
  output: {
    format: 'html',             // 生成 HTML 报告
    path: './audit-report.html',
    verbose: true               // 显示详细日志
  }
})

console.log(`完成: ${summary.success}/${summary.total}`)
console.log(`平均分数: ${summary.averagePerformanceScore}`)
```

### 3. 生成多格式报告

```javascript
import { auditPages, generateReport } from '@wfynbzlx666/sdk-perf-spa'

const summary = await auditPages({
  urls: ['https://example.com']
})

// 生成 JSON、HTML、CSV 三种格式
await generateReport(summary, 'json', './reports/audit.json')
await generateReport(summary, 'html', './reports/audit.html')
await generateReport(summary, 'csv', './reports/audit.csv')
```

### 4. 自定义 Chrome 路径

```javascript
import { auditSinglePage } from '@wfynbzlx666/sdk-perf-spa'

const result = await auditSinglePage('https://example.com', {
  chromePath: '/path/to/chrome',  // 指定本地 Chrome 路径
  puppeteer: {
    headless: true,
    timeout: 60000
  }
})
```

## 📊 查看审计结果

### 审计结果包含以下信息：

```javascript
{
  url: 'https://example.com',
  success: true,
  
  // Core Web Vitals 指标
  metrics: {
    lcp: 2500,    // Largest Contentful Paint (ms)
    fid: 80,      // First Input Delay (ms)
    cls: 0.05,    // Cumulative Layout Shift
    fcp: 1500,    // First Contentful Paint (ms)
    ttfb: 300,    // Time to First Byte (ms)
    tbt: 200,     // Total Blocking Time (ms)
    speedIndex: 3000
  },
  
  // 各类别评分（0-100）
  scores: {
    performance: 85,
    accessibility: 90,
    bestPractices: 95,
    seo: 88,
    pwa: null
  },
  
  // 优化建议
  opportunities: [
    {
      title: '压缩图片',
      description: '优化图片可以减少加载时间',
      savings: 1500  // 可节省 1500ms
    }
  ]
}
```

## ⚙️ 常用配置

### Lighthouse 配置

```javascript
lighthouse: {
  formFactor: 'mobile',        // 'mobile' | 'desktop'
  throttling: 'mobile4G',      // 'mobile3G' | 'mobile4G' | 'none'
  categories: [                // 审计类别
    'performance',
    'accessibility',
    'best-practices',
    'seo',
    'pwa'
  ]
}
```

### Puppeteer 配置

```javascript
puppeteer: {
  headless: true,              // 无头模式
  timeout: 30000,              // 超时时间（毫秒）
  launchOptions: {             // 自定义启动选项
    args: ['--no-sandbox']
  }
}
```

### 输出配置

```javascript
output: {
  format: 'html',              // 'json' | 'html' | 'csv'
  path: './report.html',       // 输出路径
  verbose: true                // 详细日志
}
```

## 🔧 常见问题

### Puppeteer 安装失败？

```bash
# 设置镜像
npm config set puppeteer_download_host=https://cdn.npmmirror.com/binaries/chrome-for-testing
pnpm install
```

### 找不到 Chrome？

```javascript
const result = await auditSinglePage('https://example.com', {
  chromePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
})
```

### 审计超时？

```javascript
const result = await auditSinglePage('https://example.com', {
  puppeteer: {
    timeout: 120000  // 增加到 120 秒
  }
})
```

## 📚 更多文档

- [完整 README](./README.md)
- [API 文档](./README.md#-api-文档)
- [使用示例](./examples/audit-example.js)

## 🎯 实用场景

### CI/CD 集成

```javascript
const summary = await auditPages({
  urls: ['https://staging.example.com']
})

// 性能分数低于 80 则失败
if (summary.averagePerformanceScore < 80) {
  process.exit(1)
}
```

### 定时监控

```javascript
import { scheduleJob } from 'node-schedule'

// 每天凌晨 2 点执行
scheduleJob('0 2 * * *', async () => {
  const summary = await auditPages({ urls: [...] })
  await generateReport(summary, 'html', `./report-${Date.now()}.html`)
})
```

---

**Happy Auditing! 🚀**








