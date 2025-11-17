/**
 * @wfynbzlx666/sdk-perf - Audit Module
 * 页面性能审计核心模块
 * 
 * 本模块整合 Puppeteer 和 Lighthouse,提供自动化的页面性能审计功能。
 * 支持批量审计、并发控制、错误处理和重试机制。
 * 
 * 核心特性:
 * - 批量页面审计
 * - 并发控制(基于 TaskQueue)
 * - 自动重试失败的审计
 * - 详细的性能指标提取
 * - 进度回调支持
 * 
 * @module audit
 */

import puppeteer, { type Browser } from 'puppeteer'
import lighthouse from 'lighthouse'
import type {
  AuditConfig,
  AuditOptions,
  AuditResult,
  AuditSummary,
  AuditProgress,
  WebVitalsMetrics,
  PerformanceScores,
  AuditOpportunity
} from './audit-types.js'
import { createTaskQueue } from '@wfynbzlx666/sdk-core'
import { generateReport } from './audit-reporter.js'

/**
 * 检查是否在 Node.js 环境
 */
function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && 
         process.versions != null && 
         process.versions.node != null
}

/**
 * 构建 Lighthouse 配置对象
 */
function buildLighthouseConfig(config: AuditConfig): any {
  const { lighthouse: lhConfig } = config

  // 如果用户提供了自定义配置,直接使用
  if (lhConfig?.customConfig) {
    return lhConfig.customConfig
  }

  // 构建默认配置
  const formFactor = lhConfig?.formFactor || 'mobile'
  const throttling = lhConfig?.throttling || 'mobile4G'
  const categories = lhConfig?.categories || ['performance']

  // 节流配置映射
  const throttlingSettings: Record<string, any> = {
    mobile3G: {
      rttMs: 150,
      throughputKbps: 1.6 * 1024,
      requestLatencyMs: 150 * 3.75,
      downloadThroughputKbps: 1.6 * 1024,
      uploadThroughputKbps: 750,
      cpuSlowdownMultiplier: 4
    },
    mobile4G: {
      rttMs: 40,
      throughputKbps: 10 * 1024,
      requestLatencyMs: 40 * 3.75,
      downloadThroughputKbps: 10 * 1024,
      uploadThroughputKbps: 5 * 1024,
      cpuSlowdownMultiplier: 1
    },
    none: undefined
  }

  // 只包含用户选择的类别
  const onlyCategories = categories.reduce((acc, cat) => {
    acc[cat] = { id: cat }
    return acc
  }, {} as Record<string, any>)

  return {
    extends: 'lighthouse:default',
    settings: {
      formFactor,
      throttling: throttlingSettings[throttling],
      screenEmulation: formFactor === 'mobile' ? {
        mobile: true,
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        disabled: false
      } : {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false
      },
      onlyCategories: categories
    }
  }
}

/**
 * 从 Lighthouse 结果中提取 Web Vitals 指标
 */
function extractWebVitals(lhr: any): WebVitalsMetrics {
  const audits = lhr.audits || {}

  // 提取 LCP 元素截图
  let lcpScreenshot: string | null = null
  try {
    const lcpAudit = audits['largest-contentful-paint-element']
    if (lcpAudit?.details?.items?.[0]) {
      const lcpElement = lcpAudit.details.items[0]
      lcpScreenshot = lcpElement.items[0].node.snippet
      // Lighthouse 会在 details 中提供 LCP 元素的截图数据
      // if (lcpElement.node?.lhId) {
      //   // 尝试从 fullPageScreenshot 中找到对应元素的截图
      //   const screenshots = lhr.audits['full-page-screenshot']
      //   if (screenshots?.details?.screenshot) {
      //     lcpScreenshot = screenshots.details.screenshot.data
      //   } else if (lhr.audits['screenshot-thumbnails']?.details?.items?.[0]) {
      //     // 降级方案：使用缩略图截图
      //     lcpScreenshot = lhr.audits['screenshot-thumbnails'].details.items[0].data
      //   } else if (lhr.audits['final-screenshot']?.details?.data) {
      //     // 再降级：使用最终截图
      //     lcpScreenshot = lhr.audits['final-screenshot'].details.data
      //   }
      // }
    }
  } catch (error) {
    // 截图提取失败不影响其他指标
    console.warn('提取 LCP 截图失败:', error)
  }

  return {
    lcp: audits['largest-contentful-paint']?.numericValue || null,
    lcpScreenshot,
    fid: audits['max-potential-fid']?.numericValue || null,
    cls: audits['cumulative-layout-shift']?.numericValue || null,
    fcp: audits['first-contentful-paint']?.numericValue || null,
    ttfb: audits['server-response-time']?.numericValue || null,
    tbt: audits['total-blocking-time']?.numericValue || null,
    speedIndex: audits['speed-index']?.numericValue || null
  }
}

/**
 * 从 Lighthouse 结果中提取性能分数
 */
function extractScores(lhr: any): PerformanceScores {
  const categories = lhr.categories || {}

  return {
    performance: categories.performance?.score ? categories.performance.score * 100 : null,
    accessibility: categories.accessibility?.score ? categories.accessibility.score * 100 : null,
    bestPractices: categories['best-practices']?.score ? categories['best-practices'].score * 100 : null,
    seo: categories.seo?.score ? categories.seo.score * 100 : null,
    pwa: categories.pwa?.score ? categories.pwa.score * 100 : null
  }
}

/**
 * Lighthouse 优化建议中英文翻译映射表
 */
const OPPORTUNITY_TRANSLATIONS: Record<string, { title: string; description: string }> = {
  'render-blocking-resources': {
    title: '消除阻塞渲染的资源',
    description: '资源阻塞了页面的首次绘制。考虑内联关键资源，延迟加载非关键资源，或移除未使用的资源。'
  },
  'unused-css-rules': {
    title: '移除未使用的 CSS',
    description: '从样式表中删除未使用的规则，减少不必要的字节消耗。'
  },
  'unused-javascript': {
    title: '移除未使用的 JavaScript',
    description: '减少未使用的 JavaScript 代码，降低网络传输时间和脚本解析时间。'
  },
  'uses-optimized-images': {
    title: '使用优化的图片格式',
    description: '使用 WebP 或 AVIF 等现代图片格式可以比 PNG 或 JPEG 提供更好的压缩效果。'
  },
  'modern-image-formats': {
    title: '使用新一代图片格式',
    description: 'WebP 和 AVIF 等图片格式通常比 PNG 或 JPEG 压缩效果更好，可以加快下载速度并减少数据消耗。'
  },
  'uses-responsive-images': {
    title: '使用合适尺寸的图片',
    description: '提供不同尺寸的图片以节省移动数据并提高加载时间。'
  },
  'offscreen-images': {
    title: '延迟加载屏幕外图片',
    description: '考虑延迟加载视口外的图片，以减少加载时间和数据使用。'
  },
  'unminified-css': {
    title: '压缩 CSS',
    description: '压缩 CSS 文件可以减小网络负载大小。'
  },
  'unminified-javascript': {
    title: '压缩 JavaScript',
    description: '压缩 JavaScript 文件可以减小负载大小和脚本解析时间。'
  },
  'uses-text-compression': {
    title: '启用文本压缩',
    description: '文本资源应该使用压缩（gzip、deflate 或 brotli）来最小化总网络字节数。'
  },
  'uses-rel-preconnect': {
    title: '预连接到所需的源',
    description: '考虑添加 preconnect 或 dns-prefetch 资源提示来建立与重要第三方源的早期连接。'
  },
  'server-response-time': {
    title: '减少服务器响应时间（TTFB）',
    description: '保持服务器响应时间低，因为高 TTFB 会延迟所有后续资源的加载。'
  },
  'redirects': {
    title: '避免多次页面重定向',
    description: '重定向会在页面加载前引入额外的延迟。'
  },
  'uses-rel-preload': {
    title: '预加载关键请求',
    description: '考虑使用 <link rel=preload> 来优先获取当前页面晚些时候发现的资源。'
  },
  'efficient-animated-content': {
    title: '使用视频格式来提供动画内容',
    description: '大型 GIF 对于提供动画内容效率很低。考虑使用 MPEG4/WebM 视频替代 GIF 以节省网络字节。'
  },
  'duplicated-javascript': {
    title: '移除重复的 JavaScript 模块',
    description: '删除大型的重复 JavaScript 模块以减少不必要的字节消耗。'
  },
  'legacy-javascript': {
    title: '避免提供旧版 JavaScript 给现代浏览器',
    description: 'Polyfill 和转译对于旧版浏览器是必要的，但对于现代浏览器则会减慢页面加载速度。'
  },
  'total-byte-weight': {
    title: '避免巨大的网络负载',
    description: '大型网络负载成本高昂，可能会严重延迟加载时间。'
  },
  'uses-long-cache-ttl': {
    title: '使用高效的缓存策略提供静态资源',
    description: '较长的缓存生命周期可以加快重复访问页面的速度。'
  },
  'dom-size': {
    title: '避免过大的 DOM 尺寸',
    description: '大型 DOM 会增加内存使用，导致更长的样式计算时间，并产生昂贵的布局重排。'
  },
  'critical-request-chains': {
    title: '最小化关键请求深度',
    description: '关键请求链表示使用关键渲染路径优先级获取的资源。降低这些链的长度和减小文件大小可以提高页面加载速度。'
  },
  'user-timings': {
    title: '用户计时标记和测量',
    description: '考虑使用 User Timing API 来测量应用的真实性能。'
  },
  'bootup-time': {
    title: '减少 JavaScript 执行时间',
    description: '考虑减少 JavaScript 解析、编译和执行所花费的时间。您可能会发现交付更小的 JavaScript 负载有助于此。'
  },
  'mainthread-work-breakdown': {
    title: '最小化主线程工作',
    description: '考虑减少解析、编译和执行 JS 所花费的时间。您可能会发现交付更小的 JS 负载有助于此。'
  },
  'font-display': {
    title: '确保文本在 webfont 加载期间保持可见',
    description: '利用 font-display CSS 功能来确保文本对用户始终可见。'
  },
  'third-party-summary': {
    title: '减少第三方代码的影响',
    description: '第三方代码会显著影响加载性能。限制使用的第三方供应商数量并尝试在主要内容加载后加载第三方代码。'
  },
  'third-party-facades': {
    title: '使用延迟加载第三方资源',
    description: '某些第三方嵌入可以延迟加载。考虑用门面替换它们，直到它们在视口中。'
  },
  'largest-contentful-paint-element': {
    title: '最大内容绘制元素',
    description: '这是在视口中渲染的最大元素。'
  },
  'lcp-lazy-loaded': {
    title: 'LCP 元素不应该延迟加载',
    description: '最大内容绘制元素不应该延迟加载，因为这会延迟关键内容的渲染。'
  },
  'layout-shift-elements': {
    title: '避免大型布局偏移',
    description: '这些 DOM 元素对页面的 CLS 贡献最大。'
  },
  'uses-passive-event-listeners': {
    title: '使用被动监听器来提高滚动性能',
    description: '考虑将触摸和滚轮事件监听器标记为 passive 以提高页面的滚动性能。'
  },
  'no-document-write': {
    title: '避免使用 document.write()',
    description: '对于连接速度慢的用户，通过 document.write() 引入的外部脚本可能会延迟页面加载数十秒。'
  },
  'long-tasks': {
    title: '避免长主线程任务',
    description: '列出了占据主线程最长时间的任务，这些任务可能会导致输入延迟。'
  }
}

/**
 * 翻译优化建议标题
 */
function translateOpportunityTitle(id: string, originalTitle: string): string {
  return OPPORTUNITY_TRANSLATIONS[id]?.title || originalTitle
}

/**
 * 翻译优化建议描述
 */
function translateOpportunityDescription(id: string, originalDescription: string): string {
  return OPPORTUNITY_TRANSLATIONS[id]?.description || originalDescription
}


/**
 * 从 Lighthouse 结果中提取优化建议
 */
function extractOpportunities(lhr: any): AuditOpportunity[] {
  const audits = lhr.audits || {}
  const opportunities: AuditOpportunity[] = []

  // 遍历所有审计项,找出有优化空间的项
  for (const [id, audit] of Object.entries(audits) as [string, any][]) {
    // 只提取有节省潜力的项
    if (audit.details?.type === 'opportunity' && audit.numericValue) {
      opportunities.push({
        id,
        title: translateOpportunityTitle(id, audit.title),
        description: translateOpportunityDescription(id, audit.description || ''),
        savings: audit.numericValue,
        score: audit.score
      })
    }
  }

  // 按节省时间排序
  return opportunities.sort((a, b) => (b.savings || 0) - (a.savings || 0))
}

/**
 * 审计单个页面
 * @internal
 */
async function auditSinglePageInternal(
  url: string,
  browser: Browser,
  config: AuditConfig,
  retryCount = 0
): Promise<AuditResult> {
  const startTime = Date.now()
  const maxRetries = config.retryCount || 1

  try {
    // 获取浏览器的 WebSocket 端点
    const browserWSEndpoint = browser.wsEndpoint()

    // 运行 Lighthouse
    const lighthouseConfig = buildLighthouseConfig(config)

    // 构建 Lighthouse flags（命令行选项）
    // 这些参数会传递给 Lighthouse API
    const lighthouseFlags = {
      port: parseInt(new URL(browserWSEndpoint).port),
      // output: 报告输出格式（必须是数组）
      // 支持: ['json'], ['html'], ['csv'] 或多格式 ['json', 'html']
      output: (config.output?.format ? [config.output.format] : ['json']) as ('json' | 'html' | 'csv')[],
      // outputPath: 报告文件保存路径
      // 如果指定，Lighthouse 会自动将报告保存到该路径
      outputPath: config.output?.path ? config.output.path : undefined,
      // logLevel: 日志级别
      // 'info' - 详细日志，'error' - 只显示错误
      logLevel: (config.output?.verbose ? 'info' : 'error') as 'info' | 'error'
    }

    const runnerResult = await lighthouse(url, lighthouseFlags, lighthouseConfig)

    if (!runnerResult || !runnerResult.lhr) {
      throw new Error('Lighthouse 审计失败: 未返回结果')
    }

    const lhr = runnerResult.lhr

    // 提取关键指标
    const metrics = extractWebVitals(lhr)
    const scores = extractScores(lhr)
    const opportunities = extractOpportunities(lhr)

    const duration = Date.now() - startTime

    return {
      url,
      timestamp: Date.now(),
      success: true,
      metrics,
      scores,
      opportunities,
      duration,
      lighthouseResult: lhr
    }
  } catch (error) {
    // 如果还有重试次数,则重试
    if (retryCount < maxRetries) {
      if (config.output?.verbose) {
        console.warn(`审计失败,正在重试 (${retryCount + 1}/${maxRetries}):`, url)
      }
      return auditSinglePageInternal(url, browser, config, retryCount + 1)
    }

    // 重试失败,返回错误结果
    const duration = Date.now() - startTime
    return {
      url,
      timestamp: Date.now(),
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration
    }
  }
}

/**
 * 审计单个页面
 * 
 * 使用 Puppeteer 和 Lighthouse 审计指定 URL 的性能。
 * 该函数会启动一个浏览器实例,执行审计后自动关闭。
 * 
 * @param url - 要审计的页面 URL
 * @param config - 审计配置(可选)
 * @returns 审计结果
 * 
 * @example
 * ```typescript
 * const result = await auditSinglePage('https://example.com', {
 *   lighthouse: {
 *     formFactor: 'mobile',
 *     categories: ['performance']
 *   }
 * })
 * console.log('性能分数:', result.scores?.performance)
 * ```
 */
export async function auditSinglePage(
  url: string,
  config: Partial<AuditConfig> = {}
): Promise<AuditResult> {
  // 环境检查
  if (!isNodeEnvironment()) {
    throw new Error('审计功能仅在 Node.js 环境中可用,浏览器环境不支持')
  }

  // 合并配置
  const fullConfig: AuditConfig = {
    urls: [url],
    ...config
  }

  // 启动浏览器
  const browser = await puppeteer.launch({
    headless: config.puppeteer?.headless !== false,
    executablePath: config.chromePath ? 
      config.chromePath :
      undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ...config.puppeteer?.launchOptions
  })

  // 打开页面
  const page = await browser.newPage()
  await page.coverage.startJSCoverage(),
  // Navigate to page
  await page.goto(url);
  // Disable both JavaScript and CSS coverage
  const jsCoverage = await page.coverage.stopJSCoverage();
  console.log('JavaScript 覆盖率:', jsCoverage)

  try {
    const result = await auditSinglePageInternal(url, browser, fullConfig)
    if (config.output?.path) {
      await generateReport([result], config.output.format || 'json', config.output.path)
    }

    return result
  } finally {
    await browser.close()
  }
}

/**
 * 批量审计多个页面
 * 
 * 使用 Puppeteer 和 Lighthouse 批量审计多个页面的性能。
 * 支持并发控制、进度回调和失败重试。
 * 
 * @param config - 审计配置
 * @returns 审计结果汇总
 */
export async function auditPages(config: AuditOptions): Promise<AuditSummary> {
  // 环境检查
  if (!isNodeEnvironment()) {
    throw new Error('审计功能仅在 Node.js 环境中可用,浏览器环境不支持')
  }

  // 验证配置
  if (!config.urls || config.urls.length === 0) {
    throw new Error('必须提供至少一个 URL')
  }

  const startTime = Date.now()
  const total = config.urls.length
  const results: AuditResult[] = []

  // 启动浏览器(复用同一个浏览器实例)
  const browser = await puppeteer.launch({
    headless: config.puppeteer?.headless !== false,
    executablePath: config.chromePath ?
      config.chromePath :
      undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ...config.puppeteer?.launchOptions
  })

  try {
    // 创建任务队列进行并发控制
    const queue = createTaskQueue({ 
      maxConcurrent: config.concurrency || 3 
    })

    // 为每个 URL 创建审计任务
    const tasks = config.urls.map((url, index) => {
      return queue.addTask(async () => {
        // 触发进度回调 - 开始
        if (config.onProgress) {
          config.onProgress({
            url,
            current: index + 1,
            total,
            percentage: Math.round(((index) / total) * 100),
            status: 'running'
          })
        }

        // 执行审计
        const result = await auditSinglePageInternal(url, browser, config)
        results.push(result)

        // 触发进度回调 - 完成
        if (config.onProgress) {
          config.onProgress({
            url,
            current: index + 1,
            total,
            percentage: Math.round(((index + 1) / total) * 100),
            status: result.success ? 'completed' : 'failed'
          })
        }

        // 输出详细日志
        if (config.output?.verbose) {
          const status = result.success ? '✓' : '✗'
          const score = result.scores?.performance || 'N/A'
          console.log(`[${index + 1}/${total}] ${status} ${url} - 性能分数: ${score}`)
        }

        return result
      })
    })

    // 等待所有任务完成
    await queue.start()

    // 如果配置了输出路径，则生成报告
    if (config.output?.path) {
      await generateReport(results, config.output.format || 'json', config.output.path)
    }

    // 计算汇总数据
    const success = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const totalDuration = Date.now() - startTime

    // 计算平均性能分数
    const performanceScores = results
      .filter(r => r.success && r.scores?.performance != null)
      .map(r => r.scores!.performance!)
    
    const averagePerformanceScore = performanceScores.length > 0
      ? performanceScores.reduce((sum, score) => sum + score, 0) / performanceScores.length
      : null

    const summary: AuditSummary = {
      total,
      success,
      failed,
      totalDuration,
      averagePerformanceScore,
      results
    }

    // 输出汇总信息
    if (config.output?.verbose) {
      console.log('\n=== 审计完成 ===')
      console.log(`总计: ${total} | 成功: ${success} | 失败: ${failed}`)
      console.log(`总耗时: ${(totalDuration / 1000).toFixed(2)}s`)
      if (averagePerformanceScore !== null) {
        console.log(`平均性能分数: ${averagePerformanceScore.toFixed(1)}`)
      }
    }

    return summary
  } finally {
    await browser.close()
  }
}

/**
 * 快速审计(使用默认配置)
 * 
 * 提供最简单的调用方式,使用推荐的默认配置快速审计页面。
 * 
 * @param urls - URL 数组或单个 URL
 * @returns 审计结果汇总或单个结果
 * 
 * @example
 * ```typescript
 * // 审计单个页面
 * const result = await quickAudit('https://example.com')
 * 
 * // 审计多个页面
 * const summary = await quickAudit([
 *   'https://example.com',
 *   'https://example.com/about'
 * ])
 * ```
 */
export async function quickAudit(
  urls: string | string[]
): Promise<AuditResult | AuditSummary> {
  const urlArray = Array.isArray(urls) ? urls : [urls]

  if (urlArray.length === 1) {
    return auditSinglePage(urlArray[0])
  }

  return auditPages({
    urls: urlArray,
    lighthouse: {
      formFactor: 'mobile',
      categories: ['performance']
    },
    concurrency: 3
  })
}

