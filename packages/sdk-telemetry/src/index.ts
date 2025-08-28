/**
 * @wfynbzlx666/sdk-telemetry
 * BMT 平台 SDK 遥测上报模块
 * 
 * 这是BMT平台遥测SDK的主入口文件，提供完整的事件追踪和数据上报功能。
 * 
 * ## 核心特性
 * 
 * ### 事件追踪
 * - 多种事件类型：页面浏览、自定义事件、错误、API调用、性能指标
 * - 自动事件属性补充：时间戳、会话ID、用户信息等
 * - 灵活的事件构建器，简化事件创建过程
 * - 完整的TypeScript类型支持
 * 
 * ### 数据管理
 * - 本地存储缓冲，避免数据丢失
 * - 智能批量上报，优化网络使用
 * - 采样率控制，减少数据量
 * - 自动和手动上报模式
 * 
 * ### 可靠性保障
 * - 重试机制，处理网络异常
 * - 降级策略：sendBeacon兜底上报
 * - 跨标签页去重（计划中）
 * - 错误处理，确保主业务不受影响
 * 
 * ### 集成特性
 * - 与后端API深度集成
 * - 支持用户会话管理
 * - 与SDK管理器配置同步
 * - 丰富的调试和监控功能
 * 
 * ## 快速开始
 * 
 * ```typescript
 * import { Telemetry } from '@wfynbzlx666/sdk-telemetry';
 * 
 * // 初始化遥测系统
 * Telemetry.init({
 *   app: 'my-application',
 *   release: '1.0.0',
 *   sampleRate: 0.8,
 *   batchSize: 50,
 *   autoFlush: true,
 *   debug: false
 * });
 * 
 * // 设置用户信息
 * Telemetry.setUser({
 *   id: 'user123',
 *   role: 'admin',
 *   plan: 'premium'
 * });
 * 
 * // 追踪页面浏览
 * Telemetry.trackPageView('/dashboard', {
 *   section: 'analytics',
 *   loadTime: 1200
 * });
 * 
 * // 追踪自定义事件
 * Telemetry.trackEvent('button_click', {
 *   buttonId: 'cta-signup',
 *   location: 'header'
 * });
 * 
 * // 追踪错误
 * try {
 *   // some operation
 * } catch (error) {
 *   Telemetry.trackError('api_error', error.message, error.stack);
 * }
 * 
 * // 手动上报数据
 * await Telemetry.flush();
 * ```
 * 
 * @version 1.0.0
 * @author BMT Platform Team
 */

// ============ 核心类型导出 ============
// 导出所有类型定义，提供完整的TypeScript支持

export type * from './types.js'

// ============ 主要API导出 ============
// 导出核心遥测类和相关类型

/**
 * 遥测系统核心类
 * 提供完整的事件追踪和数据上报功能
 */
export { Telemetry } from './telemetry.js'

/**
 * 遥测相关类型定义
 */
export type { 
  TelemetryOptions,    // 配置选项
  TelemetryEvent       // 事件接口
} from './telemetry.js'

// ============ 事件构建器导出 ============
// 导出事件构建器函数，简化事件创建

/**
 * 事件构建器函数
 * 提供快速创建各种类型事件的工厂函数
 */
export { 
  createPageEvent,     // 页面浏览事件构建器
  createCustomEvent,   // 自定义事件构建器
  createErrorEvent,    // 错误事件构建器
  createApiEvent,      // API调用事件构建器
  createPerfEvent      // 性能事件构建器
} from './events.js'

// ============ 基础设施组件导出 ============
// 导出底层组件的类型定义，供高级用户使用

/**
 * 遥测存储接口
 * 用于自定义存储实现
 */
export type { TelemetryStorage } from './storage.js'

// ============ 后端API集成 ============
// 重新导出sdk-http中与遥测相关的API接口，
// 使用户可以在一个包中获得完整的遥测能力

/**
 * 后端API接口
 * 提供与服务器端的RESTful API交互能力
 */
export {
  TelemetryAPI,        // 遥测API接口
  TelemetryBatcher,    // 遥测批处理器
  BMTAPI              // BMT平台主API接口
} from '@wfynbzlx666/sdk-http'

/**
 * 后端API相关类型定义
 * 包含所有与遥测相关的API数据结构
 */
export type {
  TelemetryEvent as APITelemetryEvent,  // API事件接口
  TelemetryEventType,                   // API事件类型
  TelemetryBatch,                       // 遥测批次
  TelemetryResponse,                    // 遥测响应
  TelemetryStatsResponse                // 遥测统计响应
} from '@wfynbzlx666/sdk-http'