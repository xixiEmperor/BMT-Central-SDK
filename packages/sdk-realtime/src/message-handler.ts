/**
 * 消息处理器 - 处理消息序列化、ack、重发
 */

import type { RealtimeMessage, MessageListener } from './types.js'

export interface MessageHandler {
  /** 发送消息 */
  send<T = unknown>(message: RealtimeMessage<T>): Promise<void>
  /** 处理接收到的消息 */
  handleMessage<T = unknown>(message: RealtimeMessage<T>): void
  /** 注册消息监听器 */
  addListener<T = unknown>(topic: string, listener: MessageListener<T>): () => void
  /** 等待 ACK */
  waitForAck(messageId: string, timeout: number): Promise<void>
}

/**
 * 创建消息处理器
 */
export function createMessageHandler(): MessageHandler {
  // TODO: 实现消息处理器
  throw new Error('Message handler not implemented yet')
}