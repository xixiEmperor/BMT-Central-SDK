/**
 * 实时通信主入口
 * 集成了后端管理API，提供统计信息和广播功能
 */

import type { 
  ConnectionStatus, 
  MessageListener, 
  ConnectionListener, 
  Subscription 
} from './types.js'
import type { RealtimeMessage, EventMessage, AckMessage } from './types.js'
import { io, Socket } from 'socket.io-client'
import { generateId, sleep } from '@platform/sdk-core'
import { RealtimeAPI, ChannelPermissions } from '@platform/sdk-http'

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
  private static socket: Socket | null = null
  private static connectionListeners = new Set<ConnectionListener>()
  private static topicListeners = new Map<string, Set<MessageListener<any>>>()
  private static pendingAcks = new Map<string, {
    resolve: () => void
    reject: (e: any) => void
    attempts: number
    timeoutHandle: any
    topic: string
    payload: any
  }>()
  private static outboundQueue: Array<EventMessage<any>> = []
  private static reconnectCount = 0
  private static loopbackMode = false
  private static heartbeatTimer: any = null

  /**
   * 初始化实时通信
   */
  static init(options: RealtimeOptions): void {
    // 存储配置并重置内部状态，使多次 init 可幂等
    const merged: Partial<RealtimeOptions> = {
      heartbeatInterval: 30_000,
      ackTimeout: 5_000,
      maxRetries: 3,
      maxQueueSize: 1000,
      reconnect: { enabled: true, maxAttempts: -1, baseMs: 1000, capMs: 30_000 },
    }
    // 覆盖外部传入
    this.options = { ...merged, ...options, reconnect: { ...merged.reconnect!, ...(options.reconnect ?? {}) } }
    this.outboundQueue.length = 0
    this.pendingAcks.clear()
    this.topicListeners.clear()
    this.reconnectCount = 0
    this.loopbackMode = false
  }

  /**
   * 连接服务器
   */
  static async connect(options?: RealtimeOptions): Promise<void> {
    if (options) {
      this.init(options)
    }
    if (!this.options) throw new Error('Realtime not initialized')
    const { url, reconnect } = this.options

    // 若已存在连接，直接返回
    if (this.socket && this.status === 'connected') return Promise.resolve()

    // 配置 socket.io 的重连参数，映射到我们的重连选项
    const reconnection = reconnect?.enabled !== false
    const reconnectionAttempts = reconnect?.maxAttempts && reconnect.maxAttempts > 0 ? reconnect.maxAttempts : Infinity
    const reconnectionDelay = reconnect?.baseMs ?? 1000
    const reconnectionDelayMax = reconnect?.capMs ?? 30_000

    this.status = 'connecting'
    this.emitConnection()

    return new Promise<void>(async (resolve) => {
      // 获取 token（若有）
      const token = (await this.options!.auth?.()) ?? null
      // 创建 socket 连接
      this.socket = io(url, {
        transports: ['websocket'],
        reconnection,
        reconnectionAttempts,
        reconnectionDelay,
        reconnectionDelayMax,
        timeout: 20000,
        auth: token ? { token: token.startsWith('Bearer ') ? token : `Bearer ${token}` } : undefined,
      })

      const s = this.socket

      // 建立连接成功：恢复订阅与队列
      s.on('connect', () => {
        console.log('🔗 Socket连接建立, ID:', s.id)
        this.status = 'connected'
        this.loopbackMode = false
        this.emitConnection()
        this.resubscribeAll()
        this.flushQueue()
        this.startHeartbeat()
        resolve()
      })

      // 监听服务器连接确认
      s.on('connected', (data) => {
        console.log('✅ 服务器连接确认:', data)
        this.emitConnection()
      })

      // 断开：进入断开/重连中状态
      s.on('disconnect', (reason) => {
        console.log('🔌 连接断开:', reason)
        this.stopHeartbeat()
        this.status = reconnection ? 'reconnecting' : 'disconnected'
        this.emitConnection()
      })

      // 重连尝试计数
      s.on('reconnect_attempt', () => {
        this.reconnectCount++
        this.status = 'reconnecting'
        this.emitConnection()
      })

      // 连接错误：若不可用，进入本地回环模式（便于无后端时演示）
      s.on('connect_error', async (_err: any) => {
        // 若第一次连接就失败，且允许回退，则开启 loopback
        if (this.status === 'connecting') {
          this.enableLoopback()
          resolve()
        }
        this.emitConnection(_err)
      })

      // 接收服务端事件消息
      s.on('event', (msg: EventMessage<any>) => {
        this.dispatchMessage(msg)
      })

      // 接收 ACK，完成 pending promise
      s.on('ack', (ack: AckMessage) => {
        const pending = this.pendingAcks.get(ack.id)
        if (!pending) return
        clearTimeout(pending.timeoutHandle)
        this.pendingAcks.delete(ack.id)
        pending.resolve()
      })

      // 心跳确认
      s.on('heartbeat_ack', (data) => {
        console.log('💓 心跳确认:', data)
      })

      // 服务端错误透传
      s.on('error', (err: any) => {
        this.emitConnection(err instanceof Error ? err : new Error(String(err)))
      })
    })
  }

  /**
   * 断开连接
   */
  static disconnect(): void {
    this.stopHeartbeat()
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.status = 'disconnected'
    this.emitConnection()
  }

  /**
   * 订阅主题
   */
  static subscribe<T = unknown>(
    topic: string, 
    listener: MessageListener<T>
  ): Subscription {
    // 注册监听器
    let set = this.topicListeners.get(topic)
    if (!set) {
      set = new Set()
      this.topicListeners.set(topic, set)
      // 首次订阅该 topic 时，向服务端发送 subscribe
      this.sendSubscribe(topic)
    }
    set.add(listener as any)

    return {
      unsubscribe: () => {
        const s = this.topicListeners.get(topic)
        if (!s) return
        s.delete(listener as any)
        if (s.size === 0) {
          this.topicListeners.delete(topic)
          // 可选：发送 unsubscribe（此处复用 subscribe 协议之外的约定，暂不发送以简化）
        }
      },
      getTopic: () => topic,
      isActive: () => this.topicListeners.has(topic),
    }
  }

  /**
   * 发布消息
   */
  static publish<T = unknown>(topic: string, payload: T, options: { ackRequired?: boolean } = {}): Promise<void> {
    const messageId = generateId()
    const msg = {
      topic,
      payload,
      messageId,
      timestamp: Date.now(),
      ackRequired: options.ackRequired !== false
    }
    return this.sendPublishMessage(msg)
  }

  /**
   * 监听连接状态
   */
  static onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener)
    // 立即同步一次当前状态
    listener(this.status)
    return () => this.connectionListeners.delete(listener)
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
    let subs = 0
    for (const set of this.topicListeners.values()) subs += set.size
    return {
      status: this.status,
      subscriptions: subs,
      queueSize: this.outboundQueue.length,
      reconnectCount: this.reconnectCount,
    }
  }

  /**
   * 获取服务器端统计信息
   * @param accessToken 访问令牌（可选）
   * @returns Promise<any> 服务器统计信息
   */
  static async getServerStats(accessToken?: string): Promise<any> {
    try {
      return await RealtimeAPI.getStats(accessToken)
    } catch (error) {
      console.warn('Failed to get server stats:', error)
      return null
    }
  }

  /**
   * 发送系统广播（需要管理员权限）
   * @param accessToken 管理员访问令牌
   * @param level 广播级别
   * @param message 广播消息
   * @param targetUsers 目标用户（可选）
   * @returns Promise<boolean> 是否广播成功
   */
  static async broadcast(
    accessToken: string,
    level: 'info' | 'warning' | 'error',
    message: string,
    targetUsers?: string[]
  ): Promise<boolean> {
    try {
      const response = await RealtimeAPI.broadcast(accessToken, {
        level,
        message,
        targetUsers
      })
      return response.success
    } catch (error) {
      console.error('Broadcast failed:', error)
      return false
    }
  }

  /**
   * 检查频道访问权限
   * @param channel 频道名称
   * @param userRole 用户角色
   * @param userId 用户ID
   * @returns boolean 是否有访问权限
   */
  static canAccessChannel(channel: string, userRole: string, userId: string): boolean {
    return ChannelPermissions.canAccess(channel, userRole, userId)
  }

  /**
   * 检查频道发布权限
   * @param channel 频道名称
   * @param userRole 用户角色
   * @param userId 用户ID
   * @returns boolean 是否有发布权限
   */
  static canPublishToChannel(channel: string, userRole: string, userId: string): boolean {
    return ChannelPermissions.canPublish(channel, userRole, userId)
  }

  /**
   * 获取用户可访问的频道
   * @param userRole 用户角色
   * @param userId 用户ID
   * @returns string[] 可访问的频道模式列表
   */
  static getAccessibleChannels(userRole: string, userId: string): string[] {
    return ChannelPermissions.getAccessibleChannels(userRole, userId)
  }

  // 内部：发送消息（无 ACK）
  private static async send(message: RealtimeMessage<any>): Promise<void> {
    if (this.loopbackMode) {
      // 本地回环：直接派发给订阅者
      if (message.type === 'event' && message.topic) this.dispatchMessage(message as EventMessage<any>)
      return
    }
    if (!this.socket || this.status !== 'connected') {
      // 未连接则入队，受 maxQueueSize 约束
      if (this.outboundQueue.length >= (this.options?.maxQueueSize ?? 1000)) {
        // 丢弃最旧消息，保证最新消息有机会发送
        this.outboundQueue.shift()
      }
      if (message.type === 'event') this.outboundQueue.push(message as EventMessage<any>)
      return
    }
    this.socket.emit(message.type, message)
  }

  // 内部：发送并等待 ACK，失败重试
  private static async sendWithAck(message: EventMessage<any>): Promise<void> {
    const ackTimeout = this.options?.ackTimeout ?? 5000
    const maxRetries = this.options?.maxRetries ?? 3

    let attempt = 0
    while (true) {
      attempt++
      await this.send(message)
      const result = await new Promise<'ok' | 'timeout'>((resolve) => {
        const timeoutHandle = setTimeout(() => {
          this.pendingAcks.delete(message.id!)
          resolve('timeout')
        }, ackTimeout)
        this.pendingAcks.set(message.id!, {
          resolve: () => resolve('ok'),
          reject: () => resolve('timeout'),
          attempts: attempt,
          timeoutHandle,
          topic: message.topic,
          payload: message.payload,
        })
      })
      if (result === 'ok') return
      if (attempt >= maxRetries) throw new Error('ACK timeout')
      // 退避后重发
      const base = this.options?.reconnect?.baseMs ?? 1000
      const cap = this.options?.reconnect?.capMs ?? 30_000
      const delay = Math.min(base * Math.pow(2, attempt - 1), cap)
      await sleep(delay)
    }
  }

  // 内部：派发消息到订阅者
  private static dispatchMessage<T = any>(msg: EventMessage<T>): void {
    const set = this.topicListeners.get(msg.topic)
    if (!set || set.size === 0) return
    for (const l of set) {
      try { (l as MessageListener<T>)(msg) } catch { /* 监听器异常不影响其他订阅者 */ }
    }
  }

  // 内部：发送订阅请求
  private static sendSubscribe(topic: string): void {
    const messageId = generateId()
    const subscribeData = {
      topic,
      messageId,
      timestamp: Date.now()
    }
    
    if (this.loopbackMode) {
      console.log(`📡 本地模式订阅: ${topic}`)
      return
    }
    
    if (!this.socket || this.status !== 'connected') {
      console.log(`⏳ 连接未就绪，订阅将在连接后重新发送: ${topic}`)
      return
    }
    
    this.socket.emit('subscribe', subscribeData, (response: any) => {
      if (response?.status === 'success') {
        console.log(`✅ 订阅成功: ${topic}`)
        console.log(`👥 订阅者数量: ${response.subscriberCount}`)
      } else {
        console.error(`❌ 订阅失败: ${topic}`, response?.error)
      }
    })
  }

  // 内部：发送发布消息
  private static async sendPublishMessage(messageData: any): Promise<void> {
    if (this.loopbackMode) {
      // 本地回环模式
      console.log(`📤 本地模式发布: ${messageData.topic}`)
      this.dispatchMessage({
        type: 'event',
        topic: messageData.topic,
        payload: messageData.payload,
        id: messageData.messageId,
        ts: messageData.timestamp
      })
      return
    }

    if (!this.socket || this.status !== 'connected') {
      throw new Error('连接未建立，无法发布消息')
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('publish', messageData, (response: any) => {
        if (response?.status === 'success') {
          console.log(`📤 消息发布成功: ${messageData.topic}`)
          console.log(`📊 送达数量: ${response.deliveredTo}`)
          resolve()
        } else {
          console.error(`❌ 消息发布失败: ${messageData.topic}`, response?.error)
          reject(new Error(response?.error || '发布失败'))
        }
      })
    })
  }

  // 内部：恢复所有订阅
  private static resubscribeAll(): void {
    for (const topic of this.topicListeners.keys()) {
      this.sendSubscribe(topic)
    }
  }

  // 内部：发送队列中的消息
  private static flushQueue(): void {
    if (!this.socket || this.status !== 'connected') return
    const queue = [...this.outboundQueue]
    this.outboundQueue.length = 0
    for (const msg of queue) this.socket.emit('event', msg)
  }

  // 内部：通知连接状态变化
  private static emitConnection(error?: Error): void {
    for (const l of this.connectionListeners) {
      try { l(this.status, error) } catch { /* 忽略监听器错误 */ }
    }
  }

  // 内部：开始心跳
  private static startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }
    
    const interval = this.options?.heartbeatInterval ?? 30_000
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat', {
          timestamp: Date.now()
        })
      }
    }, interval)
  }

  // 内部：停止心跳
  private static stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  // 内部：启用本地回环模式（无后端时代码路径）
  private static enableLoopback(): void {
    this.loopbackMode = true
    this.status = 'connected'
    this.emitConnection()
    // 立即恢复订阅与队列（本地派发）
    this.resubscribeAll()
    this.flushQueue()
  }
}