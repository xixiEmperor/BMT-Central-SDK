/**
 * 实时通信类型定义
 */

// 消息类型
export type MessageType = 'event' | 'ack' | 'error' | 'subscribe' | 'publish'

// 连接状态
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

// 基础消息结构
export interface RealtimeMessage<T = unknown> {
  /** 消息类型 */
  type: MessageType
  /** 主题 */
  topic?: string
  /** 消息 ID */
  id?: string
  /** 序列号 */
  seq?: number
  /** 消息载荷 */
  payload?: T
  /** 错误代码 */
  code?: string
  /** 错误消息 */
  message?: string
  /** 时间戳 */
  ts?: number
}

// 事件消息
export interface EventMessage<T = unknown> extends RealtimeMessage<T> {
  type: 'event'
  topic: string
  payload: T
}

// ACK 消息
export interface AckMessage extends RealtimeMessage {
  type: 'ack'
  id: string
  code?: string
  message?: string
}

// 错误消息
export interface ErrorMessage extends RealtimeMessage {
  type: 'error'
  code: string
  message: string
}

// 订阅消息
export interface SubscribeMessage extends RealtimeMessage {
  type: 'subscribe'
  topic: string
}

// 发布消息
export interface PublishMessage<T = unknown> extends RealtimeMessage<T> {
  type: 'publish'
  topic: string
  payload: T
}

// 消息监听器
export type MessageListener<T = unknown> = (message: EventMessage<T>) => void

// 连接状态监听器
export type ConnectionListener = (status: ConnectionStatus, error?: Error) => void

// 订阅对象
export interface Subscription {
  /** 取消订阅 */
  unsubscribe(): void
  /** 获取主题 */
  getTopic(): string
  /** 获取订阅状态 */
  isActive(): boolean
}