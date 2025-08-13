/**
 * 任务队列 - 支持并发控制、超时、重试
 */

import type { ErrorHandler } from './types.js'
import type { RetryOptions } from './retry.js'

export type Task<T> = () => Promise<T>

export interface TaskQueueOptions {
  /** 并发数量，默认 2 */
  concurrency?: number
  /** 任务超时时间（毫秒），默认 10000 */
  timeoutMs?: number
  /** 重试配置 */
  retry?: RetryOptions
  /** 错误处理函数 */
  onError?: ErrorHandler
}

export interface TaskQueue<T> {
  /** 添加任务到队列 */
  add(task: Task<T>): Promise<T>
  /** 启动队列处理 */
  start(): Promise<void>
  /** 清空队列 */
  clear(): void
  /** 获取队列状态 */
  getStatus(): {
    pending: number
    running: number
    completed: number
    failed: number
  }
}

/**
 * 创建任务队列
 */
export function createTaskQueue<T>(options: TaskQueueOptions = {}): TaskQueue<T> {
  // TODO: 实现任务队列逻辑
  throw new Error('TaskQueue not implemented yet')
}