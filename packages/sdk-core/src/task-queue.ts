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
  const {
    concurrency = 2,
    timeoutMs = 10_000,
    retry,
    onError,
  } = options

  const queue: Array<() => Promise<void>> = []
  const runningSet = new Set<Promise<void>>()
  let completed = 0
  let failed = 0
  let started = false

  const runWithTimeout = async <R>(promiseFactory: () => Promise<R>): Promise<R> => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const p = promiseFactory()
      // 无原生可取消，这里只做时间窗，超时抛错
      const result = await Promise.race([
        p,
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Task timeout after ${timeoutMs}ms`)), timeoutMs)
        }),
      ])
      return result as R
    } finally {
      clearTimeout(timer)
    }
  }

  const exec = async (task: Task<T>): Promise<T> => {
    const doOnce = () => runWithTimeout(() => task())
    if (retry) {
      const { withRetry } = await import('./retry.js')
      return withRetry(doOnce, retry)
    }
    return doOnce()
  }

  const pump = async () => {
    while (started && runningSet.size < concurrency && queue.length > 0) {
      const job = queue.shift()!
      const runner = job()
      runningSet.add(runner)
      runner
        .catch((err) => {
          failed++
          onError?.(err as Error)
        })
        .finally(() => {
          runningSet.delete(runner)
          void pump()
        })
    }
  }

  const add = (task: Task<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const job = async () => {
        try {
          const result = await exec(task)
          completed++
          resolve(result)
        } catch (err) {
          failed++
          reject(err)
        }
      }
      queue.push(job)
      void pump()
    })
  }

  return {
    add,
    async start() {
      started = true
      await pump()
    },
    clear() {
      queue.length = 0
    },
    getStatus() {
      return {
        pending: queue.length,
        running: runningSet.size,
        completed,
        failed,
      }
    },
  }
}