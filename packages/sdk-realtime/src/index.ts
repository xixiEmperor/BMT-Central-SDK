/**
 * @wfynbzlx666/sdk-realtime
 * BMT 平台 SDK 实时通信模块
 * 
 * 这是BMT平台实时通信SDK的主入口文件，提供完整的WebSocket实时通信功能。
 * 
 * ## 核心特性
 * 
 * ### 连接管理
 * - 基于Socket.IO的可靠WebSocket连接
 * - 自动重连机制，支持指数退避策略
 * - 心跳保活，防止连接意外断开
 * - 连接状态实时监控和通知
 * 
 * ### 消息传输
 * - 发布订阅模式，支持主题路由
 * - ACK确认机制，保障消息可靠传输
 * - 消息序列化和反序列化
 * - 离线消息队列，网络恢复后自动重发
 * 
 * ### 高级功能
 * - 权限控制，支持频道级别的访问控制
 * - 跨标签页状态协调（计划中）

 * - 与后端API深度集成
 * - 统计信息和监控支持
 * 
 * ### 管理功能
 * - 系统广播，支持全局和定向消息推送
 * - 服务器统计信息获取
 * - 频道权限管理
 * 
 * ## 快速开始
 * 
 * ```typescript
 * import { Realtime } from '@wfynbzlx666/sdk-realtime';
 * 
 * // 初始化并连接
 * await Realtime.connect({
 *   url: 'ws://localhost:3000',
 *   auth: () => localStorage.getItem('token'),
 *   heartbeatInterval: 30000,
 *   reconnect: {
 *     enabled: true,
 *     maxAttempts: 10,
 *     baseMs: 1000,
 *     capMs: 30000
 *   }
 * });
 * 
 * // 订阅消息
 * const subscription = Realtime.subscribe('chat', (message) => {
 *   console.log('收到消息:', message.payload);
 * });
 * 
 * // 发布消息
 * await Realtime.publish('chat', {
 *   text: 'Hello World!',
 *   timestamp: Date.now()
 * });
 * 
 * // 监听连接状态
 * const unsubscribe = Realtime.onConnectionChange((status, error) => {
 *   console.log('连接状态变化:', status);
 * });
 * ```
 * 
 * @version 1.0.0
 * @author BMT Platform Team
 */

// ============ 核心类型导出 ============
// 导出所有类型定义，提供完整的TypeScript支持

export type * from './types.js'

// ============ 主要API导出 ============
// 导出核心实时通信类和相关类型

/**
 * 实时通信核心类
 * 提供完整的WebSocket实时通信功能
 */
export { Realtime } from './realtime.js'

/**
 * 实时通信相关类型定义
 */
export type { 
  RealtimeOptions,     // 配置选项
  RealtimeMessage,     // 消息接口  
  Subscription         // 订阅控制对象
} from './realtime.js'

// ============ 基础设施组件导出 ============
// 导出底层组件的类型定义，供高级用户使用

/**
 * 连接管理器接口
 * 用于自定义连接管理实现
 */
export type { ConnectionManager } from './connection.js'

/**
 * 消息处理器接口
 * 用于自定义消息处理逻辑
 */
export type { MessageHandler } from './message-handler.js'

// ============ 后端API集成 ============
// 重新导出sdk-http中与实时通信相关的API接口，
// 使用户可以在一个包中获得完整的实时通信能力

/**
 * 后端API接口
 * 提供与服务器端的RESTful API交互能力
 */
export {
  RealtimeAPI,         // 实时通信API接口
  ChannelPermissions,  // 频道权限管理
  BMTAPI              // BMT平台主API接口
} from '@wfynbzlx666/sdk-http'

/**
 * 后端API相关类型定义
 * 包含所有与实时通信相关的API数据结构
 */
export type {
  RealtimeStatsResponse,        // 实时通信统计响应
  BroadcastRequest,            // 广播请求
  SocketMessage,               // Socket消息基础接口
  SocketEventMessage,          // Socket事件消息
  SocketNotification,          // Socket通知消息
  SocketAck,                   // Socket确认消息
  SocketSubscribeRequest,      // Socket订阅请求
  SocketUnsubscribeRequest,    // Socket取消订阅请求
  SocketPublishRequest,        // Socket发布请求
  SocketHeartbeatRequest,      // Socket心跳请求
  SocketHeartbeatResponse,     // Socket心跳响应
  SocketConnectedData,         // Socket连接数据
  SocketResponse,              // Socket响应基础接口
  SocketClientEvents,          // Socket客户端事件映射
  SocketServerEvents           // Socket服务器端事件映射
} from '@wfynbzlx666/sdk-http'
