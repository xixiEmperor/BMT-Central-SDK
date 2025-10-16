/**
 * Puppeteer + Lighthouse 审计功能使用示例
 * 
 * 本文件展示了如何使用 @wfynbzlx666/sdk-perf 的审计功能
 * 
 * 运行前请确保:
 * 1. 已安装依赖: pnpm install
 * 2. 已构建项目: pnpm build
 * 
 * 运行方式:
 * node packages/sdk-perf/examples/audit-example.js
 */

import { auditPages, auditSinglePage, quickAudit, generateReport } from '@wfynbzlx666/sdk-perf'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ============================================
// 示例 1: 快速审计单个页面
// ============================================
async function example1() {
  console.log('\n=== 示例 1: 快速审计 ===')
  
  // 使用默认配置快速审计
  const result = await quickAudit('https://www.example.com')
  
  console.log('审计完成!')
  console.log('- URL:', result.url)
  console.log('- 性能分数:', result.scores?.performance?.toFixed(1))
  console.log('- LCP:', result.metrics?.lcp ? `${(result.metrics.lcp / 1000).toFixed(2)}s` : 'N/A')
  console.log('- FID:', result.metrics?.fid ? `${result.metrics.fid}ms` : 'N/A')
  console.log('- CLS:', result.metrics?.cls?.toFixed(3))
  console.log('- 优化建议数:', result.opportunities?.length || 0)
  
  if (result.opportunities && result.opportunities.length > 0) {
    console.log('\n最重要的优化建议:')
    result.opportunities.slice(0, 3).forEach((opp, index) => {
      console.log(`  ${index + 1}. ${opp.title}`)
      if (opp.savings) {
        console.log(`     可节省: ${(opp.savings / 1000).toFixed(2)}s`)
      }
    })
  }
}

// ============================================
// 示例 2: 详细配置的单页审计
// ============================================
async function example2() {
  console.log('\n=== 示例 2: 详细配置审计 ===')
  
  const result = await auditSinglePage('https://www.example.com', {
    lighthouse: {
      formFactor: 'desktop',  // 桌面设备
      throttling: 'none',     // 不进行网络节流
      categories: ['performance', 'accessibility', 'seo']  // 审计多个类别
    },
    puppeteer: {
      headless: true,
      timeout: 60000  // 60秒超时
    },
    output: {
      verbose: true  // 输出详细日志
    }
  })
  
  console.log('\n审计结果:')
  console.log('- 性能:', result.scores?.performance?.toFixed(1))
  console.log('- 可访问性:', result.scores?.accessibility?.toFixed(1))
  console.log('- SEO:', result.scores?.seo?.toFixed(1))
}

// ============================================
// 示例 3: 批量审计多个页面
// ============================================
async function example3() {
  console.log('\n=== 示例 3: 批量审计 ===')
  
  const summary = await auditPages({
    urls: [
      'https://www.example.com',
      'https://www.example.org',
      'https://www.wikipedia.org'
    ],
    lighthouse: {
      formFactor: 'mobile',
      throttling: 'mobile4G',
      categories: ['performance']
    },
    concurrency: 2,  // 同时审计2个页面
    retryCount: 1,   // 失败重试1次
    output: {
      verbose: false
    },
    // 进度回调
    onProgress: (progress) => {
      console.log(`[${progress.current}/${progress.total}] ${progress.url}: ${progress.status}`)
    }
  })
  
  console.log('\n审计汇总:')
  console.log('- 总计:', summary.total)
  console.log('- 成功:', summary.success)
  console.log('- 失败:', summary.failed)
  console.log('- 平均性能分数:', summary.averagePerformanceScore?.toFixed(1))
  console.log('- 总耗时:', `${(summary.totalDuration / 1000).toFixed(2)}s`)
  
  // 显示每个页面的结果
  console.log('\n各页面详情:')
  summary.results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.url}`)
    console.log(`   状态: ${result.success ? '✓ 成功' : '✗ 失败'}`)
    if (result.success) {
      console.log(`   性能分数: ${result.scores?.performance?.toFixed(1)}`)
      console.log(`   LCP: ${result.metrics?.lcp ? (result.metrics.lcp / 1000).toFixed(2) + 's' : 'N/A'}`)
    } else {
      console.log(`   错误: ${result.error}`)
    }
  })
  
  return summary
}

// ============================================
// 示例 4: 生成报告
// ============================================
async function example4(summary) {
  console.log('\n=== 示例 4: 生成报告 ===')
  
  const outputDir = join(__dirname, '../audit-reports')
  
  // 生成 JSON 报告
  const jsonPath = join(outputDir, 'audit-report.json')
  await generateReport(summary, 'json', jsonPath)
  console.log('✓ JSON 报告已保存:', jsonPath)
  
  // 生成 HTML 报告
  const htmlPath = join(outputDir, 'audit-report.html')
  await generateReport(summary, 'html', htmlPath)
  console.log('✓ HTML 报告已保存:', htmlPath)
  
  // 生成 CSV 报告
  const csvPath = join(outputDir, 'audit-report.csv')
  await generateReport(summary, 'csv', csvPath)
  console.log('✓ CSV 报告已保存:', csvPath)
  
  console.log('\n可以在浏览器中打开 HTML 报告查看详细信息')
}

// ============================================
// 示例 5: 性能回归测试
// ============================================
async function example5() {
  console.log('\n=== 示例 5: 性能回归测试 ===')
  
  const THRESHOLD = 70  // 性能阈值
  
  const summary = await auditPages({
    urls: ['https://www.example.com'],
    lighthouse: {
      formFactor: 'mobile',
      categories: ['performance']
    },
    output: { verbose: false }
  })
  
  const avgScore = summary.averagePerformanceScore
  
  console.log(`平均性能分数: ${avgScore?.toFixed(1)}`)
  console.log(`阈值: ${THRESHOLD}`)
  
  if (avgScore && avgScore >= THRESHOLD) {
    console.log('✓ 性能测试通过!')
    return true
  } else {
    console.log('✗ 性能测试失败，分数低于阈值')
    return false
  }
}

// ============================================
// 示例 6: 多环境对比
// ============================================
async function example6() {
  console.log('\n=== 示例 6: 多环境性能对比 ===')
  
  // 假设有三个环境
  const environments = {
    'Example.com': 'https://www.example.com',
    'Example.org': 'https://www.example.org',
    'Wikipedia': 'https://www.wikipedia.org'
  }
  
  console.log('正在审计各环境...')
  
  const results = await Promise.all(
    Object.entries(environments).map(async ([name, url]) => {
      const result = await auditSinglePage(url, {
        lighthouse: {
          formFactor: 'mobile',
          categories: ['performance']
        },
        output: { verbose: false }
      })
      return { name, result }
    })
  )
  
  console.log('\n性能对比:')
  console.log('─'.repeat(50))
  console.log('环境                  | 性能分数 | LCP      | CLS')
  console.log('─'.repeat(50))
  
  results.forEach(({ name, result }) => {
    if (result.success) {
      const score = result.scores?.performance?.toFixed(1) || 'N/A'
      const lcp = result.metrics?.lcp ? `${(result.metrics.lcp / 1000).toFixed(2)}s` : 'N/A'
      const cls = result.metrics?.cls?.toFixed(3) || 'N/A'
      console.log(`${name.padEnd(20)} | ${score.toString().padEnd(8)} | ${lcp.padEnd(8)} | ${cls}`)
    } else {
      console.log(`${name.padEnd(20)} | 失败`)
    }
  })
  console.log('─'.repeat(50))
}

// ============================================
// 运行所有示例
// ============================================
async function runAllExamples() {
  console.log('🚀 Puppeteer + Lighthouse 审计功能示例')
  console.log('='.repeat(50))
  
  try {
    // 示例 1: 快速审计
    await example1()
    
    // 示例 2: 详细配置
    await example2()
    
    // 示例 3: 批量审计
    const summary = await example3()
    
    // 示例 4: 生成报告
    await example4(summary)
    
    // 示例 5: 性能测试
    await example5()
    
    // 示例 6: 环境对比
    await example6()
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ 所有示例运行完成!')
    console.log('='.repeat(50))
    
  } catch (error) {
    console.error('\n❌ 示例运行失败:', error.message)
    process.exit(1)
  }
}

// 执行示例
runAllExamples()

