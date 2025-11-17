# @wfynbzlx666/sdk-perf 重构方案

## 🎯 问题分析

### 当前问题
你的SDK同时包含了：
1. **浏览器端功能**：Web Vitals、Performance Observer、FPS监控等
2. **Node.js端功能**：Puppeteer + Lighthouse性能审计

这导致：
- ❌ 浏览器无法加载SDK（因为包含Puppeteer依赖）
- ❌ 打包体积巨大（Puppeteer约300MB）
- ❌ 用户无法按需使用功能

---

## 💡 解决方案：拆分为两个独立的包

### 方案A：创建两个独立的包（推荐）⭐

```
@wfynbzlx666/sdk-perf          → 浏览器端性能监控（轻量级，~50KB）
@wfynbzlx666/sdk-perf-audit    → Node.js端性能审计（完整功能）
```

#### 优点
✅ 清晰的职责分离  
✅ 按需安装和使用  
✅ 浏览器端包体积小  
✅ 更好的类型提示  

#### 缺点
⚠️ 需要维护两个包  
⚠️ 用户需要安装两个依赖  

---

### 方案B：使用条件导出（折中方案）

保持单个包，但提供多个入口点：

```json
{
  "exports": {
    ".": "./dist/browser.js",           // 浏览器端（默认）
    "./browser": "./dist/browser.js",   // 明确的浏览器端
    "./audit": "./dist/audit.js"        // Node.js审计功能
  }
}
```

#### 优点
✅ 单个包，统一版本  
✅ 向后兼容  

#### 缺点
⚠️ 仍然会安装Puppeteer依赖  
⚠️ node_modules体积大  

---

## 🔧 推荐实现：方案A（拆分包）

### 1. 目录结构调整

```
BMT-Central-SDK/
├── packages/
│   ├── sdk-perf/                    # 浏览器端性能监控
│   │   ├── src/
│   │   │   ├── index.ts             # 主入口
│   │   │   ├── perf.ts              # Perf类（只保留浏览器功能）
│   │   │   ├── web-vitals.ts       # Web Vitals监控
│   │   │   ├── performance-observer.ts
│   │   │   ├── advanced-metrics.ts
│   │   │   └── types.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── sdk-perf-audit/              # Node.js性能审计（新建）
│       ├── src/
│       │   ├── index.ts             # 主入口
│       │   ├── audit.ts             # 审计功能
│       │   ├── lighthouse-runner.ts
│       │   ├── puppeteer-utils.ts
│       │   └── types.ts
│       ├── package.json
│       └── tsconfig.json
```

---

## 📦 包1: @wfynbzlx666/sdk-perf（浏览器端）

### package.json

```json
{
  "name": "@wfynbzlx666/sdk-perf",
  "version": "3.0.0",
  "description": "浏览器端性能监控SDK - Web Vitals、Performance Observer",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "sideEffects": false,
  "keywords": [
    "performance", 
    "web-vitals", 
    "browser", 
    "metrics",
    "monitoring"
  ],
  "dependencies": {
    "@wfynbzlx666/sdk-core": "^0.0.2"
  },
  "peerDependencies": {},
  "devDependencies": {
    "@types/node": "^22.10.2",
    "typescript": "^5.0.0",
    "tsup": "^8.0.0"
  }
}
```

**注意**：完全移除 `puppeteer` 和 `lighthouse` 依赖！

### src/index.ts

```typescript
/**
 * @wfynbzlx666/sdk-perf
 * 浏览器端性能监控SDK
 */

export { Perf } from './perf'
export type {
  PerfOptions,
  PerfMetric,
  WebVitalsMetric,
  PerformanceObserverMetric,
  AdvancedMetric
} from './types'

// 检查环境
if (typeof window === 'undefined') {
  console.warn(
    '[@wfynbzlx666/sdk-perf] 此包仅支持浏览器环境。' +
    '如需性能审计功能，请使用 @wfynbzlx666/sdk-perf-audit'
  )
}
```

### src/perf.ts（重构版本）

```typescript
import type { PerfOptions, PerfMetric } from './types'

/**
 * 性能监控主类（仅浏览器端功能）
 */
export class Perf {
  private static options: PerfOptions = {}
  private static initialized = false
  private static observers: PerformanceObserver[] = []
  private static cleanupFunctions: (() => void)[] = []

  /**
   * 初始化性能监控
   * @param options 配置选项
   */
  static init(options: Partial<PerfOptions> = {}): void {
    // 环境检查
    if (typeof window === 'undefined') {
      throw new Error('[@wfynbzlx666/sdk-perf] 只能在浏览器环境中使用')
    }

    this.options = {
      sampleRate: 0.1,
      autoEnableWebVitals: true,
      enableDetailedMonitoring: true,
      enableAdvancedMetrics: true,
      enableMemoryLeakDetection: false,
      observeEntryTypes: [
        'navigation',
        'resource',
        'longtask',
        'measure',
        'mark',
        'event'
      ],
      ...options
    }

    this.initialized = true

    // 启动各个监控模块
    if (this.options.autoEnableWebVitals) {
      this.enableWebVitals()
    }

    if (this.options.enableDetailedMonitoring) {
      this.enablePerformanceObserver()
    }

    if (this.options.enableAdvancedMetrics) {
      this.enableAdvancedMetrics()
    }

    if (this.options.enableMemoryLeakDetection) {
      this.enableMemoryLeakDetection()
    }
  }

  /**
   * 启用 Web Vitals 监控
   */
  static enableWebVitals(): void {
    import('./web-vitals').then((module) => {
      module.initWebVitals({
        onMetric: (metric) => this.options.onMetric?.(metric)
      })
    }).catch((error) => {
      console.warn('[Perf] Web Vitals模块加载失败:', error)
    })
  }

  /**
   * 启用 Performance Observer
   */
  static enablePerformanceObserver(): void {
    import('./performance-observer').then((module) => {
      const observer = module.createPerformanceObserver({
        entryTypes: this.options.observeEntryTypes || [],
        enableDetailedMonitoring: this.options.enableDetailedMonitoring,
        onMetric: (metric) => this.options.onMetric?.(metric)
      })
      
      if (observer) {
        this.observers.push(observer)
      }
    }).catch((error) => {
      console.warn('[Perf] Performance Observer模块加载失败:', error)
    })
  }

  /**
   * 启用高级指标监控
   */
  static enableAdvancedMetrics(): void {
    import('./advanced-metrics').then((module) => {
      const cleanup = module.startAdvancedMetrics({
        enableFPS: true,
        enableInteractivity: true,
        enableNetworkQuality: true,
        enableDeviceInfo: true,
        onMetric: (metric) => this.options.onMetric?.(metric)
      })
      
      this.cleanupFunctions.push(cleanup)
    }).catch((error) => {
      console.warn('[Perf] 高级指标模块加载失败:', error)
    })
  }

  /**
   * 启用内存泄漏检测
   */
  static enableMemoryLeakDetection(): void {
    import('./advanced-metrics').then((module) => {
      const cleanup = module.startMemoryLeakDetection(
        (metric) => this.options.onMetric?.(metric)
      )
      
      this.cleanupFunctions.push(cleanup)
    }).catch((error) => {
      console.warn('[Perf] 内存泄漏检测模块加载失败:', error)
    })
  }

  /**
   * 报告路由变化（用于SPA）
   */
  static reportRouteChange(): void {
    if (!this.initialized) {
      console.warn('[Perf] 性能监控未初始化，请先调用 Perf.init()')
      return
    }

    const metric: PerfMetric = {
      name: 'route-change',
      value: performance.now(),
      timestamp: Date.now(),
      type: 'navigation'
    }

    this.options.onMetric?.(metric)
  }

  /**
   * 检查是否已初始化
   */
  static isInitialized(): boolean {
    return this.initialized
  }

  /**
   * 停止监控并清理资源
   */
  static stop(): void {
    // 断开所有观察器
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []

    // 执行所有清理函数
    this.cleanupFunctions.forEach(cleanup => cleanup())
    this.cleanupFunctions = []

    this.initialized = false
  }

  /**
   * 手动记录性能标记
   */
  static mark(name: string): void {
    performance.mark(name)
  }

  /**
   * 手动测量性能
   */
  static measure(name: string, startMark?: string, endMark?: string): void {
    try {
      performance.measure(name, startMark, endMark)
    } catch (error) {
      console.warn(`[Perf] 测量失败: ${name}`, error)
    }
  }
}
```

### tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "lib": ["DOM", "ES2020"],
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: 'es2020',
  platform: 'browser',
  external: [],
})
```

---

## 📦 包2: @wfynbzlx666/sdk-perf-audit（Node.js端）

### package.json

```json
{
  "name": "@wfynbzlx666/sdk-perf-audit",
  "version": "1.0.0",
  "description": "Node.js性能审计工具 - 基于Puppeteer和Lighthouse",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "perf-audit": "./dist/cli.js"
  },
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "keywords": [
    "performance",
    "audit",
    "lighthouse",
    "puppeteer",
    "node"
  ],
  "dependencies": {
    "@wfynbzlx666/sdk-core": "^0.0.2",
    "puppeteer": "^23.9.0",
    "lighthouse": "^12.2.1",
    "chalk": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "typescript": "^5.0.0",
    "tsup": "^8.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### src/index.ts

```typescript
/**
 * @wfynbzlx666/sdk-perf-audit
 * Node.js性能审计工具
 */

export { auditSinglePage, auditMultiplePages } from './audit'
export type { AuditOptions, AuditResult } from './types'

// 环境检查
if (typeof window !== 'undefined') {
  throw new Error(
    '[@wfynbzlx666/sdk-perf-audit] 此包仅支持Node.js环境。' +
    '如需浏览器端性能监控，请使用 @wfynbzlx666/sdk-perf'
  )
}
```

### src/audit.ts

```typescript
import puppeteer from 'puppeteer'
import lighthouse from 'lighthouse'
import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import type { AuditOptions, AuditResult } from './types'

/**
 * 审计单个页面
 */
export async function auditSinglePage(
  url: string,
  options: AuditOptions = {}
): Promise<AuditResult> {
  const {
    lighthouse: lighthouseOptions = {},
    puppeteer: puppeteerOptions = {},
    output = {}
  } = options

  let browser
  let result: AuditResult

  try {
    // 启动浏览器
    browser = await puppeteer.launch({
      headless: true,
      ...puppeteerOptions
    })

    // 运行Lighthouse审计
    const runnerResult = await lighthouse(url, {
      port: new URL(browser.wsEndpoint()).port,
      formFactor: lighthouseOptions.formFactor || 'desktop',
      throttling: lighthouseOptions.throttling || 'none',
      onlyCategories: lighthouseOptions.categories || ['performance']
    })

    if (!runnerResult) {
      throw new Error('Lighthouse审计失败')
    }

    // 提取结果
    result = {
      url,
      scores: {
        performance: runnerResult.lhr.categories.performance?.score || 0,
        accessibility: runnerResult.lhr.categories.accessibility?.score || 0,
        bestPractices: runnerResult.lhr.categories['best-practices']?.score || 0,
        seo: runnerResult.lhr.categories.seo?.score || 0
      },
      metrics: {
        fcp: runnerResult.lhr.audits['first-contentful-paint']?.numericValue || 0,
        lcp: runnerResult.lhr.audits['largest-contentful-paint']?.numericValue || 0,
        tti: runnerResult.lhr.audits['interactive']?.numericValue || 0,
        tbt: runnerResult.lhr.audits['total-blocking-time']?.numericValue || 0,
        cls: runnerResult.lhr.audits['cumulative-layout-shift']?.numericValue || 0,
        si: runnerResult.lhr.audits['speed-index']?.numericValue || 0
      },
      timestamp: Date.now()
    }

    // 保存报告
    if (output.path) {
      await saveReport(runnerResult.report, output.path, output.format || 'html')
      
      if (output.verbose) {
        console.log(`✅ 报告已保存到: ${output.path}`)
      }
    }

    return result

  } catch (error) {
    console.error('性能审计失败:', error)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

/**
 * 审计多个页面
 */
export async function auditMultiplePages(
  urls: string[],
  options: AuditOptions = {}
): Promise<AuditResult[]> {
  const results: AuditResult[] = []

  for (const url of urls) {
    try {
      const result = await auditSinglePage(url, options)
      results.push(result)
    } catch (error) {
      console.error(`审计 ${url} 失败:`, error)
    }
  }

  return results
}

/**
 * 保存报告文件
 */
async function saveReport(
  report: string,
  path: string,
  format: 'html' | 'json'
): Promise<void> {
  const dir = dirname(path)
  await mkdir(dir, { recursive: true })
  await writeFile(path, report, 'utf-8')
}
```

### src/types.ts

```typescript
export interface AuditOptions {
  lighthouse?: {
    formFactor?: 'mobile' | 'desktop'
    throttling?: 'none' | 'mobile3G' | 'mobile4G'
    categories?: string[]
  }
  puppeteer?: {
    headless?: boolean
    timeout?: number
  }
  output?: {
    format?: 'html' | 'json'
    path?: string
    verbose?: boolean
  }
}

export interface AuditResult {
  url: string
  scores: {
    performance: number
    accessibility: number
    bestPractices: number
    seo: number
  }
  metrics: {
    fcp: number
    lcp: number
    tti: number
    tbt: number
    cls: number
    si: number
  }
  timestamp: number
}
```

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  platform: 'node',
  target: 'node18',
  external: ['puppeteer', 'lighthouse'],
})
```

---

## 🔄 迁移指南

### 对于现有用户

#### 1. 浏览器端使用（Vue/React等）

**之前**：
```javascript
import { Perf } from '@wfynbzlx666/sdk-perf'

Perf.init({
  onMetric: (metric) => console.log(metric)
})

router.afterEach(() => {
  Perf.reportRouteChange()
})
```

**现在**：
```bash
# 安装新版本（不包含Puppeteer）
pnpm add @wfynbzlx666/sdk-perf@^3.0.0
```

```javascript
// 代码完全兼容，无需修改！
import { Perf } from '@wfynbzlx666/sdk-perf'

Perf.init({
  onMetric: (metric) => console.log(metric)
})

router.afterEach(() => {
  Perf.reportRouteChange()
})
```

#### 2. Node.js端审计

**之前**：
```javascript
import { auditSinglePage } from '@wfynbzlx666/sdk-perf'

const result = await auditSinglePage('https://example.com')
```

**现在**：
```bash
# 安装审计包
pnpm add -D @wfynbzlx666/sdk-perf-audit
```

```javascript
// 从新包导入
import { auditSinglePage } from '@wfynbzlx666/sdk-perf-audit'

const result = await auditSinglePage('https://example.com')
```

#### 3. 移动脚本文件

将 `src/scripts/perf-generator.js` 移到项目根目录的 `scripts/` 文件夹：

```javascript
// scripts/perf-audit.js
import { auditSinglePage } from '@wfynbzlx666/sdk-perf-audit'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runAudit() {
  const result = await auditSinglePage('https://xixiemperor.github.io/BMT-MicroApps/#/home', {
    lighthouse: {
      formFactor: 'desktop',
      throttling: 'none',
      categories: ['performance', 'accessibility', 'best-practices', 'seo']
    },
    puppeteer: {
      headless: true,
      timeout: 60000
    },
    output: {
      format: 'html',
      path: join(__dirname, 'audit-reports/single-page-report.html'),
      verbose: true
    }
  })

  console.log('\n审计结果:')
  console.log('- 性能:', result.scores.performance.toFixed(1))
  console.log('- 可访问性:', result.scores.accessibility.toFixed(1))
  console.log('- SEO:', result.scores.seo.toFixed(1))
}

runAudit()
```

---

## 📝 package.json 调整

### 在你的Vue项目中

```json
{
  "dependencies": {
    "@wfynbzlx666/sdk-perf": "^3.0.0"  // 浏览器端（轻量级）
  },
  "devDependencies": {
    "@wfynbzlx666/sdk-perf-audit": "^1.0.0"  // 审计工具（开发时使用）
  },
  "scripts": {
    "audit": "node scripts/perf-audit.js",
    "audit:ci": "node scripts/perf-audit.js --format=json --output=reports/audit.json"
  }
}
```

---

## 🚀 发布流程

### 1. 发布浏览器端包

```bash
cd packages/sdk-perf
pnpm build
pnpm publish --access public
```

### 2. 发布审计工具包

```bash
cd packages/sdk-perf-audit
pnpm build
pnpm publish --access public
```

### 3. 版本说明

- `@wfynbzlx666/sdk-perf@3.0.0` - 破坏性更新（移除审计功能）
- `@wfynbzlx666/sdk-perf-audit@1.0.0` - 新包

---

## 📊 效果对比

### 包体积对比

| 包名 | 之前 | 之后 |
|-----|-----|-----|
| @wfynbzlx666/sdk-perf | ~300MB | ~50KB |
| @wfynbzlx666/sdk-perf-audit | - | ~300MB |

### node_modules 大小

**之前**（所有项目都安装）:
```
node_modules/ ~800MB
  ├── puppeteer/ ~280MB
  ├── lighthouse/ ~150MB
  └── ...
```

**之后**（按需安装）:

浏览器项目：
```
node_modules/ ~500MB
  └── @wfynbzlx666/sdk-perf/ ~50KB
```

需要审计的项目：
```
node_modules/ ~800MB
  ├── @wfynbzlx666/sdk-perf/ ~50KB
  └── @wfynbzlx666/sdk-perf-audit/ ~300MB
```

---

## ✅ 总结

### 核心变化

1. ✅ 拆分为两个独立的包
2. ✅ 浏览器包移除所有Node.js依赖
3. ✅ 审计功能独立为开发工具
4. ✅ 保持API兼容性
5. ✅ 按需安装，减少体积

### 下一步行动

1. [ ] 重构 `@wfynbzlx666/sdk-perf` 源码
2. [ ] 创建 `@wfynbzlx666/sdk-perf-audit` 包
3. [ ] 更新文档和示例
4. [ ] 发布新版本
5. [ ] 更新所有使用项目的依赖

---

**需要帮助吗？** 我可以帮你：
- 生成完整的源码文件
- 创建迁移脚本
- 编写测试用例
- 准备发布说明

