/**
 * HTTP 错误处理
 */

import type { HttpErrorType } from './types.js'

export class HttpError extends Error {
  public readonly type: HttpErrorType
  public readonly status?: number
  public readonly data?: unknown

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

  static network(message: string): HttpError {
    return new HttpError('Network', message)
  }

  static timeout(message: string): HttpError {
    return new HttpError('Timeout', message)
  }

  static http(status: number, message: string, data?: unknown): HttpError {
    return new HttpError('Http', message, status, data)
  }

  static validation(message: string, data?: unknown): HttpError {
    return new HttpError('Validation', message, undefined, data)
  }

  static serviceUnavailable(message: string): HttpError {
    return new HttpError('ServiceUnavailable', message)
  }
}