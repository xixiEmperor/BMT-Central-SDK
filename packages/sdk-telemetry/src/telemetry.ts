/**
 * 遥测主入口
 * 自动与后端API集成，用户使用时会自动上报到后端
 */

import type { TelemetryEvent, TelemetryUser } from './types.js'
import type { PerfMetric } from '@wfynbzlx666/sdk-perf'
import { createTelemetryStorage, type TelemetryStorage } from './storage.js'
import { generateId, sleep } from '@platform/sdk-core'
import { TelemetryAPI } from '@platform/sdk-http'
import { sdkManager } from '@platform/sdk-core'

export interface TelemetryOptions {
  /** 应用名称 */
  app: string
  /** 版本号 */
  release: string
  /** 上报端点 */
  endpoint?: string
  /** 采样率，默认 1.0 */
  sampleRate?: number
  /** 批量上报阈值，默认 50 */
  batchSize?: number
  /** 上报间隔（毫秒），默认 5000 */
  flushInterval?: number
  /** 最大缓存数量，默认 1000 */
  maxCacheSize?: number
  /** 是否启用跨标签页去重，默认 true */
  enableDedup?: boolean
  /** 是否启用自动上报，默认 true */
  autoFlush?: boolean
  /** 上报失败时的重试次数，默认 3 */
  retryCount?: number
  /** 调试模式，默认 false */
  debug?: boolean
}

export { type TelemetryEvent }

export class Telemetry {
  private static options: TelemetryOptions | null = null
  private static user: TelemetryUser | null = null
  private static sessionId: string | null = null
  private static storage: TelemetryStorage = createTelemetryStorage()
  private static flushTimer: any = null

  /**
   * 初始化遥测
   * 会自动从SDK配置中获取遥测设置
   */
  static init(options: TelemetryOptions): void {
    this.options = {
      sampleRate: 1.0,
      batchSize: 50,
      flushInterval: 5_000,
      maxCacheSize: 1000,
      enableDedup: true,
      autoFlush: true,
      retryCount: 3,
      debug: false,
      ...options,
    }
    
    this.sessionId = this.sessionId ?? generateId()
    
    // 尝试从SDK管理器获取配置并覆盖默认设置
    this.updateFromSDKConfig()
    
    // 启动自动上报定时器
    if (this.options.autoFlush) {
      this.startAutoFlush()
    }
    
    if (this.options.debug) {
      console.log('Telemetry initialized with options:', this.options)
    }
  }

  /**
   * 设置用户信息
   */
  static setUser(user: TelemetryUser | null): void {
    this.user = user
  }

  /**
   * 跟踪页面浏览
   */
  static trackPageView(routeName: string, props?: Record<string, any>): void {
    this.enqueue({ type: 'page', name: routeName, props })
  }

  /**
   * 跟踪自定义事件
   */
  static trackEvent(name: string, props?: Record<string, any>): void {
    this.enqueue({ type: 'event', name, props })
  }

  /**
   * 跟踪错误
   */
  static trackError(name: string, message?: string, stack?: string): void {
    this.enqueue({ type: 'error', name, props: { message, stack } })
  }

  /**
   * 跟踪 API 调用
   */
  static trackApi(url: string, status: number, duration: number): void {
    this.enqueue({ type: 'api', name: url, props: { status, duration } })
  }

  /**
   * 跟踪性能指标
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
   * 从SDK配置更新遥测设置
   */
  private static updateFromSDKConfig(): void {
    // TODO: 简化版SDK Manager暂不支持配置获取，跳过配置更新
    // const config = sdkManager.getConfig()
    // if (config?.telemetry && this.options) {
    //   this.options.sampleRate = config.telemetry.sampleRate
    //   this.options.batchSize = config.telemetry.batchSize
    //   this.options.flushInterval = config.telemetry.flushInterval
    // }
  }

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
  private static convertToAPIEvent(event: TelemetryEvent): import('@platform/sdk-http').TelemetryEvent {
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
  private static applySampling(events: import('@platform/sdk-http').TelemetryEvent[]): import('@platform/sdk-http').TelemetryEvent[] {
    const sampleRate = this.options?.sampleRate ?? 1.0
    
    if (sampleRate >= 1.0) {
      return events
    }
    
    return events.filter(() => Math.random() < sampleRate)
  }

  /**
   * 降级方案：使用 sendBeacon
   */
  private static async fallbackFlush(events: import('@platform/sdk-http').TelemetryEvent[]): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('sendBeacon' in navigator)) {
      return false
    }

    try {
      // TODO: 简化版SDK Manager暂不支持配置获取
      const endpoint = '/api/telemetry'
      
      // 构建完整URL
      const baseURL = this.getBaseURL()
      const fullURL = `${baseURL}${endpoint}`
      
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
   * 获取API基础URL
   */
  private static getBaseURL(): string {
    // TODO: 从配置中获取，暂时使用默认值
    return this.options?.endpoint?.replace('/api/telemetry', '') || 'http://localhost:5000'
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

    // 如果达到批次大小，立即上报
    if (this.options.autoFlush) {
      const count = await this.storage.getCount()
      if (count >= (this.options.batchSize ?? 50)) {
        this.flush().catch(error => {
          if (this.options?.debug) {
            console.error('Immediate flush error:', error)
          }
        })
      }
    }
  }
}