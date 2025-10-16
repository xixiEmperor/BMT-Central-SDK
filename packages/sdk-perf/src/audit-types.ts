/**
 * @wfynbzlx666/sdk-perf - Audit Types
 * 性能审计相关类型定义
 * 
 * 本模块定义了使用 Puppeteer 和 Lighthouse 进行页面性能审计时所需的所有类型。
 * 这些类型支持批量页面审计、自定义配置和多格式报告输出。
 * 
 * @module audit-types
 */

import type { Result as LighthouseResult } from 'lighthouse'
import type { PuppeteerLaunchOptions } from 'puppeteer'

/**
 * Lighthouse 表单因子类型
 * - mobile: 移动设备模拟
 * - desktop: 桌面设备
 */
export type FormFactor = 'mobile' | 'desktop'

/**
 * Lighthouse 网络节流配置
 * - mobile3G: 模拟 3G 移动网络
 * - mobile4G: 模拟 4G 移动网络
 * - none: 不进行节流
 */
export type ThrottlingMode = 'mobile3G' | 'mobile4G' | 'none'

/**
 * Lighthouse 审计类别
 * - performance: 性能
 * - accessibility: 可访问性
 * - best-practices: 最佳实践
 * - seo: SEO 优化
 * - pwa: 渐进式 Web 应用
 */
export type AuditCategory = 'performance' | 'accessibility' | 'best-practices' | 'seo' | 'pwa'

/**
 * 报告输出格式
 * - json: JSON 格式(完整数据)
 * - html: HTML 格式(可视化报告)
 * - csv: CSV 格式(表格数据)
 */
export type ReportFormat = 'json' | 'html' | 'csv'

/**
 * Lighthouse 配置选项
 */
export interface LighthouseConfig {
  /**
   * 表单因子(移动/桌面)
   * @default 'mobile'
   */
  formFactor?: FormFactor

  /**
   * 网络节流模式
   * @default 'mobile4G'
   */
  throttling?: ThrottlingMode

  /**
   * 要审计的类别数组
   * @default ['performance']
   */
  categories?: AuditCategory[]

  /**
   * 自定义 Lighthouse 配置对象
   * 高级用户可以直接传入 Lighthouse 配置
   */
  customConfig?: any
}

/**
 * Puppeteer 配置选项
 */
export interface PuppeteerConfig {
  /**
   * 是否以无头模式运行
   * @default true
   */
  headless?: boolean

  /**
   * 页面超时时间(毫秒)
   * @default 30000
   */
  timeout?: number

  /**
   * 自定义 Puppeteer 启动选项
   * 可以传入额外的 Chromium 启动参数
   */
  launchOptions?: PuppeteerLaunchOptions
}

/**
 * 输出配置选项
 */
export interface OutputConfig {
  /**
   * 报告格式
   * @default 'json'
   */
  format?: ReportFormat

  /**
   * 输出文件路径
   * 如果不指定,则只返回结果不保存到文件
   */
  path?: string

  /**
   * 是否在控制台输出详细日志
   * @default false
   */
  verbose?: boolean
}

/**
 * 审计配置接口
 * 用户传入的完整配置对象
 */
export interface AuditConfig {
  /**
   * 要审计的页面 URL 数组
   * @required
   */
  urls: string[]

  /**
   * 用户本地Chrome浏览器路径
   * @default ''
   */
  chromePath?: string

  /**
   * Lighthouse 配置选项
   */
  lighthouse?: LighthouseConfig

  /**
   * Puppeteer 配置选项
   */
  puppeteer?: PuppeteerConfig

  /**
   * 输出配置选项
   */
  output?: OutputConfig

  /**
   * 并发数量
   * 控制同时运行的审计任务数量
   * @default 3
   */
  concurrency?: number

  /**
   * 失败重试次数
   * @default 1
   */
  retryCount?: number
}

/**
 * Core Web Vitals 指标
 */
export interface WebVitalsMetrics {
  /** Largest Contentful Paint - 最大内容绘制(毫秒) */
  lcp: number | null

  /** First Input Delay - 首次输入延迟(毫秒) */
  fid: number | null

  /** Cumulative Layout Shift - 累积布局偏移(分数) */
  cls: number | null

  /** First Contentful Paint - 首次内容绘制(毫秒) */
  fcp: number | null

  /** Time to First Byte - 首字节时间(毫秒) */
  ttfb: number | null

  /** Total Blocking Time - 总阻塞时间(毫秒) */
  tbt: number | null

  /** Speed Index - 速度指数 */
  speedIndex: number | null
}

/**
 * 性能分数(0-100)
 */
export interface PerformanceScores {
  /** 性能分数 */
  performance: number | null

  /** 可访问性分数 */
  accessibility: number | null

  /** 最佳实践分数 */
  bestPractices: number | null

  /** SEO 分数 */
  seo: number | null

  /** PWA 分数 */
  pwa: number | null
}

/**
 * 审计机会(优化建议)
 */
export interface AuditOpportunity {
  /** 审计项 ID */
  id: string

  /** 审计项标题 */
  title: string

  /** 描述信息 */
  description: string

  /** 预计可节省的时间(毫秒) */
  savings?: number

  /** 影响程度分数 */
  score: number | null
}

/**
 * 单个页面审计结果
 */
export interface AuditResult {
  /** 审计的 URL */
  url: string

  /** 审计时间戳 */
  timestamp: number

  /** 审计是否成功 */
  success: boolean

  /** 错误信息(如果失败) */
  error?: string

  /** Core Web Vitals 指标 */
  metrics?: WebVitalsMetrics

  /** 各类别评分 */
  scores?: PerformanceScores

  /** 优化建议列表 */
  opportunities?: AuditOpportunity[]

  /** 审计耗时(毫秒) */
  duration?: number

  /** 完整的 Lighthouse 结果(可选) */
  lighthouseResult?: LighthouseResult
}

/**
 * 批量审计结果汇总
 */
export interface AuditSummary {
  /** 总审计页面数 */
  total: number

  /** 成功数量 */
  success: number

  /** 失败数量 */
  failed: number

  /** 总耗时(毫秒) */
  totalDuration: number

  /** 平均性能分数 */
  averagePerformanceScore: number | null

  /** 所有审计结果 */
  results: AuditResult[]
}

/**
 * 审计进度回调参数
 */
export interface AuditProgress {
  /** 当前 URL */
  url: string

  /** 当前索引(从 1 开始) */
  current: number

  /** 总数量 */
  total: number

  /** 进度百分比(0-100) */
  percentage: number

  /** 当前状态 */
  status: 'pending' | 'running' | 'completed' | 'failed'
}

/**
 * 审计选项(内部使用,包含回调)
 */
export interface AuditOptions extends AuditConfig {
  /**
   * 进度回调函数
   * 每当一个页面审计状态改变时调用
   */
  onProgress?: (progress: AuditProgress) => void
}

