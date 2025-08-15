import React from 'react'
import { useLogger } from '../hooks/useLogger'
import LogArea from './LogArea'

const HttpSection: React.FC = () => {
  const { logs, log } = useLogger()

  const testHttpGet = async () => {
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
      log(`GET /get 成功：${JSON.stringify(data).slice(0, 120)}...`, 'success')
    } catch (e: any) {
      log(`GET 失败：${e?.message ?? e}`, 'error')
    }
  }

  const testHttpError = async () => {
    try {
      const { initHttp, http } = await import('@platform/sdk-http')
      initHttp({ baseURL: (import.meta as any).env.VITE_API_BASE_URL || 'https://httpbin.org' })
      await http.get('/status/500')
    } catch (e: any) {
      log(`触发错误：${e?.name ?? 'Error'} - ${e?.message ?? e}`, 'error')
    }
  }

  const testRetryHttp = async () => {
    try {
      const { initHttp, http, retryPlugin } = await import('@platform/sdk-http')
      
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
      
      try {
        await http.get('/status/500')
      } catch (error: any) {
        log(`重试测试完成，最终失败：${error?.name || 'Error'}`, 'success')
      }
    } catch (e: any) {
      log(`重试测试失败：${e?.message ?? e}`, 'error')
    }
  }

  const testCircuitBreaker = async () => {
    try {
      const { initHttp, http, circuitBreakerPlugin } = await import('@platform/sdk-http')
      
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
      
      for (let i = 0; i < 5; i++) {
        try {
          await http.get('/status/500')
        } catch (error: any) {
          log(`熔断器测试 - 请求 ${i + 1} 失败：${error?.name || 'Error'}`, 'info')
        }
      }
      
      log('熔断器测试完成，检查是否触发熔断', 'success')
    } catch (e: any) {
      log(`熔断器测试失败：${e?.message ?? e}`, 'error')
    }
  }

  const testRateLimit = async () => {
    try {
      const { initHttp, http, rateLimitPlugin } = await import('@platform/sdk-http')
      
      initHttp({ 
        baseURL: 'https://httpbin.org',
        plugins: [
          rateLimitPlugin({
            maxRequests: 2,
            windowMs: 5000
          })
        ]
      })
      
      for (let i = 0; i < 4; i++) {
        try {
          const response = await http.get('/get')
          log(`限流测试 - 请求 ${i + 1} 成功`, 'success')
        } catch (error: any) {
          log(`限流测试 - 请求 ${i + 1} 被限制：${error?.name || 'Error'}`, 'info')
        }
      }
    } catch (e: any) {
      log(`限流测试失败：${e?.message ?? e}`, 'error')
    }
  }

  const testDedup = async () => {
    try {
      const { initHttp, http, dedupPlugin } = await import('@platform/sdk-http')
      
      initHttp({ 
        baseURL: 'https://httpbin.org',
        plugins: [
          dedupPlugin({
            keyGenerator: (config) => `${config.method}-${config.url}`,
            cacheMs: 5000
          })
        ]
      })
      
      const promises = Array(3).fill(0).map(async (_, i) => {
        try {
          const response = await http.get('/get?test=dedup')
          log(`去重测试 - 请求 ${i + 1} 完成`, 'success')
          return response
        } catch (error: any) {
          log(`去重测试 - 请求 ${i + 1} 失败：${error?.name || 'Error'}`, 'error')
        }
      })
      
      await Promise.all(promises)
      log('去重测试完成，相同请求应该被去重', 'success')
    } catch (e: any) {
      log(`去重测试失败：${e?.message ?? e}`, 'error')
    }
  }

  const testAuth = async () => {
    try {
      const { initHttp, http, authPlugin } = await import('@platform/sdk-http')
      
      initHttp({ 
        baseURL: 'https://httpbin.org',
        plugins: [
          authPlugin({
            getToken: () => 'Bearer demo-token-12345',
            refreshToken: async () => 'Bearer refreshed-token-67890'
          })
        ]
      })
      
      try {
        const response = await http.get('/bearer')
        log(`认证测试成功：${JSON.stringify(response).slice(0, 100)}...`, 'success')
      } catch (error: any) {
        log(`认证测试失败：${error?.message || error}`, 'error')
      }
    } catch (e: any) {
      log(`认证插件测试失败：${e?.message ?? e}`, 'error')
    }
  }

  return (
    <div className="sdk-section">
      <h2>🌐 SDK HTTP</h2>
      <div className="button-group">
        <button onClick={testHttpGet}>GET 请求</button>
        <button onClick={testHttpError}>错误处理</button>
        <button onClick={testRetryHttp}>重试机制</button>
        <button onClick={testCircuitBreaker}>熔断器</button>
        <button onClick={testRateLimit}>限流插件</button>
        <button onClick={testDedup}>请求去重</button>
        <button onClick={testAuth}>认证插件</button>
      </div>
      <LogArea logs={logs} />
    </div>
  )
}

export default HttpSection