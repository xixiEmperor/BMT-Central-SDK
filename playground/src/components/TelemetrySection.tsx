import React from 'react'
import { useLogger } from '../hooks/useLogger'
import LogArea from './LogArea'
import { config } from '../config/env'

const TelemetrySection: React.FC = () => {
  const { logs, log } = useLogger()

  const ensureTelemetryInit = async () => {
    const { Telemetry } = await import('@platform/sdk-telemetry')
    
    if (!Telemetry.isInitialized()) {
      Telemetry.init({
        endpoint: config.telemetryEndpoint,
        app: config.appName,
        release: config.appVersion,
        enableConsole: config.consoleLog,
        batchSize: 10,
        flushInterval: 5000
      })
      log(`Telemetry SDK已初始化，端点：${config.telemetryEndpoint}`, 'info')
    }
    
    return Telemetry
  }

  const testTrackEvent = async () => {
    try {
      const { createCustomEvent } = await import('@platform/sdk-telemetry')
      const Telemetry = await ensureTelemetryInit()
      
      const event = createCustomEvent('button_click', {
        button_id: 'test-track-event',
        timestamp: Date.now()
      })
      
      // 使用具体的跟踪方法而不是通用的track方法
      Telemetry.trackEvent(event.name, event.props)
      log(`已发送自定义事件：${event.name}`, 'success')
    } catch (e: any) {
      log(`发送事件失败：${e?.message ?? e}`, 'error')
    }
  }

  const testPageView = async () => {
    try {
      const { createPageEvent } = await import('@platform/sdk-telemetry')
      const Telemetry = await ensureTelemetryInit()
      
      const event = createPageEvent('/playground', {
        section: 'telemetry',
        action: 'test'
      })
      
      // 使用具体的页面浏览跟踪方法
      Telemetry.trackPageView(event.name, event.props)
      log(`已发送页面浏览事件：${event.name}`, 'success')
    } catch (e: any) {
      log(`发送页面浏览事件失败：${e?.message ?? e}`, 'error')
    }
  }

  const testErrorTracking = async () => {
    try {
      const { createErrorEvent } = await import('@platform/sdk-telemetry')
      const Telemetry = await ensureTelemetryInit()
      
      const mockError = new Error('这是一个测试错误')
      mockError.stack = 'Error: 这是一个测试错误\n    at test (/playground/main.ts:200:15)'
      
      const event = createErrorEvent(mockError, {
        context: 'error_tracking_test',
        severity: 'error'
      })
      
      // 使用具体的错误跟踪方法
      Telemetry.trackError(mockError.name, mockError.message, mockError.stack)
      log(`已发送错误事件：${mockError.message}`, 'success')
    } catch (e: any) {
      log(`发送错误事件失败：${e?.message ?? e}`, 'error')
    }
  }

  const testFlush = async () => {
    try {
      const { Telemetry } = await import('@platform/sdk-telemetry')
      
      if (!Telemetry.isInitialized()) {
        log('请先发送一些事件再进行强制上报', 'info')
        return
      }
      
      await Telemetry.flush()
      log('已强制上报所有缓存事件', 'success')
    } catch (e: any) {
      log(`强制上报失败：${e?.message ?? e}`, 'error')
    }
  }

  return (
    <div className="sdk-section">
      <h2>📈 SDK Telemetry</h2>
      <div className="button-group">
        <button onClick={testTrackEvent}>发送事件</button>
        <button onClick={testPageView}>页面浏览</button>
        <button onClick={testErrorTracking}>错误跟踪</button>
        <button onClick={testFlush}>强制上报</button>
      </div>
      <LogArea logs={logs} />
    </div>
  )
}

export default TelemetrySection