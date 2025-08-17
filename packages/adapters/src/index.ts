/**
 * @platform/adapters
 * BMT 平台 SDK 框架适配器
 * 
 * 提供：
 * - React Query 默认配置
 * - Vue Query 默认配置
 * - 通用错误边界
 * - 最佳实践集成
 */

// 导出通用类型
export type * from './types.js'

// 导出 React 适配器（条件导出）
export type { ReactQueryDefaults } from './react.js'

// 导出 Vue 适配器（条件导出）
export type { VueQueryDefaults } from './vue.js'

// 导出工具函数
export { 
  createDefaultErrorHandler,
  createDefaultRetryFn,
  createDefaultDelayFn,
  isRetryableError 
} from './utils.js'

// 导出适配器API
export {
  BMTAPI,
  AuthManager,
  ChannelPermissions
} from './api.js'

// ============ API 接口导出 ============
// 从 sdk-http 重新导出所有 API 接口，方便在适配器中使用

export {
  AuthAPI,
  TelemetryAPI,
  TelemetryBatcher,
  ConfigAPI,
  HealthAPI,
  RealtimeAPI
} from '@platform/sdk-http'

export type {
  // 通用类型
  ErrorResponse,
  User,
  UserWithPermissions,
  BaseResponse,
  DataResponse,
  
  // 认证相关类型
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  VerifyResponse,
  LogoutRequest,
  
  // 遥测相关类型
  TelemetryEvent,
  TelemetryEventType,
  TelemetryBatch,
  TelemetryResponse,
  TelemetryStatsResponse,
  
  // 配置相关类型
  SDKConfig,
  ConfigParams,
  
  // 健康检查相关类型
  HealthResponse,
  ServiceStatus,
  ServiceInfoResponse,
  
  // 实时通信相关类型
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