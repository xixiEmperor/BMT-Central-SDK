/**
 * HTTP 客户端类型定义
 * 定义了 HTTP 客户端相关的所有类型接口和枚举
 */

// 导入 axios 相关类型
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

// ============ 错误类型定义 ============

/**
 * HTTP 错误类型枚举
 * 定义了系统中可能出现的各种 HTTP 错误类型
 */
export type HttpErrorType = 
  | 'Network'              // 网络连接错误
  | 'Timeout'              // 请求超时错误
  | 'Http'                 // HTTP 状态码错误（4xx, 5xx）
  | 'Validation'           // 数据验证错误
  | 'ServiceUnavailable'   // 服务不可用错误

// ============ HTTP 方法类型 ============

/**
 * HTTP 请求方法类型
 * 定义了支持的所有 HTTP 方法
 */
export type HttpMethod = 
  | 'GET'      // 获取资源
  | 'POST'     // 创建资源
  | 'PUT'      // 更新资源（完整替换）
  | 'DELETE'   // 删除资源
  | 'PATCH'    // 部分更新资源
  | 'HEAD'     // 获取资源头信息
  | 'OPTIONS'  // 获取资源支持的方法

// ============ 请求配置扩展 ============

/**
 * HTTP 请求配置接口
 * 扩展了 axios 的请求配置，添加了自定义功能
 */
export interface HttpRequestConfig extends AxiosRequestConfig {
  /** 
   * 跳过指定插件的处理
   * 数组中包含要跳过的插件名称
   */
  skipPlugins?: string[]
  
  /** 
   * 是否启用请求去重
   * 默认为 true，设置为 false 可禁用单个请求的去重功能
   */
  enableDedup?: boolean
  
  /** 
   * 自定义重试配置
   * 可以覆盖全局重试设置
   */
  retryConfig?: {
    /** 最大重试次数 */
    retries?: number
    /** 基础延迟时间（毫秒） */
    baseMs?: number
    /** 最大延迟时间（毫秒） */
    capMs?: number
  }
}

// ============ 响应数据包装 ============

/**
 * HTTP 响应接口
 * 扩展了 axios 的响应对象，添加了额外的元数据
 */
export interface HttpResponse<T = unknown> extends AxiosResponse<T> {
  /** 
   * 是否来自缓存
   * 标识响应数据是否来自缓存而非实际网络请求
   */
  fromCache?: boolean
  
  /** 
   * 重试次数
   * 记录该请求实际执行的重试次数
   */
  retryCount?: number
}