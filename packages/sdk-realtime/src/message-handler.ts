/**
 * 消息处理器模块
 * 
 * 该模块负责实时通信中的消息处理逻辑，包括：
 * - 消息的发送和接收处理
 * - 消息序列化和反序列化
 * - ACK确认机制的实现
 * - 消息重发逻辑
 * - 主题监听器的管理
 * 
 * 这是实时通信模块的核心消息处理层，为上层提供可靠的消息传输服务。
 */

import type { RealtimeMessage, MessageListener } from './types.js'

/**
 * 消息处理器接口
 * 
 * 定义了消息处理器必须实现的核心功能，包括消息发送、接收处理、
 * 监听器管理和ACK确认机制。实现此接口的类可以为实时通信提供
 * 完整的消息处理服务。
 */
export interface MessageHandler {
  /** 
   * 发送消息
   * 异步发送消息到指定的目标，支持泛型以确保类型安全
   * @template T 消息载荷的数据类型
   * @param {RealtimeMessage<T>} message 要发送的消息对象
   * @returns {Promise<void>} 发送完成时resolve，失败时reject
   */
  send<T = unknown>(message: RealtimeMessage<T>): Promise<void>
  
  /** 
   * 处理接收到的消息
   * 处理从网络接收到的消息，包括分发给相应的监听器
   * @template T 消息载荷的数据类型
   * @param {RealtimeMessage<T>} message 接收到的消息对象
   */
  handleMessage<T = unknown>(message: RealtimeMessage<T>): void
  
  /** 
   * 注册消息监听器
   * 为指定主题注册监听器，当该主题有消息时会调用监听器
   * @template T 消息载荷的数据类型
   * @param {string} topic 要监听的主题名称
   * @param {MessageListener<T>} listener 消息监听器函数
   * @returns {() => void} 返回用于取消监听的函数
   */
  addListener<T = unknown>(topic: string, listener: MessageListener<T>): () => void
  
  /** 
   * 等待ACK确认
   * 等待指定消息ID的ACK确认，支持超时机制
   * @param {string} messageId 要等待确认的消息ID
   * @param {number} timeout 超时时间（毫秒）
   * @returns {Promise<void>} 收到ACK时resolve，超时时reject
   */
  waitForAck(messageId: string, timeout: number): Promise<void>
}

/**
 * 创建消息处理器实例
 * 
 * 工厂函数，创建一个消息处理器实例来处理实时通信中的消息逻辑。
 * 该实现提供了完整的消息处理功能，包括监听器管理、ACK确认和消息分发。
 * 
 * @returns {MessageHandler} 消息处理器实例
 */
export function createMessageHandler(): MessageHandler {
  // 主题监听器映射表，每个主题对应一个监听器集合
  // 使用Map+Set的结构支持多个监听器监听同一主题
  const listeners = new Map<string, Set<MessageListener<any>>>()
  
  // 待确认的ACK映射表，存储等待ACK的Promise相关信息
  // 键是消息ID，值包含Promise的resolve/reject函数和超时定时器
  const pendingAcks = new Map<string, {
    resolve: () => void           // Promise的resolve函数
    reject: (error: any) => void  // Promise的reject函数
    timeoutHandle: any           // 超时定时器引用
  }>()

  // 返回消息处理器实例，实现MessageHandler接口
  return {
    /**
     * 发送消息的具体实现
     * 
     * 目前是接口占位实现，实际的发送逻辑在Realtime类中处理。
     * 这种设计允许消息处理器专注于消息的处理逻辑，而不需要关心底层的传输细节。
     * 
     * @template T 消息载荷的数据类型
     * @param {RealtimeMessage<T>} message 要发送的消息
     */
    async send<T = unknown>(message: RealtimeMessage<T>): Promise<void> {
      // 实际发送逻辑会在 Realtime 类中处理
      // 这里只是接口定义，用于演示消息发送的调用方式
      console.log('Sending message:', message)
    },

    /**
     * 处理接收到的消息
     * 
     * 消息处理的核心逻辑，根据消息类型进行不同的处理：
     * 1. ACK消息：完成对应的Promise，清理等待状态
     * 2. 普通消息：分发给相应主题的所有监听器
     * 
     * @template T 消息载荷的数据类型
     * @param {RealtimeMessage<T>} message 要处理的消息
     */
    handleMessage<T = unknown>(message: RealtimeMessage<T>): void {
      const { topic, type, id } = message

      // 处理ACK确认消息
      if (type === 'ack' && id) {
        const pending = pendingAcks.get(id)
        if (pending) {
          // 清理超时定时器，防止内存泄漏
          clearTimeout(pending.timeoutHandle)
          // 完成Promise，通知等待方ACK已收到
          pending.resolve()
          // 从待确认列表中移除
          pendingAcks.delete(id)
        }
        return // ACK消息处理完毕，不需要继续分发
      }

      // 分发普通消息给主题监听器
      if (topic) {
        const topicListeners = listeners.get(topic)
        if (topicListeners) {
          // 遍历该主题的所有监听器并调用
          topicListeners.forEach(listener => {
            try {
              // 调用监听器处理消息
              listener(message)
            } catch (error) {
              // 监听器执行错误不应该影响其他监听器的执行
              console.error('Message listener error:', error)
            }
          })
        }
      }
    },

    /**
     * 注册消息监听器
     * 
     * 为指定主题添加监听器，支持多个监听器监听同一主题。
     * 使用懒加载策略，只有在首次添加监听器时才创建主题对应的Set。
     * 
     * @template T 消息载荷的数据类型
     * @param {string} topic 主题名称
     * @param {MessageListener<T>} listener 监听器函数
     * @returns {() => void} 取消监听的函数
     */
    addListener<T = unknown>(topic: string, listener: MessageListener<T>): () => void {
      // 懒加载：如果主题不存在则创建对应的监听器集合
      if (!listeners.has(topic)) {
        listeners.set(topic, new Set())
      }
      
      // 获取主题对应的监听器集合并添加新监听器
      const topicListeners = listeners.get(topic)!
      topicListeners.add(listener)

      // 返回取消监听的函数
      return () => {
        // 从监听器集合中移除指定监听器
        topicListeners.delete(listener)
        
        // 如果该主题没有任何监听器了，清理整个主题条目
        if (topicListeners.size === 0) {
          listeners.delete(topic)
        }
      }
    },

    /**
     * 等待ACK确认
     * 
     * 创建一个Promise来等待指定消息的ACK确认，支持超时机制。
     * 如果在超时时间内收到ACK，Promise会resolve；
     * 如果超时，Promise会reject并清理相关资源。
     * 
     * @param {string} messageId 要等待确认的消息ID
     * @param {number} timeout 超时时间（毫秒）
     * @returns {Promise<void>} ACK确认的Promise
     */
    async waitForAck(messageId: string, timeout: number): Promise<void> {
      return new Promise((resolve, reject) => {
        // 设置超时定时器
        const timeoutHandle = setTimeout(() => {
          // 超时时清理待确认记录
          pendingAcks.delete(messageId)
          // 拒绝Promise，通知调用方超时
          reject(new Error(`ACK timeout for message ${messageId}`))
        }, timeout)

        // 将Promise的控制函数存储到待确认映射表中
        pendingAcks.set(messageId, {
          resolve,     // 用于在收到ACK时完成Promise
          reject,      // 用于在发生错误时拒绝Promise
          timeoutHandle // 用于在收到ACK时清理超时定时器
        })
      })
    }
  }
}