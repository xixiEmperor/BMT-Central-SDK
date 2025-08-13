/**
 * @platform/adapters
 * BMT 平台 SDK 框架适配器
 * 
 * 提供：
 * - React Query 默认配置
 * - Vue Query 默认配置
 * - 通用错误边界
 * - 最佳实践集成
 */

// 导出通用类型
export type * from './types.js'

// 导出 React 适配器（条件导出）
export type { ReactQueryDefaults } from './react.js'

// 导出 Vue 适配器（条件导出）
export type { VueQueryDefaults } from './vue.js'

// 导出工具函数
export { 
  createDefaultErrorHandler,
  createDefaultRetryFn,
  isRetryableError 
} from './utils.js'