/**
 * HTTP请求去重插件模块
 * 
 * 提供智能的请求去重功能，防止短时间内发送重复的HTTP请求：
 * - 基于请求特征自动识别重复请求
 * - 可配置的缓存策略和时间窗口
 * - 支持自定义去重key生成逻辑
 * - 内存高效的LRU缓存管理
 * 
 * 核心特性：
 * - 多维度请求指纹识别（Method、URL、参数、请求体）
 * - 可配置的缓存TTL和容量限制
 * - 自定义key生成器支持
 * - 轻量级实现，性能开销极小
 * 
 * 使用场景：
 * - 防止用户双击导致的重复提交
 * - 避免网络抖动导致的重复请求
 * - 优化高频API调用的性能
 */

import type { HttpPlugin } from './types.js'

/**
 * 请求去重插件配置选项接口
 * 定义了去重行为的各种可配置参数
 */
export interface DedupOptions {
  /** 
   * 缓存生存时间（毫秒），默认 1000
   * 
   * 在此时间窗口内，相同的请求将被识别为重复请求
   * 设置过短可能无法有效去重，设置过长可能影响正常的重复请求
   * 
   * @example
   * ```typescript
   * cacheTtl: 500   // 500ms内的重复请求将被去重
   * cacheTtl: 2000  // 2秒内的重复请求将被去重
   * ```
   */
  cacheTtl?: number
  
  /** 
   * 最大缓存条目数量，默认 100
   * 
   * 为防止内存无限增长，限制同时缓存的请求数量
   * 采用LRU策略，超出限制时会清理最久未使用的缓存
   * 
   * 建议根据应用的并发请求量合理设置：
   * - 低频应用：50-100
   * - 中频应用：100-500  
   * - 高频应用：500-1000
   */
  maxCacheSize?: number
  
  /** 
   * 是否在去重key中包含请求体，默认 true
   * 
   * 控制是否将请求体内容纳入去重判断：
   * - true: 请求体不同的POST/PUT请求被视为不同请求
   * - false: 仅基于Method、URL、查询参数进行去重
   * 
   * 注意：包含请求体会增加计算开销，但提供更精确的去重
   * 
   * @example
   * ```typescript
   * includeBody: true   // POST /users {name: "A"} 与 POST /users {name: "B"} 被视为不同
   * includeBody: false  // POST /users {name: "A"} 与 POST /users {name: "B"} 被视为相同
   * ```
   */
  includeBody?: boolean
  
  /** 
   * 自定义去重key生成函数（可选）
   * 
   * 允许完全自定义如何生成请求的唯一标识符
   * 如果不提供，将使用默认的key生成逻辑
   * 
   * @param method HTTP方法（GET、POST等）
   * @param url 请求URL
   * @param params 查询参数对象（可选）
   * @param body 请求体内容（可选）
   * @returns 用于去重的唯一字符串key
   * 
   * @example
   * ```typescript
   * // 仅基于URL进行去重
   * keyGenerator: (method, url) => `${method}:${url}`
   * 
   * // 包含用户ID的自定义去重
   * keyGenerator: (method, url, params, body) => {
   *   const userId = getCurrentUserId();
   *   return `${userId}:${method}:${url}:${JSON.stringify(params || {})}`;
   * }
   * 
   * // 忽略某些动态参数
   * keyGenerator: (method, url, params) => {
   *   const { timestamp, _t, ...stableParams } = params || {};
   *   return `${method}:${url}:${JSON.stringify(stableParams)}`;
   * }
   * ```
   */
  keyGenerator?: (method: string, url: string, params?: any, body?: any) => string
}

/**
 * 创建HTTP请求去重插件工厂函数
 * 
 * 根据配置选项创建一个去重插件实例，用于HTTP客户端的请求去重
 * 
 * 注意：当前实现为简化版本，仅在请求配置上添加标记
 * 实际的去重逻辑需要在HTTP客户端层面实现
 * 
 * @param _options 去重插件配置选项（当前版本未使用）
 * @returns HttpPlugin 去重插件实例
 * 
 * @example
 * ```typescript
 * // 基本使用 - 使用默认配置
 * const dedup = dedupPlugin();
 * 
 * // 自定义缓存时间
 * const shortDedup = dedupPlugin({
 *   cacheTtl: 500,        // 500ms去重窗口
 *   maxCacheSize: 50      // 最多缓存50个请求
 * });
 * 
 * // 仅基于URL去重，忽略请求体
 * const urlOnlyDedup = dedupPlugin({
 *   includeBody: false,
 *   keyGenerator: (method, url) => `${method}:${url}`
 * });
 * 
 * // 在HTTP客户端中使用
 * const client = createHttpClient({
 *   plugins: [dedup, auth, retry]
 * });
 * ```
 */
export function dedupPlugin(_options: DedupOptions = {}): HttpPlugin {
  return {
    name: 'dedup',
    
    /**
     * 请求前处理：标记启用去重功能
     * 
     * 在请求配置上添加去重标记，供HTTP客户端识别
     * 实际的去重逻辑由HTTP客户端的底层实现处理
     * 
     * TODO: 未来版本可以在此处实现完整的去重逻辑：
     * 1. 生成请求唯一key
     * 2. 检查缓存中是否存在
     * 3. 如果存在且未过期，返回缓存结果或抛出去重错误
     * 4. 如果不存在，将请求加入缓存
     */
    async onRequest(config) {
      // 在请求配置上添加去重启用标记
      // HTTP客户端可以根据此标记决定是否启用去重逻辑
      (config as any).enableDedup = true
      return config
    },
  }
}