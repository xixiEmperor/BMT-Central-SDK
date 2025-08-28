/**
 * 连接管理器模块
 * 
 * 该模块负责管理WebSocket连接的生命周期，包括：
 * - 建立和断开连接
 * - 连接状态管理和通知
 * - 心跳保活机制
 * - 连接状态监听器管理
 * 
 * 这是实时通信模块的底层基础设施，为上层提供可靠的连接服务。
 */

import type { ConnectionStatus, ConnectionListener } from './types.js'

/**
 * 连接管理器接口
 * 
 * 定义了连接管理器必须实现的核心功能，包括连接控制、状态管理和心跳机制。
 * 实现此接口的类可以为实时通信提供底层的连接服务。
 */
export interface ConnectionManager {
  /** 
   * 建立连接
   * 异步方法，尝试建立WebSocket连接到指定的服务器
   * @returns {Promise<void>} 连接建立成功时resolve，失败时reject
   */
  connect(): Promise<void>
  
  /** 
   * 断开连接
   * 主动断开当前的WebSocket连接，并清理相关资源
   */
  disconnect(): void
  
  /** 
   * 获取当前连接状态
   * @returns {ConnectionStatus} 当前的连接状态枚举值
   */
  getStatus(): ConnectionStatus
  
  /** 
   * 注册连接状态变化监听器
   * @param {ConnectionListener} listener 状态变化回调函数
   * @returns {() => void} 返回用于取消监听的函数
   */
  onStatusChange(listener: ConnectionListener): () => void
  
  /** 
   * 发送心跳包
   * 向服务器发送心跳消息以保持连接活跃，防止连接被意外关闭
   */
  sendHeartbeat(): void
}

/**
 * 创建连接管理器实例
 * 
 * 工厂函数，创建一个连接管理器实例来管理到指定URL的WebSocket连接。
 * 该实现提供了完整的连接生命周期管理，包括状态跟踪、监听器管理和心跳机制。
 * 
 * @param {string} url WebSocket服务器的连接地址
 * @returns {ConnectionManager} 连接管理器实例
 */
export function createConnectionManager(url: string): ConnectionManager {
  // 连接状态，初始为断开状态
  let status: ConnectionStatus = 'disconnected'
  // 状态变化监听器集合，使用Set避免重复注册
  const listeners = new Set<ConnectionListener>()
  // 心跳定时器引用，用于管理心跳任务的生命周期
  let heartbeatTimer: any = null

  /**
   * 触发状态变化通知
   * 
   * 当连接状态发生变化时，遍历所有注册的监听器并通知它们。
   * 使用try-catch包装每个监听器调用，防止单个监听器的错误影响其他监听器。
   */
  const emitStatusChange = () => {
    listeners.forEach(listener => {
      try {
        // 调用监听器，传递当前状态
        listener(status)
      } catch (error) {
        // 监听器执行错误不应该影响连接管理器的正常运行
        console.error('Connection status listener error:', error)
      }
    })
  }

  // 返回连接管理器实例，实现ConnectionManager接口
  return {
    /**
     * 建立连接的具体实现
     * 
     * 异步建立WebSocket连接的过程，包括状态管理和错误处理。
     * 如果已经连接则直接返回，避免重复连接。
     */
    async connect(): Promise<void> {
      // 防止重复连接，如果已经连接则直接返回
      if (status === 'connected') return
      
      // 设置状态为连接中并通知监听器
      status = 'connecting'
      emitStatusChange()

      try {
        // 模拟连接建立过程
        // 在实际实现中，这里会是真正的WebSocket连接逻辑
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // 连接成功，更新状态并通知监听器
        status = 'connected'
        emitStatusChange()
        
        // 连接建立后立即启动心跳机制
        this.sendHeartbeat()
      } catch (error) {
        // 连接失败，设置错误状态并重新抛出错误
        status = 'error'
        emitStatusChange()
        throw error
      }
    },

    /**
     * 断开连接的具体实现
     * 
     * 主动断开连接并清理相关资源，包括停止心跳定时器。
     */
    disconnect(): void {
      // 清理心跳定时器，防止内存泄漏
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer)
        heartbeatTimer = null
      }
      
      // 设置状态为已断开并通知监听器
      status = 'disconnected'
      emitStatusChange()
    },

    /**
     * 获取当前连接状态
     * 
     * @returns {ConnectionStatus} 返回当前的连接状态
     */
    getStatus(): ConnectionStatus {
      return status
    },

    /**
     * 注册状态变化监听器
     * 
     * 允许外部代码监听连接状态的变化，支持多个监听器同时存在。
     * 
     * @param {ConnectionListener} listener 要注册的监听器函数
     * @returns {() => void} 返回取消监听的函数
     */
    onStatusChange(listener: ConnectionListener): () => void {
      // 将监听器添加到集合中
      listeners.add(listener)
      
      // 返回取消监听的函数，允许调用者主动移除监听器
      return () => {
        listeners.delete(listener)
      }
    },

    /**
     * 心跳机制的具体实现
     * 
     * 启动定时器定期发送心跳包，保持连接活跃。
     * 只有在连接状态下才会启动心跳，避免无效的心跳发送。
     */
    sendHeartbeat(): void {
      // 只有在连接状态下才需要心跳
      if (status !== 'connected') return
      
      // 避免重复启动心跳定时器
      if (!heartbeatTimer) {
        // 每30秒发送一次心跳包
        heartbeatTimer = setInterval(() => {
          // 再次检查连接状态，确保只在连接时发送心跳
          if (status === 'connected') {
            // 发送心跳包（这里是模拟实现）
            // 在实际实现中，这里会通过WebSocket发送心跳消息
            console.log('Sending heartbeat')
          }
        }, 30000) // 30秒心跳间隔
      }
    }
  }
}
}