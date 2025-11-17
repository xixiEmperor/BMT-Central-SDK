/**
 * @wfynbzlx666/sdk-perf-spa
 * Node.js端性能审计SDK - Puppeteer + Lighthouse 自动化页面性能审计
 * 
 * 本SDK专为Node.js环境设计，提供自动化的页面性能审计功能。
 * 基于 Puppeteer 和 Lighthouse，支持批量审计、并发控制、多格式报告输出。
 * 
 * 主要特性:
 * - 🚀 自动化页面性能审计
 * - 📊 完整的 Web Vitals 指标收集
 * - 🎯 优化建议生成
 * - 📈 批量页面审计支持
 * - ⚡ 并发控制和任务队列
 * - 📝 多格式报告输出 (JSON, HTML, CSV)
 * - 🔄 失败重试机制
 * - 📡 进度回调支持
 * 
 * @packageDocumentation
 */

// ============================================
// 导出核心审计功能
// ============================================
export {
  auditSinglePage,
  auditPages,
  quickAudit
} from './audit.js'

// ============================================
// 导出报告生成功能
// ============================================
export {
  generateReport,
  generateJSON,
  generateHTML,
  generateCSV
} from './audit-reporter.js'

// ============================================
// 导出所有类型定义
// ============================================
export type {
  // 配置类型
  AuditConfig,
  AuditOptions,
  LighthouseConfig,
  PuppeteerConfig,
  OutputConfig,
  
  // 审计结果类型
  AuditResult,
  AuditSummary,
  AuditProgress,
  AuditOpportunity,
  
  // 指标类型
  WebVitalsMetrics,
  PerformanceScores,
  
  // 枚举类型
  FormFactor,
  ThrottlingMode,
  AuditCategory,
  ReportFormat
} from './audit-types.js'

