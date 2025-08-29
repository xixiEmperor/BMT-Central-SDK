/**
 * 实时通信类型定义
 * 
 * 该文件定义了实时通信模块中使用的所有类型接口，包括：
 * - 消息类型枚举
 * - 连接状态枚举  
 * - 各种消息接口
 * - 监听器类型
 * - 订阅对象接口
 */

/**
 * 消息类型枚举
 * 定义了实时通信中支持的所有消息类型
 * 
 * @type {MessageType}
 * - 'event': 事件消息，用于传递业务数据

 * - 'error': 错误消息，用于传递错误信息
 * - 'subscribe': 订阅消息，用于订阅特定主题
 * - 'publish': 发布消息，用于向主题发布内容
 */
export type MessageType = 'event' | 'error' | 'subscribe' | 'publish'

/**
 * 连接状态枚举
 * 定义了WebSocket连接的所有可能状态
 * 
 * @type {ConnectionStatus}
 * - 'disconnected': 已断开连接
 * - 'connecting': 正在连接中
 * - 'connected': 已连接
 * - 'reconnecting': 正在重连中
 * - 'error': 连接出错
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

/**
 * 基础消息结构接口
 * 
 * 所有实时通信消息的基础结构，包含了消息的通用字段。
 * 不同类型的消息会基于此接口进行扩展。
 * 
 * @template T 消息载荷的数据类型，默认为unknown
 */
export interface RealtimeMessage<T = unknown> {
  /** 消息类型，决定了消息的处理方式 */
  type: MessageType
  /** 消息主题，用于消息路由和订阅匹配 */
  topic?: string
  /** 消息唯一标识符，用于消息去重和ACK确认 */
  id?: string
  /** 消息序列号，用于保证消息顺序 */
  seq?: number
  /** 消息载荷数据，包含实际的业务数据 */
  payload?: T
  /** 错误代码，当消息类型为error时使用 */
  code?: string
  /** 错误描述信息，当消息类型为error时使用 */
  message?: string
  /** 消息时间戳，记录消息创建或发送时间 */
  ts?: number
}

/**
 * 事件消息接口
 * 
 * 用于传递实际业务数据的消息类型。事件消息包含主题和载荷，
 * 是实时通信中最主要的消息类型。
 * 
 * @template T 载荷数据的类型
 * @extends RealtimeMessage<T>
 */
export interface EventMessage<T = unknown> extends RealtimeMessage<T> {
  /** 固定为'event'，标识这是一个事件消息 */
  type: 'event'
  /** 必须指定主题，用于消息路由 */
  topic: string
  /** 必须包含载荷数据 */
  payload: T
}


/**
 * 错误消息接口
 * 
 * 用于传递错误信息的消息类型。当系统发生错误时，
 * 会发送此类型的消息来通知客户端具体的错误情况。
 * 
 * @extends RealtimeMessage
 */
export interface ErrorMessage extends RealtimeMessage {
  /** 固定为'error'，标识这是一个错误消息 */
  type: 'error'
  /** 必须指定错误代码，用于错误分类 */
  code: string
  /** 必须提供错误描述，帮助理解错误原因 */
  message: string
}

/**
 * 订阅消息接口
 * 
 * 用于客户端向服务器表达订阅某个主题的意图。
 * 发送此消息后，客户端将开始接收该主题的事件消息。
 * 
 * @extends RealtimeMessage
 */
export interface SubscribeMessage extends RealtimeMessage {
  /** 固定为'subscribe'，标识这是一个订阅消息 */
  type: 'subscribe'
  /** 必须指定要订阅的主题名称 */
  topic: string
}

/**
 * 发布消息接口
 * 
 * 用于客户端向指定主题发布内容。发布的内容会被
 * 分发给所有订阅了该主题的客户端。
 * 
 * @template T 载荷数据的类型
 * @extends RealtimeMessage<T>
 */
export interface PublishMessage<T = unknown> extends RealtimeMessage<T> {
  /** 固定为'publish'，标识这是一个发布消息 */
  type: 'publish'
  /** 必须指定要发布到的主题名称 */
  topic: string
  /** 必须包含要发布的数据载荷 */
  payload: T
}

/**
 * 消息监听器类型定义
 * 
 * 用于处理接收到的实时消息的回调函数类型。
 * 当订阅的主题有新消息时，注册的监听器函数会被调用。
 * 
 * @template T 消息载荷的数据类型，默认为unknown
 * @param message 接收到的实时消息对象
 * @returns void 无返回值
 */
export type MessageListener<T = unknown> = (message: RealtimeMessage<T>) => void

/**
 * 连接状态监听器类型定义
 * 
 * 用于监听WebSocket连接状态变化的回调函数类型。
 * 当连接状态发生变化时，注册的监听器函数会被调用。
 * 
 * @param status 当前的连接状态
 * @param error 可选的错误对象，当状态为error时提供错误详情
 * @returns void 无返回值
 */
export type ConnectionListener = (status: ConnectionStatus, error?: Error) => void

/**
 * 订阅对象接口
 * 
 * 表示一个主题订阅的控制对象。通过此对象可以管理订阅的生命周期，
 * 包括取消订阅、查询主题信息和检查订阅状态。
 */
export interface Subscription {
  /** 
   * 取消订阅
   * 调用此方法将停止接收该主题的消息，并清理相关的监听器
   */
  unsubscribe(): void
  
  /** 
   * 获取订阅的主题名称
   * @returns {string} 主题名称
   */
  getTopic(): string
  
  /** 
   * 检查订阅是否仍然有效
   * @returns {boolean} true表示订阅有效，false表示已被取消
   */
  isActive(): boolean
}