/**
 * 连接管理器 - 处理连接、重连、心跳
 */

import type { ConnectionStatus, ConnectionListener } from './types.js'

export interface ConnectionManager {
  /** 连接 */
  connect(): Promise<void>
  /** 断开连接 */
  disconnect(): void
  /** 获取连接状态 */
  getStatus(): ConnectionStatus
  /** 监听状态变化 */
  onStatusChange(listener: ConnectionListener): () => void
  /** 发送心跳 */
  sendHeartbeat(): void
}

/**
 * 创建连接管理器
 */
export function createConnectionManager(url: string): ConnectionManager {
  let status: ConnectionStatus = 'disconnected'
  const listeners = new Set<ConnectionListener>()
  let heartbeatTimer: any = null

  const emitStatusChange = () => {
    listeners.forEach(listener => {
      try {
        listener(status)
      } catch (error) {
        console.error('Connection status listener error:', error)
      }
    })
  }

  return {
    async connect(): Promise<void> {
      if (status === 'connected') return
      
      status = 'connecting'
      emitStatusChange()

      try {
        // 模拟连接逻辑
        await new Promise(resolve => setTimeout(resolve, 100))
        status = 'connected'
        emitStatusChange()
        
        // 启动心跳
        this.sendHeartbeat()
      } catch (error) {
        status = 'error'
        emitStatusChange()
        throw error
      }
    },

    disconnect(): void {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer)
        heartbeatTimer = null
      }
      
      status = 'disconnected'
      emitStatusChange()
    },

    getStatus(): ConnectionStatus {
      return status
    },

    onStatusChange(listener: ConnectionListener): () => void {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    sendHeartbeat(): void {
      if (status !== 'connected') return
      
      // 启动心跳定时器
      if (!heartbeatTimer) {
        heartbeatTimer = setInterval(() => {
          if (status === 'connected') {
            // 发送心跳包
            console.log('Sending heartbeat')
          }
        }, 30000) // 30秒心跳间隔
      }
    }
  }
}