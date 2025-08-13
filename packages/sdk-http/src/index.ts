/**
 * @platform/sdk-http
 * BMT 平台 SDK HTTP 客户端
 * 
 * 提供：
 * - HTTP 客户端单例
 * - 插件系统
 * - 统一错误处理
 * - 请求去重、重试、熔断、限流
 */

// 导出类型
export type * from './types.js'

// 导出主要 API
export { initHttp, http } from './client.js'
export type { HttpClientOptions, HttpClient } from './client.js'

// 导出插件系统
export type { HttpPlugin } from './plugins/types.js'
export { authPlugin } from './plugins/auth.js'
export { retryPlugin } from './plugins/retry.js'
export { circuitBreakerPlugin } from './plugins/circuit-breaker.js'
export { rateLimitPlugin } from './plugins/rate-limit.js'
export { dedupPlugin } from './plugins/dedup.js'
export { telemetryPlugin } from './plugins/telemetry.js'

// 导出错误类型
export { HttpError } from './errors.js'
export type { HttpErrorType } from './types.js'