/**
 * 跨标签页通信 - 基于 BroadcastChannel，降级到 localStorage
 */

import type { Unsubscribe } from './types.js'

export interface BroadcastMessage<T = unknown> {
  type: string
  data: T
  timestamp: number
  id: string
}

export interface BroadcastChannel<T = unknown> {
  /** 发送消息 */
  postMessage(type: string, data: T): void
  /** 监听消息 */
  addEventListener(listener: (message: BroadcastMessage<T>) => void): Unsubscribe
  /** 关闭通道 */
  close(): void
}

/**
 * 创建跨标签页广播通道
 */
export function createBroadcast<T = unknown>(name: string): BroadcastChannel<T> {
  // TODO: 实现跨标签页通信
  throw new Error('Broadcast channel not implemented yet')
}