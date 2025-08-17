/**
 * 健康检查 API 接口
 * 提供服务健康状态监控和系统信息查询功能
 */

import { http } from '../client.js';
import type { 
  HealthResponse, 
  ServiceInfoResponse, 
  ServiceStatus 
} from './types.js';

/**
 * 健康检查 API 类
 * 封装所有健康检查相关的接口调用
 */
export class HealthAPI {
  private static readonly BASE_PATH = '/api';
  private static healthCache: { response: HealthResponse; timestamp: number } | null = null;
  private static readonly CACHE_TTL = 30 * 1000; // 30秒缓存

  /**
   * 获取基础健康检查信息
   * @param useCache 是否使用缓存，默认为 true
   * @returns Promise<HealthResponse> 健康检查响应
   * @throws HttpError 当健康检查失败时抛出错误
   * 
   * @example
   * ```typescript
   * const health = await HealthAPI.getHealth();
   * console.log('Overall status:', health.status);
   * console.log('Telemetry service:', health.services.telemetry);
   * console.log('Uptime:', health.uptime, 'seconds');
   * ```
   */
  static async getHealth(useCache: boolean = true): Promise<HealthResponse> {
    // 检查缓存
    if (useCache && this.healthCache) {
      if (Date.now() - this.healthCache.timestamp < this.CACHE_TTL) {
        return this.healthCache.response;
      }
    }

    const response = await http.get<HealthResponse>(`${this.BASE_PATH}/health`);
    
    // 更新缓存
    if (useCache) {
      this.healthCache = {
        response,
        timestamp: Date.now()
      };
    }
    
    return response;
  }

  /**
   * 获取详细健康检查信息
   * @returns Promise<any> 详细健康检查响应
   * @throws HttpError 当获取详细信息失败时抛出错误
   * 
   * @example
   * ```typescript
   * const detailedHealth = await HealthAPI.getDetailedHealth();
   * console.log('Detailed health info:', detailedHealth);
   * ```
   */
  static async getDetailedHealth(): Promise<any> {
    return http.get<any>(`${this.BASE_PATH}/health/detailed`);
  }

  /**
   * 获取服务基本信息
   * @returns Promise<ServiceInfoResponse> 服务信息响应
   * @throws HttpError 当获取服务信息失败时抛出错误
   * 
   * @example
   * ```typescript
   * const serviceInfo = await HealthAPI.getServiceInfo();
   * console.log('Service name:', serviceInfo.name);
   * console.log('Version:', serviceInfo.version);
   * console.log('Endpoints:', serviceInfo.endpoints);
   * ```
   */
  static async getServiceInfo(): Promise<ServiceInfoResponse> {
    return http.get<ServiceInfoResponse>('/');
  }

  /**
   * 检查特定服务的健康状态
   * @param serviceName 服务名称
   * @returns Promise<ServiceStatus> 服务状态
   * 
   * @example
   * ```typescript
   * const authStatus = await HealthAPI.checkServiceHealth('auth');
   * if (authStatus === 'healthy') {
   *   console.log('Auth service is healthy');
   * }
   * ```
   */
  static async checkServiceHealth(serviceName: keyof HealthResponse['services']): Promise<ServiceStatus> {
    const health = await this.getHealth();
    return health.services[serviceName];
  }

  /**
   * 检查整体服务是否健康
   * @returns Promise<boolean> 是否健康
   * 
   * @example
   * ```typescript
   * const isHealthy = await HealthAPI.isHealthy();
   * if (isHealthy) {
   *   console.log('All services are healthy');
   * } else {
   *   console.log('Some services are degraded or unhealthy');
   * }
   * ```
   */
  static async isHealthy(): Promise<boolean> {
    try {
      const health = await this.getHealth();
      return health.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取服务运行时间
   * @returns Promise<number> 运行时间（秒）
   * 
   * @example
   * ```typescript
   * const uptime = await HealthAPI.getUptime();
   * console.log(`Service has been running for ${uptime} seconds`);
   * ```
   */
  static async getUptime(): Promise<number> {
    const health = await this.getHealth();
    return health.uptime;
  }

  /**
   * 获取所有不健康的服务
   * @returns Promise<string[]> 不健康的服务名称数组
   * 
   * @example
   * ```typescript
   * const unhealthyServices = await HealthAPI.getUnhealthyServices();
   * if (unhealthyServices.length > 0) {
   *   console.log('Unhealthy services:', unhealthyServices);
   * }
   * ```
   */
  static async getUnhealthyServices(): Promise<string[]> {
    const health = await this.getHealth();
    const unhealthyServices: string[] = [];

    Object.entries(health.services).forEach(([serviceName, status]) => {
      if (status !== 'healthy') {
        unhealthyServices.push(serviceName);
      }
    });

    return unhealthyServices;
  }

  /**
   * 等待服务变为健康状态
   * @param options 等待选项
   * @returns Promise<HealthResponse> 健康检查响应
   * @throws Error 当超时或服务仍不健康时抛出错误
   * 
   * @example
   * ```typescript
   * try {
   *   const health = await HealthAPI.waitForHealthy({
   *     timeout: 30000,    // 30秒超时
   *     interval: 2000,    // 每2秒检查一次
   *     requiredServices: ['telemetry', 'auth']
   *   });
   *   console.log('Services are now healthy!');
   * } catch (error) {
   *   console.error('Services did not become healthy within timeout');
   * }
   * ```
   */
  static async waitForHealthy(options: {
    /** 超时时间（毫秒），默认30秒 */
    timeout?: number;
    /** 检查间隔（毫秒），默认2秒 */
    interval?: number;
    /** 必须健康的服务列表，如果不指定则要求所有服务健康 */
    requiredServices?: (keyof HealthResponse['services'])[];
  } = {}): Promise<HealthResponse> {
    const {
      timeout = 30000,
      interval = 2000,
      requiredServices
    } = options;

    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const health = await this.getHealth(false); // 不使用缓存
        
        // 检查指定服务或所有服务是否健康
        const servicesToCheck = requiredServices || Object.keys(health.services) as (keyof HealthResponse['services'])[];
        const allHealthy = servicesToCheck.every(service => health.services[service] === 'healthy');
        
        if (allHealthy) {
          return health;
        }
      } catch (error) {
        // 健康检查失败，继续等待
      }
      
      // 等待指定间隔
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Services did not become healthy within ${timeout}ms`);
  }

  /**
   * 清理健康检查缓存
   */
  static clearCache(): void {
    this.healthCache = null;
  }

  /**
   * 获取缓存状态
   * @returns 缓存信息
   */
  static getCacheInfo(): { cached: boolean; age?: number } {
    if (!this.healthCache) {
      return { cached: false };
    }
    
    return {
      cached: true,
      age: Date.now() - this.healthCache.timestamp
    };
  }
}

/**
 * 健康监控器
 * 提供持续的健康状态监控和告警功能
 */
export class HealthMonitor {
  private timer: number | null = null;
  private isRunning = false;
  private lastHealthStatus: ServiceStatus | null = null;

  /**
   * 构造函数
   * @param options 监控配置选项
   */
  constructor(
    private options: {
      /** 检查间隔（毫秒），默认30秒 */
      interval?: number;
      /** 健康状态变化回调 */
      onStatusChange?: (status: ServiceStatus, health: HealthResponse) => void;
      /** 服务变为不健康时的回调 */
      onUnhealthy?: (unhealthyServices: string[], health: HealthResponse) => void;
      /** 服务恢复健康时的回调 */
      onRecovered?: (health: HealthResponse) => void;
      /** 检查失败时的回调 */
      onError?: (error: any) => void;
    } = {}
  ) {
    const { interval = 30000 } = options;
    this.options = { ...options, interval };
  }

  /**
   * 开始监控
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.scheduleNext();
  }

  /**
   * 停止监控
   */
  stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * 执行一次健康检查
   * @returns Promise<void>
   */
  async check(): Promise<void> {
    try {
      const health = await HealthAPI.getHealth(false); // 不使用缓存
      const currentStatus = health.status;

      // 检查状态是否发生变化
      if (this.lastHealthStatus !== currentStatus) {
        this.options.onStatusChange?.(currentStatus, health);
        
        if (currentStatus === 'unhealthy' || currentStatus === 'degraded') {
          const unhealthyServices = await HealthAPI.getUnhealthyServices();
          this.options.onUnhealthy?.(unhealthyServices, health);
        } else if (currentStatus === 'healthy' && this.lastHealthStatus !== 'healthy') {
          this.options.onRecovered?.(health);
        }
        
        this.lastHealthStatus = currentStatus;
      }
    } catch (error) {
      this.options.onError?.(error);
    }
  }

  /**
   * 检查是否正在运行
   * @returns boolean 是否正在运行
   */
  isMonitoring(): boolean {
    return this.isRunning;
  }

  /**
   * 调度下次检查
   */
  private scheduleNext(): void {
    if (!this.isRunning) return;

    this.timer = setTimeout(async () => {
      await this.check();
      this.scheduleNext();
    }, this.options.interval);
  }
}

// 默认导出
export default HealthAPI;
