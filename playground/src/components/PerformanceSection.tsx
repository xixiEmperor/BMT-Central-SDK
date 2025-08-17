import React, { useRef } from 'react'
import { useLogger } from '../hooks/useLogger'
import LogArea from './LogArea'

const PerformanceSection: React.FC = () => {
  const { logs, log } = useLogger()
  const cleanupRef = useRef<(() => void) | null>(null)

  const testWebVitals = async () => {
    try {
      const { initWebVitals } = await import('@wfynbzlx666/sdk-perf')
      initWebVitals({
        onMetric: (metric) => {
          log(`Web Vitals - ${metric.name}: ${metric.value}${metric.unit || 'ms'} (${metric.rating})`, 'success')
        }
      })
      log('Web Vitals 监控已启动', 'success')
    } catch (e: any) {
      log(`Web Vitals 启动失败：${e?.message ?? e}`, 'error')
    }
  }

  const testUserTiming = async () => {
    try {
      const { mark, measure, getEntriesByType } = await import('@wfynbzlx666/sdk-perf')
      
      mark('demo-start')
      await new Promise(resolve => setTimeout(resolve, 100))
      mark('demo-end')
      measure('demo-duration', 'demo-start', 'demo-end')
      
      const measures = getEntriesByType('measure')
      const demoDuration = measures.find(m => m.name === 'demo-duration')
      
      log(`User Timing - demo-duration: ${demoDuration?.duration?.toFixed(2)}ms`, 'success')
    } catch (e: any) {
      log(`User Timing 测试失败：${e?.message ?? e}`, 'error')
    }
  }

  const testPerformanceObserver = async () => {
    try {
      const { createPerformanceObserver } = await import('@wfynbzlx666/sdk-perf')
      
      const observer = createPerformanceObserver({
        entryTypes: ['navigation', 'paint', 'resource', 'longtask'],
        enableDetailedMonitoring: true,
        onMetric: (metric) => {
          log(`Observer - ${metric.type}/${metric.name}: ${metric.value}${metric.unit || ''}`, 'success')
        }
      })
      
      if (observer) {
        log('Performance Observer 已启动，正在监控...', 'success')
        
        setTimeout(() => {
          observer.disconnect()
          log('Performance Observer 已停止', 'info')
        }, 10000)
      } else {
        log('Performance Observer 不支持', 'error')
      }
    } catch (e: any) {
      log(`Performance Observer 启动失败：${e?.message ?? e}`, 'error')
    }
  }

  const testAdvancedMetrics = async () => {
    try {
      const { startAdvancedMetrics } = await import('@wfynbzlx666/sdk-perf')
      
      if (cleanupRef.current) {
        cleanupRef.current()
      }
      
      const cleanup = startAdvancedMetrics({
        enableFPS: true,
        enableInteractivity: true,
        enableNetworkQuality: true,
        enableDeviceInfo: true,
        onMetric: (metric) => {
          log(`高级指标 - ${metric.name}: ${metric.value}${metric.unit || ''} (${metric.rating || 'N/A'})`, 'success')
        }
      })
      
      cleanupRef.current = cleanup
      log('高级性能指标监控已启动（包含FPS、交互性、网络质量、设备信息）', 'success')
      
      setTimeout(() => {
        cleanup()
        cleanupRef.current = null
        log('高级性能指标监控已停止', 'info')
      }, 20000)
    } catch (e: any) {
      log(`高级指标启动失败：${e?.message ?? e}`, 'error')
    }
  }

  const testFpsMonitoring = async () => {
    try {
      const { startAdvancedMetrics } = await import('@wfynbzlx666/sdk-perf')
      
      if (cleanupRef.current) {
        cleanupRef.current()
      }
      
      const cleanup = startAdvancedMetrics({
        enableFPS: true,
        fpsInterval: 1000,
        enableInteractivity: false,
        enableNetworkQuality: false,
        enableDeviceInfo: false,
        onMetric: (metric) => {
          if (metric.name === 'fps') {
            log(`FPS: ${metric.value} (${metric.rating})`, metric.rating === 'good' ? 'success' : 'info')
          }
        }
      })
      
      cleanupRef.current = cleanup
      log('FPS 监控已启动，正在测量帧率...', 'success')
      
      // 创建一些动画来测试FPS
      let animationId: number
      const animate = () => {
        const start = performance.now()
        while (performance.now() - start < 2) {
          // 忙等待2ms
        }
        animationId = requestAnimationFrame(animate)
      }
      animate()
      
      setTimeout(() => {
        cancelAnimationFrame(animationId)
        cleanup()
        cleanupRef.current = null
        log('FPS 监控已停止', 'info')
      }, 10000)
    } catch (e: any) {
      log(`FPS 监控启动失败：${e?.message ?? e}`, 'error')
    }
  }

  const testMemoryMonitoring = async () => {
    try {
      const { startMemoryLeakDetection } = await import('@wfynbzlx666/sdk-perf')
      
      const cleanup = startMemoryLeakDetection((metric) => {
        log(`内存监控 - ${metric.name}: ${(metric.value * 100).toFixed(2)}% 趋势`, metric.rating === 'good' ? 'success' : 'error')
      }, 5000)
      
      log('内存泄漏检测已启动...', 'success')
      
      const memoryConsumer: any[] = []
      const interval = setInterval(() => {
        for (let i = 0; i < 1000; i++) {
          memoryConsumer.push(new Array(1000).fill(Math.random()))
        }
        if (memoryConsumer.length > 5000) {
          memoryConsumer.splice(0, 1000)
        }
      }, 1000)
      
      setTimeout(() => {
        clearInterval(interval)
        cleanup()
        memoryConsumer.length = 0
        log('内存监控已停止', 'info')
      }, 15000)
    } catch (e: any) {
      log(`内存监控启动失败：${e?.message ?? e}`, 'error')
    }
  }

  const testPerformanceSnapshot = async () => {
    try {
      const { Perf } = await import('@wfynbzlx666/sdk-perf')
      
      const snapshot = Perf.getPerformanceSnapshot()
      log(`性能快照已生成`, 'success')
      log(`导航时间: 加载完成=${snapshot.navigation.loadComplete}ms, DOM加载=${snapshot.navigation.domContentLoaded}ms`, 'info')
      
      if (snapshot.memory.usedJSHeapSize) {
        log(`内存使用: ${(snapshot.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB (${snapshot.memory.usagePercent}%)`, 'info')
      }
      
      log(`自定义时间: ${snapshot.timing.measuresCount} 个测量, ${snapshot.timing.marksCount} 个标记`, 'info')
    } catch (e: any) {
      log(`性能快照失败：${e?.message ?? e}`, 'error')
    }
  }

  const testComprehensivePerf = async () => {
    try {
      const { Perf } = await import('@wfynbzlx666/sdk-perf')
      
      Perf.init({
        enableDetailedMonitoring: true,
        enableAdvancedMetrics: true,
        enableMemoryLeakDetection: true,
        onMetric: (metric) => {
          const prefix = `[${metric.type}]`
          const rating = metric.rating ? ` (${metric.rating})` : ''
          log(`${prefix} ${metric.name}: ${metric.value}${metric.unit || ''}${rating}`, 'success')
        }
      })
      
      log('🚀 综合性能监控已启动！监控以下指标：', 'success')
      log('• Web Vitals (LCP, FID, CLS, TTFB, FCP)', 'info')
      log('• 导航时间 (DNS, TCP, 请求响应等)', 'info')
      log('• 资源加载性能', 'info')
      log('• 长任务监控', 'info')
      log('• FPS 和交互性能', 'info')
      log('• 内存使用和泄漏检测', 'info')
      log('• 网络质量和设备信息', 'info')
      
      setTimeout(() => {
        Perf.stop()
        log('综合性能监控已停止', 'info')
      }, 30000)
    } catch (e: any) {
      log(`综合性能测试失败：${e?.message ?? e}`, 'error')
    }
  }

  return (
    <div className="sdk-section">
      <h2>📊 SDK Performance</h2>
      <div className="button-group">
        <button onClick={testWebVitals}>Web Vitals</button>
        <button onClick={testUserTiming}>User Timing</button>
        <button onClick={testPerformanceObserver}>Performance Observer</button>
        <button onClick={testAdvancedMetrics}>高级指标</button>
        <button onClick={testFpsMonitoring}>FPS 监控</button>
        <button onClick={testMemoryMonitoring}>内存监控</button>
        <button onClick={testPerformanceSnapshot}>性能快照</button>
        <button onClick={testComprehensivePerf}>综合性能测试</button>
      </div>
      <LogArea logs={logs} />
    </div>
  )
}

export default PerformanceSection