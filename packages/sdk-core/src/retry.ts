/**
 * 重试机制模块 - 提供健壮的重试策略支持
 * 
 * 本模块实现了智能重试功能，支持多种退避策略和抖动机制：
 * - 指数退避：延迟时间按指数级增长，适用于网络重试场景
 * - 线性退避：延迟时间线性增长，适用于资源竞争场景  
 * - 固定延迟：固定间隔重试，适用于简单场景
 * - Full Jitter：完全随机抖动，避免雷群效应
 * 
 * 核心特性：
 * - 可配置的重试次数和延迟策略
 * - 智能抖动机制避免请求风暴
 * - 自定义重试条件判断
 * - 类型安全的泛型支持
 */

import { sleep } from './utils.js'

/**
 * 重试配置选项接口
 * 定义了重试行为的各种可配置参数
 */
export interface RetryOptions {
  /** 
   * 重试次数，默认 3
   * 设置为 0 表示不重试，仅执行一次
   * 注意：总执行次数 = retries + 1（初始执行）
   */
  retries?: number
  
  /** 
   * 基础延迟时间（毫秒），默认 1000
   * 作为各种退避策略的基础时间单位
   * - 固定策略：每次重试都使用此延迟
   * - 线性策略：延迟 = baseMs * (重试次数 + 1)  
   * - 指数策略：延迟 = baseMs * 2^重试次数
   */
  baseMs?: number
  
  /** 
   * 最大延迟时间（毫秒），默认 30000（30秒）
   * 防止延迟时间过长，确保系统响应性
   * 任何计算出的延迟都不会超过此值
   */
  capMs?: number
  
  /** 
   * 重试策略类型，默认 'exponential'
   * - 'fixed': 固定延迟，适用于简单重试场景
   * - 'linear': 线性增长，适用于资源逐渐释放的场景
   * - 'exponential': 指数增长，适用于网络请求等场景
   */
  strategy?: 'fixed' | 'exponential' | 'linear'
  
  /** 
   * 是否启用 Full Jitter 抖动，默认 true
   * Full Jitter 将延迟时间随机化为 [0, 计算延迟] 范围内的值
   * 有效防止多个客户端同时重试造成的"雷群效应"
   */
  jitter?: boolean
  
  /** 
   * 自定义重试条件判断函数（可选）
   * @param error 当前遇到的错误对象
   * @param attempt 当前重试次数（从0开始）
   * @returns true表示应该重试，false表示停止重试
   * 
   * 如果不提供此函数，默认行为是：只要还有剩余重试次数就继续重试
   * 可以基于错误类型、HTTP状态码等自定义重试逻辑
   */
  shouldRetry?: (error: unknown, attempt: number) => boolean
}

/**
 * 重试上下文接口
 * 提供重试过程中的状态信息，便于监控和调试
 */
export interface RetryContext {
  /** 当前重试次数（从0开始，0表示首次执行） */
  attempt: number
  /** 总执行次数（包括首次执行） */
  totalAttempts: number
  /** 本次重试的延迟时间（毫秒） */
  delay: number
  /** 导致重试的错误对象 */
  error: unknown
}

/**
 * 创建重试函数工厂
 * 根据提供的配置选项创建一个可重用的重试执行器
 * 
 * @param options 重试配置选项
 * @returns 返回一个重试执行器函数，可用于包装需要重试的异步操作
 * 
 * @example
 * ```typescript
 * // 创建一个指数退避的重试器
 * const retry = createRetry({
 *   retries: 3,
 *   baseMs: 1000,
 *   strategy: 'exponential'
 * });
 * 
 * // 使用重试器执行操作
 * const result = await retry(async () => {
 *   return await fetch('/api/data');
 * });
 * ```
 */
export function createRetry(options: RetryOptions = {}) {
  // 解构配置选项，设置默认值
  const {
    retries = 3,           // 默认重试3次
    baseMs = 1000,         // 默认基础延迟1秒
    capMs = 30000,         // 默认最大延迟30秒
    strategy = 'exponential',  // 默认指数退避策略
    jitter = true,         // 默认启用抖动
    shouldRetry,           // 自定义重试条件（可选）
  } = options

  /**
   * 计算重试延迟时间
   * 根据配置的策略和当前重试次数计算下次重试的延迟时间
   * 
   * @param attemptIndex 当前重试索引（从0开始）
   * @returns 计算出的延迟时间（毫秒）
   */
  const computeDelay = (attemptIndex: number): number => {
    let rawDelay: number
    
    // 根据策略计算原始延迟时间
    if (strategy === 'fixed') {
      // 固定延迟：每次都使用基础延迟时间
      rawDelay = baseMs
    } else if (strategy === 'linear') {
      // 线性延迟：延迟时间线性增长
      // 第1次重试: baseMs * 1, 第2次: baseMs * 2, 以此类推
      rawDelay = baseMs * (attemptIndex + 1)
    } else {
      // 指数延迟：延迟时间指数增长（默认策略）
      // 第1次重试: baseMs * 2^0, 第2次: baseMs * 2^1, 第3次: baseMs * 2^2
      rawDelay = baseMs * Math.pow(2, attemptIndex)
    }
    
    // 应用最大延迟限制，防止延迟时间过长
    const capped = Math.min(rawDelay, capMs)
    
    if (jitter) {
      // 应用 Full Jitter 抖动机制
      // 将延迟时间随机化到 [0, capped] 范围内
      // 这样可以避免多个客户端在同一时间重试（雷群效应）
      return Math.floor(Math.random() * capped)
    }
    
    return capped
  }

  /**
   * 默认重试条件判断函数
   * 当用户没有提供自定义 shouldRetry 函数时使用
   * 
   * @param error 错误对象（此函数中未使用，但保持接口一致性）
   * @param attempt 当前重试次数
   * @returns 是否应该继续重试
   */
  const defaultShouldRetry = (error: unknown, attempt: number): boolean => {
    // 默认策略：只要还有剩余重试次数就继续重试
    // attempt 从 0 开始，所以当 attempt < retries 时表示还可以重试
    return attempt < retries
  }

  /**
   * 重试执行器函数
   * 这是实际执行重试逻辑的函数，支持泛型以保持类型安全
   * 
   * @template T 异步函数的返回类型
   * @param fn 需要重试执行的异步函数
   * @returns Promise<T> 执行结果的Promise
   * @throws 如果所有重试都失败，抛出最后一次的错误
   */
  return async function retryExecute<T>(fn: () => Promise<T>): Promise<T> {
    const totalAttempts = retries + 1  // 总尝试次数 = 初始执行 + 重试次数
    let lastError: unknown
    
    // 执行重试循环
    for (let attempt = 0; attempt < totalAttempts; attempt++) {
      try {
        // 尝试执行目标函数
        return await fn()
      } catch (error) {
        // 保存错误信息，用于最终抛出
        lastError = error
        
        // 判断是否应该重试
        const canRetry = (shouldRetry ?? defaultShouldRetry)(error, attempt)
        const isLastAttempt = attempt >= retries
        
        // 如果不应该重试或已是最后一次尝试，直接抛出错误
        if (!canRetry || isLastAttempt) {
          throw error
        }
        
        // 计算延迟时间并等待
        const delay = computeDelay(attempt)
        await sleep(delay)
      }
    }
    
    // 理论上不会到达这里，因为循环中已经处理了所有情况
    // 但为了类型安全，保留此行
    throw lastError
  }
}

/**
 * 便捷函数：为单个异步函数添加重试能力
 * 这是一个简化的API，适用于一次性使用的场景
 * 
 * @template T 异步函数的返回类型
 * @param fn 需要重试执行的异步函数
 * @param options 重试配置选项
 * @returns Promise<T> 执行结果的Promise
 * @throws 如果所有重试都失败，抛出最后一次的错误
 * 
 * @example
 * ```typescript
 * // 使用默认配置重试网络请求
 * const data = await withRetry(async () => {
 *   const response = await fetch('/api/users');
 *   if (!response.ok) {
 *     throw new Error(`HTTP ${response.status}`);
 *   }
 *   return response.json();
 * });
 * 
 * // 使用自定义配置
 * const result = await withRetry(
 *   async () => await riskyOperation(),
 *   {
 *     retries: 5,
 *     baseMs: 500,
 *     strategy: 'linear',
 *     shouldRetry: (error) => error.code === 'NETWORK_ERROR'
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // 创建重试器并立即执行
  const retry = createRetry(options)
  return retry(fn)
}