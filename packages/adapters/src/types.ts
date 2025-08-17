/**
 * 适配器通用类型定义
 */

// 错误处理函数类型
export type ErrorHandler = (error: Error) => void

// 重试函数类型
export type RetryFn = (failureCount: number, error: Error) => boolean

// 延迟函数类型
export type DelayFn = (attemptIndex: number) => number

// 查询键类型
export type QueryKey = readonly unknown[]

// 查询函数类型
export type QueryFn<T = unknown> = () => Promise<T>

// 通用查询选项
export interface BaseQueryOptions<T = unknown> {
  /** 查询键 */
  queryKey?: QueryKey
  /** 查询函数 */
  queryFn?: QueryFn<T>
  /** 数据缓存时间（毫秒） */
  staleTime?: number
  /** 垃圾回收时间（毫秒） */
  gcTime?: number
  /** 重试次数 */
  retry?: boolean | number | RetryFn
  /** 重试延迟 */
  retryDelay?: number | DelayFn
  /** 错误处理 */
  onError?: ErrorHandler
  /** 是否启用 */
  enabled?: boolean
  /** 窗口获得焦点时重新获取 */
  refetchOnWindowFocus?: boolean
  /** 组件挂载时重新获取 */
  refetchOnMount?: boolean
  /** 重新连接时重新获取 */
  refetchOnReconnect?: boolean
}