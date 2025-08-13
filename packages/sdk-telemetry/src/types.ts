/**
 * 遥测事件类型定义
 */

// 事件类型
export type TelemetryEventType = 'page' | 'event' | 'error' | 'api' | 'perf'

// 用户信息
export interface TelemetryUser {
  id?: string | number
  role?: string
  [key: string]: any
}

// 基础事件结构
export interface TelemetryEvent {
  /** 事件类型 */
  type: TelemetryEventType
  /** 事件名称 */
  name: string
  /** 时间戳 */
  ts: number
  /** 应用名称 */
  app: string
  /** 版本号 */
  release: string
  /** 用户信息 */
  user?: TelemetryUser
  /** 事件属性 */
  props?: Record<string, any>
  /** 事件 ID */
  id?: string
  /** 会话 ID */
  sessionId?: string
}

// 页面浏览事件
export interface PageViewEvent extends TelemetryEvent {
  type: 'page'
  name: string  // 路由名称
  props?: {
    url?: string
    title?: string
    referrer?: string
    [key: string]: any
  }
}

// 自定义事件
export interface CustomEvent extends TelemetryEvent {
  type: 'event'
  name: string  // 事件名称
  props?: Record<string, any>
}

// 错误事件
export interface ErrorEvent extends TelemetryEvent {
  type: 'error'
  name: string  // 错误名称
  props?: {
    message?: string
    stack?: string
    filename?: string
    lineno?: number
    colno?: number
    [key: string]: any
  }
}

// API 调用事件
export interface ApiEvent extends TelemetryEvent {
  type: 'api'
  name: string  // API 路径
  props?: {
    method?: string
    status?: number
    duration?: number
    [key: string]: any
  }
}

// 性能事件
export interface PerfEvent extends TelemetryEvent {
  type: 'perf'
  name: string  // 指标名称
  props?: {
    value?: number
    rating?: string
    [key: string]: any
  }
}