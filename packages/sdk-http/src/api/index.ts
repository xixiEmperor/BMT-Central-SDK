/**
 * BMT Platform API 统一入口
 * 导出所有API接口和相关类型
 */

// ============ API 类导入 ============

import { AuthAPI, AuthManager } from './auth.js';
import { TelemetryAPI, TelemetryBatcher } from './telemetry.js';
import { ConfigAPI } from './config.js';
import { HealthAPI, HealthMonitor } from './health.js';
import { RealtimeAPI, ChannelPermissions } from './realtime.js';
import { initHttp } from '../client.js';
import type { HttpClientOptions } from '../client.js';

// ============ 类型定义导出 ============

// 通用类型
export type {
  ErrorResponse,
  User,
  UserWithPermissions,
  BaseResponse,
  DataResponse
} from './types.js';

// 认证相关类型
export type {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  VerifyResponse,
  LogoutRequest
} from './types.js';

// 遥测相关类型
export type {
  TelemetryEvent,
  TelemetryEventType,
  TelemetryBatch,
  TelemetryResponse,
  TelemetryStatsResponse
} from './types.js';

// 配置相关类型
export type {
  SDKConfig,
  ConfigParams
} from './types.js';

// 健康检查相关类型
export type {
  HealthResponse,
  ServiceStatus,
  ServiceInfoResponse
} from './types.js';

// 实时通信相关类型
export type {
  RealtimeStatsResponse,
  BroadcastRequest
} from './types.js';

// Socket.IO 扩展类型
export type {
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
} from './realtime.js';

// ============ 统一 API 客户端 ============

/**
 * BMT Platform API 客户端
 * 提供所有API功能的统一访问入口
 */
export class BMTAPI {
  /** 认证相关API */
  static get auth() { return AuthAPI; }
  
  /** 遥测数据API */
  static get telemetry() { return TelemetryAPI; }
  
  /** SDK配置API */
  static get config() { return ConfigAPI; }
  
  /** 健康检查API */
  static get health() { return HealthAPI; }
  
  /** 实时通信API */
  static get realtime() { return RealtimeAPI; }

  /**
   * 创建认证管理器实例
   * @param fingerprint 设备指纹（可选）
   * @returns AuthManager 认证管理器实例
   */
  static createAuthManager(fingerprint?: string): AuthManager {
    return new AuthManager(fingerprint);
  }

  /**
   * 创建遥测批次管理器实例
   * @param options 批次配置选项
   * @returns TelemetryBatcher 遥测批次管理器实例
   */
  static createTelemetryBatcher(options?: {
    maxBatchSize?: number;
    flushInterval?: number;
    onFlush?: (events: import('./types.js').TelemetryEvent[]) => Promise<void>;
  }): TelemetryBatcher {
    return new TelemetryBatcher(options);
  }

  /**
   * 创建健康监控器实例
   * @param options 监控配置选项
   * @returns HealthMonitor 健康监控器实例
   */
  static createHealthMonitor(options?: {
    interval?: number;
    onStatusChange?: (status: import('./types.js').ServiceStatus, health: import('./types.js').HealthResponse) => void;
    onUnhealthy?: (unhealthyServices: string[], health: import('./types.js').HealthResponse) => void;
    onRecovered?: (health: import('./types.js').HealthResponse) => void;
    onError?: (error: any) => void;
  }): HealthMonitor {
    return new HealthMonitor(options);
  }
}

// ============ API 类导出 ============

export { AuthAPI, AuthManager };
export { TelemetryAPI, TelemetryBatcher };
export { ConfigAPI };
export { HealthAPI, HealthMonitor };
export { RealtimeAPI, ChannelPermissions };

// 默认导出统一客户端
export default BMTAPI;
