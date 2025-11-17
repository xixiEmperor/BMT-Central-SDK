/**
 * @wfynbzlx666/sdk-perf - Audit Reporter
 * 审计报告生成器
 * 
 * 本模块提供多种格式的审计报告生成功能,包括:
 * - JSON: 完整的结构化数据
 * - HTML: 可视化的报告页面
 * - CSV: 表格数据,便于导入 Excel
 * 
 * @module audit-reporter
 */

import { writeFile } from 'fs/promises'
import { dirname } from 'path'
import { mkdir } from 'fs/promises'
import type { AuditResult, AuditSummary, ReportFormat } from './audit-types.js'

/**
 * 确保目录存在
 */
async function ensureDir(filePath: string): Promise<void> {
  const dir = dirname(filePath)
  try {
    await mkdir(dir, { recursive: true })
  } catch (error) {
    // 目录已存在,忽略错误
  }
}

/**
 * 生成 JSON 格式报告
 * 
 * 导出完整的审计数据为 JSON 格式,包含所有原始数据和 Lighthouse 结果。
 * 
 * @param results - 审计结果数组
 * @param includeLighthouseResult - 是否包含完整的 Lighthouse 结果(默认 false,减小文件大小)
 * @returns JSON 字符串
 */
export function generateJSON(
  results: AuditResult[] | AuditSummary,
  includeLighthouseResult = false
): string {
  // 如果是汇总结果,提取 results 数组
  const resultArray = Array.isArray(results) ? results : results.results

  // 如果不包含 Lighthouse 结果,移除该字段以减小文件大小
  const cleanedResults = includeLighthouseResult
    ? resultArray
    : resultArray.map(({ lighthouseResult, ...rest }) => rest)

  // 如果是汇总对象,保留汇总信息
  if (!Array.isArray(results)) {
    return JSON.stringify({
      ...results,
      results: cleanedResults
    }, null, 2)
  }

  return JSON.stringify(cleanedResults, null, 2)
}

/**
 * 生成 CSV 格式报告
 * 
 * 将审计结果转换为 CSV 表格格式,包含关键性能指标和分数。
 * 可以直接导入 Excel 或 Google Sheets 进行分析。
 * 
 * @param results - 审计结果数组
 * @returns CSV 字符串
 */
export function generateCSV(results: AuditResult[] | AuditSummary): string {
  // 如果是汇总结果,提取 results 数组
  const resultArray = Array.isArray(results) ? results : results.results

  // CSV 表头
  const headers = [
    'URL',
    '状态',
    '时间戳',
    '耗时(ms)',
    '性能分数',
    '可访问性',
    '最佳实践',
    'SEO',
    'PWA',
    'LCP(ms)',
    'FID(ms)',
    'CLS',
    'FCP(ms)',
    'TTFB(ms)',
    'TBT(ms)',
    'Speed Index',
    '优化建议数',
    '错误信息'
  ]

  // 生成 CSV 行
  const rows = resultArray.map(result => {
    return [
      result.url,
      result.success ? '成功' : '失败',
      new Date(result.timestamp).toISOString(),
      result.duration || '',
      result.scores?.performance?.toFixed(1) || '',
      result.scores?.accessibility?.toFixed(1) || '',
      result.scores?.bestPractices?.toFixed(1) || '',
      result.scores?.seo?.toFixed(1) || '',
      result.scores?.pwa?.toFixed(1) || '',
      result.metrics?.lcp?.toFixed(0) || '',
      result.metrics?.fid?.toFixed(0) || '',
      result.metrics?.cls?.toFixed(3) || '',
      result.metrics?.fcp?.toFixed(0) || '',
      result.metrics?.ttfb?.toFixed(0) || '',
      result.metrics?.tbt?.toFixed(0) || '',
      result.metrics?.speedIndex?.toFixed(0) || '',
      result.opportunities?.length || 0,
      result.error ? `"${result.error.replace(/"/g, '""')}"` : ''
    ].join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

/**
 * 生成 HTML 格式报告
 * 
 * 创建一个美观的 HTML 报告页面,包含:
 * - 汇总统计信息
 * - 各页面详细结果
 * - 可视化的性能分数
 * - 优化建议列表
 * 
 * @param results - 审计结果数组
 * @returns HTML 字符串
 */
export function generateHTML(results: AuditResult[] | AuditSummary): string {
  // 如果是汇总结果,提取 results 数组
  const resultArray = Array.isArray(results) ? results : results.results
  const summary = Array.isArray(results) ? null : results

  // 计算统计数据
  const total = resultArray.length
  const success = resultArray.filter(r => r.success).length
  const failed = total - success
  const avgScore = summary?.averagePerformanceScore || 
    (resultArray.filter(r => r.scores?.performance)
      .reduce((sum, r) => sum + (r.scores?.performance || 0), 0) / success || 0)

  // 评分颜色函数
  const getScoreColor = (score: number | null) => {
    if (score === null) return '#999'
    if (score >= 90) return '#0cce6b'
    if (score >= 50) return '#ffa400'
    return '#ff4e42'
  }

  // 评分标签函数
  const getScoreLabel = (score: number | null) => {
    if (score === null) return 'N/A'
    if (score >= 90) return '优秀'
    if (score >= 50) return '中等'
    return '较差'
  }

  // 生成每个页面的结果卡片
  const resultCards = resultArray.map(result => {
    const perfScore = result.scores?.performance ?? null
    const scoreColor = getScoreColor(perfScore)
    const scoreLabel = getScoreLabel(perfScore)

    // 生成优化建议列表（显示所有建议，不限制数量）
    const opportunitiesList = result.opportunities && result.opportunities.length > 0
      ? `
        <div class="opportunities">
          <h4>🎯 优化建议 (${result.opportunities.length})</h4>
          <ul>
            ${result.opportunities.map(opp => `
              <li>
                <div class="opportunity-header">
                  <strong>${opp.title}</strong>
                  ${opp.savings ? `<span class="savings">可节省 ${(opp.savings / 1000).toFixed(2)}s</span>` : ''}
                </div>
                ${opp.description ? `<p class="opportunity-description">${opp.description}</p>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      `
      : ''

    return `
      <div class="result-card ${result.success ? 'success' : 'failed'}">
        <div class="result-header">
          <h3>${result.url}</h3>
          <span class="status ${result.success ? 'success' : 'failed'}">
            ${result.success ? '✓ 成功' : '✗ 失败'}
          </span>
        </div>
        
        ${result.success ? `
          <div class="scores">
            <div class="score-item main-score" style="border-color: ${scoreColor}">
              <div class="score-value" style="color: ${scoreColor}">${perfScore?.toFixed(0) || 'N/A'}</div>
              <div class="score-label">性能分数</div>
              <div class="score-rating" style="color: ${scoreColor}">${scoreLabel}</div>
            </div>
            
            <div class="score-grid">
              ${result.scores?.accessibility ? `
                <div class="score-item">
                  <div class="score-value">${result.scores.accessibility.toFixed(0)}</div>
                  <div class="score-label">可访问性</div>
                </div>
              ` : ''}
              ${result.scores?.bestPractices ? `
                <div class="score-item">
                  <div class="score-value">${result.scores.bestPractices.toFixed(0)}</div>
                  <div class="score-label">最佳实践</div>
                </div>
              ` : ''}
              ${result.scores?.seo ? `
                <div class="score-item">
                  <div class="score-value">${result.scores.seo.toFixed(0)}</div>
                  <div class="score-label">SEO</div>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="metrics">
            <h4>📊 Core Web Vitals</h4>
            <div class="metrics-grid">
              ${result.metrics?.lcp ? `
                <div class="metric-item">
                  <div class="metric-value">${(result.metrics.lcp / 1000).toFixed(2)}s</div>
                  <div class="metric-label">LCP</div>
                </div>
              ` : ''}
              ${result.metrics?.fid ? `
                <div class="metric-item">
                  <div class="metric-value">${result.metrics.fid.toFixed(0)}ms</div>
                  <div class="metric-label">FID</div>
                </div>
              ` : ''}
              ${result.metrics?.cls ? `
                <div class="metric-item">
                  <div class="metric-value">${result.metrics.cls.toFixed(3)}</div>
                  <div class="metric-label">CLS</div>
                </div>
              ` : ''}
              ${result.metrics?.fcp ? `
                <div class="metric-item">
                  <div class="metric-value">${(result.metrics.fcp / 1000).toFixed(2)}s</div>
                  <div class="metric-label">FCP</div>
                </div>
              ` : ''}
              ${result.metrics?.ttfb ? `
                <div class="metric-item">
                  <div class="metric-value">${result.metrics.ttfb.toFixed(0)}ms</div>
                  <div class="metric-label">TTFB</div>
                </div>
              ` : ''}
              ${result.metrics?.tbt ? `
                <div class="metric-item">
                  <div class="metric-value">${result.metrics.tbt.toFixed(0)}ms</div>
                  <div class="metric-label">TBT</div>
                </div>
              ` : ''}
            </div>
          </div>

          ${result.metrics?.lcpScreenshot && process.env.NODE_ENV !== 'production' ? `
            <div class="lcp-screenshot">
              <h4>🎯 LCP 最大内容元素截图</h4>
              <div class="screenshot-container">
                <pre>最大内容元素为："${result.metrics.lcpScreenshot}"</pre>
                <p class="screenshot-hint">优化此区域可以显著提升 LCP 指标</p>
              </div>
            </div>
          ` : ''}

          ${opportunitiesList}
        ` : `
          <div class="error-message">
            <strong>错误:</strong> ${result.error}
          </div>
        `}
        
        <div class="result-footer">
          <span>📅 ${new Date(result.timestamp).toLocaleString('zh-CN')}</span>
          ${result.duration ? `<span>⏱️ 耗时: ${(result.duration / 1000).toFixed(2)}s</span>` : ''}
        </div>
      </div>
    `
  }).join('')

  // 完整的 HTML 模板
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>性能审计报告 - BMT SDK</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
      color: #333;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
      color: #667eea;
    }

    .header p {
      color: #666;
      font-size: 14px;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .summary-card {
      background: white;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .summary-card .value {
      font-size: 36px;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 8px;
    }
    
    .summary-card .value.warning {
      color: #ff4e42;
    }

    .summary-card .label {
      font-size: 14px;
      color: #666;
    }

    .result-card {
      background: white;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      border-left: 5px solid #667eea;
    }

    .result-card.failed {
      border-left-color: #ff4e42;
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 2px solid #f0f0f0;
    }

    .result-header h3 {
      font-size: 18px;
      color: #333;
      word-break: break-all;
    }

    .status {
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
    }

    .status.success {
      background: #d4edda;
      color: #155724;
    }

    .status.failed {
      background: #f8d7da;
      color: #721c24;
    }

    .scores {
      display: flex;
      gap: 30px;
      margin-bottom: 30px;
      align-items: center;
    }

    .main-score {
      border: 4px solid;
      border-radius: 50%;
      width: 150px;
      height: 150px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
    }

    .main-score .score-value {
      font-size: 48px;
      font-weight: bold;
    }

    .main-score .score-label {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }

    .main-score .score-rating {
      font-size: 14px;
      font-weight: 600;
      margin-top: 5px;
    }

    .score-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 15px;
      flex: 1;
    }

    .score-item {
      text-align: center;
    }

    .score-grid .score-item {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
    }

    .score-grid .score-value {
      font-size: 28px;
      font-weight: bold;
      color: #667eea;
    }

    .score-grid .score-label {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }

    .metrics h4, .opportunities h4 {
      font-size: 16px;
      margin-bottom: 15px;
      color: #333;
    }

    .metrics {
      margin-bottom: 30px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 15px;
    }

    .metric-item {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }

    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 5px;
    }

    .metric-label {
      font-size: 12px;
      color: #666;
    }

    .opportunities ul {
      list-style: none;
      padding: 0;
    }

    .opportunities li {
      padding: 15px;
      background: #fff9e6;
      border-left: 3px solid #ffa400;
      margin-bottom: 12px;
      border-radius: 4px;
    }

    .opportunity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .opportunity-description {
      font-size: 13px;
      color: #666;
      margin: 0;
      line-height: 1.5;
    }

    .savings {
      background: #ffa400;
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
      margin-left: 10px;
    }

    .lcp-screenshot {
      margin-bottom: 30px;
    }

    .lcp-screenshot h4 {
      font-size: 16px;
      margin-bottom: 15px;
      color: #333;
    }

    .screenshot-container {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }

    .screenshot-container img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      margin-bottom: 10px;
    }

    .screenshot-hint {
      font-size: 13px;
      color: #666;
      margin: 0;
      font-style: italic;
    }

    .error-message {
      padding: 20px;
      background: #f8d7da;
      border-left: 4px solid #721c24;
      border-radius: 4px;
      color: #721c24;
      margin-bottom: 20px;
    }

    .result-footer {
      display: flex;
      justify-content: space-between;
      padding-top: 15px;
      border-top: 2px solid #f0f0f0;
      font-size: 13px;
      color: #666;
    }

    @media (max-width: 768px) {
      .scores {
        flex-direction: column;
      }
      
      .result-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 性能审计报告</h1>
      <p>由 @wfynbzlx666/sdk-perf 生成 | 生成时间: ${new Date().toLocaleString('zh-CN')}</p>
    </div>

    <div class="summary">
      <div class="summary-card">
        <div class="value">${total}</div>
        <div class="label">审计页面数</div>
      </div>
      <div class="summary-card">
        <div class="value" style="color: #0cce6b">${success}</div>
        <div class="label">成功</div>
      </div>
      <div class="summary-card">
        <div class="value" style="color: #ff4e42">${failed}</div>
        <div class="label">失败</div>
      </div>
      <div class="summary-card">
        <div class="value">${avgScore.toFixed(1)}</div>
        <div class="label">平均性能分数</div>
      </div>
    </div>

    ${resultCards}
  </div>
</body>
</html>
  `.trim()
}

/**
 * 生成报告
 * 
 * 根据指定格式生成审计报告,并可选择性保存到文件。
 * 
 * @param results - 审计结果数组或汇总
 * @param format - 报告格式
 * @param outputPath - 输出文件路径(可选)
 * @param options - 额外选项
 * @returns 报告内容字符串
 * 
 * @example
 * ```typescript
 * const results = await auditPages({ ... })
 * 
 * // 生成 JSON 报告并保存
 * await generateReport(results, 'json', './reports/audit.json')
 * 
 * // 生成 HTML 报告
 * const html = await generateReport(results, 'html')
 * console.log(html)
 * ```
 */
export async function generateReport(
  results: AuditResult[] | AuditSummary,
  format: ReportFormat = 'json',
  outputPath?: string,
  options: { includeLighthouseResult?: boolean } = {}
): Promise<string> {
  let content: string

  switch (format) {
    case 'json':
      content = generateJSON(results, options.includeLighthouseResult)
      break
    case 'html':
      content = generateHTML(results)
      break
    case 'csv':
      content = generateCSV(results)
      break
    default:
      throw new Error(`不支持的报告格式: ${format}`)
  }

  // 如果指定了输出路径,保存到文件
  if (outputPath) {
    await ensureDir(outputPath)
    await writeFile(outputPath, content, 'utf-8')
  }

  return content
}

