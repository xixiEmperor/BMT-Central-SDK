/**
 * 请求去重插件 - 基于 method+url+params+body 的请求去重
 */

import type { HttpPlugin } from './types.js'

export interface DedupOptions {
  /** 缓存时间（毫秒），默认 1000 */
  cacheTtl?: number
  /** 最大缓存数量，默认 100 */
  maxCacheSize?: number
  /** 是否包含请求体进行去重，默认 true */
  includeBody?: boolean
  /** 自定义 key 生成函数 */
  keyGenerator?: (method: string, url: string, params?: any, body?: any) => string
}

/**
 * 创建请求去重插件
 */
export function dedupPlugin(options: DedupOptions = {}): HttpPlugin {
  // TODO: 实现请求去重插件
  throw new Error('Dedup plugin not implemented yet')
}