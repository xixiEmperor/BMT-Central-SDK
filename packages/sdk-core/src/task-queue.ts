/**
 * 高并发任务队列管理器
 *
 * =================== 与浏览器事件循环的关系 ===================
 *
 * 🔄 相似之处：
 * 1. 都使用队列数据结构管理任务
 * 2. 都遵循FIFO(先进先出)原则
 * 3. 都处理异步任务的调度
 * 4. 都有任务状态管理
 *
 * 🎯 关键差异：
 *
 * 1. 执行层级：
 *    - 浏览器事件循环：JavaScript引擎底层，管理所有异步操作
 *    - 本任务队列：应用层面，基于Promise和setTimeout实现
 *
 * 2. 并发控制：
 *    - 浏览器事件循环：单线程，一次只执行一个任务
 *    - 本任务队列：支持控制并发数量，可同时执行多个任务
 *
 * 3. 任务类型：
 *    - 浏览器事件循环：宏任务(setTimeout,I/O) + 微任务(Promise.then)
 *    - 本任务队列：业务逻辑任务，通常包装为Promise
 *
 * 4. 调度策略：
 *    - 浏览器事件循环：固定调度算法(微任务优先)
 *    - 本任务队列：可配置调度(优先级、间隔、重试)
 *
 * 5. 错误处理：
 *    - 浏览器事件循环：错误冒泡到全局
 *    - 本任务队列：内置重试机制和错误恢复
 *
 * 🔗 实际关系：
 * 本任务队列运行在浏览器事件循环之上，利用事件循环的异步能力，
 * 实现了更高级的任务调度和管理功能。每个任务的执行最终还是
 * 通过事件循环来调度的。
 */

import type { ErrorHandler, Callback } from './types.js'
import type { RetryOptions } from './retry.js'
import { sleep, generateId, getCurrentTimestamp } from './utils.js'

// 任务执行函数类型
export type Task<T> = (data?: any, abortSignal?: AbortSignal) => Promise<T>

// 任务状态类型
export type TaskStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'retrying' | 'cancelled'

// 任务配置接口
export interface TaskOptions {
  /** 任务优先级（数字越大优先级越高） */
  priority?: number
  /** 最大重试次数 */
  maxRetries?: number
  /** 任务超时时间（毫秒） */
  timeout?: number
  /** 重试延迟（毫秒） */
  retryDelay?: number
  /** 自定义选项 */
  [key: string]: any
}

// 任务对象接口
export interface TaskItem<T = any> {
  /** 任务唯一标识符 */
  id: string
  /** 任务执行函数 */
  fn: Task<T>
  /** 任务数据 */
  data?: any
  /** 任务配置选项 */
  options: {
    retries: number
    maxRetries: number
    priority: number
    timeout: number
    retryDelay: number
    [key: string]: any
  }
  /** 任务状态 */
  status: TaskStatus
  /** 任务执行结果 */
  result?: T
  /** 任务执行错误 */
  error?: Error
  /** 任务开始执行时间 */
  startTime?: number
  /** 任务结束执行时间 */
  endTime?: number
  /** 任务执行耗时 */
  duration: number
  /** 取消控制器 */
  abortController?: AbortController
  /** Promise resolve 函数 */
  resolve?: (value: T) => void
  /** Promise reject 函数 */
  reject?: (reason?: any) => void
}

// 队列配置接口
export interface TaskQueueOptions {
  /** 最大并发数，默认 3 */
  maxConcurrent?: number
  /** 请求间隔（毫秒），默认 100 */
  requestInterval?: number
  /** 最大重试次数，默认 3 */
  maxRetries?: number
  /** 重试延迟（毫秒），默认 1000 */
  retryDelay?: number
  /** 请求超时时间（毫秒），默认 30000 */
  timeout?: number
  /** 进度更新回调 */
  onProgress?: (progress: ProgressInfo) => void
  /** 单个任务完成回调 */
  onTaskComplete?: (task: TaskItem, status: 'success' | 'failed') => void
  /** 队列完成回调 */
  onQueueComplete?: (results: QueueResults) => void
  /** 错误回调 */
  onError?: ErrorHandler
}

// 进度信息接口
export interface ProgressInfo {
  /** 总任务数 */
  total: number
  /** 已完成数 */
  completed: number
  /** 失败数 */
  failed: number
  /** 执行中数 */
  executing: number
  /** 待处理数 */
  pending: number
  /** 完成百分比 */
  percentage: number
  /** 是否完成 */
  isComplete: boolean
  /** 已执行时间 */
  elapsedTime: number
}

// 队列结果接口
export interface QueueResults {
  /** 统计信息 */
  stats: {
    total: number
    completed: number
    failed: number
    executing: number
    pending: number
    startTime?: number
    endTime?: number
  }
  /** 成功任务列表 */
  completed: TaskItem[]
  /** 失败任务列表 */
  failed: TaskItem[]
  /** 是否全部成功 */
  isSuccess: boolean
  /** 成功率 */
  successRate: number
}

// 队列状态接口
export interface QueueStatus {
  /** 是否暂停 */
  paused: boolean
  /** 是否停止 */
  stopped: boolean
  /** 执行中任务数 */
  executing: number
  /** 待处理任务数 */
  pending: number
  /** 已完成任务数 */
  completed: number
  /** 失败任务数 */
  failed: number
}

/**
 * 任务队列类
 * 
 * 设计目标：
 * 1. 解决高并发请求导致的数据库死锁问题
 * 2. 控制服务器资源使用，避免过载
 * 3. 提供可靠的重试机制和错误处理
 * 4. 实现实时进度监控和状态管理
 *
 * 核心原理：
 * - 生产者-消费者模式：任务生产和消费分离
 * - 并发控制：限制同时执行的任务数量
 * - 状态机管理：完整的任务生命周期跟踪
 * - 事件驱动：通过回调函数实现状态通知
 */
export class TaskQueueImpl<T = any> {
  private config: Required<TaskQueueOptions>
  private tasks: TaskItem<T>[] = []
  private executing = new Map<string, TaskItem<T>>()
  private completed: TaskItem<T>[] = []
  private failed: TaskItem<T>[] = []
  private paused = false
  private stopped = false
  private stats = {
    total: 0,
    completed: 0,
    failed: 0,
    executing: 0,
    pending: 0,
    startTime: undefined as number | undefined,
    endTime: undefined as number | undefined,
  }
  private taskIdCounter = 0
  private processingTimer: ReturnType<typeof setTimeout> | null = null

  constructor(options: TaskQueueOptions = {}) {
    // 配置参数，这些参数控制队列的行为特性
    this.config = {
      maxConcurrent: options.maxConcurrent || 3,
      requestInterval: options.requestInterval || 100,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      timeout: options.timeout || 30000,
      onProgress: options.onProgress || (() => {}),
      onTaskComplete: options.onTaskComplete || (() => {}),
      onQueueComplete: options.onQueueComplete || (() => {}),
      onError: options.onError || (() => {}),
    }
  }

  /**
   * 添加任务到队列
   * 
   * 这是队列的核心入口方法，负责：
   * 1. 创建任务对象并分配唯一ID
   * 2. 设置任务的配置选项和初始状态
   * 3. 将任务加入队列并按优先级排序
   * 4. 更新统计信息和触发进度回调
   */
  addTask(taskFn: Task<T>, data?: any, options: TaskOptions = {}): Promise<T> {
    // 生成唯一的任务ID
    const taskId = generateId()

    // 创建任务对象，包含任务的所有信息和状态
    const task: TaskItem<T> = {
      id: taskId,
      fn: taskFn,
      data,
      options: {
        retries: 0,
        maxRetries: options.maxRetries ?? this.config.maxRetries,
        priority: options.priority ?? 0,
        timeout: options.timeout ?? this.config.timeout,
        retryDelay: options.retryDelay ?? this.config.retryDelay,
        ...options,
      },
      status: 'pending',
      result: undefined,
      error: undefined,
      startTime: undefined,
      endTime: undefined,
      duration: 0,
    }

    // 返回 Promise，支持外部等待任务完成
    return new Promise<T>((resolve, reject) => {
      task.resolve = resolve
      task.reject = reject

      // 将任务加入待执行队列
      this.tasks.push(task)

      // 更新统计信息
      this.stats.total++
      this.stats.pending++

      // 按优先级排序：优先级高的任务排在前面
      this.tasks.sort((a, b) => b.options.priority - a.options.priority)

      // 触发进度更新回调
      this.updateProgress()

      // 如果队列已经启动，立即尝试处理
      if (!this.paused && !this.stopped) {
        this.processQueue()
      }
    })
  }

  /**
   * 批量添加任务
   */
  addTasks(taskList: Array<{ fn: Task<T>; data?: any; options?: TaskOptions }>): Promise<T[]> {
    const promises = taskList.map(task => 
      this.addTask(task.fn, task.data, task.options)
    )
    return Promise.all(promises)
  }

  /**
   * 开始执行队列
   */
  async start(): Promise<QueueResults> {
    if (this.stopped) {
      throw new Error('队列已停止，请创建新的队列实例')
    }

    this.paused = false
    this.stats.startTime = getCurrentTimestamp()

    console.log(`[TaskQueue] 开始执行，总任务数: ${this.stats.total}`)

    // 启动队列处理循环
    this.processQueue()

    // 返回Promise，支持异步等待队列完成
    return new Promise((resolve, reject) => {
      const checkComplete = () => {
        if (this.stopped) {
          reject(new Error('队列已停止'))
          return
        }

        if (this.isComplete()) {
          this.stats.endTime = getCurrentTimestamp()
          const duration = this.stats.endTime - (this.stats.startTime || 0)
          console.log(`[TaskQueue] 队列执行完成，耗时: ${duration}ms`)

          const results = this.getResults()
          this.config.onQueueComplete(results)
          resolve(results)
        } else {
          setTimeout(checkComplete, 100)
        }
      }
      checkComplete()
    })
  }

  /**
   * 暂停队列执行
   */
  pause(): void {
    this.paused = true
    console.log('[TaskQueue] 队列已暂停')
  }

  /**
   * 恢复队列执行
   */
  resume(): void {
    if (this.paused) {
      this.paused = false
      console.log('[TaskQueue] 队列已恢复')
      this.processQueue()
    }
  }

  /**
   * 停止队列执行
   */
  stop(): void {
    this.stopped = true
    this.paused = true

    // 取消所有正在执行的任务
    this.executing.forEach((task) => {
      if (task.abortController) {
        task.abortController.abort()
      }
    })

    // 清理定时器
    if (this.processingTimer) {
      clearTimeout(this.processingTimer)
      this.processingTimer = null
    }

    console.log('[TaskQueue] 队列已停止')
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.tasks = []
    this.completed = []
    this.failed = []
    this.executing.clear()
    this.resetStats()
  }

  /**
   * 重置统计信息
   */
  private resetStats(): void {
    this.stats = {
      total: 0,
      completed: 0,
      failed: 0,
      executing: 0,
      pending: 0,
      startTime: undefined,
      endTime: undefined,
    }
  }

  /**
   * 处理队列 - 核心调度算法
   */
  private async processQueue(): Promise<void> {
    // 检查队列状态
    if (this.paused || this.stopped) return

    // 并发控制循环
    while (
      !this.paused &&
      !this.stopped &&
      this.executing.size < this.config.maxConcurrent &&
      this.tasks.length > 0
    ) {
      const task = this.tasks.shift()!
      this.stats.pending--

      // 异步执行任务，不阻塞调度循环
      this.executeTask(task)
    }

    // 检查是否需要继续调度
    if (!this.isComplete() && !this.paused && !this.stopped) {
      this.processingTimer = setTimeout(() => {
        this.processQueue()
      }, this.config.requestInterval)
    }
  }

  /**
   * 执行单个任务
   */
  private async executeTask(task: TaskItem<T>): Promise<void> {
    // 任务执行前的准备工作
    task.status = 'executing'
    task.startTime = getCurrentTimestamp()
    this.executing.set(task.id, task)
    this.stats.executing++

    // 创建AbortController用于任务取消控制
    const abortController = new AbortController()
    task.abortController = abortController

    try {
      // 超时控制机制
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`任务超时: ${task.options.timeout}ms`))
        }, task.options.timeout)
      })

      // 执行任务
      const taskPromise = task.fn(task.data, abortController.signal)

      // 竞态执行：任务完成或超时
      const result = await Promise.race([taskPromise, timeoutPromise])

      // 成功处理
      task.status = 'completed'
      task.result = result
      task.endTime = getCurrentTimestamp()
      task.duration = task.endTime - (task.startTime || 0)

      this.completed.push(task)
      this.stats.completed++

      console.log(`[TaskQueue] 任务 ${task.id} 执行成功，耗时: ${task.duration}ms`)

      this.config.onTaskComplete(task, 'success')
      task.resolve?.(result)

    } catch (error) {
      await this.handleTaskError(task, error as Error)
    } finally {
      // 清理工作
      this.executing.delete(task.id)
      this.stats.executing--
      this.updateProgress()

      // 添加请求间隔
      if (this.config.requestInterval > 0) {
        await sleep(this.config.requestInterval)
      }
    }
  }

  /**
   * 处理任务错误 - 智能重试机制
   */
  private async handleTaskError(task: TaskItem<T>, error: Error): Promise<void> {
    task.error = error
    task.options.retries++

    console.warn(`[TaskQueue] 任务 ${task.id} 执行失败 (${task.options.retries}/${task.options.maxRetries}):`, error.message)

    // 判断是否需要重试
    if (task.options.retries < task.options.maxRetries) {
      task.status = 'retrying'

      // 指数退避延迟
      await sleep(task.options.retryDelay * task.options.retries)

      // 将任务重新加入队列头部
      this.tasks.unshift(task)
      this.stats.pending++

      console.log(`[TaskQueue] 任务 ${task.id} 将进行第 ${task.options.retries + 1} 次重试`)
    } else {
      // 最终失败处理
      task.status = 'failed'
      task.endTime = getCurrentTimestamp()
      task.duration = task.endTime - (task.startTime || 0)

      this.failed.push(task)
      this.stats.failed++

      console.error(`[TaskQueue] 任务 ${task.id} 最终失败:`, error.message)

      this.config.onTaskComplete(task, 'failed')
      this.config.onError(error)
      task.reject?.(error)
    }
  }

  /**
   * 更新进度
   */
  private updateProgress(): void {
    const progress: ProgressInfo = {
      total: this.stats.total,
      completed: this.stats.completed,
      failed: this.stats.failed,
      executing: this.stats.executing,
      pending: this.stats.pending,
      percentage: this.stats.total > 0 
        ? Math.round(((this.stats.completed + this.stats.failed) / this.stats.total) * 100) 
        : 0,
      isComplete: this.isComplete(),
      elapsedTime: this.stats.startTime ? getCurrentTimestamp() - this.stats.startTime : 0
    }

    this.config.onProgress(progress)
  }

  /**
   * 检查队列是否完成
   */
  private isComplete(): boolean {
    return this.tasks.length === 0 && 
           this.executing.size === 0 && 
           this.stats.total > 0
  }

  /**
   * 获取执行结果
   */
  getResults(): QueueResults {
    return {
      stats: { ...this.stats },
      completed: [...this.completed],
      failed: [...this.failed],
      isSuccess: this.failed.length === 0,
      successRate: this.stats.total > 0 
        ? Math.round((this.stats.completed / this.stats.total) * 100) 
        : 0
    }
  }

  /**
   * 获取队列状态
   */
  getStatus(): QueueStatus {
    return {
      paused: this.paused,
      stopped: this.stopped,
      executing: this.executing.size,
      pending: this.tasks.length,
      completed: this.completed.length,
      failed: this.failed.length
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<TaskQueueOptions>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('[TaskQueue] 配置已更新:', newConfig)
  }

  /**
   * 重试失败任务
   */
  retryFailedTasks(): void {
    const failedTasks = [...this.failed]
    this.failed = []
    this.stats.failed = 0

    failedTasks.forEach(task => {
      task.status = 'pending'
      task.options.retries = 0
      task.error = undefined
      task.startTime = undefined
      task.endTime = undefined
      task.duration = 0

      this.tasks.push(task)
      this.stats.pending++
    })

    console.log(`[TaskQueue] ${failedTasks.length} 个失败任务已重新加入队列`)
    this.updateProgress()
  }

  /**
   * 销毁队列
   */
  destroy(): void {
    this.stop()
    this.clear()
    console.log('[TaskQueue] 队列已销毁')
  }
}

// 队列接口，保持向后兼容
export interface TaskQueue<T = any> {
  /** 添加任务到队列 */
  addTask(taskFn: Task<T>, data?: any, options?: TaskOptions): Promise<T>
  /** 批量添加任务 */
  addTasks(taskList: Array<{ fn: Task<T>; data?: any; options?: TaskOptions }>): Promise<T[]>
  /** 启动队列处理 */
  start(): Promise<QueueResults>
  /** 暂停队列 */
  pause(): void
  /** 恢复队列 */
  resume(): void
  /** 停止队列 */
  stop(): void
  /** 清空队列 */
  clear(): void
  /** 获取队列状态 */
  getStatus(): QueueStatus
  /** 获取执行结果 */
  getResults(): QueueResults
  /** 更新配置 */
  updateConfig(newConfig: Partial<TaskQueueOptions>): void
  /** 重试失败任务 */
  retryFailedTasks(): void
  /** 销毁队列 */
  destroy(): void
}

/**
 * 创建任务队列
 */
export function createTaskQueue<T = any>(options: TaskQueueOptions = {}): TaskQueue<T> {
  return new TaskQueueImpl<T>(options)
}

/**
 * 创建专门用于高并发场景的任务队列
 */
export function createHighConcurrencyTaskQueue<T = any>(options: TaskQueueOptions = {}): TaskQueue<T> {
  const defaultConfig: TaskQueueOptions = {
    maxConcurrent: 10,
    requestInterval: 50,
    maxRetries: 2,
    retryDelay: 500,
    timeout: 10000,
  }
  return new TaskQueueImpl<T>({ ...defaultConfig, ...options })
}

/**
 * 创建专门用于低并发稳定场景的任务队列
 */
export function createLowConcurrencyTaskQueue<T = any>(options: TaskQueueOptions = {}): TaskQueue<T> {
  const defaultConfig: TaskQueueOptions = {
    maxConcurrent: 1,
    requestInterval: 500,
    maxRetries: 5,
    retryDelay: 2000,
    timeout: 60000,
  }
  return new TaskQueueImpl<T>({ ...defaultConfig, ...options })
}

/**
 * 创建专门用于数据库操作的任务队列
 */
export function createDatabaseTaskQueue<T = any>(options: TaskQueueOptions = {}): TaskQueue<T> {
  const defaultConfig: TaskQueueOptions = {
    maxConcurrent: 2,
    requestInterval: 200,
    maxRetries: 3,
    retryDelay: 1500,
    timeout: 15000,
  }
  return new TaskQueueImpl<T>({ ...defaultConfig, ...options })
}