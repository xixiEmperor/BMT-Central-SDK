import React from 'react'
import { useLogger } from '../hooks/useLogger'
import LogArea from './LogArea'
import { config } from '../config/env'

const AdaptersSection: React.FC = () => {
  const { logs, log } = useLogger()

  const testErrorHandler = async () => {
    try {
      const { createDefaultErrorHandler, isRetryableError } = await import('@platform/adapters')
      
      const errorHandler = createDefaultErrorHandler({
        onError: (error, context) => {
          log(`错误处理器捕获：${error.message} (上下文：${context})`, 'error')
        },
        enableConsoleLog: true,
        enableTelemetry: false
      })
      
      // 测试错误处理
      const testError = new Error('测试错误')
      errorHandler(testError, 'test-context')
      
      // 测试重试判断
      const networkError = new Error('网络连接失败')
      networkError.name = 'NetworkError'
      const shouldRetry = isRetryableError(networkError)
      log(`网络错误是否可重试：${shouldRetry}`, shouldRetry ? 'success' : 'info')
      
      log('错误处理器测试完成', 'success')
    } catch (e: any) {
      log(`错误处理器测试失败：${e?.message ?? e}`, 'error')
    }
  }

  const testRetryFunction = async () => {
    try {
      const { createDefaultRetryFn } = await import('@platform/adapters')
      
      const retryFn = createDefaultRetryFn({
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 5000,
        jitter: true
      })
      
      let attempts = 0
      const testFunction = async () => {
        attempts++
        log(`重试尝试 ${attempts}`, 'info')
        
        if (attempts < 3) {
          throw new Error(`尝试 ${attempts} 失败`)
        }
        
        return '重试成功！'
      }
      
      const shouldRetry = (error: Error, attempt: number): boolean => {
        log(`重试判断：错误=${error.message}, 尝试次数=${attempt}`, 'info')
        return attempt < 3
      }
      
      const result = await retryFn(testFunction, shouldRetry)
      log(`重试函数结果：${result}`, 'success')
      
    } catch (e: any) {
      log(`重试函数测试失败：${e?.message ?? e}`, 'error')
    }
  }

  const testBMTAPI = async () => {
    try {
      const { BMTAPI } = await import('@platform/adapters')
      
      // 配置API客户端
      BMTAPI.configure({
        baseURL: config.apiBaseUrl,
        defaultHeaders: {
          'X-Client-Version': config.appVersion,
          'X-App-Name': config.appName
        }
      })
      
      log(`BMTAPI 已配置为连接到 ${config.apiBaseUrl}`, 'success')
      
      // 测试健康检查
      const health = await BMTAPI.health.check()
      log(`API健康检查：${JSON.stringify(health)}`, 'success')
      
    } catch (e: any) {
      log(`BMTAPI 测试失败：${e?.message ?? e}`, 'error')
    }
  }

  const testAuthManager = async () => {
    try {
      const { AuthManager } = await import('@platform/adapters')
      
      // 配置认证管理器
      AuthManager.configure({
        baseURL: config.apiBaseUrl,
        tokenStorage: 'localStorage',
        autoRefresh: true
      })
      
      // 测试登录
      const loginResult = await AuthManager.login({
        email: 'test@example.com',
        password: 'password123'
      })
      
      log(`认证管理器登录：${JSON.stringify(loginResult)}`, 'success')
      
      // 测试获取当前用户
      const currentUser = await AuthManager.getCurrentUser()
      log(`当前用户：${JSON.stringify(currentUser)}`, 'success')
      
    } catch (e: any) {
      log(`认证管理器测试失败：${e?.message ?? e}`, 'error')
    }
  }

  const testChannelPermissions = async () => {
    try {
      const { ChannelPermissions } = await import('@platform/adapters')
      
      // 检查频道权限
      const canRead = await ChannelPermissions.canRead('test-channel')
      const canWrite = await ChannelPermissions.canWrite('test-channel')
      const canManage = await ChannelPermissions.canManage('test-channel')
      
      log(`频道权限检查 - 读取：${canRead}, 写入：${canWrite}, 管理：${canManage}`, 'success')
      
      // 获取用户频道列表
      const channels = await ChannelPermissions.getUserChannels()
      log(`用户频道列表：${JSON.stringify(channels)}`, 'success')
      
    } catch (e: any) {
      log(`频道权限测试失败：${e?.message ?? e}`, 'error')
    }
  }

  return (
    <div className="sdk-section">
      <h2>🔌 SDK Adapters</h2>
      <div className="button-group">
        <button onClick={testErrorHandler}>错误处理器</button>
        <button onClick={testRetryFunction}>重试函数</button>
        <button onClick={testBMTAPI}>BMT API</button>
        <button onClick={testAuthManager}>认证管理器</button>
        <button onClick={testChannelPermissions}>频道权限</button>
      </div>
      <LogArea logs={logs} />
    </div>
  )
}

export default AdaptersSection
