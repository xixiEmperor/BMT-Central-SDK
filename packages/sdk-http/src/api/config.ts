/**
 * SDK 配置 API 接口
 * 提供动态配置获取和更新功能
 */

import { http } from '../client.js';
import type { SDKConfig, ConfigParams, BaseResponse } from './types.js';

/**
 * 配置 API 类
 * 封装所有 SDK 配置相关的接口调用
 */
export class ConfigAPI {
  private static readonly BASE_PATH = '/api/sdk';
  private static configCache: { [key: string]: { config: SDKConfig; timestamp: number } } = {};
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 获取 SDK 配置
   * @param params 配置请求参数
   * @param useCache 是否使用缓存，默认为 true
   * @returns Promise<SDKConfig> SDK配置对象
   * @throws HttpError 当获取配置失败时抛出错误
   * 
   * @example
   * ```typescript
   * // 方式1：通过查询参数
   * const config = await ConfigAPI.getConfig({
   *   app: 'my-app',
   *   release: '1.0.0'
   * });
   * 
   * // 方式2：通过请求头（推荐）
   * const config = await ConfigAPI.getConfigWithHeaders('my-app', '1.0.0');
   * ```
   */
  static async getConfig(params: ConfigParams = {}, useCache: boolean = true): Promise<SDKConfig> {
    const cacheKey = this.buildCacheKey(params);
    
    // 检查缓存
    if (useCache && this.configCache[cacheKey]) {
      const cached = this.configCache[cacheKey];
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.config;
      }
    }

    // 构建查询参数
    const searchParams = new URLSearchParams();
    if (params.app) searchParams.append('app', params.app);
    if (params.release) searchParams.append('release', params.release);
    
    const url = `${this.BASE_PATH}/config${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const config = await http.get<SDKConfig>(url);
    
    // 更新缓存
    if (useCache) {
      this.configCache[cacheKey] = {
        config,
        timestamp: Date.now()
      };
    }
    
    return config;
  }

  /**
   * 通过请求头获取 SDK 配置（推荐方式）
   * @param app 应用名称
   * @param release 版本号
   * @param sdkVersion SDK版本
   * @param useCache 是否使用缓存，默认为 true
   * @returns Promise<SDKConfig> SDK配置对象
   * 
   * @example
   * ```typescript
   * const config = await ConfigAPI.getConfigWithHeaders(
   *   'my-app',
   *   '1.0.0',
   *   '2.1.0'
   * );
   * 
   * console.log('Telemetry enabled:', config.telemetry.enabled);
   * console.log('Sample rate:', config.telemetry.sampleRate);
   * ```
   */
  static async getConfigWithHeaders(
    app: string,
    release: string,
    sdkVersion?: string,
    useCache: boolean = true
  ): Promise<SDKConfig> {
    const headers: Record<string, string> = {
      'X-SDK-App': app,
      'X-SDK-Release': release
    };
    
    if (sdkVersion) {
      headers['X-SDK-Version'] = sdkVersion;
    }

    const cacheKey = this.buildCacheKey({ app, release });
    
    // 检查缓存
    if (useCache && this.configCache[cacheKey]) {
      const cached = this.configCache[cacheKey];
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.config;
      }
    }

    const config = await http.get<SDKConfig>(`${this.BASE_PATH}/config`, { headers });
    
    // 更新缓存
    if (useCache) {
      this.configCache[cacheKey] = {
        config,
        timestamp: Date.now()
      };
    }
    
    return config;
  }

  /**
   * 更新 SDK 配置（需要管理员权限）
   * @param accessToken 访问令牌
   * @param config 要更新的配置
   * @param app 应用名称（可选）
   * @returns Promise<BaseResponse> 更新结果
   * @throws HttpError 当更新失败时抛出错误
   * 
   * @example
   * ```typescript
   * const response = await ConfigAPI.updateConfig('admin_token', {
   *   telemetry: {
   *     enabled: true,
   *     sampleRate: 0.1,
   *     batchSize: 50
   *     // ... 其他配置
   *   }
   * }, 'my-app');
   * ```
   */
  static async updateConfig(
    accessToken: string,
    config: Partial<SDKConfig>,
    app?: string
  ): Promise<BaseResponse> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`
    };
    
    if (app) {
      headers['X-SDK-App'] = app;
    }

    const response = await http.post<BaseResponse>(`${this.BASE_PATH}/config`, config, { headers });
    
    // 清理相关缓存
    if (app) {
      this.clearCacheForApp(app);
    } else {
      this.clearAllCache();
    }
    
    return response;
  }

  /**
   * 获取应用的默认配置
   * @param appType 应用类型 ('admin' | 'user' | 'mobile' 等)
   * @returns SDKConfig 默认配置对象
   * 
   * @example
   * ```typescript
   * const adminConfig = ConfigAPI.getDefaultConfig('admin');
   * const userConfig = ConfigAPI.getDefaultConfig('user');
   * ```
   */
  static getDefaultConfig(appType: string = 'user'): SDKConfig {
    const baseConfig: SDKConfig = {
      telemetry: {
        enabled: true,
        endpoint: '/v1/telemetry/ingest',
        sampleRate: 0.1,
        batchSize: 50,
        flushInterval: 5000,
        maxEventSize: 10240, // 10KB
        maxBatchEvents: 200
      },
      performance: {
        enabled: true,
        sampleRate: 0.05,
        webVitals: true,
        endpoint: '/v1/telemetry/perf'
      },
      realtime: {
        enabled: true,
        url: 'ws://localhost:5000',
        heartbeatInterval: 30000,
        reconnectDelay: 1000,
        maxReconnectAttempts: 5,
        namespace: '/'
      },
      features: {
        errorReporting: true,
        performanceMonitoring: true,
        realtimeUpdates: true,
        advancedAnalytics: false,
        debugMode: false
      },
      rateLimit: {
        telemetry: 1000,
        auth: 60,
        windowMs: 60000
      },
      debug: false
    };

    // 根据应用类型调整配置
    switch (appType) {
      case 'admin':
        return {
          ...baseConfig,
          telemetry: { ...baseConfig.telemetry, sampleRate: 1.0 },
          performance: { ...baseConfig.performance, sampleRate: 0.5 },
          features: {
            ...baseConfig.features,
            advancedAnalytics: true,
            debugMode: true
          },
          debug: true
        };
      
      case 'mobile':
        return {
          ...baseConfig,
          telemetry: { ...baseConfig.telemetry, sampleRate: 0.05 },
          performance: { ...baseConfig.performance, enabled: false, sampleRate: 0.01 },
          features: {
            ...baseConfig.features,
            performanceMonitoring: false,
            realtimeUpdates: false
          }
        };
      
      case 'user':
      default:
        return baseConfig;
    }
  }

  /**
   * 验证配置对象的有效性
   * @param config 要验证的配置对象
   * @returns { valid: boolean; errors: string[] } 验证结果
   * 
   * @example
   * ```typescript
   * const validation = ConfigAPI.validateConfig(config);
   * if (!validation.valid) {
   *   console.error('Config validation errors:', validation.errors);
   * }
   * ```
   */
  static validateConfig(config: Partial<SDKConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证遥测配置
    if (config.telemetry) {
      const { sampleRate, batchSize, flushInterval, maxEventSize, maxBatchEvents } = config.telemetry;
      
      if (sampleRate !== undefined && (sampleRate < 0 || sampleRate > 1)) {
        errors.push('telemetry.sampleRate must be between 0 and 1');
      }
      
      if (batchSize !== undefined && (batchSize < 1 || batchSize > 200)) {
        errors.push('telemetry.batchSize must be between 1 and 200');
      }
      
      if (flushInterval !== undefined && flushInterval < 1000) {
        errors.push('telemetry.flushInterval must be at least 1000ms');
      }
      
      if (maxEventSize !== undefined && maxEventSize < 1024) {
        errors.push('telemetry.maxEventSize must be at least 1024 bytes');
      }
      
      if (maxBatchEvents !== undefined && (maxBatchEvents < 1 || maxBatchEvents > 200)) {
        errors.push('telemetry.maxBatchEvents must be between 1 and 200');
      }
    }

    // 验证性能配置
    if (config.performance) {
      const { sampleRate } = config.performance;
      
      if (sampleRate !== undefined && (sampleRate < 0 || sampleRate > 1)) {
        errors.push('performance.sampleRate must be between 0 and 1');
      }
    }

    // 验证实时通信配置
    if (config.realtime) {
      const { heartbeatInterval, reconnectDelay, maxReconnectAttempts } = config.realtime;
      
      if (heartbeatInterval !== undefined && heartbeatInterval < 5000) {
        errors.push('realtime.heartbeatInterval must be at least 5000ms');
      }
      
      if (reconnectDelay !== undefined && reconnectDelay < 100) {
        errors.push('realtime.reconnectDelay must be at least 100ms');
      }
      
      if (maxReconnectAttempts !== undefined && maxReconnectAttempts < 1) {
        errors.push('realtime.maxReconnectAttempts must be at least 1');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 构建缓存键
   * @param params 配置参数
   * @returns string 缓存键
   */
  private static buildCacheKey(params: ConfigParams): string {
    const { app = 'default', release = 'latest' } = params;
    return `${app}:${release}`;
  }

  /**
   * 清理指定应用的缓存
   * @param app 应用名称
   */
  private static clearCacheForApp(app: string): void {
    const keys = Object.keys(this.configCache);
    keys.forEach(key => {
      if (key.startsWith(`${app}:`)) {
        delete this.configCache[key];
      }
    });
  }

  /**
   * 清理所有缓存
   */
  private static clearAllCache(): void {
    this.configCache = {};
  }

  /**
   * 获取缓存统计信息
   * @returns 缓存统计信息
   */
  static getCacheStats(): { totalEntries: number; oldestEntry?: number; newestEntry?: number } {
    const entries = Object.values(this.configCache);
    if (entries.length === 0) {
      return { totalEntries: 0 };
    }

    const timestamps = entries.map(entry => entry.timestamp);
    return {
      totalEntries: entries.length,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps)
    };
  }
}

// 默认导出
export default ConfigAPI;
