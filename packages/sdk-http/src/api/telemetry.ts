/**
 * 遥测数据上报 API 接口
 * 提供批量事件上报、性能数据上报和统计查询功能
 */

import { http } from '../client.js';
import type {
  TelemetryEvent,
  TelemetryBatch,
  TelemetryResponse,
  TelemetryStatsResponse,
  TelemetryEventType
} from './types.js';

/**
 * 遥测 API 类
 * 封装所有遥测数据相关的接口调用
 */
export class TelemetryAPI {
  private static readonly BASE_PATH = '/v1/telemetry';

  /**
   * 批量上报遥测事件
   * @param events 事件数组（1-200个事件）
   * @returns Promise<TelemetryResponse> 上报结果
   * @throws HttpError 当上报失败时抛出错误
   * 
   * @example
   * ```typescript
   * const events = [
   *   {
   *     id: 'evt_' + Date.now(),
   *     type: 'page',
   *     name: '/dashboard',
   *     ts: Date.now(),
   *     app: 'my-app',
   *     release: '1.0.0',
   *     sessionId: 'sess_' + Date.now(),
   *     props: { url: '/dashboard', loadTime: 1200 }
   *   }
   * ];
   * 
   * const response = await TelemetryAPI.ingest(events);
   * console.log('Processed:', response.processed);
   * ```
   */
  static async ingest(events: TelemetryBatch): Promise<TelemetryResponse> {
    if (!Array.isArray(events) || events.length === 0) {
      throw new Error('Events array cannot be empty');
    }
    
    if (events.length > 200) {
      throw new Error('Batch size cannot exceed 200 events');
    }

    return http.post<TelemetryResponse>(`${this.BASE_PATH}/ingest`, events);
  }

  /**
   * 上报性能数据（专用接口）
   * @param perfEvents 性能事件数组，只接受 type: 'perf' 的事件
   * @returns Promise<TelemetryResponse> 上报结果
   * @throws HttpError 当上报失败时抛出错误
   * 
   * @example
   * ```typescript
   * const perfEvents = [
   *   {
   *     id: 'perf_' + Date.now(),
   *     type: 'perf',
   *     name: 'LCP',
   *     ts: Date.now(),
   *     app: 'my-app',
   *     release: '1.0.0',
   *     sessionId: 'sess_123',
   *     props: {
   *       value: 1250,
   *       rating: 'good',
   *       entryType: 'largest-contentful-paint'
   *     }
   *   }
   * ];
   * 
   * const response = await TelemetryAPI.reportPerformance(perfEvents);
   * ```
   */
  static async reportPerformance(perfEvents: TelemetryEvent[]): Promise<TelemetryResponse> {
    // 验证所有事件都是性能类型
    const invalidEvents = perfEvents.filter(event => event.type !== 'perf');
    if (invalidEvents.length > 0) {
      throw new Error('Performance endpoint only accepts events with type "perf"');
    }

    return http.post<TelemetryResponse>(`${this.BASE_PATH}/perf`, perfEvents);
  }

  /**
   * 获取遥测服务统计信息
   * @returns Promise<TelemetryStatsResponse> 统计信息
   * @throws HttpError 当获取失败时抛出错误
   * 
   * @example
   * ```typescript
   * const stats = await TelemetryAPI.getStats();
   * console.log('Total Events:', stats.data.totalEvents);
   * console.log('Buffer Size:', stats.data.bufferSize);
   * ```
   */
  static async getStats(): Promise<TelemetryStatsResponse> {
    return http.get<TelemetryStatsResponse>(`${this.BASE_PATH}/stats`);
  }

  /**
   * 创建页面浏览事件
   * @param options 页面事件选项
   * @returns TelemetryEvent 页面事件对象
   * 
   * @example
   * ```typescript
   * const pageEvent = TelemetryAPI.createPageEvent({
   *   name: '/dashboard',
   *   app: 'my-app',
   *   release: '1.0.0',
   *   sessionId: 'sess_123',
   *   props: {
   *     url: 'https://app.example.com/dashboard',
   *     title: 'Dashboard',
   *     loadTime: 1200
   *   }
   * });
   * ```
   */
  static createPageEvent(options: Omit<TelemetryEvent, 'id' | 'type' | 'ts'>): TelemetryEvent {
    return {
      id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'page',
      ts: Date.now(),
      ...options
    };
  }

  /**
   * 创建自定义事件
   * @param options 自定义事件选项
   * @returns TelemetryEvent 自定义事件对象
   * 
   * @example
   * ```typescript
   * const customEvent = TelemetryAPI.createCustomEvent({
   *   name: 'button_click',
   *   app: 'my-app',
   *   release: '1.0.0',
   *   sessionId: 'sess_123',
   *   props: {
   *     buttonId: 'save-btn',
   *     section: 'settings'
   *   }
   * });
   * ```
   */
  static createCustomEvent(options: Omit<TelemetryEvent, 'id' | 'type' | 'ts'>): TelemetryEvent {
    return {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'custom',
      ts: Date.now(),
      ...options
    };
  }

  /**
   * 创建错误事件
   * @param options 错误事件选项
   * @returns TelemetryEvent 错误事件对象
   * 
   * @example
   * ```typescript
   * const errorEvent = TelemetryAPI.createErrorEvent({
   *   name: 'javascript_error',
   *   app: 'my-app',
   *   release: '1.0.0',
   *   sessionId: 'sess_123',
   *   props: {
   *     message: 'TypeError: Cannot read property...',
   *     stack: 'TypeError: Cannot read property...\n    at...',
   *     filename: 'app.js',
   *     lineno: 123,
   *     severity: 'error'
   *   }
   * });
   * ```
   */
  static createErrorEvent(options: Omit<TelemetryEvent, 'id' | 'type' | 'ts'>): TelemetryEvent {
    return {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'error',
      ts: Date.now(),
      ...options
    };
  }

  /**
   * 创建API调用事件
   * @param options API事件选项
   * @returns TelemetryEvent API事件对象
   * 
   * @example
   * ```typescript
   * const apiEvent = TelemetryAPI.createApiEvent({
   *   name: '/api/users',
   *   app: 'my-app',
   *   release: '1.0.0',
   *   sessionId: 'sess_123',
   *   props: {
   *     method: 'POST',
   *     url: 'https://api.example.com/users',
   *     status: 200,
   *     duration: 350,
   *     success: true
   *   }
   * });
   * ```
   */
  static createApiEvent(options: Omit<TelemetryEvent, 'id' | 'type' | 'ts'>): TelemetryEvent {
    return {
      id: `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'api',
      ts: Date.now(),
      ...options
    };
  }

  /**
   * 创建性能事件
   * @param options 性能事件选项
   * @returns TelemetryEvent 性能事件对象
   * 
   * @example
   * ```typescript
   * const perfEvent = TelemetryAPI.createPerfEvent({
   *   name: 'LCP',
   *   app: 'my-app',
   *   release: '1.0.0',
   *   sessionId: 'sess_123',
   *   props: {
   *     value: 1250,
   *     rating: 'good',
   *     entryType: 'largest-contentful-paint'
   *   }
   * });
   * ```
   */
  static createPerfEvent(options: Omit<TelemetryEvent, 'id' | 'type' | 'ts'>): TelemetryEvent {
    return {
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'perf',
      ts: Date.now(),
      ...options
    };
  }
}

/**
 * 遥测批次管理器
 * 提供事件批量收集和自动上报功能
 */
export class TelemetryBatcher {
  private batch: TelemetryEvent[] = [];
  private timer: number | null = null;
  
  /**
   * 构造函数
   * @param options 批次配置选项
   */
  constructor(
    private options: {
      /** 批次大小限制，默认50 */
      maxBatchSize?: number;
      /** 自动刷新间隔（毫秒），默认5秒 */
      flushInterval?: number;
      /** 刷新回调函数 */
      onFlush?: (events: TelemetryEvent[]) => Promise<void>;
    } = {}
  ) {
    const {
      maxBatchSize = 50,
      flushInterval = 5000,
      onFlush
    } = options;

    this.options = { maxBatchSize, flushInterval, onFlush };
    this.startTimer();
  }

  /**
   * 添加事件到批次
   * @param event 要添加的事件
   */
  add(event: TelemetryEvent): void {
    this.batch.push(event);

    // 如果达到批次大小限制，立即刷新
    if (this.batch.length >= (this.options.maxBatchSize || 50)) {
      this.flush();
    }
  }

  /**
   * 添加多个事件到批次
   * @param events 要添加的事件数组
   */
  addBatch(events: TelemetryEvent[]): void {
    events.forEach(event => this.add(event));
  }

  /**
   * 立即刷新批次
   * @returns Promise<void>
   */
  async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    const eventsToFlush = [...this.batch];
    this.batch = [];

    try {
      if (this.options.onFlush) {
        await this.options.onFlush(eventsToFlush);
      } else {
        await TelemetryAPI.ingest(eventsToFlush);
      }
    } catch (error) {
      console.error('Failed to flush telemetry batch:', error);
      // 可以选择将失败的事件重新加入批次或存储到本地
    }
  }

  /**
   * 获取当前批次大小
   * @returns number 当前批次中的事件数量
   */
  getBatchSize(): number {
    return this.batch.length;
  }

  /**
   * 销毁批次管理器
   */
  destroy(): void {
    this.stopTimer();
    // 在销毁前尝试刷新剩余事件
    if (this.batch.length > 0) {
      this.flush();
    }
  }

  /**
   * 启动定时器
   */
  private startTimer(): void {
    if (this.options.flushInterval && this.options.flushInterval > 0) {
      this.timer = setInterval(() => {
        this.flush();
      }, this.options.flushInterval);
    }
  }

  /**
   * 停止定时器
   */
  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

// 默认导出
export default TelemetryAPI;
