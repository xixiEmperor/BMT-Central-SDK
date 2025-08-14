/**
 * HTTP 插件系统类型定义
 * 定义了插件系统的核心接口，支持请求生命周期的各个阶段扩展
 */

// 导入 axios 相关类型
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * HTTP 插件接口
 * 定义了插件的标准结构和生命周期钩子函数
 * 插件可以在请求的不同阶段介入处理，实现功能扩展
 */
export interface HttpPlugin {
  /** 
   * 插件名称
   * 用于标识插件，也可用于插件的启用/禁用控制
   */
  name: string
  
  /** 
   * 请求前处理钩子（可选）
   * 在发送请求前调用，可以修改请求配置
   * @param config 原始请求配置
   * @returns 修改后的请求配置（支持同步和异步）
   */
  onRequest?(config: AxiosRequestConfig): AxiosRequestConfig | Promise<AxiosRequestConfig>
  
  /** 
   * 响应后处理钩子（可选）
   * 在收到响应后调用，可以处理响应数据
   * @param response 原始响应对象
   * @returns 处理后的响应数据（支持同步和异步）
   */
  onResponse?<T = any>(response: AxiosResponse<T>): T | Promise<T>
  
  /** 
   * 错误处理钩子（可选）
   * 在请求发生错误时调用，可以进行错误处理或转换
   * @param error 错误对象
   * @throws 处理后的错误（支持同步和异步）
   */
  onError?(error: any): never | Promise<never>
  
  /** 
   * 插件初始化钩子（可选）
   * 在插件被安装时调用，用于执行初始化逻辑
   * @returns void 或 Promise<void>
   */
  setup?(): void | Promise<void>
  
  /** 
   * 插件销毁钩子（可选）
   * 在插件被卸载时调用，用于清理资源
   * @returns void 或 Promise<void>
   */
  teardown?(): void | Promise<void>
}