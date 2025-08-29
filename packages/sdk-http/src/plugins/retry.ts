/**
 * HTTP重试插件模块
 * 
 * 提供智能的HTTP请求重试功能，基于SDK核心重试机制：
 * - 针对可重试的HTTP方法和状态码进行重试
 * - 支持多种退避策略（指数、线性、固定）
 * - 可配置的重试条件和参数
 * - 与HTTP客户端深度集成
 * 
 * 核心特性：
 * - 基于HTTP语义的智能重试判断
 * - 可配置的重试方法白名单
 * - 基于状态码的重试决策
 * - 继承SDK核心的完整重试能力
 * 
 * 重试策略说明：
 * - 幂等方法（GET、HEAD、OPTIONS、PUT、DELETE）默认可重试
 * - 非幂等方法（POST、PATCH）默认不重试，避免副作用
 * - 特定状态码（408超时、429限流、5xx服务器错误）触发重试
 * - 客户端错误（4xx，除429外）通常不重试
 * 
 * 使用场景：
 * - 网络不稳定环境下的请求重试
 * - 服务器临时故障的自动恢复
 * - API限流时的自动退避重试
 * - 提升分布式系统的可靠性
 */

import type { HttpPlugin } from './types.js'
import type { RetryOptions } from '@wfynbzlx666/sdk-core'

/**
 * HTTP重试插件配置选项接口
 * 继承SDK核心重试选项，并添加HTTP特定的配置
 */
export interface RetryPluginOptions extends RetryOptions {
  /** 
   * 可重试的HTTP方法列表，默认 ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']
   * 
   * 基于HTTP语义安全性和幂等性设计：
   * - GET、HEAD、OPTIONS：安全且幂等，可以无副作用重试
   * - PUT、DELETE：幂等但不安全，重试通常是安全的
   * - POST、PATCH：非幂等，重试可能产生副作用，默认不包含
   * 
   * 自定义建议：
   * - 如果你的POST请求是幂等的（如使用幂等键），可以添加'POST'
   * - 如果使用自定义HTTP方法，需要根据其语义决定是否可重试
   * 
   * @example
   * ```typescript
   * // 默认配置（推荐）
   * retryableMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']
   * 
   * // 包含POST（确保你的POST是幂等的）
   * retryableMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE', 'POST']
   * 
   * // 只重试读取操作
   * retryableMethods: ['GET', 'HEAD', 'OPTIONS']
   * ```
   */
  retryableMethods?: string[]
  
  /** 
   * 可重试的HTTP状态码列表，默认 [408, 429, 500, 502, 503, 504]
   * 
   * 基于HTTP状态码语义和重试成功概率设计：
   * - 408 Request Timeout：请求超时，网络问题，重试有意义
   * - 429 Too Many Requests：限流，等待后重试通常会成功
   * - 500 Internal Server Error：服务器临时错误，重试可能成功
   * - 502 Bad Gateway：网关错误，通常是临时问题
   * - 503 Service Unavailable：服务不可用，可能是临时过载
   * - 504 Gateway Timeout：网关超时，网络或上游问题
   * 
   * 不包含的状态码及原因：
   * - 4xx客户端错误（除408、429）：重试通常无意义
   * - 401 Unauthorized：认证问题，需要用户干预
   * - 403 Forbidden：权限问题，重试无效
   * - 404 Not Found：资源不存在，重试无意义
   * - 501 Not Implemented：方法不支持，重试无效
   * 
   * @example
   * ```typescript
   * // 默认配置（推荐）
   * retryableStatusCodes: [408, 429, 500, 502, 503, 504]
   * 
   * // 更激进的重试（包含更多5xx错误）
   * retryableStatusCodes: [408, 429, 500, 501, 502, 503, 504, 505]
   * 
   * // 保守重试（只重试明确的临时错误）
   * retryableStatusCodes: [408, 429, 503]
   * ```
   */
  retryableStatusCodes?: number[]
}

/**
 * 创建HTTP重试插件工厂函数
 * 
 * 基于SDK核心重试机制的HTTP插件实现
 * 提供HTTP语义感知的重试控制和配置传递
 * 
 * @param options HTTP重试插件配置选项
 * @returns HttpPlugin HTTP重试插件实例
 * 
 * @example
 * ```typescript
 * // 基本使用 - 默认配置
 * const retry = retryPlugin({
 *   retries: 3,
 *   baseMs: 300,
 *   strategy: 'exponential'
 * });
 * 
 * // 自定义重试条件
 * const customRetry = retryPlugin({
 *   retries: 5,
 *   baseMs: 500,
 *   retryableMethods: ['GET', 'POST'],  // 包含POST
 *   retryableStatusCodes: [408, 429, 500, 502, 503],
 *   shouldRetry: (error, attempt) => {
 *     // 自定义重试条件
 *     return attempt < 3 && error.code === 'NETWORK_ERROR';
 *   }
 * });
 * 
 * // 保守重试策略
 * const conservativeRetry = retryPlugin({
 *   retries: 2,
 *   baseMs: 1000,
 *   strategy: 'linear',
 *   retryableMethods: ['GET', 'HEAD'],  // 只重试读取操作
 *   retryableStatusCodes: [503]         // 只重试服务不可用
 * });
 * ```
 */
export function retryPlugin(options: RetryPluginOptions = {}): HttpPlugin {
  // 解构配置选项并设置默认值
  const {
    // HTTP特定配置
    retryableMethods = ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'],
    retryableStatusCodes = [408, 429, 500, 502, 503, 504],
    
    // 重试策略配置（来自SDK核心）
    retries = 3,              // 默认重试3次
    baseMs = 300,             // 默认基础延迟300ms（比核心默认值更短，适合HTTP）
    capMs = 10_000,           // 默认最大延迟10秒
    strategy = 'exponential', // 默认指数退避策略
    jitter = true,            // 默认启用抖动
  } = options

  return {
    name: 'retry',
    
    /**
     * 请求前处理：传递重试配置到请求上下文
     * 
     * 将重试相关的配置附加到请求配置中，供HTTP客户端使用
     * 这种设计允许每个请求有独立的重试配置
     * 
     * 注意：插件本身不执行重试逻辑，而是将配置传递给HTTP客户端
     * 实际的重试执行由HTTP客户端的withRetry包装器完成
     */
    async onRequest(config) {
      // 将重试配置附加到请求配置中
      // HTTP客户端会读取这些配置来执行实际的重试逻辑
      ;(config as any).__retry = { 
        retries, 
        baseMs, 
        capMs, 
        strategy, 
        jitter,
        // 注意：retryableMethods和retryableStatusCodes由客户端在shouldRetry中使用
        retryableMethods,
        retryableStatusCodes
      }
      
      return config
    },
    
    /**
     * 响应后处理：透传响应数据
     * 
     * 成功响应不需要特殊处理，直接返回数据
     * 保持插件的轻量性，避免不必要的数据转换
     */
    async onResponse(resp) {
      return resp.data as any
    },
    
    /**
     * 错误处理：透传错误，不干预重试逻辑
     * 
     * 重试插件不在此处处理重试逻辑，原因：
     * 1. 避免插件间的重试冲突
     * 2. 保持插件职责单一
     * 3. 由HTTP客户端统一管理重试流程
     * 
     * 实际的重试逻辑在HTTP客户端的withRetry包装器中执行
     * 该包装器会读取__retry配置并执行相应的重试策略
     */
    async onError(error) {
      // 不在插件层面处理重试，避免与客户端重试逻辑冲突
      // HTTP客户端的withRetry会根据__retry配置执行重试
      throw error
    },
  }
}