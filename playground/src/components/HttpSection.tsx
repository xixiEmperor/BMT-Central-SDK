import React from 'react'
import { useLogger } from '../hooks/useLogger'
import LogArea from './LogArea'
import { config } from '../config/env'

const HttpSection: React.FC = () => {
  const { logs, log, logError, logApiCall } = useLogger()

  const testHttpGet = async () => {
    try {
      const { initHttp, http } = await import('@platform/sdk-http')
      initHttp({ 
        baseURL: config.apiBaseUrl
      })
      log('开始测试 GET 请求...', 'info')
      const data = await http.get('/api/health')
      logApiCall('GET', '/api/health', data)
    } catch (e: any) {
      logApiCall('GET', '/api/health', undefined, e)
    }
  }

  const testHttpError = async () => {
    try {
      const { initHttp, http } = await import('@platform/sdk-http')
      initHttp({ baseURL: config.apiBaseUrl })
      log('开始错误处理测试...', 'info')
      // 测试一个不存在的端点触发404错误
      await http.get('/api/nonexistent-endpoint')
    } catch (e: any) {
      logError(e, '错误处理测试')
      log('✅ 错误处理测试完成，错误已被正确捕获', 'success')
    }
  }

  const testRetryHttp = async () => {
    try {
      const { initHttp, http, retryPlugin } = await import('@platform/sdk-http')
      
      initHttp({ 
        baseURL: config.apiBaseUrl,
        plugins: [
          retryPlugin({
            retries: 3,
            baseMs: 1000
          })
        ]
      })
      
      log('开始重试测试...', 'info')
      try {
        // 测试一个可能失败的端点
        await http.get('/api/test-retry')
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
        baseURL: config.apiBaseUrl,
        plugins: [
          circuitBreakerPlugin({
            failureThreshold: 3,
            resetTimeout: 10000
          })
        ]
      })
      
      log('开始熔断器测试...', 'info')
      for (let i = 0; i < 5; i++) {
        try {
          await http.get('/api/test-failure')
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
        baseURL: config.apiBaseUrl,
        plugins: [
          rateLimitPlugin({
            requests: 2,
            window: 5000
          })
        ]
      })
      
      log('开始限流测试...', 'info')
      for (let i = 0; i < 4; i++) {
        try {
          await http.get('/api/health')
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
        baseURL: config.apiBaseUrl,
        plugins: [
          dedupPlugin({
            keyGenerator: (config: any) => `${config.method}-${config.url}`,
            ttl: 5000
          })
        ]
      })
      
      log('开始去重测试...', 'info')
      const promises = Array(3).fill(0).map(async (_, i) => {
        try {
          const response = await http.get('/api/health?test=dedup')
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
        baseURL: config.apiBaseUrl,
        plugins: [
          authPlugin({
            getToken: () => 'Bearer demo-token-12345',
            refreshToken: async () => {
              log('尝试刷新Token...', 'info')
              return 'Bearer refreshed-token-67890'
            }
          })
        ]
      })
      
      log('开始认证测试...', 'info')
      try {
        const response = await http.get('/v1/auth/verify')
        log(`认证测试成功：${JSON.stringify(response)}`, 'success')
      } catch (error: any) {
        log(`认证测试失败：${error?.message || error}`, 'error')
      }
    } catch (e: any) {
      log(`认证插件测试失败：${e?.message ?? e}`, 'error')
    }
  }

  const testAuthAPI = async () => {
    try {
      const { initHttp, AuthAPI } = await import('@platform/sdk-http')
      
      initHttp({ baseURL: config.apiBaseUrl })
      
      log('开始Auth API测试...', 'info')
      
      // 测试登录
      try {
        const loginResult = await AuthAPI.login({
          username: 'test@example.com',
          password: 'password123'
        })
        logApiCall('POST', '/v1/auth/login', loginResult)
        
        // 测试验证token
        const verifyResult = await AuthAPI.verify('demo-token-12345')
        logApiCall('GET', '/v1/auth/verify', verifyResult)
      } catch (authError: any) {
        logError(authError, 'Auth API 调用')
      }
      
    } catch (e: any) {
      log(`Auth API 测试失败：${e?.message ?? e}`, 'error')
    }
  }

  const testHealthAPI = async () => {
    try {
      const { initHttp, HealthAPI } = await import('@platform/sdk-http')
      
      initHttp({ baseURL: config.apiBaseUrl })
      
      log('开始Health API测试...', 'info')
      
      // 测试健康检查
      try {
        const healthResult = await HealthAPI.getHealth()
        logApiCall('GET', '/api/health', healthResult)
      } catch (healthError: any) {
        logApiCall('GET', '/api/health', undefined, healthError)
      }
      
      // 测试服务信息
      try {
        const serviceInfo = await HealthAPI.getServiceInfo()
        logApiCall('GET', '/api/health/info', serviceInfo)
      } catch (infoError: any) {
        logApiCall('GET', '/api/health/info', undefined, infoError)
      }
      
    } catch (e: any) {
      log(`Health API 测试失败：${e?.message ?? e}`, 'error')
    }
  }

  const testConfigAPI = async () => {
    try {
      const { initHttp, ConfigAPI } = await import('@platform/sdk-http')
      
      initHttp({ baseURL: config.apiBaseUrl })
      
      log('开始Config API测试...', 'info')
      
      // 测试获取配置
      try {
        const configData = await ConfigAPI.getConfig({
          environment: 'development',
          version: '1.0.0'
        })
        logApiCall('GET', '/api/config', configData)
      } catch (configError: any) {
        logApiCall('GET', '/api/config', undefined, configError)
      }
      
    } catch (e: any) {
      log(`Config API 测试失败：${e?.message ?? e}`, 'error')
    }
  }

  const testTelemetryAPI = async () => {
    try {
      const { initHttp, TelemetryAPI } = await import('@platform/sdk-http')
      
      initHttp({ baseURL: config.apiBaseUrl })
      
      log('开始Telemetry API测试...', 'info')
      
      // 测试发送遥测事件
      const events = [
        {
          id: `evt_${Date.now()}`,
          type: 'custom' as const,
          name: 'test_event',
          ts: Date.now(),
          app: config.appName,
          release: config.appVersion,
          sessionId: `sess_${Date.now()}`,
          props: { test: true, source: 'playground' }
        }
      ]
      
      try {
        const result = await TelemetryAPI.sendEvents(events)
        logApiCall('POST', '/api/telemetry/events', result)
      } catch (sendError: any) {
        logApiCall('POST', '/api/telemetry/events', undefined, sendError)
      }
      
      // 测试获取遥测统计
      try {
        const stats = await TelemetryAPI.getStats()
        logApiCall('GET', '/api/telemetry/stats', stats)
      } catch (statsError: any) {
        logApiCall('GET', '/api/telemetry/stats', undefined, statsError)
      }
      
    } catch (e: any) {
      log(`Telemetry API 测试失败：${e?.message ?? e}`, 'error')
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
        <button onClick={testAuthAPI}>Auth API</button>
        <button onClick={testHealthAPI}>Health API</button>
        <button onClick={testConfigAPI}>Config API</button>
        <button onClick={testTelemetryAPI}>Telemetry API</button>
      </div>
      <LogArea logs={logs} />
    </div>
  )
}

export default HttpSection