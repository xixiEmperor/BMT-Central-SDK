/**
 * 性能监控优化示例
 * 
 * 本示例展示了如何使用优化后的性能监控系统，避免重复监控Web Vitals指标。
 * 优化后的系统会智能检测并避免重复监控，提高性能和效率。
 */

import { Perf } from './src/perf.js'

// 示例1：默认配置（自动优化）
// 系统会自动检测到Performance Observer包含Web Vitals指标，因此不会启用独立的Web Vitals监控
console.log('=== 示例1：默认配置（自动优化） ===')
Perf.init()

const status1 = Perf.getMonitoringStatus()
console.log('监控状态:', status1)
console.log('Web Vitals启用:', status1.webVitalsEnabled) // false，因为被Performance Observer覆盖
console.log('Performance Observer启用:', status1.performanceObserverEnabled) // true
console.log('是否存在重复监控:', status1.hasWebVitalsOverlap) // false，优化后避免了重复

// 示例2：仅启用Web Vitals监控
console.log('\n=== 示例2：仅启用Web Vitals监控 ===')
Perf.init({
  autoEnableWebVitals: true,
  enableDetailedMonitoring: false, // 禁用Performance Observer
  observeEntryTypes: [] // 空数组，不监控任何Performance Observer条目
})

const status2 = Perf.getMonitoringStatus()
console.log('监控状态:', status2)
console.log('Web Vitals启用:', status2.webVitalsEnabled) // true，因为没有重复
console.log('Performance Observer启用:', status2.performanceObserverEnabled) // false
console.log('是否存在重复监控:', status2.hasWebVitalsOverlap) // false

// 示例3：自定义Performance Observer条目（不包含Web Vitals）
console.log('\n=== 示例3：自定义Performance Observer条目（不包含Web Vitals） ===')
Perf.init({
  autoEnableWebVitals: true,
  enableDetailedMonitoring: true,
  observeEntryTypes: ['longtask', 'measure', 'mark', 'memory'] // 不包含Web Vitals相关条目
})

const status3 = Perf.getMonitoringStatus()
console.log('监控状态:', status3)
console.log('Web Vitals启用:', status3.webVitalsEnabled) // true，因为没有重复
console.log('Performance Observer启用:', status3.performanceObserverEnabled) // true
console.log('监控的条目类型:', status3.monitoredEntryTypes)
console.log('是否存在重复监控:', status3.hasWebVitalsOverlap) // false

// 示例4：检测重复监控的情况（旧版本行为）
console.log('\n=== 示例4：如果没有优化会出现的重复监控 ===')
// 注意：这只是展示优化前后的对比，实际代码已经优化，不会出现重复
const wouldBeOverlapping = {
  autoEnableWebVitals: true,
  enableDetailedMonitoring: true,
  observeEntryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift']
}

// 模拟检测逻辑
const webVitalsEntryTypes = ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift', 'navigation']
const hasOverlap = wouldBeOverlapping.observeEntryTypes.some(type => 
  webVitalsEntryTypes.includes(type)
)

console.log('如果没有优化，会同时启用:')
console.log('- Web Vitals监控: true')
console.log('- Performance Observer监控: true') 
console.log('- 重复的指标:', wouldBeOverlapping.observeEntryTypes.filter(type => 
  webVitalsEntryTypes.includes(type)
))
console.log('- 这会导致性能浪费!')

console.log('\n优化后的行为:')
console.log('- 系统检测到重复，自动禁用独立的Web Vitals监控')
console.log('- 仅使用Performance Observer监控所有指标')
console.log('- 避免重复监控，提高性能')

// 性能对比示例
console.log('\n=== 性能优化效果 ===')
console.log('优化前：')
console.log('- 5个独立的Web Vitals PerformanceObserver实例')
console.log('- 1个Performance Observer实例（包含相同指标）')
console.log('- 总计：6个Observer实例，重复监控5个指标')

console.log('\n优化后：')
console.log('- 1个Performance Observer实例（包含所有指标）')
console.log('- 总计：1个Observer实例，无重复监控')
console.log('- 性能提升：减少83%的Observer实例，避免重复处理')
