/**
 * React Query 适配器（占位实现，去除对 React 类型的直接依赖）
 */

import type { BaseQueryOptions } from './types.js'

// 轻量本地类型，避免依赖 @types/react
type ReactNodeLike = unknown
type ReactErrorInfoLike = { componentStack?: string }
type ComponentTypeLike<P = any> = (props: P) => ReactNodeLike

export interface ReactQueryDefaults {
  /** 默认查询选项 */
  defaultOptions: {
    queries: BaseQueryOptions
    mutations: Record<string, unknown>
  }
  /** 创建 QueryClient */
  createQueryClient(): unknown  // 占位，真实类型来自 @tanstack/react-query
}

/**
 * 创建 React Query 默认配置（占位）
 */
export function createQueryClientDefaults(): ReactQueryDefaults {
  return {
    defaultOptions: {
      queries: {
        queryKey: ['placeholder'],
        queryFn: async () => ({}),
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: 3,
        retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 30_000),
        enabled: true,
      },
      mutations: {},
    },
    createQueryClient() {
      // 返回占位对象，避免强依赖 @tanstack/react-query
      return {}
    },
  }
}

/**
 * React 错误边界组件配置（占位）
 */
export interface ErrorBoundaryProps {
  children: ReactNodeLike
  fallback?: ComponentTypeLike<{ error: Error }>
  onError?: (error: Error, errorInfo: ReactErrorInfoLike) => void
}

/**
 * 创建错误边界组件（占位）
 */
export function createErrorBoundary(): ComponentTypeLike<ErrorBoundaryProps> {
  return function ErrorBoundary(props: ErrorBoundaryProps) {
    return props.children as any
  }
}