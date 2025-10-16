/**
 * 审计功能集成测试脚本
 * 
 * 此脚本用于测试 Puppeteer + Lighthouse 审计功能的完整流程。
 * 
 * 运行方式:
 * 1. 先安装依赖: pnpm install
 * 2. 构建项目: cd packages/sdk-perf && pnpm build
 * 3. 运行测试: node packages/sdk-perf/test-audit.js
 */

import { auditPages, auditSinglePage, quickAudit, generateReport } from './dist/index.js'

console.log('🚀 开始审计功能集成测试...\n')

// // 测试 1: 快速审计单个页面
// async function test1() {
//   console.log('=== 测试 1: 快速审计单个页面 ===')
//   try {
//     const result = await quickAudit('http://localhost:5173/#/home')
//     console.log('✅ 测试通过')
//     console.log(`- URL: ${result.url}`)
//     console.log(`- 性能分数: ${result.scores?.performance?.toFixed(1) || 'N/A'}`)
//     console.log(`- LCP: ${result.metrics?.lcp ? (result.metrics.lcp / 1000).toFixed(2) + 's' : 'N/A'}`)
//     console.log(`- 优化建议数: ${result.opportunities?.length || 0}`)
//     console.log()
//     return true
//   } catch (error) {
//     console.error('❌ 测试失败:', error.message)
//     console.log()
//     return false
//   }
// }

// 测试 2: 审计单个页面（带详细配置）
async function test2() {
  console.log('=== 测试 2: 审计单个页面（详细配置）===')
  try {
    const result = await auditSinglePage('http://localhost:5173/#/home', {
      chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      lighthouse: {
        formFactor: 'desktop',
        categories: ['performance']
      },
      output: {
        format: 'html',
        path: './audit-result.html',
        verbose: true
      }
    })
    console.log('✅ 测试通过')
    console.log('- result:', result)
    console.log(`- URL: ${result.url}`)
    console.log(`- 成功: ${result.success}`)
    console.log(`- 耗时: ${result.duration ? (result.duration / 1000).toFixed(2) + 's' : 'N/A'}`)
    console.log()
    return true
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.log()
    return false
  }
}

test2()

// // 测试 3: 批量审计（少量页面）
// async function test3() {
//   console.log('=== 测试 3: 批量审计 ===')
//   try {
//     const summary = await auditPages({
//       urls: [
//         'http://localhost:5173/#/home',
//         'http://localhost:5173/#/booking'
//       ],
//       chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
//       lighthouse: {
//         formFactor: 'mobile',
//         categories: ['performance']
//       },
//       puppeteer: {
//         headless: false
//       },
//       concurrency: 2,
//       output: {
//         verbose: false
//       }
//     })
    
//     console.log('✅ 测试通过')
//     console.log(`- 总计: ${summary.total}`)
//     console.log(`- 成功: ${summary.success}`)
//     console.log(`- 失败: ${summary.failed}`)
//     console.log(`- 平均性能分数: ${summary.averagePerformanceScore?.toFixed(1) || 'N/A'}`)
//     console.log(`- 总耗时: ${(summary.totalDuration / 1000).toFixed(2)}s`)
//     console.log()
    
//     // 测试报告生成
//     console.log('=== 测试 3.1: 生成 JSON 报告 ===')
//     const jsonReport = await generateReport(summary, 'json')
//     console.log('✅ JSON 报告生成成功，长度:', jsonReport.length, 'bytes')
    
//     console.log('=== 测试 3.2: 生成 HTML 报告 ===')
//     const htmlReport = await generateReport(summary, 'html')
//     console.log('✅ HTML 报告生成成功，长度:', htmlReport.length, 'bytes')
    
//     console.log('=== 测试 3.3: 生成 CSV 报告 ===')
//     const csvReport = await generateReport(summary, 'csv')
//     console.log('✅ CSV 报告生成成功，长度:', csvReport.length, 'bytes')
//     console.log()
    
//     return true
//   } catch (error) {
//     console.error('❌ 测试失败:', error.message)
//     console.log()
//     return false
//   }
// }

// // 测试 4: 错误处理（无效 URL）
// async function test4() {
//   console.log('=== 测试 4: 错误处理 ===')
//   try {
//     const result = await auditSinglePage('https://this-url-definitely-does-not-exist-12345.com', {
//       output: { verbose: false },
//       retryCount: 0  // 不重试，快速失败
//     })
    
//     if (!result.success) {
//       console.log('✅ 测试通过（正确处理了失败情况）')
//       console.log(`- 错误信息: ${result.error}`)
//       console.log()
//       return true
//     } else {
//       console.error('❌ 测试失败: 应该失败但成功了')
//       console.log()
//       return false
//     }
//   } catch (error) {
//     console.error('❌ 测试失败（抛出了异常）:', error.message)
//     console.log()
//     return false
//   }
// }

// // 测试 5: 进度回调
// async function test5() {
//   console.log('=== 测试 5: 进度回调 ===')
//   try {
//     let progressCallCount = 0
    
//     await auditPages({
//       urls: ['http://localhost:5173/#/home'],
//       lighthouse: {
//         formFactor: 'mobile',
//         categories: ['performance']
//       },
//       output: { verbose: false },
//       onProgress: (progress) => {
//         progressCallCount++
//         console.log(`  进度: [${progress.current}/${progress.total}] ${progress.url} - ${progress.status}`)
//       }
//     })
    
//     if (progressCallCount > 0) {
//       console.log(`✅ 测试通过（进度回调被调用 ${progressCallCount} 次）`)
//       console.log()
//       return true
//     } else {
//       console.error('❌ 测试失败: 进度回调未被调用')
//       console.log()
//       return false
//     }
//   } catch (error) {
//     console.error('❌ 测试失败:', error.message)
//     console.log()
//     return false
//   }
// }

// // 运行所有测试
// async function runAllTests() {
//   const results = {
//     test1: await test1(),
//     test2: await test2(),
//     test3: await test3(),
//     test4: await test4(),
//     test5: await test5()
//   }
  
//   console.log('='.repeat(50))
//   console.log('📊 测试结果汇总')
//   console.log('='.repeat(50))
  
//   const passed = Object.values(results).filter(r => r).length
//   const total = Object.keys(results).length
  
//   Object.entries(results).forEach(([name, passed]) => {
//     console.log(`${passed ? '✅' : '❌'} ${name}: ${passed ? '通过' : '失败'}`)
//   })
  
//   console.log('='.repeat(50))
//   console.log(`总计: ${passed}/${total} 测试通过`)
//   console.log('='.repeat(50))
  
//   if (passed === total) {
//     console.log('🎉 所有测试通过！')
//     process.exit(0)
//   } else {
//     console.log('⚠️  部分测试失败')
//     process.exit(1)
//   }
// }

// // 启动测试
// runAllTests().catch(error => {
//   console.error('💥 测试执行过程中发生严重错误:', error)
//   process.exit(1)
// })

