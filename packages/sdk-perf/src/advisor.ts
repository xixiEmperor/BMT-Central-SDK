/**
 * 性能建议引擎
 * 
 * 该模块基于收集到的性能数据，提供智能的性能优化建议。
 * 通过分析各项性能指标，自动识别性能瓶颈并给出针对性的优化建议。
 */

import type { PerfMetric, PerfRating } from './types.js'

/**
 * 建议类型枚举
 */
export type AdviceType = 
  | 'optimization'  // 优化建议
  | 'warning'       // 警告
  | 'error'         // 错误
  | 'info'          // 信息

/**
 * 建议优先级枚举
 */
export type AdvicePriority = 'low' | 'medium' | 'high' | 'critical'

/**
 * 建议分类枚举
 */
export type AdviceCategory = 
  | 'loading'       // 加载性能
  | 'rendering'     // 渲染性能
  | 'interactivity' // 交互性能
  | 'memory'        // 内存优化
  | 'network'       // 网络优化
  | 'bundle'        // 代码打包
  | 'caching'       // 缓存策略
  | 'general'       // 通用建议

/**
 * 性能建议接口
 */
export interface PerformanceAdvice {
  /** 建议唯一标识 */
  id: string
  /** 建议类型 */
  type: AdviceType
  /** 建议优先级 */
  priority: AdvicePriority
  /** 建议分类 */
  category: AdviceCategory
  /** 建议标题 */
  title: string
  /** 详细描述 */
  description: string
  /** 具体建议内容 */
  suggestions: string[]
  /** 相关的性能指标 */
  relatedMetrics: string[]
  /** 预期改善效果 */
  expectedImprovement?: string
  /** 实施难度 */
  difficulty?: 'easy' | 'medium' | 'hard'
  /** 相关文档链接 */
  references?: string[]
  /** 生成时间戳 */
  timestamp: number
}

/**
 * 分析结果接口
 */
export interface PerformanceAnalysis {
  /** 整体性能评分 (0-100) */
  overallScore: number
  /** 性能等级 */
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  /** 关键问题数量 */
  criticalIssues: number
  /** 建议列表 */
  advices: PerformanceAdvice[]
  /** 分析摘要 */
  summary: {
    strengths: string[]      // 优势点
    weaknesses: string[]     // 薄弱环节
    quickWins: string[]      // 快速改进点
  }
  /** 分析时间戳 */
  timestamp: number
}

/**
 * 性能分析配置
 */
export interface AnalysisOptions {
  /** 是否包含低优先级建议 */
  includeLowPriority?: boolean
  /** 最大建议数量 */
  maxAdvices?: number
  /** 分析时间窗口（毫秒） */
  timeWindow?: number
  /** 自定义阈值 */
  customThresholds?: Record<string, { good: number; poor: number }>
}

/**
 * 性能建议生成器
 */
export class PerformanceAdvisor {
  private metrics: PerfMetric[] = []
  private analysisHistory: PerformanceAnalysis[] = []
  
  /**
   * 添加性能指标数据
   */
  addMetric(metric: PerfMetric): void {
    this.metrics.push(metric)
    
    // 保持最近1000条数据
    if (this.metrics.length > 1000) {
      this.metrics.shift()
    }
  }

  /**
   * 批量添加性能指标
   */
  addMetrics(metrics: PerfMetric[]): void {
    metrics.forEach(metric => this.addMetric(metric))
  }

  /**
   * 生成性能分析报告
   */
  generateAnalysis(options: AnalysisOptions = {}): PerformanceAnalysis {
    const {
      includeLowPriority = false,
      maxAdvices = 20,
      timeWindow = 5 * 60 * 1000, // 默认5分钟
      customThresholds = {}
    } = options

    // 获取时间窗口内的指标
    const now = Date.now()
    const recentMetrics = this.metrics.filter(
      metric => now - metric.ts <= timeWindow
    )

    if (recentMetrics.length === 0) {
      return this.createEmptyAnalysis()
    }

    // 分析各类性能指标
    const webVitalsAdvices = this.analyzeWebVitals(recentMetrics, customThresholds)
    const navigationAdvices = this.analyzeNavigation(recentMetrics)
    const resourceAdvices = this.analyzeResources(recentMetrics)
    const memoryAdvices = this.analyzeMemory(recentMetrics)
    const generalAdvices = this.analyzeGeneral(recentMetrics)

    // 合并所有建议
    let allAdvices = [
      ...webVitalsAdvices,
      ...navigationAdvices,
      ...resourceAdvices,
      ...memoryAdvices,
      ...generalAdvices
    ]

    // 过滤低优先级建议
    if (!includeLowPriority) {
      allAdvices = allAdvices.filter(advice => advice.priority !== 'low')
    }

    // 按优先级排序并限制数量
    allAdvices.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    allAdvices = allAdvices.slice(0, maxAdvices)

    // 计算整体评分
    const overallScore = this.calculateOverallScore(recentMetrics)
    const grade = this.getGrade(overallScore)
    const criticalIssues = allAdvices.filter(a => a.priority === 'critical').length

    // 生成摘要
    const summary = this.generateSummary(recentMetrics, allAdvices)

    const analysis: PerformanceAnalysis = {
      overallScore,
      grade,
      criticalIssues,
      advices: allAdvices,
      summary,
      timestamp: now
    }

    // 保存到历史记录
    this.analysisHistory.push(analysis)
    if (this.analysisHistory.length > 10) {
      this.analysisHistory.shift()
    }

    return analysis
  }

  /**
   * 获取最新的分析结果
   */
  getLatestAnalysis(): PerformanceAnalysis | null {
    return this.analysisHistory[this.analysisHistory.length - 1] || null
  }

  /**
   * 获取分析历史
   */
  getAnalysisHistory(): PerformanceAnalysis[] {
    return [...this.analysisHistory]
  }

  /**
   * 清除数据
   */
  clear(): void {
    this.metrics = []
    this.analysisHistory = []
  }

  /**
   * 分析 Web Vitals 指标
   */
  private analyzeWebVitals(
    metrics: PerfMetric[], 
    customThresholds: Record<string, any>
  ): PerformanceAdvice[] {
    const advices: PerformanceAdvice[] = []
    const vitalsMetrics = metrics.filter(m => m.type === 'vitals')

    // 分析 LCP (Largest Contentful Paint)
    const lcpMetrics = vitalsMetrics.filter(m => m.name === 'LCP')
    if (lcpMetrics.length > 0) {
      const avgLCP = lcpMetrics.reduce((sum, m) => sum + m.value, 0) / lcpMetrics.length
      const lcpThreshold = customThresholds.lcp || { good: 2500, poor: 4000 }
      
      if (avgLCP > lcpThreshold.poor) {
        advices.push({
          id: 'lcp-poor',
          type: 'error',
          priority: 'critical',
          category: 'loading',
          title: 'LCP (最大内容绘制) 过慢',
          description: `当前平均 LCP 为 ${Math.round(avgLCP)}ms，严重超出推荐阈值`,
          suggestions: [
            '优化图片加载：使用 WebP 格式、设置适当的尺寸、启用懒加载',
            '优化服务器响应时间：使用 CDN、启用压缩、优化数据库查询',
            '减少资源阻塞：内联关键 CSS、延迟加载非关键 JavaScript',
            '使用资源预加载：<link rel="preload"> 预加载关键资源'
          ],
          relatedMetrics: ['LCP'],
          expectedImprovement: '可将 LCP 改善 30-50%',
          difficulty: 'medium',
          references: [
            'https://web.dev/lcp/',
            'https://developer.chrome.com/docs/lighthouse/performance/largest-contentful-paint/'
          ],
          timestamp: Date.now()
        })
      } else if (avgLCP > lcpThreshold.good) {
        advices.push({
          id: 'lcp-needs-improvement',
          type: 'warning',
          priority: 'high',
          category: 'loading',
          title: 'LCP 可进一步优化',
          description: `当前 LCP 为 ${Math.round(avgLCP)}ms，可以进一步优化`,
          suggestions: [
            '优化图片格式和压缩',
            '启用浏览器缓存',
            '优化 CSS 和 JavaScript 加载顺序'
          ],
          relatedMetrics: ['LCP'],
          expectedImprovement: '可将 LCP 改善 15-25%',
          difficulty: 'easy',
          timestamp: Date.now()
        })
      }
    }

    // 分析 FID (First Input Delay)
    const fidMetrics = vitalsMetrics.filter(m => m.name === 'FID')
    if (fidMetrics.length > 0) {
      const avgFID = fidMetrics.reduce((sum, m) => sum + m.value, 0) / fidMetrics.length
      const fidThreshold = customThresholds.fid || { good: 100, poor: 300 }
      
      if (avgFID > fidThreshold.poor) {
        advices.push({
          id: 'fid-poor',
          type: 'error',
          priority: 'critical',
          category: 'interactivity',
          title: 'FID (首次输入延迟) 过高',
          description: `当前平均 FID 为 ${Math.round(avgFID)}ms，用户交互响应缓慢`,
          suggestions: [
            '拆分长任务：将大型 JavaScript 任务分解为较小的异步任务',
            '优化 JavaScript 执行：使用 Web Workers 处理非 UI 任务',
            '减少主线程工作：优化第三方脚本、减少 DOM 操作',
            '代码分割：使用动态导入延迟加载非关键代码'
          ],
          relatedMetrics: ['FID'],
          expectedImprovement: '可将 FID 降低 40-60%',
          difficulty: 'hard',
          timestamp: Date.now()
        })
      }
    }

    // 分析 CLS (Cumulative Layout Shift)
    const clsMetrics = vitalsMetrics.filter(m => m.name === 'CLS')
    if (clsMetrics.length > 0) {
      const avgCLS = clsMetrics.reduce((sum, m) => sum + m.value, 0) / clsMetrics.length
      const clsThreshold = customThresholds.cls || { good: 0.1, poor: 0.25 }
      
      if (avgCLS > clsThreshold.poor) {
        advices.push({
          id: 'cls-poor',
          type: 'error',
          priority: 'high',
          category: 'rendering',
          title: 'CLS (累积布局偏移) 过高',
          description: `当前 CLS 评分为 ${avgCLS.toFixed(3)}，页面布局不稳定`,
          suggestions: [
            '为图片和视频设置明确的宽高属性',
            '为动态内容预留空间',
            '避免在现有内容上方插入内容',
            '使用 CSS aspect-ratio 属性'
          ],
          relatedMetrics: ['CLS'],
          expectedImprovement: '可将 CLS 降低 50-80%',
          difficulty: 'easy',
          timestamp: Date.now()
        })
      }
    }

    return advices
  }

  /**
   * 分析导航性能
   */
  private analyzeNavigation(metrics: PerfMetric[]): PerformanceAdvice[] {
    const advices: PerformanceAdvice[] = []
    const navigationMetrics = metrics.filter(m => m.type === 'navigation')

    // 分析 TTFB (Time to First Byte)
    const ttfbMetrics = navigationMetrics.filter(m => m.name === 'ttfb')
    if (ttfbMetrics.length > 0) {
      const avgTTFB = ttfbMetrics.reduce((sum, m) => sum + m.value, 0) / ttfbMetrics.length
      
      if (avgTTFB > 1800) {
        advices.push({
          id: 'ttfb-slow',
          type: 'warning',
          priority: 'high',
          category: 'network',
          title: '服务器响应时间过慢',
          description: `TTFB 为 ${Math.round(avgTTFB)}ms，服务器响应较慢`,
          suggestions: [
            '优化服务器性能：升级硬件、优化代码',
            '使用 CDN 加速内容分发',
            '启用服务器端缓存',
            '优化数据库查询性能'
          ],
          relatedMetrics: ['ttfb'],
          expectedImprovement: '可将 TTFB 降低 30-50%',
          difficulty: 'medium',
          timestamp: Date.now()
        })
      }
    }

    // 分析 DNS 查询时间
    const dnsMetrics = navigationMetrics.filter(m => m.name === 'dns-lookup')
    if (dnsMetrics.length > 0) {
      const avgDNS = dnsMetrics.reduce((sum, m) => sum + m.value, 0) / dnsMetrics.length
      
      if (avgDNS > 100) {
        advices.push({
          id: 'dns-slow',
          type: 'optimization',
          priority: 'medium',
          category: 'network',
          title: 'DNS 查询时间可优化',
          description: `DNS 查询耗时 ${Math.round(avgDNS)}ms`,
          suggestions: [
            '使用 DNS 预解析：<link rel="dns-prefetch">',
            '减少不同域名的数量',
            '使用更快的 DNS 解析服务'
          ],
          relatedMetrics: ['dns-lookup'],
          expectedImprovement: '可将 DNS 时间降低 20-40%',
          difficulty: 'easy',
          timestamp: Date.now()
        })
      }
    }

    return advices
  }

  /**
   * 分析资源加载性能
   */
  private analyzeResources(metrics: PerfMetric[]): PerformanceAdvice[] {
    const advices: PerformanceAdvice[] = []
    const resourceMetrics = metrics.filter(m => m.type === 'resource')

    // 分析大型资源
    const largeResources = resourceMetrics.filter(m => 
      m.attrs?.transferSize && m.attrs.transferSize > 500 * 1024 // 500KB
    )
    
    if (largeResources.length > 0) {
      advices.push({
        id: 'large-resources',
        type: 'warning',
        priority: 'high',
        category: 'bundle',
        title: '检测到大型资源文件',
        description: `发现 ${largeResources.length} 个大于 500KB 的资源文件`,
        suggestions: [
          '压缩图片资源：使用 WebP、AVIF 等现代格式',
          '代码分割：拆分大型 JavaScript 包',
          '按需加载：使用动态导入加载非关键资源',
          '启用 Gzip/Brotli 压缩'
        ],
        relatedMetrics: resourceMetrics.map(m => m.name),
        expectedImprovement: '可减少 40-60% 的加载时间',
        difficulty: 'medium',
        timestamp: Date.now()
      })
    }

    // 分析缓存命中率
    const cachableResources = resourceMetrics.filter(m => m.attrs?.cached !== undefined)
    if (cachableResources.length > 0) {
      const cacheHitRate = cachableResources.filter(m => m.attrs?.cached).length / cachableResources.length
      
      if (cacheHitRate < 0.5) {
        advices.push({
          id: 'low-cache-hit-rate',
          type: 'optimization',
          priority: 'medium',
          category: 'caching',
          title: '缓存命中率偏低',
          description: `缓存命中率仅为 ${Math.round(cacheHitRate * 100)}%`,
          suggestions: [
            '配置适当的缓存策略',
            '使用浏览器缓存控制头',
            '实施服务端缓存',
            '考虑使用 Service Worker 缓存'
          ],
          relatedMetrics: ['resource'],
          expectedImprovement: '可提升 20-30% 的重复访问性能',
          difficulty: 'easy',
          timestamp: Date.now()
        })
      }
    }

    return advices
  }

  /**
   * 分析内存使用
   */
  private analyzeMemory(metrics: PerfMetric[]): PerformanceAdvice[] {
    const advices: PerformanceAdvice[] = []
    const memoryMetrics = metrics.filter(m => m.type === 'memory')

    if (memoryMetrics.length > 0) {
      const latestMemory = memoryMetrics[memoryMetrics.length - 1]
      const memoryUsage = latestMemory.attrs?.memoryUsagePercent || 0

      if (memoryUsage > 80) {
        advices.push({
          id: 'high-memory-usage',
          type: 'warning',
          priority: 'high',
          category: 'memory',
          title: '内存使用率过高',
          description: `当前内存使用率为 ${Math.round(memoryUsage)}%`,
          suggestions: [
            '检查内存泄漏：及时清理事件监听器和定时器',
            '优化数据结构：避免创建大量临时对象',
            '使用对象池：重用对象减少垃圾回收压力',
            '分析内存快照：使用开发者工具分析内存使用'
          ],
          relatedMetrics: ['memory'],
          expectedImprovement: '可降低 30-50% 的内存使用',
          difficulty: 'hard',
          timestamp: Date.now()
        })
      }

      // 检测内存趋势
      if (memoryMetrics.length >= 3) {
        const recent = memoryMetrics.slice(-3)
        const trend = recent.map(m => m.attrs?.memoryUsagePercent || 0)
        const isIncreasing = trend.every((val, i) => i === 0 || val > trend[i - 1])

        if (isIncreasing && trend[trend.length - 1] - trend[0] > 20) {
          advices.push({
            id: 'memory-leak-trend',
            type: 'error',
            priority: 'critical',
            category: 'memory',
            title: '疑似内存泄漏',
            description: '检测到内存使用持续增长趋势',
            suggestions: [
              '立即检查代码中的内存泄漏源',
              '使用浏览器内存分析工具',
              '检查未正确清理的 DOM 引用',
              '验证事件监听器是否正确移除'
            ],
            relatedMetrics: ['memory'],
            expectedImprovement: '修复后可稳定内存使用',
            difficulty: 'hard',
            timestamp: Date.now()
          })
        }
      }
    }

    return advices
  }

  /**
   * 通用分析
   */
  private analyzeGeneral(metrics: PerfMetric[]): PerformanceAdvice[] {
    const advices: PerformanceAdvice[] = []

    // 分析长任务
    const longTaskMetrics = metrics.filter(m => m.type === 'longtask')
    if (longTaskMetrics.length > 5) {
      advices.push({
        id: 'frequent-long-tasks',
        type: 'warning',
        priority: 'high',
        category: 'interactivity',
        title: '频繁的长任务',
        description: `检测到 ${longTaskMetrics.length} 个长任务（>50ms）`,
        suggestions: [
          '使用 setTimeout 或 requestIdleCallback 分割长任务',
          '将计算密集型操作移至 Web Worker',
          '优化算法复杂度',
          '使用时间切片技术'
        ],
        relatedMetrics: ['longtask'],
        expectedImprovement: '可改善用户交互响应性',
        difficulty: 'medium',
        timestamp: Date.now()
      })
    }

    // 分析 FPS
    const fpsMetrics = metrics.filter(m => m.name === 'fps')
    if (fpsMetrics.length > 0) {
      const avgFPS = fpsMetrics.reduce((sum, m) => sum + m.value, 0) / fpsMetrics.length
      
      if (avgFPS < 30) {
        advices.push({
          id: 'low-fps',
          type: 'warning',
          priority: 'medium',
          category: 'rendering',
          title: '帧率偏低',
          description: `平均帧率为 ${Math.round(avgFPS)} FPS`,
          suggestions: [
            '优化 CSS 动画：使用 transform 和 opacity',
            '减少重排重绘：避免频繁修改 DOM 样式',
            '使用 CSS will-change 属性',
            '考虑使用 Canvas 或 WebGL 替代复杂 DOM 动画'
          ],
          relatedMetrics: ['fps'],
          expectedImprovement: '可提升到 60 FPS',
          difficulty: 'medium',
          timestamp: Date.now()
        })
      }
    }

    return advices
  }

  /**
   * 计算整体性能评分
   */
  private calculateOverallScore(metrics: PerfMetric[]): number {
    const scores: Record<string, number> = {}
    let totalWeight = 0

    // Web Vitals 权重
    const webVitalsWeights = {
      'LCP': 25,
      'FID': 25,
      'CLS': 25,
      'FCP': 15,
      'TTFB': 10
    }

    // 计算 Web Vitals 得分
    Object.entries(webVitalsWeights).forEach(([name, weight]) => {
      const metric = metrics.find(m => m.type === 'vitals' && m.name === name)
      if (metric && metric.rating) {
        const score = metric.rating === 'good' ? 100 : 
                     metric.rating === 'needs-improvement' ? 60 : 20
        scores[name] = score * weight
        totalWeight += weight
      }
    })

    // 其他指标权重较低
    const otherMetrics = metrics.filter(m => 
      m.type !== 'vitals' && m.rating && !['mark', 'measure'].includes(m.type)
    )
    
    if (otherMetrics.length > 0) {
      const avgOtherScore = otherMetrics.reduce((sum, m) => {
        const score = m.rating === 'good' ? 100 : 
                     m.rating === 'needs-improvement' ? 60 : 20
        return sum + score
      }, 0) / otherMetrics.length
      
      scores['other'] = avgOtherScore * 5
      totalWeight += 5
    }

    if (totalWeight === 0) return 0

    const finalScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / totalWeight
    return Math.round(Math.max(0, Math.min(100, finalScore)))
  }

  /**
   * 根据评分获取等级
   */
  private getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  /**
   * 生成分析摘要
   */
  private generateSummary(
    metrics: PerfMetric[], 
    advices: PerformanceAdvice[]
  ): PerformanceAnalysis['summary'] {
    const strengths: string[] = []
    const weaknesses: string[] = []
    const quickWins: string[] = []

    // 分析优势
    const goodMetrics = metrics.filter(m => m.rating === 'good')
    if (goodMetrics.length > 0) {
      const webVitalsGood = goodMetrics.filter(m => m.type === 'vitals')
      if (webVitalsGood.length > 0) {
        strengths.push(`Web Vitals 表现良好 (${webVitalsGood.length} 项达标)`)
      }
    }

    // 分析薄弱环节
    const criticalAdvices = advices.filter(a => a.priority === 'critical')
    criticalAdvices.forEach(advice => {
      weaknesses.push(advice.title)
    })

    // 识别快速改进点
    const easyAdvices = advices.filter(a => a.difficulty === 'easy')
    easyAdvices.slice(0, 3).forEach(advice => {
      quickWins.push(advice.title)
    })

    return { strengths, weaknesses, quickWins }
  }

  /**
   * 创建空分析结果
   */
  private createEmptyAnalysis(): PerformanceAnalysis {
    return {
      overallScore: 0,
      grade: 'F',
      criticalIssues: 0,
      advices: [],
      summary: {
        strengths: [],
        weaknesses: ['缺乏性能数据'],
        quickWins: ['开始收集性能指标']
      },
      timestamp: Date.now()
    }
  }
}

/**
 * 创建性能建议器实例
 */
export function createPerformanceAdvisor(): PerformanceAdvisor {
  return new PerformanceAdvisor()
}

/**
 * 快速分析性能数据并生成建议
 */
export function analyzePerformance(
  metrics: PerfMetric[], 
  options?: AnalysisOptions
): PerformanceAnalysis {
  const advisor = new PerformanceAdvisor()
  advisor.addMetrics(metrics)
  return advisor.generateAnalysis(options)
}