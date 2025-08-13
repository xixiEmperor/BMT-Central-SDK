/**
 * 实时通信主入口
 */

import type { 
  ConnectionStatus, 
  MessageListener, 
  ConnectionListener, 
  Subscription 
} from './types.js'

export interface RealtimeOptions {
  /** WebSocket 服务器地址 */
  url: string
  /** 认证函数 */
  auth?: () => string | null | Promise<string | null>
  /** 心跳间隔（毫秒），默认 30000 */
  heartbeatInterval?: number
  /** 重连配置 */
  reconnect?: {
    /** 是否自动重连，默认 true */
    enabled?: boolean
    /** 最大重连次数，默认 -1 (无限) */
    maxAttempts?: number
    /** 重连间隔基数（毫秒），默认 1000 */
    baseMs?: number
    /** 最大重连间隔（毫秒），默认 30000 */
    capMs?: number
  }
  /** ACK 超时时间（毫秒），默认 5000 */
  ackTimeout?: number
  /** 最大重发次数，默认 3 */
  maxRetries?: number
  /** 消息队列最大长度，默认 1000 */
  maxQueueSize?: number
}

export type { RealtimeMessage } from './types.js'
export { type Subscription }

export class Realtime {
  private static options: RealtimeOptions | null = null
  private static status: ConnectionStatus = 'disconnected'

  /**
   * 初始化实时通信
   */
  static init(options: RealtimeOptions): void {
    // TODO: 实现实时通信初始化
    throw new Error('Realtime.init not implemented yet')
  }

  /**
   * 连接服务器
   */
  static connect(): Promise<void> {
    // TODO: 实现连接
    throw new Error('Realtime.connect not implemented yet')
  }

  /**
   * 断开连接
   */
  static disconnect(): void {
    // TODO: 实现断开连接
    throw new Error('Realtime.disconnect not implemented yet')
  }

  /**
   * 订阅主题
   */
  static subscribe<T = unknown>(
    topic: string, 
    listener: MessageListener<T>
  ): Subscription {
    // TODO: 实现订阅
    throw new Error('Realtime.subscribe not implemented yet')
  }

  /**
   * 发布消息
   */
  static publish<T = unknown>(topic: string, payload: T): Promise<void> {
    // TODO: 实现发布
    throw new Error('Realtime.publish not implemented yet')
  }

  /**
   * 监听连接状态
   */
  static onConnectionChange(listener: ConnectionListener): () => void {
    // TODO: 实现连接状态监听
    throw new Error('Realtime.onConnectionChange not implemented yet')
  }

  /**
   * 获取连接状态
   */
  static getStatus(): ConnectionStatus {
    return this.status
  }

  /**
   * 获取统计信息
   */
  static getStats(): {
    status: ConnectionStatus
    subscriptions: number
    queueSize: number
    reconnectCount: number
  } {
    // TODO: 实现统计信息
    return {
      status: this.status,
      subscriptions: 0,
      queueSize: 0,
      reconnectCount: 0,
    }
  }
}