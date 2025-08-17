/**
 * 跨标签页通信模块
 * 
 * 实现不同浏览器标签页之间的实时通信功能，包含以下特性：
 * 1. 优先使用现代浏览器的 BroadcastChannel API
 * 2. 不支持时自动降级到 localStorage + storage 事件机制  
 * 3. 支持类型安全的消息传递
 * 4. 每个消息都包含时间戳和唯一ID，便于去重和排序
 * 
 * 使用场景：
 * - 用户在多个标签页登录同一账户，需要同步登录状态
 * - 购物车数据在多标签页间实时同步
 * - 全局通知或系统消息的广播
 * - 多标签页的数据缓存同步
 */

import type { Unsubscribe } from './types.js'

/**
 * 广播消息的数据结构
 * @template T 消息数据的类型
 */
export interface BroadcastMessage<T = unknown> {
  /** 消息类型，用于区分不同种类的消息 */
  type: string
  /** 消息携带的具体数据 */
  data: T
  /** 消息发送时的时间戳，可用于排序和过期判断 */
  timestamp: number
  /** 消息的唯一标识符，用于去重处理 */
  id: string
}

/**
 * 跨标签页广播通道接口
 * @template T 消息数据的类型，默认为 unknown
 */
export interface BroadcastChannel<T = unknown> {
  /** 
   * 发送消息到其他标签页
   * @param type 消息类型
   * @param data 要发送的数据
   */
  postMessage(type: string, data: T): void
  /** 
   * 监听来自其他标签页的消息
   * @param listener 消息处理函数
   * @returns 取消监听的函数
   */
  addEventListener(listener: (message: BroadcastMessage<T>) => void): Unsubscribe
  /** 
   * 关闭广播通道，清理所有监听器和资源 
   */
  close(): void
}

/**
 * 创建跨标签页广播通道
 * 
 * 根据浏览器支持情况自动选择最佳的通信方式：
 * 1. 现代浏览器：使用 BroadcastChannel API（性能最佳）
 * 2. 旧版浏览器：使用 localStorage + storage 事件（兼容性方案）
 * 
 * @param name 通道名称，相同名称的通道可以互相通信
 * @returns 广播通道实例
 */
export function createBroadcast<T = unknown>(name: string): BroadcastChannel<T> {
  // 检测浏览器是否支持 BroadcastChannel API
  const channelSupported = typeof globalThis !== 'undefined' && 'BroadcastChannel' in globalThis
  // 生成当前实例的唯一标识符，避免接收到自己发送的消息
  const uid = Math.random().toString(36).slice(2)

  // 定义消息监听器类型
  type Listener = (message: BroadcastMessage<T>) => void
  // 存储所有的消息监听器
  const listeners = new Set<Listener>()

  // 方案一：使用现代 BroadcastChannel API
  if (channelSupported) {
    // 创建原生的 BroadcastChannel 实例
    const bc = new (globalThis as any).BroadcastChannel(name) as globalThis.BroadcastChannel
    
    // 处理接收到的消息，转发给所有监听器
    const onMessage = (ev: MessageEvent) => {
      const msg = ev.data as BroadcastMessage<T>
      // 遍历所有监听器并调用
      for (const l of listeners) l(msg)
    }
    
    // 监听原生 BroadcastChannel 的消息事件
    bc.addEventListener('message', onMessage)
    
    return {
      /**
       * 发送消息到其他标签页
       */
      postMessage(type: string, data: T) {
        const msg: BroadcastMessage<T> = { type, data, timestamp: Date.now(), id: uid }
        bc.postMessage(msg)
      },
      /**
       * 添加消息监听器
       */
      addEventListener(listener: Listener) {
        listeners.add(listener)
        // 返回取消监听的函数
        return () => listeners.delete(listener)
      },
      /**
       * 关闭通道，清理所有资源
       */
      close() {
        bc.removeEventListener('message', onMessage)
        bc.close()
        listeners.clear()
      },
    }
  }

  // 方案二：localStorage + storage 事件降级方案
  // 当浏览器不支持 BroadcastChannel 时使用此方案
  // 原理：利用 localStorage 的 storage 事件在标签页间传递消息
  const storageKey = `__broadcast__:${name}`
  
  /**
   * 处理 localStorage storage 事件
   * 当其他标签页修改 localStorage 时会触发此事件
   */
  const onStorage = (e: StorageEvent) => {
    // 检查事件是否与当前通道相关
    if (!e.key || e.key !== storageKey || !e.newValue) return
    try {
      // 解析消息数据并转发给所有监听器
      const msg = JSON.parse(e.newValue) as BroadcastMessage<T>
      for (const l of listeners) l(msg)
    } catch {
      // 忽略 JSON 解析错误，可能是其他应用写入的无效数据
    }
  }
  
  // 在浏览器环境中监听 storage 事件
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage)
  }

  return {
    /**
     * 通过 localStorage 发送消息
     * 巧妙利用先设置再删除的方式触发 storage 事件
     */
    postMessage(type: string, data: T) {
      const msg: BroadcastMessage<T> = { type, data, timestamp: Date.now(), id: uid }
      try {
        // 将消息写入 localStorage
        localStorage.setItem(storageKey, JSON.stringify(msg))
        // 立即删除以触发 storage 事件（这是关键步骤）
        // storage 事件只在值发生变化时触发，所以需要删除来制造变化
        localStorage.removeItem(storageKey)
      } catch {
        // 忽略 localStorage 操作失败（如存储空间不足、隐私模式等）
      }
    },
    /**
     * 添加消息监听器
     */
    addEventListener(listener: Listener) {
      listeners.add(listener)
      // 返回取消监听的函数
      return () => listeners.delete(listener)
    },
    /**
     * 关闭通道，清理所有资源
     */
    close() {
      // 移除 storage 事件监听器
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorage)
      }
      // 清空所有消息监听器
      listeners.clear()
    },
  }
}