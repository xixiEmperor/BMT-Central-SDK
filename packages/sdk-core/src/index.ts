/**
 * @wfynbzlx666/sdk-core
 * BMT 平台 SDK 核心能力包
 * 
 * 提供：
 * - TaskQueue: 任务队列管理
 * - Retry: 重试与指数退避
 * - Broadcast: 跨标签页通信
 * - Locks: 互斥锁协调
 */

// 导出所有核心类型
export type * from './types.js'

// 导出 TaskQueue 相关
export { 
  createTaskQueue,
  createHighConcurrencyTaskQueue,
  createLowConcurrencyTaskQueue,
  createDatabaseTaskQueue,
  TaskQueueImpl
} from './task-queue.js'
export type { 
  Task, 
  TaskQueue,
  TaskQueueOptions, 
  TaskOptions,
  TaskItem,
  TaskStatus,
  ProgressInfo,
  QueueResults,
  QueueStatus
} from './task-queue.js'

// 导出重试相关
export { createRetry, withRetry } from './retry.js'
export type { RetryOptions, RetryContext } from './retry.js'

// 导出跨标签页通信
export { createBroadcast } from './broadcast.js'
export type { BroadcastChannel, BroadcastMessage } from './broadcast.js'

// 导出互斥锁
export { withLock } from './locks.js'
export type { LockOptions } from './locks.js'

// 导出工具函数
export { 
  sleep, 
  timeout, 
  isSupported,
  generateId,
  getCurrentTimestamp 
} from './utils.js'