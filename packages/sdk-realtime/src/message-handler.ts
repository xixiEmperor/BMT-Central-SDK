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
  const listeners = new Map<string, Set<MessageListener<any>>>()
  const pendingAcks = new Map<string, {
    resolve: () => void
    reject: (error: any) => void
    timeoutHandle: any
  }>()

  return {
    async send<T = unknown>(message: RealtimeMessage<T>): Promise<void> {
      // 实际发送逻辑会在 Realtime 类中处理
      // 这里只是接口定义
      console.log('Sending message:', message)
    },

    handleMessage<T = unknown>(message: RealtimeMessage<T>): void {
      const { topic, type, id } = message

      // 处理 ACK 消息
      if (type === 'ack' && id) {
        const pending = pendingAcks.get(id)
        if (pending) {
          clearTimeout(pending.timeoutHandle)
          pending.resolve()
          pendingAcks.delete(id)
        }
        return
      }

      // 分发普通消息
      if (topic) {
        const topicListeners = listeners.get(topic)
        if (topicListeners) {
          topicListeners.forEach(listener => {
            try {
              listener(message)
            } catch (error) {
              console.error('Message listener error:', error)
            }
          })
        }
      }
    },

    addListener<T = unknown>(topic: string, listener: MessageListener<T>): () => void {
      if (!listeners.has(topic)) {
        listeners.set(topic, new Set())
      }
      const topicListeners = listeners.get(topic)!
      topicListeners.add(listener)

      // 返回取消监听函数
      return () => {
        topicListeners.delete(listener)
        if (topicListeners.size === 0) {
          listeners.delete(topic)
        }
      }
    },

    async waitForAck(messageId: string, timeout: number): Promise<void> {
      return new Promise((resolve, reject) => {
        const timeoutHandle = setTimeout(() => {
          pendingAcks.delete(messageId)
          reject(new Error(`ACK timeout for message ${messageId}`))
        }, timeout)

        pendingAcks.set(messageId, {
          resolve,
          reject,
          timeoutHandle
        })
      })
    }
  }
}