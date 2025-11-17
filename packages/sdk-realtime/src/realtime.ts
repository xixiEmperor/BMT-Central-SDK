/**
 * 实时通信核心模块
 * 
 * 该模块是实时通信系统的主入口，提供完整的WebSocket实时通信功能，包括：
 * - Socket.IO客户端连接管理
 * - 自动重连和心跳保活
 * - 消息发布订阅机制
 * - ACK确认和消息可靠性保障
 * - 消息队列和离线缓存
 * - 权限验证和频道管理
 * - 与后端管理API的集成
 * - 统计信息和广播功能

 * 
 * 这是整个实时通信SDK的核心类，为上层应用提供简单易用的实时通信接口。
 */

import type { 
  ConnectionStatus, 
  MessageListener, 
  ConnectionListener, 
  Subscription 
} from './types.js'
import type { RealtimeMessage, EventMessage } from './types.js'
import { io, Socket } from 'socket.io-client'
import { generateId, sleep } from '@wfynbzlx666/sdk-core'
import { RealtimeAPI, ChannelPermissions } from '@wfynbzlx666/sdk-http'

/**
 * 实时通信配置选项接口
 * 
 * 定义了实时通信客户端的所有配置参数，包括连接设置、重连策略、
 * 超时控制和队列管理等。这些配置项影响客户端的行为和性能。
 */
export interface RealtimeOptions {
  /** 
   * WebSocket服务器地址
   * 必填字段，指定要连接的Socket.IO服务器URL
   */
  url: string
  
  /** 
   * 认证函数
   * 可选的异步函数，用于获取认证令牌
   * @returns {string | null | Promise<string | null>} 认证令牌或null
   */
  auth?: () => string | null | Promise<string | null>

  /**
   * 用户信息
   */
  user: {
    userId: string | number,
    user_role: string
  }
  
  /** 
   * 心跳间隔时间（毫秒）
   * 客户端向服务器发送心跳包的间隔，用于保持连接活跃
   * @default 30000 (30秒)
   */
  heartbeatInterval?: number
  
  /** 
   * 重连配置选项
   * 控制客户端在连接断开时的重连行为
   */
  reconnect?: {
    /** 
     * 是否启用自动重连
     * @default true 
     */
    enabled?: boolean
    
    /** 
     * 最大重连尝试次数
     * -1表示无限重连
     * @default -1 
     */
    maxAttempts?: number
    
    /** 
     * 重连间隔基础时间（毫秒）
     * 实际重连间隔会基于此值进行指数退避
     * @default 1000 
     */
    baseMs?: number
    
    /** 
     * 最大重连间隔时间（毫秒）
     * 重连间隔的上限，防止等待时间过长
     * @default 30000 
     */
    capMs?: number
  }
  
  
  /** 
   * 消息队列最大长度
   * 离线时缓存消息的最大数量，超过时会丢弃最旧的消息
   * @default 1000 
   */
  maxQueueSize?: number
}

// 重新导出核心类型，方便外部使用
export type { RealtimeMessage } from './types.js'
export { type Subscription }

/**
 * 实时通信核心类
 * 
 * 这是实时通信SDK的主要类，采用静态方法设计以确保全应用单例。
 * 提供完整的WebSocket实时通信功能，包括连接管理、消息发布订阅、
 * 权限控制、统计监控和管理功能。
 * 
 * 主要特性：
 * - 基于Socket.IO的可靠连接
 * - 自动重连和心跳保活
 * - 消息确认和重传机制
 * - 离线消息队列

 * - 集成后端管理API
 * - 频道权限控制
 * - 统计信息收集
 * 
 */
export class Realtime {
  // ============ 静态属性 ============
  
  /** 客户端配置选项，存储初始化时传入的配置 */
  private static options: RealtimeOptions | null = null
  
  /** 当前连接状态，初始为断开状态 */
  private static status: ConnectionStatus = 'disconnected'
  
  /** Socket.IO客户端实例，负责实际的网络通信 */
  private static socket: Socket | null = null
  
  /** 连接状态监听器集合，用于通知外部连接状态变化 */
  private static connectionListeners = new Set<ConnectionListener>()
  
  /** 主题监听器映射表，存储每个主题的所有订阅者 */
  // 相当于一个池子，每个主题对应一个池子，池子里面存储了所有订阅了这个主题的回调函数
  private static topicListeners = new Map<string, Set<MessageListener<any>>>()
  
  
  /** 离线消息队列，在连接断开时缓存待发送的消息 */
  private static outboundQueue: Array<EventMessage<any>> = []
  
  /** 重连计数器，记录重连尝试次数 */
  private static reconnectCount = 0
  

  
  /** 心跳定时器，用于定期发送心跳包保持连接活跃 */
  private static heartbeatTimer: any = null

  // ============ 公共API方法 ============
  
  /**
   * 初始化实时通信客户端
   * 
   * 设置客户端配置并重置内部状态，使客户端准备好进行连接。
   * 该方法是幂等的，可以安全地多次调用。
   * 
   * @param {RealtimeOptions} options 实时通信配置选项
   * 
   * @example
   * ```typescript
   * Realtime.init({
   *   url: 'ws://localhost:3000',
   *   auth: () => localStorage.getItem('token'),
   *   heartbeatInterval: 30000,
   *   reconnect: {
   *     enabled: true,
   *     maxAttempts: 5,
   *     baseMs: 1000,
   *     capMs: 30000
   *   }
   * });
   * ```
   */
  static init(options: RealtimeOptions): void {
    // 设置默认配置值
    const merged: Partial<RealtimeOptions> = {
      heartbeatInterval: 30_000,  // 30秒心跳间隔
      maxQueueSize: 1000,         // 队列最大1000条消息
      reconnect: { 
        enabled: true,            // 启用自动重连
        maxAttempts: -1,          // 无限重连
        baseMs: 1000,            // 重连基础间隔1秒
        capMs: 30_000            // 重连最大间隔30秒
      },
    }
    
    // 合并用户配置与默认配置，用户配置优先级更高
    this.options = { 
      ...merged, 
      ...options, 
      // 重连配置需要深度合并
      reconnect: { 
        ...merged.reconnect!, 
        ...(options.reconnect ?? {}) 
      } 
    }
    
    // 重置内部状态，确保init的幂等性
    this.outboundQueue.length = 0    // 清空消息队列
    this.topicListeners.clear()      // 清空主题监听器
    this.reconnectCount = 0          // 重置重连计数

  }

  /**
   * 连接到WebSocket服务器
   * 
   * 建立与服务器的Socket.IO连接，支持认证、自动重连和错误处理。
    *  
   * @param {RealtimeOptions} [options] 可选的配置选项，如果提供会先调用init方法
   * @returns {Promise<void>} 连接成功时resolve，连接失败时reject
   * @throws {Error} 当客户端未初始化时抛出错误
   * 
   * @example
   * ```typescript
   * // 使用已初始化的配置连接
   * await Realtime.connect();
   * 
   * // 或者直接传入配置连接
   * await Realtime.connect({
   *   url: 'ws://localhost:3000',
   *   auth: () => getAuthToken()
   * });
   * ```
   */
  static async connect(options?: RealtimeOptions): Promise<void> {
    // 如果提供了配置选项，先进行初始化
    if (options) {
      this.init(options)
    }
    
    // 确保客户端已经初始化
    if (!this.options) throw new Error('Realtime not initialized')
    
    const { url, reconnect } = this.options

    // 防止重复连接，如果已经连接则直接返回
    if (this.socket && this.status === 'connected') return Promise.resolve()

    // 将我们的重连配置映射到Socket.IO的重连参数
    const reconnection = reconnect?.enabled !== false
    const reconnectionAttempts = reconnect?.maxAttempts && reconnect.maxAttempts > 0 
      ? reconnect.maxAttempts 
      : Infinity // -1 表示无限重连
    const reconnectionDelay = reconnect?.baseMs ?? 1000
    const reconnectionDelayMax = reconnect?.capMs ?? 30_000

    // 设置状态为连接中并通知监听器
    this.status = 'connecting'
    this.emitConnection()

    return new Promise<void>(async (resolve) => {
      // 获取认证令牌（如果配置了认证函数）
      const token = (await this.options!.auth?.()) ?? null
      
      // 创建Socket.IO连接实例
      this.socket = io(url, {
        transports: ['websocket'],           // 只使用WebSocket传输
        reconnection,                        // 是否启用自动重连
        reconnectionAttempts,               // 最大重连次数
        reconnectionDelay,                  // 重连延迟
        reconnectionDelayMax,               // 最大重连延迟
        timeout: 20000,                     // 连接超时时间
        // 认证配置，确保令牌格式正确
        auth: token ? { 
          token: token.startsWith('Bearer ') ? token : `Bearer ${token}` 
        } : undefined,
        // 用户信息通过query传递，需要序列化为字符串
        query: {
          userId: this.options!.user.userId,
          userRole: this.options!.user.user_role
        },
      })

      const s = this.socket

      // ============ Socket事件监听器 ============
      
      /**
       * 连接建立成功事件
       * 恢复订阅、发送队列消息、启动心跳
       */
      s.on('connect', () => {
        console.log('🔗 Socket连接建立, ID:', s.id)
        this.status = 'connected'
    
        this.emitConnection()
        this.resubscribeAll()    // 恢复所有订阅
        this.flushQueue()        // 发送队列中的消息
        this.startHeartbeat()    // 启动心跳
        resolve()
      })

      /**
       * 连接断开事件
       * 停止心跳，根据重连配置决定状态
       */
      s.on('disconnect', (reason) => {
        console.log('🔌 连接断开:', reason)
        this.stopHeartbeat()
        // 根据是否启用重连来设置状态
        this.status = reconnection ? 'reconnecting' : 'disconnected'
        this.emitConnection()
      })

      /**
       * 重连尝试事件
       * 更新重连计数和状态
       */
      s.on('reconnect_attempt', () => {
        this.reconnectCount++
        this.status = 'reconnecting'
        this.emitConnection()
      })

      /**
       * 连接错误事件
       */
      s.on('connect_error', async (_err: any) => {
        this.emitConnection(_err)
      })

      /**
       * 接收事件消息
       * 分发给相应的主题监听器
       */
      s.on('event', (msg: EventMessage<any>) => {
        this.dispatchMessage(msg)
      })



      /**
       * 心跳确认事件
       * 服务器对心跳包的响应
       */
      s.on('heartbeat_ack', (data) => {
        console.log('💓 心跳确认:', data)
      })

      /**
       * 服务器错误事件
       * 透传服务器端的错误信息
       */
      s.on('error', (err: any) => {
        this.emitConnection(err instanceof Error ? err : new Error(String(err)))
      })
    })
  }

  /**
   * 断开与服务器的连接
   * 
   * 主动断开Socket连接并清理相关资源，包括停止心跳定时器。
   * 断开后状态会设置为'disconnected'并通知所有监听器。
   * 
   * @example
   * ```typescript
   * // 断开连接
   * Realtime.disconnect();
   * ```
   */
  static disconnect(): void {
    // 停止心跳定时器
    this.stopHeartbeat()

    // 断开Socket连接并清理引用
    if (this.socket) {
      (this.socket as any).disconnect(true) // true 参数禁用重连
      this.socket = null
    }

    // 更新状态并通知监听器
    this.status = 'disconnected'
    this.emitConnection()
  }

  /**
   * 订阅指定主题的消息
   * 
   * 为指定主题注册消息监听器，当该主题有新消息时会调用监听器函数。
   * 支持多个监听器订阅同一主题，首次订阅时会向服务器发送订阅请求。
   * 
   * @template T 消息载荷的数据类型
   * @param {string} topic 要订阅的主题名称
   * @param {MessageListener<T>} listener 消息监听器函数
   * @returns {Subscription} 订阅控制对象，可用于取消订阅
   * 
   * @example
   * ```typescript
   * // 订阅聊天消息
   * const subscription = Realtime.subscribe('chat', (message) => {
   *   console.log('收到聊天消息:', message.payload);
   * });
   * 
   * // 取消订阅
   * subscription.unsubscribe();
   * ```
   */
  static subscribe<T = unknown>(
    topic: string, 
    listener: MessageListener<T> // 订阅时传入一个listener，当有消息发送回来时，用于接收消息并进行处理
  ): Subscription {
    // 获取或创建主题对应的监听器集合
    let set = this.topicListeners.get(topic)
    if (!set) {
      set = new Set()
      this.topicListeners.set(topic, set)
      // 首次订阅该主题时，向服务器发送订阅请求
      this.sendSubscribe(topic)
    }
    
    // 将监听器添加到集合中
    set.add(listener as any)

    // 返回订阅控制对象
    return {
      /**
       * 取消订阅
       * 移除该主题中set池里对应的监听器，如果是该主题的最后一个监听器则清理主题记录
       */
      unsubscribe: () => {
        const s = this.topicListeners.get(topic)
        if (!s) return
        
        s.delete(listener as any)
        
        // 如果该主题没有任何监听器了，清理主题记录
        if (s.size === 0) {
          this.topicListeners.delete(topic)
          // 注意：这里可以发送unsubscribe请求给服务器，但为了简化协议暂不实现
        }
      },
      
      /**
       * 获取订阅的主题名称：直接返回主题名称
       */
      getTopic: () => topic,
      
      /**
       * 检查订阅是否仍然有效：直接看看有没有这个主题
       */
      isActive: () => this.topicListeners.has(topic),
    }
  }

  /**
   * 向指定主题发布消息
   * 
   * 发送消息到指定主题，所有订阅了该主题的客户端都会收到消息。
   * 支持ACK确认机制，确保消息送达的可靠性。
   * 
   * @template T 消息载荷的数据类型
   * @param {string} topic 目标主题名称
   * @param {T} payload 要发送的消息载荷
   * @param {object} [options] 发布选项
   * @param {boolean} [options.ackRequired=true] 是否需要ACK确认
   * @returns {Promise<void>} 发布成功时resolve，失败时reject
   * 
   * @example
   * ```typescript
   * // 发布聊天消息
   * await Realtime.publish('chat', {
   *   text: 'Hello World!',
   *   author: 'Alice'
   * });
   * 
   * // 发布不需要确认的消息
   * await Realtime.publish('notifications', {
   *   type: 'info',
   *   message: 'System update'
   * }, { ackRequired: false });
   * ```
   */
  static publish<T = unknown>(
    topic: string, 
    payload: T, 
    options: { ackRequired?: boolean } = {}
  ): Promise<void> {
    // 生成唯一消息ID
    const messageId = generateId()
    
    // 构造消息对象
    const msg = {
      topic,
      payload,
      messageId,
      timestamp: Date.now(),
      ackRequired: options.ackRequired !== false  // 默认需要ACK确认
    }
    
    // 发送消息
    return this.sendPublishMessage(msg)
  }

  /**
   * 监听连接状态变化：向集合中添加回调函数，这样emitConnection时会调用所有回调函数
   * 
   * 注册连接状态变化监听器，当连接状态发生变化时会调用监听器函数。
   * 注册时会立即调用一次监听器以同步当前状态。
   * 
   * @param {ConnectionListener} listener 连接状态监听器函数
   * @returns {() => void} 取消监听的函数
   * 
   * @example
   * ```typescript
   * // 监听连接状态变化
   * const unsubscribe = Realtime.onConnectionChange((status, error) => {
   *   console.log('连接状态:', status);
   *   if (error) {
   *     console.error('连接错误:', error);
   *   }
   * });
   * 
   * // 取消监听
   * unsubscribe();
   * ```
   */
  static onConnectionChange(listener: ConnectionListener): () => void { // 传入一个回调函数，当连接状态变化时，会调用这个回调函数，用于接收状态信息，并返回一个取消监听的函数
    // 添加监听器到集合
    this.connectionListeners.add(listener)
    
    // 立即同步当前状态给新监听器
    listener(this.status)
    
    // 返回取消监听的函数
    return () => this.connectionListeners.delete(listener)
  }

  /**
   * 获取当前连接状态
   * 
   * 返回客户端的当前连接状态，可用于判断是否可以发送消息。
   * 
   * @returns {ConnectionStatus} 当前连接状态
   * 
   * @example
   * ```typescript
   * // 检查连接状态
   * const status = Realtime.getStatus();
   * if (status === 'connected') {
   *   console.log('连接正常，可以发送消息');
   * }
   * ```
   */
  static getStatus(): ConnectionStatus {
    return this.status
  }

  /**
   * 获取客户端统计信息
   * 
   * 返回当前客户端的统计信息，包括连接状态、订阅数量、队列大小等。
   * 这些信息可用于监控和调试客户端状态。
   * 
   * @returns {object} 统计信息对象
   * @returns {ConnectionStatus} returns.status 当前连接状态
   * @returns {number} returns.subscriptions 当前订阅数量
   * @returns {number} returns.queueSize 离线消息队列大小
   * @returns {number} returns.reconnectCount 重连次数
   * 
   * @example
   * ```typescript
   * // 获取统计信息
   * const stats = Realtime.getStats();
   * console.log(`状态: ${stats.status}`);
   * console.log(`订阅数: ${stats.subscriptions}`);
   * console.log(`队列大小: ${stats.queueSize}`);
   * console.log(`重连次数: ${stats.reconnectCount}`);
   * ```
   */
  static getStats(): {
    status: ConnectionStatus
    subscriptions: number
    queueSize: number
    reconnectCount: number
  } {
    // 计算总订阅数量
    let subs = 0
    for (const set of this.topicListeners.values()) {
      subs += set.size
    }
    
    return {
      status: this.status,                        // 当前连接状态
      subscriptions: subs,                        // 总订阅数量
      queueSize: this.outboundQueue.length,       // 离线队列大小
      reconnectCount: this.reconnectCount,        // 重连次数
    }
  }

  // ============ 管理API接口 ============
  
  /**
   * 获取服务器端统计信息
   * 
   * 通过后端API获取服务器端的实时通信统计信息，包括连接数、消息数等。
   * 这是一个管理功能，通常用于监控和运维。
   * 
   * @param {string} [accessToken] 访问令牌，可选
   * @returns {Promise<any>} 服务器统计信息，获取失败时返回null
   * 
   * @example
   * ```typescript
   * // 获取服务器统计信息
   * const serverStats = await Realtime.getServerStats(adminToken);
   * if (serverStats) {
   *   console.log('服务器连接数:', serverStats.connections);
   *   console.log('总消息数:', serverStats.messages);
   * }
   * ```
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
   * 发送系统广播消息
   * 
   * 向系统中的用户发送广播消息，需要管理员权限。
   * 可以指定广播级别和目标用户，支持全局广播和定向广播。
   * 
   * @param {string} accessToken 管理员访问令牌
   * @param {'info' | 'warning' | 'error'} level 广播级别
   * @param {string} message 广播消息内容
   * @param {string[]} [targetUsers] 目标用户ID列表，不指定则为全局广播
   * @returns {Promise<boolean>} 广播是否成功
   * 
   * @example
   * ```typescript
   * // 发送全局系统通知
   * const success = await Realtime.broadcast(
   *   adminToken,
   *   'info',
   *   '系统将在30分钟后进行维护'
   * );
   * 
   * // 发送定向警告消息
   * const success = await Realtime.broadcast(
   *   adminToken,
   *   'warning',
   *   '您的账户存在异常行为',
   *   ['user123', 'user456']
   * );
   * ```
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

  // ============ 权限控制接口 ============
  
  /**
   * 检查用户是否有频道访问权限
   * 
   * 根据用户角色和ID检查是否可以访问指定频道。
   * 这是一个客户端权限检查，实际的权限控制由服务器端实施。
   * 
   * @param {string} channel 频道名称
   * @param {string} userRole 用户角色
   * @param {string} userId 用户ID
   * @returns {boolean} 是否有访问权限
   * 
   * @example
   * ```typescript
   * // 检查用户是否可以访问管理频道
   * const canAccess = Realtime.canAccessChannel('admin-notifications', 'admin', 'user123');
   * if (canAccess) {
   *   // 允许订阅该频道
   *   Realtime.subscribe('admin-notifications', handleMessage);
   * }
   * ```
   */
  static canAccessChannel(channel: string, userRole: string, userId: string): boolean {
    return ChannelPermissions.canAccess(channel, userRole, userId)
  }

  /**
   * 检查用户是否有频道发布权限
   * 
   * 根据用户角色和ID检查是否可以向指定频道发布消息。
   * 发布权限通常比访问权限更严格，需要更高的权限级别。
   * 
   * @param {string} channel 频道名称
   * @param {string} userRole 用户角色
   * @param {string} userId 用户ID
   * @returns {boolean} 是否有发布权限
   * 
   * @example
   * ```typescript
   * // 检查用户是否可以发布系统公告
   * const canPublish = Realtime.canPublishToChannel('system-announcements', 'admin', 'user123');
   * if (canPublish) {
   *   // 允许发布消息
   *   await Realtime.publish('system-announcements', { text: '系统公告' });
   * }
   * ```
   */
  static canPublishToChannel(channel: string, userRole: string, userId: string): boolean {
    return ChannelPermissions.canPublish(channel, userRole, userId)
  }

  /**
   * 获取用户可访问的频道列表
   * 
   * 根据用户角色和ID返回所有可访问的频道模式列表。
   * 返回的是频道模式，可能包含通配符。
   * 
   * @param {string} userRole 用户角色
   * @param {string} userId 用户ID
   * @returns {string[]} 可访问的频道模式列表
   * 
   * @example
   * ```typescript
   * // 获取用户可访问的频道
   * const channels = Realtime.getAccessibleChannels('user', 'user123');
   * console.log('可访问的频道:', channels);
   * // 输出: ['public.*', 'user.user123.*']
   * ```
   */
  static getAccessibleChannels(userRole: string, userId: string): string[] {
    return ChannelPermissions.getAccessibleChannels(userRole, userId)
  }

  // ============ 私有方法 ============
  // 以下是内部实现方法，不对外暴露
  
  // 内部：派发消息到订阅者
  // 会根据消息的主题，把消息传递给订阅了该主题的客户端
  // 所以只要订阅了主题，就可以收到消息，并且可以根据服务端发来的消息进行一些操作
  private static dispatchMessage<T = any>(msg: EventMessage<T>): void {
    const set = this.topicListeners.get(msg.topic)
    if (!set || set.size === 0) {
      console.log('您发送的主题不存在')
      return
    }
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
  // 简单理解为所有客户端都会调用自己传入的监听器，可能就是打印一个连接状态
  private static emitConnection(error?: Error): void {
    for (const l of this.connectionListeners) {
      // 这里会把status传递给客户端，供其根据status进行处理
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
}