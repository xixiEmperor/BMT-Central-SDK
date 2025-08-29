/**
 * 性能监控可视化面板
 * 
 * 该模块提供了一个完整的性能监控可视化解决方案，包括：
 * - 实时性能数据展示
 * - 历史趋势分析
 * - 智能性能建议
 * - 交互式图表
 * - 性能报告导出
 */

import type { PerfMetric } from './types.js'
import type { PerformanceAnalysis, PerformanceAdvice } from './advisor.js'
import { PerformanceAdvisor } from './advisor.js'

/**
 * 面板配置选项
 */
export interface DashboardOptions {
  /** 面板容器元素 */
  container: HTMLElement
  /** 主题模式 */
  theme?: 'light' | 'dark' | 'auto'
  /** 是否显示建议面板 */
  showAdvice?: boolean
  /** 是否启用实时更新 */
  realTimeUpdate?: boolean
  /** 更新间隔（毫秒） */
  updateInterval?: number
  /** 最大数据点数量 */
  maxDataPoints?: number
  /** 自定义颜色配置 */
  colors?: {
    primary?: string
    success?: string
    warning?: string
    error?: string
    background?: string
    text?: string
  }
}

/**
 * 图表数据点
 */
interface DataPoint {
  timestamp: number
  value: number
  label?: string
  color?: string
}

/**
 * 图表配置
 */
interface ChartConfig {
  title: string
  type: 'line' | 'bar' | 'gauge' | 'score'
  unit?: string
  thresholds?: {
    good: number
    poor: number
  }
  maxValue?: number
  data: DataPoint[]
}

/**
 * 性能监控可视化面板
 */
export class PerformanceDashboard {
  private container: HTMLElement
  private options: Required<DashboardOptions>
  private advisor: PerformanceAdvisor
  private charts: Map<string, ChartConfig> = new Map()
  private updateTimer?: number
  private isInitialized = false

  constructor(options: DashboardOptions) {
    this.container = options.container
    this.options = {
      theme: 'auto',
      showAdvice: true,
      realTimeUpdate: true,
      updateInterval: 1000,
      maxDataPoints: 100,
      colors: {
        primary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        background: '#ffffff',
        text: '#1f2937'
      },
      ...options
    }
    this.advisor = new PerformanceAdvisor()
    
    // 自动检测主题
    if (this.options.theme === 'auto') {
      this.options.theme = this.detectTheme()
    }
  }

  /**
   * 初始化面板
   */
  init(): void {
    if (this.isInitialized) return

    this.createLayout()
    this.setupEventListeners()
    
    if (this.options.realTimeUpdate) {
      this.startRealTimeUpdate()
    }
    
    this.isInitialized = true
  }

  /**
   * 销毁面板
   */
  destroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
      this.updateTimer = undefined
    }
    
    this.container.innerHTML = ''
    this.charts.clear()
    this.isInitialized = false
  }

  /**
   * 添加性能指标数据
   */
  addMetric(metric: PerfMetric): void {
    this.advisor.addMetric(metric)
    this.updateChart(metric)
    
    if (this.options.showAdvice) {
      this.updateAdvicePanel()
    }
  }

  /**
   * 批量添加性能指标
   */
  addMetrics(metrics: PerfMetric[]): void {
    metrics.forEach(metric => this.addMetric(metric))
  }

  /**
   * 生成性能报告
   */
  generateReport(): PerformanceAnalysis {
    return this.advisor.generateAnalysis()
  }

  /**
   * 导出数据
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    const analysis = this.generateReport()
    
    if (format === 'json') {
      return JSON.stringify({
        analysis,
        charts: Object.fromEntries(this.charts),
        timestamp: Date.now()
      }, null, 2)
    } else {
      // CSV 格式
      const lines = [
        'Metric,Value,Unit,Rating,Timestamp',
        ...Array.from(this.charts.values()).flatMap(chart =>
          chart.data.map(point => 
            `${chart.title},${point.value},${chart.unit || ''},${point.label || ''},${point.timestamp}`
          )
        )
      ]
      return lines.join('\n')
    }
  }

  /**
   * 创建面板布局
   */
  private createLayout(): void {
    const theme = this.options.theme
    
    this.container.innerHTML = `
      <div class="perf-dashboard" data-theme="${theme}">
        <style>
          .perf-dashboard {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: ${this.options.colors.background};
            color: ${this.options.colors.text};
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .perf-dashboard[data-theme="dark"] {
            background: #1f2937;
            color: #f9fafb;
          }
          
          .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .dashboard-title {
            font-size: 24px;
            font-weight: 600;
            margin: 0;
          }
          
          .dashboard-actions {
            display: flex;
            gap: 12px;
          }
          
          .dashboard-btn {
            padding: 8px 16px;
            border: 1px solid #d1d5db;
            background: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
          }
          
          .dashboard-btn:hover {
            background: #f3f4f6;
            border-color: #9ca3af;
          }
          
          .dashboard-content {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 24px;
          }
          
          .charts-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
          }
          
          .chart-container {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            position: relative;
          }
          
          .chart-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          
          .chart-value {
            font-size: 12px;
            color: #6b7280;
            font-weight: normal;
          }
          
          .chart-canvas {
            width: 100%;
            height: 200px;
            position: relative;
          }
          
          .advice-panel {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            max-height: 600px;
            overflow-y: auto;
          }
          
          .advice-header {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .performance-score {
            font-size: 48px;
            font-weight: 700;
            text-align: center;
            margin: 20px 0;
          }
          
          .score-a { color: #10b981; }
          .score-b { color: #3b82f6; }
          .score-c { color: #f59e0b; }
          .score-d { color: #f97316; }
          .score-f { color: #ef4444; }
          
          .advice-item {
            padding: 12px;
            margin-bottom: 12px;
            border-radius: 6px;
            border-left: 4px solid;
          }
          
          .advice-critical {
            background: #fef2f2;
            border-color: #ef4444;
          }
          
          .advice-high {
            background: #fff7ed;
            border-color: #f97316;
          }
          
          .advice-medium {
            background: #fffbeb;
            border-color: #f59e0b;
          }
          
          .advice-low {
            background: #f0f9ff;
            border-color: #3b82f6;
          }
          
          .advice-title {
            font-weight: 600;
            margin-bottom: 4px;
          }
          
          .advice-description {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 8px;
          }
          
          .advice-suggestions {
            font-size: 13px;
            margin-left: 16px;
          }
          
          .advice-suggestions li {
            margin-bottom: 4px;
          }
          
          .loading {
            text-align: center;
            color: #6b7280;
            padding: 20px;
          }
          
          @media (max-width: 768px) {
            .dashboard-content {
              grid-template-columns: 1fr;
            }
            
            .charts-section {
              grid-template-columns: 1fr;
            }
          }
        </style>
        
        <div class="dashboard-header">
          <h1 class="dashboard-title">性能监控面板</h1>
          <div class="dashboard-actions">
            <button class="dashboard-btn" onclick="this.closest('.perf-dashboard').dashboard.exportData('json')">
              导出 JSON
            </button>
            <button class="dashboard-btn" onclick="this.closest('.perf-dashboard').dashboard.exportData('csv')">
              导出 CSV
            </button>
            <button class="dashboard-btn" onclick="this.closest('.perf-dashboard').dashboard.generateReport()">
              生成报告
            </button>
          </div>
        </div>
        
        <div class="dashboard-content">
          <div class="charts-section" id="charts-section">
            <div class="loading">正在加载性能数据...</div>
          </div>
          
          ${this.options.showAdvice ? `
          <div class="advice-panel" id="advice-panel">
            <div class="advice-header">
              🎯 性能建议
            </div>
            <div class="loading">正在分析性能数据...</div>
          </div>
          ` : ''}
        </div>
      </div>
    `
    
    // 将 dashboard 实例绑定到 DOM，以便按钮可以访问
    ;(this.container.querySelector('.perf-dashboard') as any).dashboard = this
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 主题切换
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', (e) => {
      if (this.options.theme === 'auto') {
        const newTheme = e.matches ? 'dark' : 'light'
        const dashboard = this.container.querySelector('.perf-dashboard')
        if (dashboard) {
          dashboard.setAttribute('data-theme', newTheme)
        }
      }
    })

    // 窗口大小变化时重新渲染图表
    window.addEventListener('resize', () => {
      this.rerenderCharts()
    })
  }

  /**
   * 开始实时更新
   */
  private startRealTimeUpdate(): void {
    this.updateTimer = window.setInterval(() => {
      this.updateAllCharts()
      if (this.options.showAdvice) {
        this.updateAdvicePanel()
      }
    }, this.options.updateInterval)
  }

  /**
   * 更新图表数据
   */
  private updateChart(metric: PerfMetric): void {
    const chartKey = `${metric.type}-${metric.name}`
    let chart = this.charts.get(chartKey)
    
    if (!chart) {
      chart = this.createChartConfig(metric)
      this.charts.set(chartKey, chart)
      this.renderChart(chartKey, chart)
    }
    
    // 添加新数据点
    chart.data.push({
      timestamp: metric.ts,
      value: metric.value,
      label: metric.rating,
      color: this.getColorByRating(metric.rating)
    })
    
    // 限制数据点数量
    if (chart.data.length > this.options.maxDataPoints) {
      chart.data.shift()
    }
    
    // 更新图表显示
    this.updateChartDisplay(chartKey, chart)
  }

  /**
   * 创建图表配置
   */
  private createChartConfig(metric: PerfMetric): ChartConfig {
    const config: ChartConfig = {
      title: this.getMetricDisplayName(metric),
      type: this.getChartType(metric),
      unit: metric.unit,
      data: []
    }
    
    // 设置阈值
    if (metric.type === 'vitals') {
      config.thresholds = this.getVitalsThresholds(metric.name)
    }
    
    // 设置最大值
    if (metric.name === 'fps') {
      config.maxValue = 60
    } else if (metric.unit === 'percent') {
      config.maxValue = 100
    }
    
    return config
  }

  /**
   * 渲染图表
   */
  private renderChart(chartKey: string, chart: ChartConfig): void {
    const chartsSection = this.container.querySelector('#charts-section')
    if (!chartsSection) return
    
    // 首次渲染时移除加载提示
    const loading = chartsSection.querySelector('.loading')
    if (loading) {
      loading.remove()
    }
    
    const chartContainer = document.createElement('div')
    chartContainer.className = 'chart-container'
    chartContainer.id = `chart-${chartKey}`
    
    chartContainer.innerHTML = `
      <div class="chart-title">
        ${chart.title}
        <span class="chart-value" id="value-${chartKey}">--</span>
      </div>
      <div class="chart-canvas" id="canvas-${chartKey}">
        ${this.renderChartContent(chart)}
      </div>
    `
    
    chartsSection.appendChild(chartContainer)
  }

  /**
   * 渲染图表内容
   */
  private renderChartContent(chart: ChartConfig): string {
    switch (chart.type) {
      case 'gauge':
        return this.renderGaugeChart(chart)
      case 'score':
        return this.renderScoreChart(chart)
      case 'line':
        return this.renderLineChart(chart)
      case 'bar':
        return this.renderBarChart(chart)
      default:
        return '<div>暂不支持的图表类型</div>'
    }
  }

  /**
   * 渲染仪表盘图表
   */
  private renderGaugeChart(chart: ChartConfig): string {
    const latestValue = chart.data[chart.data.length - 1]?.value || 0
    const maxValue = chart.maxValue || 100
    const percentage = Math.min(100, (latestValue / maxValue) * 100)
    
    return `
      <div style="position: relative; width: 120px; height: 120px; margin: 0 auto;">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" stroke-width="8"/>
          <circle cx="60" cy="60" r="50" fill="none" stroke="${this.options.colors.primary}" 
                  stroke-width="8" stroke-dasharray="314" 
                  stroke-dashoffset="${314 - (314 * percentage / 100)}"
                  transform="rotate(-90 60 60)"/>
          <text x="60" y="60" text-anchor="middle" dy="5" 
                style="font-size: 16px; font-weight: 600;">
            ${latestValue.toFixed(1)}
          </text>
          <text x="60" y="80" text-anchor="middle" 
                style="font-size: 10px; fill: #6b7280;">
            ${chart.unit || ''}
          </text>
        </svg>
      </div>
    `
  }

  /**
   * 渲染评分图表
   */
  private renderScoreChart(chart: ChartConfig): string {
    const latestValue = chart.data[chart.data.length - 1]?.value || 0
    const grade = this.getGrade(latestValue)
    
    return `
      <div class="performance-score score-${grade.toLowerCase()}">
        ${latestValue}
        <div style="font-size: 16px; margin-top: 8px;">等级: ${grade}</div>
      </div>
    `
  }

  /**
   * 渲染折线图
   */
  private renderLineChart(chart: ChartConfig): string {
    if (chart.data.length === 0) {
      return '<div style="text-align: center; color: #6b7280; padding: 40px;">暂无数据</div>'
    }
    
    const width = 280
    const height = 150
    const padding = 20
    
    const values = chart.data.map(d => d.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue || 1
    
    const points = chart.data.map((d, i) => {
      const x = padding + (i / (chart.data.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((d.value - minValue) / range) * (height - 2 * padding)
      return `${x},${y}`
    }).join(' ')
    
    return `
      <svg width="${width}" height="${height}" style="background: #f9fafb;">
        <polyline points="${points}" fill="none" stroke="${this.options.colors.primary}" stroke-width="2"/>
        ${chart.data.map((d, i) => {
          const x = padding + (i / (chart.data.length - 1)) * (width - 2 * padding)
          const y = height - padding - ((d.value - minValue) / range) * (height - 2 * padding)
          return `<circle cx="${x}" cy="${y}" r="3" fill="${d.color || this.options.colors.primary}"/>`
        }).join('')}
      </svg>
    `
  }

  /**
   * 渲染柱状图
   */
  private renderBarChart(chart: ChartConfig): string {
    if (chart.data.length === 0) {
      return '<div style="text-align: center; color: #6b7280; padding: 40px;">暂无数据</div>'
    }
    
    const width = 280
    const height = 150
    const padding = 20
    const barWidth = Math.max(4, (width - 2 * padding) / chart.data.length - 2)
    
    const maxValue = Math.max(...chart.data.map(d => d.value))
    
    return `
      <svg width="${width}" height="${height}" style="background: #f9fafb;">
        ${chart.data.map((d, i) => {
          const x = padding + i * (barWidth + 2)
          const barHeight = (d.value / maxValue) * (height - 2 * padding)
          const y = height - padding - barHeight
          return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
                        fill="${d.color || this.options.colors.primary}"/>`
        }).join('')}
      </svg>
    `
  }

  /**
   * 更新图表显示
   */
  private updateChartDisplay(chartKey: string, chart: ChartConfig): void {
    const valueElement = this.container.querySelector(`#value-${chartKey}`)
    const canvasElement = this.container.querySelector(`#canvas-${chartKey}`)
    
    if (valueElement && chart.data.length > 0) {
      const latestValue = chart.data[chart.data.length - 1].value
      valueElement.textContent = `${latestValue.toFixed(1)} ${chart.unit || ''}`
    }
    
    if (canvasElement) {
      canvasElement.innerHTML = this.renderChartContent(chart)
    }
  }

  /**
   * 更新建议面板
   */
  private updateAdvicePanel(): void {
    const advicePanel = this.container.querySelector('#advice-panel')
    if (!advicePanel) return
    
    const analysis = this.advisor.generateAnalysis()
    
    advicePanel.innerHTML = `
      <div class="advice-header">
        🎯 性能建议
        <span style="font-size: 14px; font-weight: normal; color: #6b7280;">
          评分: ${analysis.overallScore}/100 (${analysis.grade})
        </span>
      </div>
      
      ${analysis.advices.length === 0 ? 
        '<div class="loading">暂无建议，继续收集数据中...</div>' :
        analysis.advices.map(advice => this.renderAdviceItem(advice)).join('')
      }
    `
  }

  /**
   * 渲染建议项
   */
  private renderAdviceItem(advice: PerformanceAdvice): string {
    return `
      <div class="advice-item advice-${advice.priority}">
        <div class="advice-title">
          ${this.getPriorityIcon(advice.priority)} ${advice.title}
        </div>
        <div class="advice-description">${advice.description}</div>
        <ul class="advice-suggestions">
          ${advice.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
        </ul>
      </div>
    `
  }

  /**
   * 获取优先级图标
   */
  private getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'critical': return '🚨'
      case 'high': return '⚠️'
      case 'medium': return '💡'
      case 'low': return 'ℹ️'
      default: return '📝'
    }
  }

  /**
   * 更新所有图表
   */
  private updateAllCharts(): void {
    this.charts.forEach((chart, chartKey) => {
      this.updateChartDisplay(chartKey, chart)
    })
  }

  /**
   * 重新渲染所有图表
   */
  private rerenderCharts(): void {
    this.charts.forEach((chart, chartKey) => {
      const canvasElement = this.container.querySelector(`#canvas-${chartKey}`)
      if (canvasElement) {
        canvasElement.innerHTML = this.renderChartContent(chart)
      }
    })
  }

  /**
   * 获取指标显示名称
   */
  private getMetricDisplayName(metric: PerfMetric): string {
    const names: Record<string, string> = {
      'LCP': '最大内容绘制',
      'FID': '首次输入延迟',
      'CLS': '累积布局偏移',
      'FCP': '首次内容绘制',
      'TTFB': '首字节响应时间',
      'fps': '帧率',
      'memory-usage': '内存使用',
      'dns-lookup': 'DNS 查询',
      'tcp-connect': 'TCP 连接'
    }
    return names[metric.name] || metric.name
  }

  /**
   * 获取图表类型
   */
  private getChartType(metric: PerfMetric): 'line' | 'bar' | 'gauge' | 'score' {
    if (metric.name === 'fps') return 'gauge'
    if (metric.name === 'overall-score') return 'score'
    if (metric.type === 'vitals') return 'line'
    if (metric.unit === 'percent') return 'gauge'
    return 'line'
  }

  /**
   * 获取 Web Vitals 阈值
   */
  private getVitalsThresholds(name: string): { good: number; poor: number } | undefined {
    const thresholds: Record<string, { good: number; poor: number }> = {
      'LCP': { good: 2500, poor: 4000 },
      'FID': { good: 100, poor: 300 },
      'CLS': { good: 0.1, poor: 0.25 },
      'FCP': { good: 1800, poor: 3000 },
      'TTFB': { good: 800, poor: 1800 }
    }
    return thresholds[name]
  }

  /**
   * 根据评级获取颜色
   */
  private getColorByRating(rating?: string): string {
    switch (rating) {
      case 'good': return this.options.colors.success
      case 'needs-improvement': return this.options.colors.warning
      case 'poor': return this.options.colors.error
      default: return this.options.colors.primary
    }
  }

  /**
   * 获取等级
   */
  private getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  /**
   * 检测系统主题
   */
  private detectTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
}

/**
 * 创建性能监控面板
 */
export function createPerformanceDashboard(options: DashboardOptions): PerformanceDashboard {
  return new PerformanceDashboard(options)
}