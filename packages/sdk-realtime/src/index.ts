/**
 * @platform/sdk-realtime
 * BMT 平台 SDK 实时通信
 * 
 * 提供：
 * - Socket.IO 可靠通道
 * - 心跳保活
 * - 自动重连
 * - ack 机制
 * - 序列号有序
 * - 跨标签页协调
 */

// 导出类型
export type * from './types.js'

// 导出主要 API
export { Realtime } from './realtime.js'
export type { RealtimeOptions, RealtimeMessage, Subscription } from './realtime.js'

// 导出连接管理
export type { ConnectionManager } from './connection.js'

// 导出消息处理
export type { MessageHandler } from './message-handler.js'

// ============ API 接口导出 ============
// 从 sdk-http 重新导出实时通信相关的 API 接口

export {
  RealtimeAPI,
  ChannelPermissions,
  BMTAPI
} from '@platform/sdk-http'

export type {
  RealtimeStatsResponse,
  BroadcastRequest,
  SocketMessage,
  SocketEventMessage,
  SocketNotification,
  SocketAck,
  SocketSubscribeRequest,
  SocketUnsubscribeRequest,
  SocketPublishRequest,
  SocketHeartbeatRequest,
  SocketHeartbeatResponse,
  SocketConnectedData,
  SocketResponse,
  SocketClientEvents,
  SocketServerEvents
} from '@platform/sdk-http'