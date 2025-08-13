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
  // TODO: 实现连接管理器
  throw new Error('Connection manager not implemented yet')
}