/**
 * 简化版 SDK 管理器
 * 避免循环依赖，提供基础的SDK管理功能
 */

import { generateId } from './utils.js';

/**
 * SDK 初始化选项
 */
export interface SDKInitOptions {
  /** 应用名称 */
  name: string;
  /** 应用版本 */
  version: string;
  /** 环境 */
  environment?: 'development' | 'staging' | 'production';
  /** 启用开发工具 */
  enableDevtools?: boolean;
}

/**
 * SDK 状态
 */
export type SDKStatus = 'idle' | 'initializing' | 'ready' | 'error' | 'destroyed';

/**
 * SDK 状态变化监听器
 */
export type SDKStatusListener = (status: SDKStatus, prevStatus: SDKStatus) => void;

/**
 * SDK 管理器类
 */
class SDKManager {
  private status: SDKStatus = 'idle';
  private options: SDKInitOptions | null = null;
  private listeners: SDKStatusListener[] = [];
  private sessionId: string | null = null;

  /**
   * 初始化 SDK
   */
  async init(options: SDKInitOptions): Promise<void> {
    const prevStatus = this.status;
    this.status = 'initializing';
    this.options = { ...options };
    this.sessionId = generateId();
    this.emitStatusChange(prevStatus);

    try {
      // 模拟初始化过程
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.status = 'ready';
      this.emitStatusChange('initializing');
      
      console.log('SDK Manager 初始化完成', {
        name: options.name,
        version: options.version,
        environment: options.environment,
        sessionId: this.sessionId
      });
    } catch (error) {
      this.status = 'error';
      this.emitStatusChange('initializing');
      throw error;
    }
  }

  /**
   * 销毁 SDK
   */
  async destroy(): Promise<void> {
    const prevStatus = this.status;
    this.status = 'destroyed';
    this.options = null;
    this.sessionId = null;
    this.emitStatusChange(prevStatus);
    
    console.log('SDK Manager 已销毁');
  }

  /**
   * 获取当前状态
   */
  getStatus(): SDKStatus {
    return this.status;
  }

  /**
   * 获取 SDK 信息
   */
  getSDKInfo() {
    return {
      status: this.status,
      options: this.options,
      sessionId: this.sessionId,
      timestamp: Date.now()
    };
  }

  /**
   * 监听状态变化
   */
  onStatusChange(listener: SDKStatusListener): () => void {
    this.listeners.push(listener);
    
    // 返回取消监听的函数
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.status === 'ready';
  }

  /**
   * 发出状态变化事件
   */
  private emitStatusChange(prevStatus: SDKStatus): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.status, prevStatus);
      } catch (error) {
        console.error('SDK状态监听器执行失败:', error);
      }
    });
  }
}

// 创建单例实例
export const sdkManager = new SDKManager();

// 导出类以供直接使用
export { SDKManager };
