/**
 * React Query 适配器
 */

import type { BaseQueryOptions } from './types.js'

export interface ReactQueryDefaults {
  /** 默认查询选项 */
  defaultOptions: {
    queries: BaseQueryOptions
    mutations: Record<string, unknown>
  }
  /** 创建 QueryClient */
  createQueryClient(): unknown  // QueryClient 类型来自 @tanstack/react-query
}

/**
 * 创建 React Query 默认配置
 */
export function createQueryClientDefaults(): ReactQueryDefaults {
  // TODO: 实现 React Query 适配器
  throw new Error('React Query adapter not implemented yet')
}

/**
 * React 错误边界组件配置
 */
export interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * 创建错误边界组件
 */
export function createErrorBoundary(): React.ComponentType<ErrorBoundaryProps> {
  // TODO: 实现错误边界
  throw new Error('Error boundary not implemented yet')
}