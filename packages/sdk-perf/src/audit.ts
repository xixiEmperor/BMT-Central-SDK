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

  return {
    lcp: audits['largest-contentful-paint']?.numericValue || null,
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
        title: audit.title,
        description: audit.description || '',
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
    const runnerResult = await lighthouse(url, {
      port: parseInt(new URL(browserWSEndpoint).port),
      output: 'json',
      logLevel: config.output?.verbose ? 'info' : 'error'
    }, lighthouseConfig)

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

  try {
    const result = await auditSinglePageInternal(url, browser, fullConfig)
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
 * 
 * @example
 * ```typescript
 * const summary = await auditPages({
 *   urls: [
 *     'https://example.com',
 *     'https://example.com/about',
 *     'https://example.com/contact'
 *   ],
 *   lighthouse: {
 *     formFactor: 'desktop',
 *     categories: ['performance', 'accessibility']
 *   },
 *   concurrency: 2,
 *   output: {
 *     format: 'json',
 *     path: './audit-results.json'
 *   }
 * })
 * 
 * console.log(`审计完成: ${summary.success}/${summary.total}`)
 * console.log(`平均性能分数: ${summary.averagePerformanceScore}`)
 * ```
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
    await Promise.all(tasks)

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

