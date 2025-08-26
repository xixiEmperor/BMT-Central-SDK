/**
 * HTTP熔断器插件模块
 * 
 * 实现服务故障检测和自动熔断功能，基于经典的熔断器模式：
 * - 监控服务健康状态，自动检测故障
 * - 快速失败机制，避免无效请求堆积
 * - 自动恢复检测，渐进式服务恢复
 * - 三状态管理：关闭、开启、半开
 * 
 * 核心特性：
 * - 基于失败率的智能熔断
 * - 可配置的熔断阈值和恢复策略
 * - 统计窗口管理，平滑的状态转换
 * - 内存高效，性能开销极小
 * 
 * 熔断器状态说明：
 * - CLOSED（关闭）：正常状态，所有请求正常通过，持续监控失败率
 * - OPEN（开启）：熔断状态，所有请求立即失败，不发送实际请求
 * - HALF_OPEN（半开）：探测状态，允许少量请求通过以检测服务恢复
 * 
 * 使用场景：
 * - 微服务间调用保护
 * - 第三方API调用容错
 * - 防止服务雪崩效应
 * - 提升系统整体稳定性
 */

import type { HttpPlugin } from './types.js'

/**
 * 熔断器插件配置选项接口
 * 定义了熔断行为的各种可配置参数
 */
export interface CircuitBreakerOptions {
  /** 
   * 失败率阈值（百分比），默认 50
   * 
   * 当失败率超过此阈值时触发熔断
   * 失败率 = (失败请求数 / 总请求数) * 100
   * 
   * 设置建议：
   * - 50-60%：平衡的容错水平，适合大多数场景
   * - 30-40%：严格的容错，对稳定性要求高的系统
   * - 70-80%：宽松的容错，允许更多故障但减少误判
   * 
   * @example
   * ```typescript
   * failureThreshold: 50   // 失败率超过50%时熔断
   * failureThreshold: 30   // 失败率超过30%时熔断（更敏感）
   * failureThreshold: 70   // 失败率超过70%时熔断（更宽松）
   * ```
   */
  failureThreshold?: number
  
  /** 
   * 超时阈值（毫秒），默认 10000（未使用）
   * 
   * 预留参数，用于未来支持基于响应时间的熔断
   * 当前版本不使用此参数
   */
  timeoutThreshold?: number
  
  /** 
   * 最小请求数阈值，默认 10
   * 
   * 只有当请求数达到此阈值时才会考虑熔断
   * 避免因为少量请求就触发熔断，提供统计有效性
   * 
   * 设置原则：
   * - 太小：容易误判，可能因为偶发错误就熔断
   * - 太大：反应迟钝，可能错过真正的故障
   * - 建议：5-20，根据业务请求量调整
   * 
   * @example
   * ```typescript
   * minimumRequests: 5   // 至少5个请求后才考虑熔断
   * minimumRequests: 20  // 至少20个请求后才考虑熔断（更稳定）
   * ```
   */
  minimumRequests?: number
  
  /** 
   * 半开状态重试间隔（毫秒），默认 30000（30秒）
   * 
   * 熔断器开启后，等待此时间间隔后进入半开状态
   * 半开状态允许少量请求通过以检测服务是否恢复
   * 
   * 设置考虑：
   * - 太短：可能在服务未恢复时就开始重试
   * - 太长：延长了服务不可用时间
   * - 建议：根据服务的典型恢复时间设置
   * 
   * @example
   * ```typescript
   * retryInterval: 15000   // 15秒后重试（较激进）
   * retryInterval: 60000   // 60秒后重试（较保守）
   * ```
   */
  retryInterval?: number
  
  /** 
   * 统计窗口重置间隔（毫秒），默认 60000（60秒）
   * 
   * 定期重置统计窗口，清除旧的请求统计数据
   * 确保熔断决策基于最近的数据，而不是历史累积
   * 
   * 重置机制的重要性：
   * - 防止历史故障影响当前判断
   * - 提供滑动窗口效果
   * - 允许系统从历史故障中恢复
   * 
   * @example
   * ```typescript
   * resetInterval: 30000   // 30秒重置一次（更频繁）
   * resetInterval: 120000  // 2分钟重置一次（更稳定）
   * ```
   */
  resetInterval?: number
}

/**
 * 创建HTTP熔断器插件工厂函数
 * 
 * 基于失败率阈值的熔断器实现，提供自动故障检测和恢复功能
 * 每个插件实例维护独立的状态和统计信息
 * 
 * @param options 熔断器配置选项
 * @returns HttpPlugin 熔断器插件实例
 * 
 * @example
 * ```typescript
 * // 基本使用 - 默认配置
 * const breaker = circuitBreakerPlugin({
 *   failureThreshold: 50,      // 50%失败率触发熔断
 *   minimumRequests: 10,       // 至少10个请求
 *   retryInterval: 30000,      // 30秒后重试
 *   resetInterval: 60000       // 60秒重置统计
 * });
 * 
 * // 敏感配置 - 快速熔断
 * const sensitiveBreaker = circuitBreakerPlugin({
 *   failureThreshold: 30,      // 30%失败率就熔断
 *   minimumRequests: 5,        // 仅需5个请求
 *   retryInterval: 15000,      // 15秒后重试
 *   resetInterval: 30000       // 30秒重置统计
 * });
 * 
 * // 宽松配置 - 容忍更多故障
 * const tolerantBreaker = circuitBreakerPlugin({
 *   failureThreshold: 70,      // 70%失败率才熔断
 *   minimumRequests: 20,       // 需要20个请求样本
 *   retryInterval: 60000,      // 60秒后重试
 *   resetInterval: 120000      // 2分钟重置统计
 * });
 * ```
 */
export function circuitBreakerPlugin(options: CircuitBreakerOptions = {}): HttpPlugin {
  // 解构配置选项并设置默认值
  const {
    failureThreshold = 50,     // 默认50%失败率阈值
    minimumRequests = 10,      // 默认最少10个请求
    retryInterval = 30_000,    // 默认30秒重试间隔
    resetInterval = 60_000,    // 默认60秒统计重置间隔
  } = options

  // 熔断器状态类型定义
  type State = 'closed' | 'open' | 'half-open'
  
  // 熔断器状态管理
  let state: State = 'closed'    // 初始状态为关闭（正常）
  let lastOpenedAt = 0           // 上次熔断开启的时间戳
  
  // 统计窗口数据
  let windowStart = Date.now()   // 当前统计窗口开始时间
  let total = 0                  // 统计窗口内的总请求数
  let failed = 0                 // 统计窗口内的失败请求数

  /**
   * 重置统计窗口
   * 清空当前统计数据，开始新的统计周期
   * 
   * 重置的时机：
   * 1. 定期重置（由定时器触发）
   * 2. 半开状态成功恢复时
   */
  const resetWindow = () => {
    windowStart = Date.now()
    total = 0
    failed = 0
  }

  /**
   * 定时器：定期重置统计窗口
   * 
   * 确保熔断决策基于最近的请求统计，而不是历史累积数据
   * 这提供了类似滑动窗口的效果，使熔断器能够从历史故障中恢复
   */
  setInterval(() => {
    // 定期重置统计窗口，清除历史数据
    resetWindow()
  }, resetInterval)

  return {
    name: 'circuit-breaker',
    
    /**
     * 请求前处理：熔断状态检查和控制
     * 
     * 根据当前熔断器状态决定是否允许请求通过：
     * - CLOSED: 直接通过
     * - OPEN: 检查是否可以转为半开状态，否则拒绝
     * - HALF_OPEN: 直接通过（用于探测服务恢复）
     */
    async onRequest(config) {
      if (state === 'open') {
        const now = Date.now()
        
        // 检查是否到了重试时间，可以进入半开状态
        if (now - lastOpenedAt > retryInterval) {
          state = 'half-open'
          // 允许请求通过，用于探测服务是否恢复
        } else {
          // 仍在熔断期内，直接拒绝请求
          throw { 
            type: 'ServiceUnavailable', 
            message: 'Circuit breaker open' 
          }
        }
      }
      
      // 其他状态（closed、half-open）允许请求通过
      return config
    },
    
    /**
     * 响应后处理：成功请求的统计和状态更新
     * 
     * 处理成功响应：
     * 1. 增加总请求计数
     * 2. 如果当前是半开状态，成功意味着服务恢复，转为关闭状态
     * 3. 返回响应数据
     */
    async onResponse(resp) {
      total++  // 统计总请求数
      
      if (state === 'half-open') {
        // 半开状态下的成功请求表明服务已恢复
        state = 'closed'
        resetWindow()  // 重置统计，开始新的监控周期
      }
      
      return resp.data as any
    },
    
    /**
     * 错误处理：失败请求的统计和熔断判断
     * 
     * 处理失败响应：
     * 1. 增加总请求计数和失败计数
     * 2. 计算当前失败率
     * 3. 检查是否达到熔断条件
     * 4. 如果达到条件，触发熔断
     * 5. 重新抛出原始错误
     */
    async onError(error) {
      total++   // 统计总请求数
      failed++  // 统计失败请求数
      
      // 计算当前失败率（百分比）
      const percent = total > 0 ? (failed / total) * 100 : 0
      
      // 检查熔断条件：
      // 1. 请求数达到最小阈值（避免小样本误判）
      // 2. 失败率超过配置阈值
      // 3. 当前不是开启状态（避免重复设置）
      if (total >= minimumRequests && percent >= failureThreshold && state !== 'open') {
        state = 'open'               // 切换到熔断状态
        lastOpenedAt = Date.now()    // 记录熔断开启时间
      }
      
      // 重新抛出原始错误，不吞掉异常
      throw error
    },
  }
}