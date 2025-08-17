/**
 * @platform/sdk-telemetry
 * BMT 平台 SDK 遥测上报
 * 
 * 提供：
 * - 统一事件模型
 * - 批量缓冲上报
 * - 跨标签页去重
 * - Beacon 兜底
 */

// 导出类型
export type * from './types.js'

// 导出主要 API
export { Telemetry } from './telemetry.js'
export type { TelemetryOptions, TelemetryEvent } from './telemetry.js'

// 导出事件构建器
export { 
  createPageEvent,
  createCustomEvent,
  createErrorEvent,
  createApiEvent,
  createPerfEvent 
} from './events.js'

// 导出存储相关
export type { TelemetryStorage } from './storage.js'

// ============ API 接口导出 ============
// 从 sdk-http 重新导出遥测相关的 API 接口，方便在遥测包中直接使用

export {
  TelemetryAPI,
  TelemetryBatcher,
  BMTAPI
} from '@platform/sdk-http'

export type {
  TelemetryEvent as APITelemetryEvent,
  TelemetryEventType,
  TelemetryBatch,
  TelemetryResponse,
  TelemetryStatsResponse
} from '@platform/sdk-http'