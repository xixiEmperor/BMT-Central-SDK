/**
 * Puppeteer + Lighthouse 审计功能使用示例
 * 
 * 本文件展示了如何使用 @wfynbzlx666/sdk-perf-spa 的审计功能
 * 
 * 运行前请确保:
 * 1. 已安装依赖: pnpm install
 * 2. 已构建项目: pnpm build
 * 
 * 运行方式:
 * node packages/sdk-perf-spa/examples/audit-example.js
 */

import { auditPages, auditSinglePage, quickAudit, generateReport } from '@wfynbzlx666/sdk-perf-spa'
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
  const result = await quickAudit('http://localhost:5173/#/home')
  
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
// 示例 2: 使用完整配置的单页审计（包含 output 配置）
// ============================================
async function example2() {
  console.log('\n=== 示例 2: 详细配置审计 ===')
  
  const result = await auditSinglePage('http://localhost:5173/#/home', {
    lighthouse: {
      formFactor: 'desktop',  // 桌面设备
      throttling: 'none',     // 不进行网络节流
      categories: ['performance', 'accessibility', 'best-practices', 'seo']  // 审计多个类别
    },
    puppeteer: {
      headless: 'new',
      timeout: 60000  // 60秒超时
    },
    output: {
      format: 'html',
      path: join(__dirname, '../audit-reports/single-page-report.html'),
      verbose: false // 输出详细日志
    }
  })
  
  console.log('\n审计结果:')
  console.log('- 性能:', result.scores?.performance?.toFixed(1))
  console.log('- 可访问性:', result.scores?.accessibility?.toFixed(1))
  console.log('- 最佳实践:', result.scores?.bestPractices?.toFixed(1))
  console.log('- SEO:', result.scores?.seo?.toFixed(1))
}

// ============================================
// 示例 3: 批量审计多个页面
// ============================================
async function example3() {
  console.log('\n=== 示例 3: 批量审计 ===')
  
  const summary = await auditPages({
    urls: [
      'https://xixiemperor.github.io/BMT-MicroApps/#/home',
      'https://xixiemperor.github.io/BMT-MicroApps/#/booking'
    ],
    lighthouse: {
      formFactor: 'mobile',
      throttling: 'mobile4G',
      categories: ['performance']
    },
    concurrency: 1,  // 同时审计2个页面
    retryCount: 1,   // 失败重试1次
    output: {
      format: 'html',
      path: join(__dirname, '../audit-reports/summary.html'),
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
// 示例 4: Output 配置完整演示
// ============================================
async function example4() {
  console.log('\n=== 示例 4: Output 配置完整演示 ===')
  
  const outputDir = join(__dirname, '../audit-reports')
  
  console.log('\n4.1 保存 JSON 报告:')
  await auditSinglePage('http://localhost:5173/#/home', {
    lighthouse: {
      formFactor: 'mobile',
      categories: ['performance']
    },
    output: {
      format: 'json',  // JSON 格式
      path: join(outputDir, 'report.json'),  // 保存路径
      verbose: true    // 详细日志
    }
  })
  console.log('✓ JSON 报告已保存到:', join(outputDir, 'report.json'))
  
  console.log('\n4.2 保存 HTML 报告:')
  await auditSinglePage('http://localhost:5173/#/home', {
    lighthouse: {
      formFactor: 'mobile',
      categories: ['performance']
    },
    output: {
      format: 'html',  // HTML 格式（可视化报告）
      path: join(outputDir, 'report.html'),
      verbose: false   // 只显示错误
    }
  })
  console.log('✓ HTML 报告已保存到:', join(outputDir, 'report.html'))
  
  console.log('\n4.3 保存 CSV 报告:')
  await auditSinglePage('http://localhost:5173/#/home', {
    lighthouse: {
      formFactor: 'mobile',
      categories: ['performance']
    },
    output: {
      format: 'csv',   // CSV 格式（便于数据分析）
      path: join(outputDir, 'report.csv'),
      verbose: false
    }
  })
  console.log('✓ CSV 报告已保存到:', join(outputDir, 'report.csv'))
  
  console.log('\n4.4 不保存文件（只返回结果）:')
  const result = await auditSinglePage('http://localhost:5173/#/home', {
    lighthouse: {
      formFactor: 'mobile',
      categories: ['performance']
    },
    output: {
      format: 'json',
      // 不指定 path，只在内存中返回结果
      verbose: false
    }
  })
  console.log('✓ 审计完成，性能分数:', result.scores?.performance?.toFixed(1))
  console.log('  （未保存到文件，只在内存中）')
  
  console.log('\n4.5 批量审计并保存报告:')
  await auditPages({
    urls: [
      'http://localhost:5173/#/home',
      'http://localhost:5173/#/booking'
    ],
    lighthouse: {
      formFactor: 'desktop',
      categories: ['performance', 'accessibility']
    },
    output: {
      format: 'html',  // 保存为 HTML 格式
      path: join(outputDir, 'batch-report.html'),
      verbose: true
    }
  })
  
  console.log('✓ 所有报告已自动保存')
}

// ============================================
// 示例 5: 手动生成多种格式报告
// ============================================
async function example5(summary) {
  console.log('\n=== 示例 5: 手动生成报告 ===')
  
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
// 示例 6: 多环境对比
// ============================================
async function example6() {
  console.log('\n=== 示例 6: 多环境性能对比 ===')
  
  // 假设有三个环境
  const environments = {
    'Home': 'http://localhost:5173/#/home',
    'Booking': 'http://localhost:5173/#/booking'
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
    // await example1()
    
    // 示例 2: 详细配置
    await example2()
    
    // 示例 3: 批量审计
    // const summary = await example3()
    // generateReport(summary, 'html', join(__dirname, '../audit-reports/summary.html'))
    
    // 示例 4: 审计时自动保存报告
    // await example4()
    
    // 示例 5: 手动生成报告
    // await example5(summary)
    
    // 示例 6: 性能测试
    // await example6()
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ 所有示例运行完成!')
    console.log('='.repeat(50))
    
  } catch (error) {
    console.error('\n❌ 示例运行失败:', error.message)
    console.error('错误详情:', error)
    process.exit(1)
  }
}

// 执行示例
runAllExamples()

