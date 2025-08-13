/**
 * SDK Core 通用类型定义
 */

// 通用回调函数类型
export type Callback<T = void> = (value: T) => void
export type AsyncCallback<T = void> = (value: T) => Promise<void>

// 取消回调类型
export type Unsubscribe = () => void

// 错误处理函数类型
export type ErrorHandler = (error: Error) => void

// 重试策略类型
export type RetryStrategy = 'fixed' | 'exponential' | 'linear'

// 日志级别
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// 环境检测结果
export interface SupportInfo {
  broadcastChannel: boolean
  navigatorLocks: boolean
  indexedDB: boolean
  webWorker: boolean
  serviceWorker: boolean
  localStorage: boolean
  sessionStorage: boolean
}