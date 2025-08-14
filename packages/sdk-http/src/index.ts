/**
 * @platform/sdk-http
 * BMT 平台 SDK HTTP 客户端模块
 * 
 * 这是一个功能完整的 HTTP 客户端库，专为 BMT 平台设计
 * 
 * 🚀 核心功能：
 * - HTTP 客户端单例 - 提供统一的请求接口
 * - 插件系统 - 支持功能扩展和自定义处理
 * - 统一错误处理 - 标准化的错误类型和处理机制
 * - 请求去重 - 防止相同请求并发执行
 * - 自动重试 - 智能的失败重试机制
 * - 熔断保护 - 防止服务雪崩
 * - 流量控制 - 请求频率限制
 * 
 * 📦 使用方式：
 * ```typescript
 * import { initHttp, http } from '@platform/sdk-http'
 * 
 * // 初始化客户端
 * initHttp({
 *   baseURL: 'https://api.example.com',
 *   plugins: [authPlugin(), retryPlugin()]
 * })
 * 
 * // 发送请求
 * const data = await http.get('/users')
 * ```
 */

// ============ 类型导出 ============
// 导出所有类型定义，供外部使用
export type * from './types.js'

// ============ 核心 API 导出 ============
// 导出主要的客户端初始化函数和单例对象
export { initHttp, http } from './client.js'
export type { HttpClientOptions, HttpClient } from './client.js'

// ============ 插件系统导出 ============
// 导出插件接口和所有内置插件

/** 插件接口类型 */
export type { HttpPlugin } from './plugins/types.js'

/** 认证插件 - 自动添加认证头信息 */
export { authPlugin } from './plugins/auth.js'

/** 重试插件 - 请求失败时自动重试 */
export { retryPlugin } from './plugins/retry.js'

/** 熔断器插件 - 防止服务雪崩 */
export { circuitBreakerPlugin } from './plugins/circuit-breaker.js'

/** 限流插件 - 控制请求频率 */
export { rateLimitPlugin } from './plugins/rate-limit.js'

/** 去重插件 - 防止重复请求 */
export { dedupPlugin } from './plugins/dedup.js'

/** 遥测插件 - 收集请求指标和日志 */
export { telemetryPlugin } from './plugins/telemetry.js'

/** 模拟插件 - 用于测试和开发环境 */
export { mockPlugin } from './plugins/mock.js'

// ============ 错误处理导出 ============
// 导出错误类和错误类型

/** HTTP 错误类 - 统一的错误处理 */
export { HttpError } from './errors.js'

/** HTTP 错误类型枚举 */
export type { HttpErrorType } from './types.js'