/**
 * SDK 管理器
 * 负责整个SDK的初始化、配置获取、认证管理等核心功能
 * 自动与后端API集成，用户无需直接调用API
 */

// 使用动态导入避免循环依赖
// import { initHttp, http, AuthAPI, ConfigAPI, HealthAPI, type SDKConfig } from '@platform/sdk-http';
import { generateId, sleep } from './utils.js';

// 临时类型定义
interface SDKConfig {
  features?: {
    telemetry?: boolean;
    performance?: boolean;
    realtime?: boolean;
  };
  endpoints?: {
    api?: string;
    realtime?: string;
    telemetry?: string;
  };
  limits?: {
    maxRequestsPerMinute?: number;
    maxEventBatchSize?: number;
  };
}

/**
 * SDK 初始化选项
 */
export interface SDKInitOptions {
  /** API 基础地址 */
  apiBaseURL: string;
  /** 应用名称 */
  app: string;
  /** 应用版本 */
  release: string;
  /** SDK 版本 */
  sdkVersion?: string;
  /** 用户认证信息（可选） */
  auth?: {
    username: string;
    password: string;
  };
  /** 设备指纹（可选） */
  fingerprint?: string;
  /** 是否自动获取配置，默认 true */
  autoConfig?: boolean;
  /** 是否启用健康监控，默认 false */
  enableHealthMonitoring?: boolean;
  /** 健康监控间隔（毫秒），默认 30000 */
  healthCheckInterval?: number;
  /** 调试模式，默认 false */
  debug?: boolean;
}

/**
 * SDK 状态
 */
export type SDKStatus = 'uninitialized' | 'initializing' | 'ready' | 'error';

/**
 * SDK 状态变化监听器
 */
export type SDKStatusListener = (status: SDKStatus, error?: Error) => void;

/**
 * SDK 管理器类
 * 单例模式，管理整个SDK的生命周期
 */
export class SDKManager {
  private static instance: SDKManager | null = null;
  private status: SDKStatus = 'uninitialized';
  private config: SDKConfig | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private options: SDKInitOptions | null = null;
  private statusListeners = new Set<SDKStatusListener>();
  private healthCheckTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  /**
   * 获取SDK管理器单例
   */
  static getInstance(): SDKManager {
    if (!this.instance) {
      this.instance = new SDKManager();
    }
    return this.instance;
  }

  /**
   * 初始化SDK
   * @param options 初始化选项
   * @returns Promise<SDKConfig> SDK配置
   */
  async init(options: SDKInitOptions): Promise<SDKConfig> {
    if (this.status === 'initializing') {
      throw new Error('SDK is already initializing');
    }

    if (this.status === 'ready') {
      if (options.debug) {
        console.warn('SDK is already initialized');
      }
      return this.config!;
    }

    this.status = 'initializing';
    this.options = { ...options };
    this.emitStatusChange();

    try {
      // TODO: 初始化HTTP客户端 (避免循环依赖，后续版本实现)
      // const { initHttp } = await import('@platform/sdk-http');
      // initHttp({
      //   baseURL: options.apiBaseURL,
      //   timeout: 10000,
      //   retry: {
      //     retries: 3,
      //     baseMs: 1000,
      //     capMs: 30000
      //   }
      // });

      // 2. 如果提供了认证信息，先进行登录
      if (options.auth) {
        await this.performLogin(options.auth.username, options.auth.password);
      }

      // 3. 获取SDK配置（如果启用自动配置）
      if (options.autoConfig !== false) {
        this.config = await this.fetchConfig();
      } else {
        // 使用默认配置
        this.config = this.getDefaultConfig();
      }

      // 4. 启动健康监控（如果启用）
      if (options.enableHealthMonitoring) {
        this.startHealthMonitoring();
      }

      this.status = 'ready';
      this.emitStatusChange();

      if (options.debug) {
        console.log('SDK initialized successfully', {
          app: options.app,
          release: options.release,
          config: this.config
        });
      }

      return this.config;
    } catch (error) {
      this.status = 'error';
      this.emitStatusChange(error as Error);
      throw error;
    }
  }

  /**
   * 获取当前SDK状态
   */
  getStatus(): SDKStatus {
    return this.status;
  }

  /**
   * 获取当前SDK配置
   */
  getConfig(): SDKConfig | null {
    return this.config;
  }

  /**
   * 获取当前访问令牌（自动刷新）
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.accessToken) {
      return null;
    }

    // 检查令牌是否即将过期（提前5分钟刷新）
    if (this.isTokenExpiringSoon(5 * 60 * 1000)) {
      await this.refreshAccessToken();
    }

    return this.accessToken;
  }

  /**
   * 检查用户是否已登录
   */
  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.refreshToken;
  }

  /**
   * 用户登录
   */
  async login(username: string, password: string): Promise<void> {
    await this.performLogin(username, password);
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    if (!this.accessToken || !this.refreshToken) {
      return;
    }

    try {
      // TODO: 动态导入避免循环依赖
      // const { AuthAPI } = await import('@platform/sdk-http');
      // await AuthAPI.logout(this.accessToken, {
      //   refreshToken: this.refreshToken
      // });
    } catch (error) {
      // 登出失败也要清理本地令牌
      if (this.options?.debug) {
        console.warn('Logout API failed, but clearing local tokens', error);
      }
    }

    this.clearTokens();
  }

  /**
   * 刷新SDK配置
   */
  async refreshConfig(): Promise<SDKConfig> {
    if (!this.options) {
      throw new Error('SDK not initialized');
    }

    this.config = await this.fetchConfig();
    
    if (this.options.debug) {
      console.log('SDK configuration refreshed', this.config);
    }

    return this.config;
  }

  /**
   * 监听SDK状态变化
   */
  onStatusChange(listener: SDKStatusListener): () => void {
    this.statusListeners.add(listener);
    // 立即通知当前状态
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  /**
   * 销毁SDK
   */
  destroy(): void {
    this.stopHealthMonitoring();
    this.clearTokens();
    this.statusListeners.clear();
    this.status = 'uninitialized';
    this.config = null;
    this.options = null;
  }

  /**
   * 获取SDK统计信息
   */
  getStats(): {
    status: SDKStatus;
    isAuthenticated: boolean;
    configLoaded: boolean;
    app?: string;
    release?: string;
    apiBaseURL?: string;
  } {
    return {
      status: this.status,
      isAuthenticated: this.isAuthenticated(),
      configLoaded: !!this.config,
      app: this.options?.app,
      release: this.options?.release,
      apiBaseURL: this.options?.apiBaseURL
    };
  }

  // ============ 私有方法 ============

  /**
   * 执行登录
   */
  private async performLogin(username: string, password: string): Promise<void> {
    // TODO: 动态导入避免循环依赖
    // const { AuthAPI } = await import('@platform/sdk-http');
    // const response = await AuthAPI.login({
      username,
      password,
      fingerprint: this.options?.fingerprint
    });

    this.accessToken = response.accessToken;
    this.refreshToken = response.refreshToken;
    this.tokenExpiresAt = Date.now() + (response.expiresIn * 1000);

    if (this.options?.debug) {
      console.log('User logged in successfully', {
        user: response.user,
        expiresIn: response.expiresIn
      });
    }
  }

  /**
   * 获取SDK配置
   */
  private async fetchConfig(): Promise<SDKConfig> {
    if (!this.options) {
      throw new Error('SDK options not available');
    }

    try {
      return await ConfigAPI.getConfigWithHeaders(
        this.options.app,
        this.options.release,
        this.options.sdkVersion
      );
    } catch (error) {
      if (this.options.debug) {
        console.warn('Failed to fetch remote config, using default', error);
      }
      // 如果获取远程配置失败，使用默认配置
      return this.getDefaultConfig();
    }
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): SDKConfig {
    const appType = this.options?.app || 'user';
    return ConfigAPI.getDefaultConfig(appType);
  }

  /**
   * 刷新访问令牌
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await AuthAPI.refresh({
        refreshToken: this.refreshToken,
        fingerprint: this.options?.fingerprint
      });

      this.accessToken = response.accessToken;
      this.tokenExpiresAt = Date.now() + (response.expiresIn * 1000);

      if (this.options?.debug) {
        console.log('Access token refreshed successfully');
      }
    } catch (error) {
      // 刷新失败，清理令牌
      this.clearTokens();
      throw error;
    }
  }

  /**
   * 检查令牌是否即将过期
   */
  private isTokenExpiringSoon(thresholdMs: number = 5 * 60 * 1000): boolean {
    if (!this.tokenExpiresAt) return true;
    return Date.now() + thresholdMs >= this.tokenExpiresAt;
  }

  /**
   * 清理令牌信息
   */
  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
  }

  /**
   * 启动健康监控
   */
  private startHealthMonitoring(): void {
    const interval = this.options?.healthCheckInterval || 30000;
    
    this.healthCheckTimer = setInterval(async () => {
      try {
        const health = await HealthAPI.getHealth(false); // 不使用缓存
        
        if (this.options?.debug && health.status !== 'healthy') {
          console.warn('Health check warning:', health);
        }
      } catch (error) {
        if (this.options?.debug) {
          console.error('Health check failed:', error);
        }
      }
    }, interval);
  }

  /**
   * 停止健康监控
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * 触发状态变化事件
   */
  private emitStatusChange(error?: Error): void {
    for (const listener of this.statusListeners) {
      try {
        listener(this.status, error);
      } catch (e) {
        // 忽略监听器错误
      }
    }
  }
}

// 导出单例实例
export const sdkManager = SDKManager.getInstance();
