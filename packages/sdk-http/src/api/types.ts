/**
 * BMT Platform API 类型定义
 * 定义了所有 API 接口的请求和响应类型
 */

// ============ 通用类型定义 ============

/**
 * API 错误响应格式
 */
export interface ErrorResponse {
  code: 'InvalidArgument' | 'Unauthorized' | 'Forbidden' | 'NotFound' | 
        'PayloadTooLarge' | 'RateLimited' | 'Internal' | 'ServiceUnavailable';
  message: string;
  details?: any;
  requestId: string;
}

/**
 * 用户信息接口
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  attrs?: Record<string, any>;
}

/**
 * 用户信息（带权限）
 */
export interface UserWithPermissions extends User {
  permissions: string[];
}

// ============ 遥测数据类型 ============

/**
 * 遥测事件类型
 */
export type TelemetryEventType = 'page' | 'custom' | 'error' | 'api' | 'perf' | 'event';

/**
 * 遥测事件接口
 */
export interface TelemetryEvent {
  /** 事件唯一ID，最大100字符 */
  id: string;
  /** 事件类型 */
  type: TelemetryEventType;
  /** 事件名称，最大200字符 */
  name: string;
  /** 时间戳（毫秒） */
  ts: number;
  /** 应用名称，最大50字符 */
  app: string;
  /** 版本号，最大20字符 */
  release: string;
  /** 会话ID，最大100字符 */
  sessionId: string;
  /** 用户信息（可选） */
  user?: User;
  /** 事件属性 */
  props?: Record<string, any>;
}

/**
 * 遥测批次类型（1-200个事件）
 */
export type TelemetryBatch = TelemetryEvent[];

/**
 * 遥测上报响应
 */
export interface TelemetryResponse {
  success: boolean;
  /** 接收到的事件数量 */
  accepted: number;
  /** 成功处理的事件数量 */
  processed: number;
  /** 拒绝的事件数量 */
  rejected: number;
  /** 重复事件数量 */
  duplicates: number;
  requestId: string;
  errors?: Array<{
    eventId: string;
    error: string;
  }>;
}

/**
 * 遥测统计响应
 */
export interface TelemetryStatsResponse {
  success: boolean;
  data: {
    totalEvents: number;
    bufferSize: number;
    lastProcessed: string;
  };
  timestamp: number;
}

// ============ 认证相关类型 ============

/**
 * 登录请求
 */
export interface LoginRequest {
  /** 用户名（邮箱） */
  username: string;
  /** 密码 */
  password: string;
  /** 设备指纹（可选） */
  fingerprint?: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  /** JWT访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** 令牌类型 */
  tokenType: 'Bearer';
  /** 过期时间（秒） */
  expiresIn: number;
  /** 用户信息 */
  user: User;
  requestId: string;
}

/**
 * 刷新令牌请求
 */
export interface RefreshRequest {
  /** 刷新令牌 */
  refreshToken: string;
  /** 设备指纹（可选） */
  fingerprint?: string;
}

/**
 * 刷新令牌响应
 */
export interface RefreshResponse {
  /** 新的JWT访问令牌 */
  accessToken: string;
  /** 令牌类型 */
  tokenType: 'Bearer';
  /** 过期时间（秒） */
  expiresIn: number;
  requestId: string;
}

/**
 * 令牌验证响应
 */
export interface VerifyResponse {
  valid: boolean;
  /** 用户信息（带权限） */
  user: UserWithPermissions;
  /** 令牌过期时间戳 */
  expiresAt: number;
  requestId: string;
}

/**
 * 登出请求
 */
export interface LogoutRequest {
  refreshToken: string;
}

// ============ SDK配置类型 ============

/**
 * SDK配置请求参数
 */
export interface ConfigParams {
  /** 应用名称 */
  app?: string;
  /** 版本号 */
  release?: string;
}

/**
 * SDK配置响应
 */
export interface SDKConfig {
  /** 遥测配置 */
  telemetry: {
    /** 是否启用遥测 */
    enabled: boolean;
    /** 上报端点 */
    endpoint: string;
    /** 采样率 (0-1) */
    sampleRate: number;
    /** 批次大小 */
    batchSize: number;
    /** 刷新间隔(ms) */
    flushInterval: number;
    /** 单个事件最大大小(bytes) */
    maxEventSize: number;
    /** 批次最大事件数 */
    maxBatchEvents: number;
  };
  /** 性能监控配置 */
  performance: {
    /** 是否启用性能监控 */
    enabled: boolean;
    /** 性能采样率 */
    sampleRate: number;
    /** 是否收集Web Vitals */
    webVitals: boolean;
    /** 性能数据端点 */
    endpoint: string;
  };
  /** 实时通信配置 */
  realtime: {
    /** 是否启用实时通信 */
    enabled: boolean;
    /** WebSocket地址 */
    url: string;
    /** 心跳间隔(ms) */
    heartbeatInterval: number;
    /** 重连延迟(ms) */
    reconnectDelay: number;
    /** 最大重连次数 */
    maxReconnectAttempts: number;
    /** Socket.IO命名空间 */
    namespace: string;
  };
  /** 功能开关 */
  features: {
    /** 错误上报 */
    errorReporting: boolean;
    /** 性能监控 */
    performanceMonitoring: boolean;
    /** 实时更新 */
    realtimeUpdates: boolean;
    /** 高级分析 */
    advancedAnalytics: boolean;
    /** 调试模式 */
    debugMode: boolean;
  };
  /** 限流配置 */
  rateLimit: {
    /** 遥测接口限流 */
    telemetry: number;
    /** 认证接口限流 */
    auth: number;
    /** 限流窗口(ms) */
    windowMs: number;
  };
  /** 是否为调试模式 */
  debug: boolean;
}

// ============ 健康检查类型 ============

/**
 * 服务状态
 */
export type ServiceStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * 健康检查响应
 */
export interface HealthResponse {
  status: ServiceStatus;
  services: {
    telemetry: ServiceStatus;
    auth: ServiceStatus;
    websocket: ServiceStatus;
    database: ServiceStatus;
    memory: ServiceStatus;
    disk: ServiceStatus;
  };
  timestamp: number;
  /** 服务运行时间(秒) */
  uptime: number;
  /** 服务版本 */
  version: string;
  /** Node.js版本 */
  nodeVersion: string;
  /** 运行环境 */
  environment: string;
}

// ============ 服务信息类型 ============

/**
 * 服务信息响应
 */
export interface ServiceInfoResponse {
  name: string;
  version: string;
  status: string;
  timestamp: number;
  endpoints: {
    telemetry: string;
    auth: string;
    config: string;
    health: string;
    realtime: string;
  };
}

// ============ 实时通信类型 ============

/**
 * 实时服务统计响应
 */
export interface RealtimeStatsResponse {
  // TODO: 根据实际后端实现添加具体字段
  [key: string]: any;
}

/**
 * 系统广播请求
 */
export interface BroadcastRequest {
  /** 通知级别 */
  level: 'info' | 'warning' | 'error';
  /** 消息内容 */
  message: string;
  /** 目标用户（可选，不提供则广播给所有用户） */
  targetUsers?: string[];
}

// ============ 通用响应类型 ============

/**
 * 基础成功响应
 */
export interface BaseResponse {
  success: boolean;
  requestId: string;
}

/**
 * 带数据的响应
 */
export interface DataResponse<T> extends BaseResponse {
  data: T;
}
