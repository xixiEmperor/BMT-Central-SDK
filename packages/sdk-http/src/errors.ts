/**
 * HTTP 错误处理模块
 * 提供统一的 HTTP 错误类型和创建方法
 */

// 导入错误类型定义
import type { HttpErrorType } from './types.js'

/**
 * HTTP 错误类
 * 继承自原生 Error 类，提供更丰富的错误信息和类型分类
 */
export class HttpError extends Error {
  /** 错误类型 - 用于分类不同种类的 HTTP 错误 */
  public readonly type: HttpErrorType
  
  /** HTTP 状态码 - 仅在 HTTP 响应错误时存在 */
  public readonly status?: number
  
  /** 错误相关的额外数据 - 可能包含服务器返回的错误详情 */
  public readonly data?: unknown

  /**
   * 构造函数
   * @param type 错误类型
   * @param message 错误消息
   * @param status HTTP 状态码（可选）
   * @param data 错误相关数据（可选）
   */
  constructor(
    type: HttpErrorType,
    message: string,
    status?: number,
    data?: unknown
  ) {
    super(message)
    this.name = 'HttpError'
    this.type = type
    this.status = status
    this.data = data
  }

  // ============ 静态工厂方法 ============
  // 提供便捷的错误创建方法，避免直接使用构造函数

  /**
   * 创建网络连接错误
   * 通常在无法建立网络连接时使用
   * @param message 错误消息
   * @returns HttpError 实例
   */
  static network(message: string): HttpError {
    return new HttpError('Network', message)
  }

  /**
   * 创建请求超时错误
   * 当请求超过设定的超时时间时使用
   * @param message 错误消息
   * @returns HttpError 实例
   */
  static timeout(message: string): HttpError {
    return new HttpError('Timeout', message)
  }

  /**
   * 创建 HTTP 状态码错误
   * 当服务器返回 4xx 或 5xx 状态码时使用
   * @param status HTTP 状态码
   * @param message 错误消息
   * @param data 服务器返回的错误数据（可选）
   * @returns HttpError 实例
   */
  static http(status: number, message: string, data?: unknown): HttpError {
    return new HttpError('Http', message, status, data)
  }

  /**
   * 创建数据验证错误
   * 当请求或响应数据不符合预期格式时使用
   * @param message 错误消息
   * @param data 验证失败的相关数据（可选）
   * @returns HttpError 实例
   */
  static validation(message: string, data?: unknown): HttpError {
    return new HttpError('Validation', message, undefined, data)
  }

  /**
   * 创建服务不可用错误
   * 当目标服务暂时不可用时使用
   * @param message 错误消息
   * @returns HttpError 实例
   */
  static serviceUnavailable(message: string): HttpError {
    return new HttpError('ServiceUnavailable', message)
  }
}