// BMT Platform SDK Playground 主入口
import { createTaskQueue, withRetry, createBroadcast, withLock } from '@platform/sdk-core'

console.log('🚀 BMT Platform SDK Playground 启动中...')

// 临时的日志辅助函数
function log(sectionId: string, message: string, type: 'info' | 'success' | 'error' = 'info') {
  const logArea = document.getElementById(`${sectionId}-log`)
  if (logArea) {
    const timestamp = new Date().toLocaleTimeString()
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'
    logArea.textContent += `[${timestamp}] ${prefix} ${message}\n`
    logArea.scrollTop = logArea.scrollHeight
  }
}

// 初始化按钮事件监听
document.addEventListener('DOMContentLoaded', () => {
  // SDK Core - TaskQueue
  document.getElementById('test-task-queue')?.addEventListener('click', async () => {
    const queue = createTaskQueue<{ id: number }>({ concurrency: 2, timeoutMs: 5000 })
    const start = Date.now()
    const tasks = Array.from({ length: 5 }, (_, i) => async () => {
      const ms = 500 + Math.random() * 1500
      await new Promise(r => setTimeout(r, ms))
      return { id: i + 1 }
    })
    const results = await Promise.all(tasks.map(t => queue.add(t)))
    const status = queue.getStatus()
    log('core', `TaskQueue 完成 ${results.length} 个任务，用时 ${Date.now() - start}ms，状态：${JSON.stringify(status)}`, 'success')
  })

  // SDK Core - Retry
  document.getElementById('test-retry')?.addEventListener('click', async () => {
    let attempt = 0
    const fn = async () => {
      attempt++
      if (attempt < 3) throw new Error(`第 ${attempt} 次失败`)
      return 'OK'
    }
    try {
      const result = await withRetry(fn, { retries: 3, baseMs: 200, jitter: true })
      log('core', `重试成功，结果：${result}，总尝试：${attempt}`, 'success')
    } catch (e: any) {
      log('core', `重试失败：${e?.message ?? e}`, 'error')
    }
  })

  // SDK Core - Broadcast
  document.getElementById('test-broadcast')?.addEventListener('click', () => {
    const bc = createBroadcast<{ msg: string }>('demo')
    const un = bc.addEventListener((m) => {
      log('core', `收到广播：${m.data.msg}`)
      un()
      bc.close()
    })
    bc.postMessage('demo', { msg: '来自本页的广播消息' })
    log('core', '已发送广播消息，建议在另一个 Tab 也打开本页面测试跨标签页', 'success')
  })

  // SDK HTTP 测试（占位）
  document.getElementById('test-http-get')?.addEventListener('click', async () => {
    try {
      const { initHttp, http, mockPlugin } = await import('@platform/sdk-http')
      initHttp({ 
        baseURL: (import.meta as any).env.VITE_API_BASE_URL || 'https://httpbin.org',
        plugins: [
          mockPlugin({
            routes: [
              {
                test: (cfg) => cfg.url?.endsWith('/get') === true,
                response: () => ({ ok: true, mocked: true, ts: Date.now() }),
                delayMs: 300,
              },
            ],
          }),
        ],
      })
      const data = await http.get('/get')
      log('http', `GET /get 成功：${JSON.stringify(data).slice(0, 120)}...`, 'success')
    } catch (e: any) {
      log('http', `GET 失败：${e?.message ?? e}`, 'error')
    }
  })
  document.getElementById('test-http-error')?.addEventListener('click', async () => {
    try {
      const { initHttp, http } = await import('@platform/sdk-http')
      initHttp({ baseURL: (import.meta as any).env.VITE_API_BASE_URL || 'https://httpbin.org' })
      await http.get('/status/500')
    } catch (e: any) {
      log('http', `触发错误：${e?.name ?? 'Error'} - ${e?.message ?? e}`, 'error')
    }
  })
  document.getElementById('test-retry-http')?.addEventListener('click', async () => {
    try {
      const { initHttp, http, retryPlugin } = await import('@platform/sdk-http')
      
      // 初始化HTTP客户端，配置重试插件
      initHttp({ 
        baseURL: 'https://httpbin.org',
        plugins: [
          retryPlugin({
            retries: 3,
            baseMs: 1000,
            statusCodes: [500, 502, 503, 504]
          })
        ]
      })
      
      // 发送一个会失败的请求来测试重试
      try {
        await http.get('/status/500')
      } catch (error: any) {
        log('http', `重试测试完成，最终失败：${error?.name || 'Error'}`, 'success')
      }
    } catch (e: any) {
      log('http', `重试测试失败：${e?.message ?? e}`, 'error')
    }
  })
  
  document.getElementById('test-circuit-breaker')?.addEventListener('click', async () => {
    try {
      const { initHttp, http, circuitBreakerPlugin } = await import('@platform/sdk-http')
      
      // 初始化HTTP客户端，配置熔断器插件
      initHttp({ 
        baseURL: 'https://httpbin.org',
        plugins: [
          circuitBreakerPlugin({
            failureThreshold: 3,
            resetTimeoutMs: 10000,
            monitoringPeriodMs: 60000
          })
        ]
      })
      
      // 快速发送多个失败请求来触发熔断器
      for (let i = 0; i < 5; i++) {
        try {
          await http.get('/status/500')
        } catch (error: any) {
          log('http', `熔断器测试 - 请求 ${i + 1} 失败：${error?.name || 'Error'}`, 'info')
        }
      }
      
      log('http', '熔断器测试完成，检查是否触发熔断', 'success')
    } catch (e: any) {
      log('http', `熔断器测试失败：${e?.message ?? e}`, 'error')
    }
  })
  
  // 额外的HTTP插件测试
  document.getElementById('test-rate-limit')?.addEventListener('click', async () => {
    try {
      const { initHttp, http, rateLimitPlugin } = await import('@platform/sdk-http')
      
      // 初始化HTTP客户端，配置限流插件
      initHttp({ 
        baseURL: 'https://httpbin.org',
        plugins: [
          rateLimitPlugin({
            maxRequests: 2,
            windowMs: 5000
          })
        ]
      })
      
      // 快速发送多个请求来测试限流
      for (let i = 0; i < 4; i++) {
        try {
          const response = await http.get('/get')
          log('http', `限流测试 - 请求 ${i + 1} 成功`, 'success')
        } catch (error: any) {
          log('http', `限流测试 - 请求 ${i + 1} 被限制：${error?.name || 'Error'}`, 'info')
        }
      }
    } catch (e: any) {
      log('http', `限流测试失败：${e?.message ?? e}`, 'error')
    }
  })
  
  document.getElementById('test-dedup')?.addEventListener('click', async () => {
    try {
      const { initHttp, http, dedupPlugin } = await import('@platform/sdk-http')
      
      // 初始化HTTP客户端，配置去重插件
      initHttp({ 
        baseURL: 'https://httpbin.org',
        plugins: [
          dedupPlugin({
            keyGenerator: (config) => `${config.method}-${config.url}`,
            cacheMs: 5000
          })
        ]
      })
      
      // 发送相同的请求多次
      const promises = Array(3).fill(0).map(async (_, i) => {
        try {
          const response = await http.get('/get?test=dedup')
          log('http', `去重测试 - 请求 ${i + 1} 完成`, 'success')
          return response
        } catch (error: any) {
          log('http', `去重测试 - 请求 ${i + 1} 失败：${error?.name || 'Error'}`, 'error')
        }
      })
      
      await Promise.all(promises)
      log('http', '去重测试完成，相同请求应该被去重', 'success')
    } catch (e: any) {
      log('http', `去重测试失败：${e?.message ?? e}`, 'error')
    }
  })
  
  document.getElementById('test-auth')?.addEventListener('click', async () => {
    try {
      const { initHttp, http, authPlugin } = await import('@platform/sdk-http')
      
      // 初始化HTTP客户端，配置认证插件
      initHttp({ 
        baseURL: 'https://httpbin.org',
        plugins: [
          authPlugin({
            getToken: () => 'Bearer demo-token-12345',
            refreshToken: async () => 'Bearer refreshed-token-67890'
          })
        ]
      })
      
      // 发送需要认证的请求
      try {
        const response = await http.get('/bearer')
        log('http', `认证测试成功：${JSON.stringify(response).slice(0, 100)}...`, 'success')
      } catch (error: any) {
        log('http', `认证测试失败：${error?.message || error}`, 'error')
      }
    } catch (e: any) {
      log('http', `认证插件测试失败：${e?.message ?? e}`, 'error')
    }
  })

  // SDK Performance 测试
  document.getElementById('test-web-vitals')?.addEventListener('click', async () => {
    try {
      const { initWebVitals } = await import('@platform/sdk-perf')
      initWebVitals({
        onMetric: (metric) => {
          log('perf', `Web Vitals - ${metric.name}: ${metric.value}${metric.unit || 'ms'} (${metric.rating})`, 'success')
        }
      })
      log('perf', 'Web Vitals 监控已启动', 'success')
    } catch (e: any) {
      log('perf', `Web Vitals 启动失败：${e?.message ?? e}`, 'error')
    }
  })
  
  document.getElementById('test-user-timing')?.addEventListener('click', async () => {
    try {
      const { mark, measure, getEntriesByType } = await import('@platform/sdk-perf')
      
      // 标记开始时间
      mark('demo-start')
      
      // 模拟一些操作
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 标记结束时间
      mark('demo-end')
      
      // 测量时间间隔
      measure('demo-duration', 'demo-start', 'demo-end')
      
      // 获取测量结果
      const measures = getEntriesByType('measure')
      const demoDuration = measures.find(m => m.name === 'demo-duration')
      
      log('perf', `User Timing - demo-duration: ${demoDuration?.duration?.toFixed(2)}ms`, 'success')
    } catch (e: any) {
      log('perf', `User Timing 测试失败：${e?.message ?? e}`, 'error')
    }
  })
  
  document.getElementById('test-performance-observer')?.addEventListener('click', async () => {
    try {
      const { createPerformanceObserver } = await import('@platform/sdk-perf')
      
      const observer = createPerformanceObserver({
        entryTypes: ['navigation', 'paint', 'resource', 'longtask'],
        enableDetailedMonitoring: true,
        onMetric: (metric) => {
          log('perf', `Observer - ${metric.type}/${metric.name}: ${metric.value}${metric.unit || ''}`, 'success')
        }
      })
      
      if (observer) {
        log('perf', 'Performance Observer 已启动，正在监控...', 'success')
        
        // 10秒后停止观察
        setTimeout(() => {
          observer.disconnect()
          log('perf', 'Performance Observer 已停止', 'info')
        }, 10000)
      } else {
        log('perf', 'Performance Observer 不支持', 'error')
      }
    } catch (e: any) {
      log('perf', `Performance Observer 启动失败：${e?.message ?? e}`, 'error')
    }
  })

  // 高级性能指标测试
  document.getElementById('test-advanced-metrics')?.addEventListener('click', async () => {
    try {
      const { startAdvancedMetrics } = await import('@platform/sdk-perf')
      
      const cleanup = startAdvancedMetrics({
        enableFPS: true,
        enableInteractivity: true,
        enableNetworkQuality: true,
        enableDeviceInfo: true,
        onMetric: (metric) => {
          log('perf', `高级指标 - ${metric.name}: ${metric.value}${metric.unit || ''} (${metric.rating || 'N/A'})`, 'success')
        }
      })
      
      log('perf', '高级性能指标监控已启动（包含FPS、交互性、网络质量、设备信息）', 'success')
      
      // 20秒后停止
      setTimeout(() => {
        cleanup()
        log('perf', '高级性能指标监控已停止', 'info')
      }, 20000)
    } catch (e: any) {
      log('perf', `高级指标启动失败：${e?.message ?? e}`, 'error')
    }
  })

  // FPS 监控测试
  document.getElementById('test-fps-monitoring')?.addEventListener('click', async () => {
    try {
      const { startAdvancedMetrics } = await import('@platform/sdk-perf')
      
      const cleanup = startAdvancedMetrics({
        enableFPS: true,
        fpsInterval: 1000,
        enableInteractivity: false,
        enableNetworkQuality: false,
        enableDeviceInfo: false,
        onMetric: (metric) => {
          if (metric.name === 'fps') {
            log('perf', `FPS: ${metric.value} (${metric.rating})`, metric.rating === 'good' ? 'success' : 'info')
          }
        }
      })
      
      log('perf', 'FPS 监控已启动，正在测量帧率...', 'success')
      
      // 创建一些动画来测试FPS
      let animationId: number
      const animate = () => {
        // 模拟一些工作负载
        const start = performance.now()
        while (performance.now() - start < 2) {
          // 忙等待2ms
        }
        animationId = requestAnimationFrame(animate)
      }
      animate()
      
      // 10秒后停止
      setTimeout(() => {
        cancelAnimationFrame(animationId)
        cleanup()
        log('perf', 'FPS 监控已停止', 'info')
      }, 10000)
    } catch (e: any) {
      log('perf', `FPS 监控启动失败：${e?.message ?? e}`, 'error')
    }
  })

  // 内存监控测试
  document.getElementById('test-memory-monitoring')?.addEventListener('click', async () => {
    try {
      const { startMemoryLeakDetection } = await import('@platform/sdk-perf')
      
      const cleanup = startMemoryLeakDetection((metric) => {
        log('perf', `内存监控 - ${metric.name}: ${(metric.value * 100).toFixed(2)}% 趋势`, metric.rating === 'good' ? 'success' : 'error')
      }, 5000) // 5秒间隔
      
      log('perf', '内存泄漏检测已启动...', 'success')
      
      // 创建一些内存分配来模拟使用
      const memoryConsumer: any[] = []
      const interval = setInterval(() => {
        // 分配一些内存
        for (let i = 0; i < 1000; i++) {
          memoryConsumer.push(new Array(1000).fill(Math.random()))
        }
        if (memoryConsumer.length > 5000) {
          memoryConsumer.splice(0, 1000) // 释放一些内存
        }
      }, 1000)
      
      // 15秒后停止
      setTimeout(() => {
        clearInterval(interval)
        cleanup()
        memoryConsumer.length = 0 // 清理内存
        log('perf', '内存监控已停止', 'info')
      }, 15000)
    } catch (e: any) {
      log('perf', `内存监控启动失败：${e?.message ?? e}`, 'error')
    }
  })

  // 性能快照测试
  document.getElementById('test-performance-snapshot')?.addEventListener('click', async () => {
    try {
      const { Perf } = await import('@platform/sdk-perf')
      
      const snapshot = Perf.getPerformanceSnapshot()
      log('perf', `性能快照已生成`, 'success')
      log('perf', `导航时间: 加载完成=${snapshot.navigation.loadComplete}ms, DOM加载=${snapshot.navigation.domContentLoaded}ms`, 'info')
      
      if (snapshot.memory.usedJSHeapSize) {
        log('perf', `内存使用: ${(snapshot.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB (${snapshot.memory.usagePercent}%)`, 'info')
      }
      
      log('perf', `自定义时间: ${snapshot.timing.measuresCount} 个测量, ${snapshot.timing.marksCount} 个标记`, 'info')
    } catch (e: any) {
      log('perf', `性能快照失败：${e?.message ?? e}`, 'error')
    }
  })

  // 综合性能测试
  document.getElementById('test-comprehensive-perf')?.addEventListener('click', async () => {
    try {
      const { Perf } = await import('@platform/sdk-perf')
      
      // 初始化综合性能监控
      Perf.init({
        enableDetailedMonitoring: true,
        enableAdvancedMetrics: true,
        enableMemoryLeakDetection: true,
        onMetric: (metric) => {
          const prefix = `[${metric.type}]`
          const rating = metric.rating ? ` (${metric.rating})` : ''
          log('perf', `${prefix} ${metric.name}: ${metric.value}${metric.unit || ''}${rating}`, 'success')
        }
      })
      
      log('perf', '🚀 综合性能监控已启动！监控以下指标：', 'success')
      log('perf', '• Web Vitals (LCP, FID, CLS, TTFB, FCP)', 'info')
      log('perf', '• 导航时间 (DNS, TCP, 请求响应等)', 'info')
      log('perf', '• 资源加载性能', 'info')
      log('perf', '• 长任务监控', 'info')
      log('perf', '• FPS 和交互性能', 'info')
      log('perf', '• 内存使用和泄漏检测', 'info')
      log('perf', '• 网络质量和设备信息', 'info')
      
      // 30秒后停止
      setTimeout(() => {
        Perf.stop()
        log('perf', '综合性能监控已停止', 'info')
      }, 30000)
    } catch (e: any) {
      log('perf', `综合性能测试失败：${e?.message ?? e}`, 'error')
    }
  })

  // SDK Telemetry 测试
  document.getElementById('test-track-event')?.addEventListener('click', async () => {
    try {
      const { Telemetry, createCustomEvent } = await import('@platform/sdk-telemetry')
      
      // 初始化遥测（如果还没有初始化）
      if (!Telemetry.isInitialized()) {
        Telemetry.init({
          endpoint: 'https://httpbin.org/post',
          app: 'playground',
          release: '1.0.0'
        })
      }
      
      // 创建自定义事件
      const event = createCustomEvent('button_click', {
        button_id: 'test-track-event',
        timestamp: Date.now()
      })
      
      // 发送事件
      await Telemetry.track(event)
      log('telemetry', `已发送自定义事件：${JSON.stringify(event)}`, 'success')
    } catch (e: any) {
      log('telemetry', `发送事件失败：${e?.message ?? e}`, 'error')
    }
  })
  
  document.getElementById('test-page-view')?.addEventListener('click', async () => {
    try {
      const { Telemetry, createPageEvent } = await import('@platform/sdk-telemetry')
      
      // 初始化遥测（如果还没有初始化）
      if (!Telemetry.isInitialized()) {
        Telemetry.init({
          endpoint: 'https://httpbin.org/post',
          app: 'playground',
          release: '1.0.0'
        })
      }
      
      // 创建页面浏览事件
      const event = createPageEvent('/playground', {
        section: 'telemetry',
        action: 'test'
      })
      
      // 发送页面浏览事件
      await Telemetry.track(event)
      log('telemetry', `已发送页面浏览事件：${JSON.stringify(event)}`, 'success')
    } catch (e: any) {
      log('telemetry', `发送页面浏览事件失败：${e?.message ?? e}`, 'error')
    }
  })
  
  document.getElementById('test-error-tracking')?.addEventListener('click', async () => {
    try {
      const { Telemetry, createErrorEvent } = await import('@platform/sdk-telemetry')
      
      // 初始化遥测（如果还没有初始化）
      if (!Telemetry.isInitialized()) {
        Telemetry.init({
          endpoint: 'https://httpbin.org/post',
          app: 'playground',
          release: '1.0.0'
        })
      }
      
      // 模拟一个错误
      const mockError = new Error('这是一个测试错误')
      mockError.stack = 'Error: 这是一个测试错误\n    at test (/playground/main.ts:200:15)'
      
      // 创建错误事件
      const event = createErrorEvent(mockError, {
        context: 'error_tracking_test',
        severity: 'error'
      })
      
      // 发送错误事件
      await Telemetry.track(event)
      log('telemetry', `已发送错误事件：${mockError.message}`, 'success')
    } catch (e: any) {
      log('telemetry', `发送错误事件失败：${e?.message ?? e}`, 'error')
    }
  })
  
  document.getElementById('test-flush')?.addEventListener('click', async () => {
    try {
      const { Telemetry } = await import('@platform/sdk-telemetry')
      
      if (!Telemetry.isInitialized()) {
        log('telemetry', '请先发送一些事件再进行强制上报', 'info')
        return
      }
      
      // 强制上报所有缓存的事件
      await Telemetry.flush()
      log('telemetry', '已强制上报所有缓存事件', 'success')
    } catch (e: any) {
      log('telemetry', `强制上报失败：${e?.message ?? e}`, 'error')
    }
  })

  // SDK Realtime 测试
  document.getElementById('test-connect')?.addEventListener('click', async () => {
    try {
      const { Realtime } = await import('@platform/sdk-realtime')
      
      // 连接到WebSocket服务器
      await Realtime.connect({
        url: 'ws://localhost:3001',
        auth: () => 'demo-token',
        heartbeatInterval: 30000,
        reconnect: {
          enabled: true,
          maxAttempts: 5,
          baseMs: 1000
        }
      })
      
      // 监听连接状态变化
      Realtime.onConnectionChange((status) => {
        log('realtime', `连接状态变化：${status}`, status === 'connected' ? 'success' : 'info')
      })
      
      log('realtime', '正在连接WebSocket服务器...', 'info')
    } catch (e: any) {
      log('realtime', `连接失败：${e?.message ?? e}`, 'error')
    }
  })
  
  document.getElementById('test-subscribe')?.addEventListener('click', async () => {
    try {
      const { Realtime } = await import('@platform/sdk-realtime')
      
      if (Realtime.getStatus() !== 'connected') {
        log('realtime', '请先连接到服务器', 'error')
        return
      }
      
      // 订阅消息
      const subscription = await Realtime.subscribe('test-channel', (message) => {
        log('realtime', `收到消息：${JSON.stringify(message)}`, 'success')
      })
      
      log('realtime', '已订阅 test-channel 频道', 'success')
      
      // 保存订阅引用到全局（方便取消订阅）
      ;(window as any).realtimeSubscription = subscription
    } catch (e: any) {
      log('realtime', `订阅失败：${e?.message ?? e}`, 'error')
    }
  })
  
  document.getElementById('test-publish')?.addEventListener('click', async () => {
    try {
      const { Realtime } = await import('@platform/sdk-realtime')
      
      if (Realtime.getStatus() !== 'connected') {
        log('realtime', '请先连接到服务器', 'error')
        return
      }
      
      // 发布消息
      const message = {
        type: 'chat',
        content: '来自Playground的测试消息',
        timestamp: Date.now()
      }
      
      await Realtime.publish('test-channel', message)
      log('realtime', `已发布消息到 test-channel：${JSON.stringify(message)}`, 'success')
    } catch (e: any) {
      log('realtime', `发布消息失败：${e?.message ?? e}`, 'error')
    }
  })
  
  document.getElementById('test-disconnect')?.addEventListener('click', async () => {
    try {
      const { Realtime } = await import('@platform/sdk-realtime')
      
      // 取消订阅
      const subscription = (window as any).realtimeSubscription
      if (subscription) {
        subscription.unsubscribe()
        log('realtime', '已取消订阅', 'info')
      }
      
      // 断开连接
      await Realtime.disconnect()
      log('realtime', '已断开WebSocket连接', 'success')
    } catch (e: any) {
      log('realtime', `断开连接失败：${e?.message ?? e}`, 'error')
    }
  })

  log('core', '🎉 BMT Platform SDK Playground 初始化完成！所有模块已集成，可开始全面测试', 'success')
})