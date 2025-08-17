import React, { useRef, useState } from 'react'
import { useLogger } from '../hooks/useLogger'
import LogArea from './LogArea'
import { config } from '../config/env'

const RealtimeSection: React.FC = () => {
  const { logs, log } = useLogger()
  const subscriptionRef = useRef<any>(null)
  const [selectedChannel, setSelectedChannel] = useState('user-notifications')

  // 真实的业务频道
  const channels = [
    { value: 'user-notifications', label: '用户通知' },
    { value: 'system-updates', label: '系统更新' },
    { value: 'order-events', label: '订单事件' },
    { value: 'chat-messages', label: '聊天消息' }
  ]

  const connectToServer = async () => {
    try {
      const { Realtime } = await import('@platform/sdk-realtime')
      
      await Realtime.connect({
        url: config.realtimeUrl,
        auth: () => 'Bearer demo-token-12345',
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
      
      log(`正在连接WebSocket服务器 (${config.realtimeUrl})...`, 'info')
    } catch (e: any) {
      log(`连接失败：${e?.message ?? e}`, 'error')
    }
  }

  const subscribeToChannel = async () => {
    try {
      const { Realtime } = await import('@platform/sdk-realtime')
      
      if (Realtime.getStatus() !== 'connected') {
        log('请先连接到服务器', 'error')
        return
      }
      
      // 先取消之前的订阅
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
      
      const subscription = await Realtime.subscribe(selectedChannel, (message) => {
        const channelName = channels.find(c => c.value === selectedChannel)?.label || selectedChannel
        log(`[${channelName}] 收到消息：${JSON.stringify(message.payload)}`, 'success')
      })
      
      subscriptionRef.current = subscription
      const channelName = channels.find(c => c.value === selectedChannel)?.label || selectedChannel
      log(`已订阅 ${channelName} 频道`, 'success')
    } catch (e: any) {
      log(`订阅失败：${e?.message ?? e}`, 'error')
    }
  }

  const sendUserNotification = async () => {
    try {
      const { Realtime } = await import('@platform/sdk-realtime')
      
      if (Realtime.getStatus() !== 'connected') {
        log('请先连接到服务器', 'error')
        return
      }
      
      const notification = {
        userId: 'user-123',
        type: 'order_update',
        title: '订单状态更新',
        message: '您的订单 #12345 已发货',
        priority: 'high',
        timestamp: Date.now()
      }
      
      await (Realtime as any).publish('user-notifications', notification, { ackRequired: true })
      log(`发送用户通知：${JSON.stringify(notification)}`, 'success')
    } catch (e: any) {
      log(`发送通知失败：${e?.message ?? e}`, 'error')
    }
  }

  const sendSystemUpdate = async () => {
    try {
      const { Realtime } = await import('@platform/sdk-realtime')
      
      if (Realtime.getStatus() !== 'connected') {
        log('请先连接到服务器', 'error')
        return
      }
      
      const systemUpdate = {
        type: 'maintenance',
        title: '系统维护通知',
        message: '系统将于今晚23:00-01:00进行维护升级',
        affectedServices: ['payment', 'user-center'],
        timestamp: Date.now()
      }
      
      await (Realtime as any).publish('system-updates', systemUpdate, { ackRequired: true })
      log(`发送系统更新：${JSON.stringify(systemUpdate)}`, 'success')
    } catch (e: any) {
      log(`发送系统更新失败：${e?.message ?? e}`, 'error')
    }
  }

  const disconnectFromServer = async () => {
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

  const getServerStats = async () => {
    try {
      const { RealtimeAPI } = await import('@platform/sdk-http')
      const { initHttp } = await import('@platform/sdk-http')
      
      initHttp({ baseURL: config.apiBaseUrl })
      
      // 获取实时通信统计
      const stats = await RealtimeAPI.getStats()
      log(`服务器统计信息：${JSON.stringify(stats)}`, 'success')
      
    } catch (e: any) {
      log(`获取服务器统计失败：${e?.message ?? e}`, 'error')
    }
  }

  return (
    <div className="sdk-section">
      <h2>⚡ SDK Realtime - 实时通信</h2>
      
      {/* 频道选择器 */}
      <div className="config-section">
        <label htmlFor="channel-select">选择频道：</label>
        <select 
          id="channel-select"
          value={selectedChannel} 
          onChange={(e) => setSelectedChannel(e.target.value)}
        >
          {channels.map(channel => (
            <option key={channel.value} value={channel.value}>
              {channel.label}
            </option>
          ))}
        </select>
      </div>

      {/* 连接控制 */}
      <div className="button-group">
        <button onClick={connectToServer}>连接服务器</button>
        <button onClick={subscribeToChannel}>订阅频道</button>
        <button onClick={disconnectFromServer}>断开连接</button>
        <button onClick={getServerStats}>服务器统计</button>
      </div>

      {/* 消息发送 */}
      <div className="button-group">
        <button onClick={sendUserNotification}>发送用户通知</button>
        <button onClick={sendSystemUpdate}>发送系统更新</button>
      </div>

      <LogArea logs={logs} />
    </div>
  )
}

export default RealtimeSection