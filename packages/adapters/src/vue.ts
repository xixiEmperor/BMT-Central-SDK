/**
 * Vue Query 适配器
 */

import type { BaseQueryOptions } from './types.js'

export interface VueQueryDefaults {
  /** 默认查询选项 */
  defaultOptions: {
    queries: BaseQueryOptions
    mutations: Record<string, unknown>
  }
  /** 创建 Vue Query 客户端 */
  createQueryClient(): unknown  // VueQueryClient 类型来自 @tanstack/vue-query
}

/**
 * 创建 Vue Query 默认配置
 */
export function createVueQueryDefaults(): VueQueryDefaults {
  // TODO: 实现 Vue Query 适配器
  throw new Error('Vue Query adapter not implemented yet')
}

/**
 * Vue 全局错误处理器
 */
export function createGlobalErrorHandler(): (error: Error) => void {
  // TODO: 实现全局错误处理器
  throw new Error('Global error handler not implemented yet')
}

/**
 * Vue 路由埋点插件
 */
export function createRouterPlugin(): unknown {
  // TODO: 实现路由埋点插件
  throw new Error('Router plugin not implemented yet')
}