import React, { useRef } from 'react'
import { useLogger } from '../hooks/useLogger'
import LogArea from './LogArea'

const RealtimeSection: React.FC = () => {
  const { logs, log } = useLogger()
  const subscriptionRef = useRef<any>(null)

  const testConnect = async () => {
    try {
      const { Realtime } = await import('@platform/sdk-realtime')
      
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
      
      Realtime.onConnectionChange((status) => {
        log(`连接状态变化：${status}`, status === 'connected' ? 'success' : 'info')
      })
      
      log('正在连接WebSocket服务器...', 'info')
    } catch (e: any) {
      log(`连接失败：${e?.message ?? e}`, 'error')
    }
  }

  const testSubscribe = async () => {
    try {
      const { Realtime } = await import('@platform/sdk-realtime')
      
      if (Realtime.getStatus() !== 'connected') {
        log('请先连接到服务器', 'error')
        return
      }
      
      const subscription = await Realtime.subscribe('test-channel', (message) => {
        log(`收到消息：${JSON.stringify(message)}`, 'success')
      })
      
      subscriptionRef.current = subscription
      log('已订阅 test-channel 频道', 'success')
    } catch (e: any) {
      log(`订阅失败：${e?.message ?? e}`, 'error')
    }
  }

  const testPublish = async () => {
    try {
      const { Realtime } = await import('@platform/sdk-realtime')
      
      if (Realtime.getStatus() !== 'connected') {
        log('请先连接到服务器', 'error')
        return
      }
      
      const message = {
        type: 'chat',
        content: '来自Playground的测试消息',
        timestamp: Date.now()
      }
      
      await Realtime.publish('test-channel', message)
      log(`已发布消息到 test-channel：${JSON.stringify(message)}`, 'success')
    } catch (e: any) {
      log(`发布消息失败：${e?.message ?? e}`, 'error')
    }
  }

  const testDisconnect = async () => {
    try {
      const { Realtime } = await import('@platform/sdk-realtime')
      
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
        log('已取消订阅', 'info')
      }
      
      await Realtime.disconnect()
      log('已断开WebSocket连接', 'success')
    } catch (e: any) {
      log(`断开连接失败：${e?.message ?? e}`, 'error')
    }
  }

  return (
    <div className="sdk-section">
      <h2>⚡ SDK Realtime</h2>
      <div className="button-group">
        <button onClick={testConnect}>连接服务器</button>
        <button onClick={testSubscribe}>订阅消息</button>
        <button onClick={testPublish}>发布消息</button>
        <button onClick={testDisconnect}>断开连接</button>
      </div>
      <LogArea logs={logs} />
    </div>
  )
}

export default RealtimeSection