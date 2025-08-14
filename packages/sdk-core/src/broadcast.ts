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
  const channelSupported = typeof globalThis !== 'undefined' && 'BroadcastChannel' in globalThis
  const uid = Math.random().toString(36).slice(2)

  type Listener = (message: BroadcastMessage<T>) => void
  const listeners = new Set<Listener>()

  if (channelSupported) {
    const bc = new (globalThis as any).BroadcastChannel(name) as globalThis.BroadcastChannel
    const onMessage = (ev: MessageEvent) => {
      const msg = ev.data as BroadcastMessage<T>
      for (const l of listeners) l(msg)
    }
    bc.addEventListener('message', onMessage)
    return {
      postMessage(type: string, data: T) {
        const msg: BroadcastMessage<T> = { type, data, timestamp: Date.now(), id: uid }
        bc.postMessage(msg)
      },
      addEventListener(listener: Listener) {
        listeners.add(listener)
        return () => listeners.delete(listener)
      },
      close() {
        bc.removeEventListener('message', onMessage)
        bc.close()
        listeners.clear()
      },
    }
  }

  // localStorage 降级方案
  const storageKey = `__broadcast__:${name}`
  const onStorage = (e: StorageEvent) => {
    if (!e.key || e.key !== storageKey || !e.newValue) return
    try {
      const msg = JSON.parse(e.newValue) as BroadcastMessage<T>
      for (const l of listeners) l(msg)
    } catch {}
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage)
  }

  return {
    postMessage(type: string, data: T) {
      const msg: BroadcastMessage<T> = { type, data, timestamp: Date.now(), id: uid }
      try {
        localStorage.setItem(storageKey, JSON.stringify(msg))
        // 触发 storage 事件
        localStorage.removeItem(storageKey)
      } catch {}
    },
    addEventListener(listener: Listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    close() {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorage)
      }
      listeners.clear()
    },
  }
}