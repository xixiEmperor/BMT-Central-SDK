/**
 * 遥测系统核心模块
 * 
 * 该模块是遥测SDK的主入口，提供完整的事件追踪和数据上报功能。
 * 自动与后端API集成，支持批量上报、重试机制、采样控制等高级特性。
 * 
 * 核心功能：
 * - 事件收集和本地存储
 * - 自动批量上报到后端
 * - 采样率控制，减少数据量
 * - 重试机制，确保数据可靠性
 * - 多种降级策略，提高稳定性
 * - 与SDK管理器深度集成
 * 
 * 使用模式：
 * 1. 初始化配置
 * 2. 设置用户信息
 * 3. 追踪各种事件
 * 4. 自动或手动上报数据
 */

import type { TelemetryEvent, TelemetryUser } from './types.js'
import type { PerfMetric } from '@wfynbzlx666/sdk-perf'
import { createTelemetryStorage, type TelemetryStorage } from './storage.js'
import { generateId, sleep } from '@wfynbzlx666/sdk-core'
import { TelemetryAPI } from '@wfynbzlx666/sdk-http'

/**
 * 遥测配置选项接口
 * 
 * 定义了遥测系统的所有配置参数，包括基础信息、上报策略、
 * 性能优化和调试选项等。
 */
export interface TelemetryOptions {
  /** 
   * 应用名称
   * 用于标识事件来源的应用程序
   */
  app: string
  
  /** 
   * 应用版本号
   * 用于版本间的数据对比和问题定位
   */
  release: string
  
  /** 
   * 上报端点URL
   * 可选，默认使用SDK配置中的遥测端点
   */
  endpoint?: string
  
  /** 
   * 采样率
   * 0.0-1.0之间的数值，控制事件采样比例
   * @default 1.0
   */
  sampleRate?: number
  
  /** 
   * 批量上报阈值
   * 达到此数量时立即触发上报（无论autoFlush开关状态）
   * @default 50
   */
  batchSize?: number
  
  /** 
   * 上报间隔时间（毫秒）
   * 定时上报的间隔时间
   * @default 5000
   */
  flushInterval?: number
  
  /** 
   * 最大缓存数量
   * 本地存储的事件数量上限
   * @default 1000
   */
  maxCacheSize?: number
  
  /** 
   * 是否启用跨标签页去重
   * 避免同一事件在多个标签页中重复上报
   * @default true
   */
  enableDedup?: boolean
  
  /** 
   * 是否启用定时上报
   * 控制是否启动定时器定期上报数据（不影响批量阈值触发的上报）
   * @default false
   */
  autoFlush?: boolean
  
  /** 
   * 上报失败时的重试次数
   * 网络错误或服务器错误时的重试次数
   * @default 3
   */
  retryCount?: number
  
  /** 
   * 调试模式
   * 启用详细的控制台日志输出
   * @default false
   */
  debug?: boolean
}

// 重新导出核心类型
export { type TelemetryEvent }

/**
 * 遥测系统核心类
 * 
 * 采用静态方法设计，确保全应用单例模式。提供完整的事件追踪、
 * 存储和上报功能，与后端API深度集成。
 * 
 * 主要特性：
 * - 多种事件类型支持（页面、自定义、错误、API、性能）
 * - 智能批量上报和重试机制
 * - 采样率控制和性能优化
 * - 用户会话管理
 * - 双重上报模式：批量阈值触发 + 可选定时上报
 * - 完善的错误处理和降级策略
 * 
 * @example
 * ```typescript
 * // 初始化遥测系统
 * Telemetry.init({
 *   app: 'my-app',
 *   release: '1.0.0',
 *   sampleRate: 0.1,
 *   debug: true
 * });
 * 
 * // 设置用户信息
 * Telemetry.setUser({
 *   id: 'user123',
 *   role: 'admin'
 * });
 * 
 * // 追踪事件
 * Telemetry.trackEvent('button_click', { buttonId: 'submit' });
 * Telemetry.trackPageView('/dashboard');
 * ```
 */
export class Telemetry {
  // ============ 静态属性 ============
  
  /** 遥测配置选项 */
  private static options: TelemetryOptions | null = null
  
  /** 当前用户信息 */
  private static user: TelemetryUser | null = null
  
  /** 会话唯一标识符 */
  private static sessionId: string | null = null
  
  /** 本地存储实例 */
  private static storage: TelemetryStorage = createTelemetryStorage()
  
  /** 自动上报定时器 */
  private static flushTimer: any = null

  // ============ 公共API方法 ============

  /**
   * 初始化遥测系统
   * 
   * 设置配置选项并启动遥测服务。会自动从SDK管理器获取
   * 全局配置并与传入的选项合并。
   * 
   * @param {TelemetryOptions} options 遥测配置选项
   * 
   * @example
   * ```typescript
   * Telemetry.init({
   *   app: 'my-application',
   *   release: '2.1.0',
   *   sampleRate: 0.8,
   *   batchSize: 100,
   *   autoFlush: true,
   *   debug: process.env.NODE_ENV === 'development'
   * });
   * ```
   */
  static init(options: TelemetryOptions): void {
    // 设置默认配置值
    this.options = {
      endpoint: 'http://localhost:5000',
      sampleRate: 1.0,        // 默认100%采样
      batchSize: 50,          // 默认批次大小50
      flushInterval: 5_000,   // 默认5秒上报间隔
      maxCacheSize: 1000,     // 默认最大缓存1000条
      enableDedup: true,      // 默认启用去重
      autoFlush: false,        // 默认自动上报
      retryCount: 3,          // 默认重试3次
      debug: false,           // 默认关闭调试
      ...options,             // 用户配置覆盖默认值
    }
    
    // 生成或保持会话ID
    this.sessionId = this.sessionId ?? generateId()
    
    // 启动自动上报定时器
    if (this.options.autoFlush) {
      this.startAutoFlush()
    }
    
    // 调试模式下输出初始化信息
    if (this.options.debug) {
      console.log('Telemetry initialized with options:', this.options)
    }
  }

  /**
   * 设置当前用户信息
   * 
   * 设置或更新当前用户的信息，这些信息会被自动添加到
   * 后续的所有遥测事件中，用于用户行为分析。
   * 
   * @param {TelemetryUser | null} user 用户信息对象，传入null清除用户信息
   * 
   * @example
   * ```typescript
   * // 设置用户信息
   * Telemetry.setUser({
   *   id: 'user_12345',
   *   role: 'premium',
   *   email: 'user@example.com',
   *   plan: 'pro'
   * });
   * 
   * // 清除用户信息（如用户登出）
   * Telemetry.setUser(null);
   * ```
   */
  static setUser(user: TelemetryUser | null): void {
    this.user = user
  }

  /**
   * 追踪页面浏览事件
   * 
   * 记录用户访问页面的行为，自动获取页面URL、标题等信息。
   * 
   * @param {string} routeName 页面路由名称或标识
   * @param {Record<string, any>} [props] 额外的页面相关属性
   */
  static trackPageView(routeName: string, props?: Record<string, any>): void {
    this.enqueue({ type: 'page', name: routeName, props })
  }

  /**
   * 追踪自定义事件
   * 
   * 记录应用中的用户行为和业务事件。
   * 
   * @param {string} name 事件名称
   * @param {Record<string, any>} [props] 事件相关属性
   */
  static trackEvent(name: string, props?: Record<string, any>): void {
    this.enqueue({ type: 'event', name, props })
  }

  /**
   * 追踪错误事件
   * 
   * 记录应用中发生的错误和异常。
   * 
   * @param {string} name 错误名称或类型
   * @param {string} [message] 错误消息
   * @param {string} [stack] 错误堆栈
   */
  static trackError(name: string, message?: string, stack?: string): void {
    this.enqueue({ type: 'error', name, props: { message, stack } })
  }

  /**
   * 追踪API调用事件
   * 
   * 记录API调用的性能和状态信息。
   * 
   * @param {string} url API地址
   * @param {number} status HTTP状态码
   * @param {number} duration 耗时（毫秒）
   */
  static trackApi(url: string, status: number, duration: number): void {
    this.enqueue({ type: 'api', name: url, props: { status, duration } })
  }

  /**
   * 追踪性能指标
   * 
   * 记录应用性能指标，通常与sdk-perf模块集成使用。
   * 
   * @param {PerfMetric} metric 性能指标对象
   */
  static trackPerf(metric: PerfMetric): void {
    this.enqueue({ type: 'perf', name: metric.name, props: { value: metric.value, rating: metric.rating } })
  }

  /**
   * 强制上报
   * 自动调用后端API进行数据上报
   */
  static async flush(): Promise<void> {
    if (!this.options) return

    const batchSize = this.options.batchSize ?? 50
    const retryCount = this.options.retryCount ?? 3
    
    try {
      const batch = await this.storage.getBatch(batchSize)
      if (batch.length === 0) return

      if (this.options.debug) {
        console.log(`Flushing ${batch.length} telemetry events`)
      }

      // 转换为API格式的事件
      const apiEvents = batch.map(event => this.convertToAPIEvent(event))
      
      // 应用采样率
      const sampledEvents = this.applySampling(apiEvents)
      if (sampledEvents.length === 0) {
        // 即使被采样掉也要从存储中移除
        await this.storage.remove(batch.map(b => b.id!).filter(Boolean))
        return
      }

      // 尝试上报到后端API
      let success = false
      let lastError: Error | null = null

      for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
          const response = await TelemetryAPI.ingest(sampledEvents)
          
          if (this.options.debug) {
            console.log('Telemetry flush successful:', response)
          }
          
          success = true
          break
        } catch (error) {
          lastError = error as Error
          
          if (this.options.debug) {
            console.warn(`Telemetry flush attempt ${attempt} failed:`, error)
          }
          
          // 如果不是最后一次尝试，等待后重试
          if (attempt < retryCount) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
            await sleep(delay)
          }
        }
      }

      if (success) {
        // 上报成功，从本地存储中移除
        await this.storage.remove(batch.map(b => b.id!).filter(Boolean))
      } else {
        // 所有重试都失败了，尝试使用 sendBeacon 作为降级方案
        const fallbackSuccess = await this.fallbackFlush(sampledEvents)
        
        if (fallbackSuccess) {
          await this.storage.remove(batch.map(b => b.id!).filter(Boolean))
        } else {
          // 连降级方案都失败了，保留数据等待下次上报
          if (this.options.debug) {
            console.error('All telemetry flush attempts failed:', lastError)
          }
        }
      }
    } catch (error) {
      if (this.options.debug) {
        console.error('Telemetry flush error:', error)
      }
    }
  }

  /**
   * 获取队列状态
   */
  static async getQueueStatus(): Promise<{ pending: number; failed: number }> {
    if (!this.options) return { pending: 0, failed: 0 }
    try {
      const pending = await this.storage.getCount()
      return { pending, failed: 0 }
    } catch {
      return { pending: 0, failed: 0 }
    }
  }

  /**
   * 检查是否已初始化
   */
  static isInitialized(): boolean {
    return this.options !== null
  }

  // ============ 私有方法 ============
  /**
   * 启动自动上报定时器
   */
  private static startAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    
    this.flushTimer = setInterval(() => {
      this.flush().catch(error => {
        if (this.options?.debug) {
          console.error('Auto flush error:', error)
        }
      })
    }, this.options?.flushInterval ?? 5000)
  }

  /**
   * 停止自动上报定时器
   */
  private static stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
  }

  /**
   * 转换为API格式的事件
   */
  private static convertToAPIEvent(event: TelemetryEvent): import('@wfynbzlx666/sdk-http').TelemetryEvent {
    return {
      id: event.id!,
      type: event.type as any,
      name: event.name,
      ts: event.ts,
      app: event.app,
      release: event.release,
      sessionId: event.sessionId || 'default-session',
      user: event.user ? {
        id: String(event.user.id || 'anonymous'),
        email: event.user.email,
        name: event.user.name,
        role: event.user.role || 'user',
        attrs: event.user.attrs
      } : undefined,
      props: event.props
    }
  }

  /**
   * 应用采样率
   */
  private static applySampling(events: import('@wfynbzlx666/sdk-http').TelemetryEvent[]): import('@wfynbzlx666/sdk-http').TelemetryEvent[] {
    const sampleRate = this.options?.sampleRate ?? 1.0
    
    if (sampleRate >= 1.0) {
      return events
    }
    
    return events.filter(() => Math.random() < sampleRate)
  }

  /**
   * 降级方案：使用 sendBeacon
   */
  private static async fallbackFlush(events: import('@wfynbzlx666/sdk-http').TelemetryEvent[]): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('sendBeacon' in navigator)) {
      return false
    }

    try {
      const fullURL = `${this.options?.endpoint}/v1/telemetry/ingest`
      
      const body = JSON.stringify(events)
      const blob = new Blob([body], { type: 'application/json' })
      
      const success = (navigator as any).sendBeacon(fullURL, blob)
      
      if (this.options?.debug) {
        console.log(`Fallback sendBeacon ${success ? 'succeeded' : 'failed'}`)
      }
      
      return success
    } catch (error) {
      if (this.options?.debug) {
        console.error('Fallback flush error:', error)
      }
      return false
    }
  }

  /**
   * 入队事件
   */
  private static async enqueue(partial: Omit<TelemetryEvent, 'app' | 'release' | 'ts' | 'id' | 'sessionId'> & { props?: Record<string, any> }) {
    if (!this.options) return
    
    const event: TelemetryEvent = {
      ...(partial as any),
      app: this.options.app,
      release: this.options.release,
      ts: Date.now(),
      id: generateId(),
      sessionId: this.sessionId ?? generateId(),
      user: this.user ?? undefined,
    }
    
    await this.storage.add(event)

    // 检查是否达到批次大小，达到则立即上报（与autoFlush无关）
    const count = await this.storage.getCount()
    if (count >= (this.options.batchSize ?? 50)) {
      this.flush().catch(error => {
        if (this.options?.debug) {
          console.error('Batch size flush error:', error)
        }
      })
    }
  }
}