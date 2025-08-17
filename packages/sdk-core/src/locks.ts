/**
 * 跨标签页互斥锁模块
 * 
 * 实现基于浏览器原生 Web Locks API 的互斥锁机制，包含以下特性：
 * 1. 优先使用现代浏览器的 navigator.locks API 实现真正的跨标签页互斥
 * 2. 不支持时降级到单标签页内的普通执行模式
 * 3. 支持超时控制，避免死锁问题
 * 4. 支持非阻塞模式，可选择立即执行而不等待锁释放
 * 
 * 使用场景：
 * - 防止多个标签页同时执行敏感操作（如支付、提交表单）
 * - 确保数据同步操作的原子性（如缓存更新、文件上传）
 * - 限制资源访问并发数（如同时只能有一个标签页播放音频）
 * - 防止重复的后台任务执行（如数据备份、定时同步）
 * 
 * 互斥锁的作用：
 * 互斥锁（Mutex）是一种同步原语，用于保护共享资源，确保在同一时间
 * 只有一个执行上下文（标签页/进程/线程）可以访问特定资源。
 * 
 * 在前端应用中的重要性：
 * - 避免竞态条件：防止多个标签页同时修改相同数据导致的数据不一致
 * - 保证操作原子性：确保复杂操作要么完全执行，要么完全不执行
 * - 资源管理：合理分配有限的系统资源（如网络连接、本地存储空间）
 */

/**
 * 互斥锁配置选项
 */
export interface LockOptions {
  /** 锁名称，相同名称的锁会互相排斥 */
  name: string
  /** 
   * 超时时间（毫秒），默认 10000ms（10秒）
   * 防止因为异常情况导致锁永远不被释放
   */
  timeout?: number
  /** 
   * 是否使用非阻塞模式，默认 false
   * true: 如果锁被占用则立即执行函数（不保证互斥）
   * false: 等待锁释放后再执行函数（保证互斥）
   */
  ifAvailable?: boolean
}

/**
 * 使用互斥锁执行函数
 * 
 * 这是核心 API，用于在互斥锁保护下执行指定函数，确保同一时间
 * 只有一个标签页能够执行相同锁名称的操作。
 * 
 * @param key 锁的唯一标识符，相同 key 的操作会互斥
 * @param fn 需要在锁保护下执行的异步函数
 * @param options 锁配置选项
 * @returns 返回函数执行结果的 Promise
 * 
 * @example
 * ```typescript
 * // 防止多标签页重复提交订单
 * const result = await withLock('submit-order', async () => {
 *   return await submitOrder(orderData)
 * }, { timeout: 5000 })
 * 
 * // 非阻塞模式：如果锁被占用则立即执行
 * const result = await withLock('background-sync', async () => {
 *   return await syncData()
 * }, { ifAvailable: true })
 * ```
 */
export async function withLock<T>(
  key: string,
  fn: () => Promise<T>,
  options: Omit<LockOptions, 'name'> = {}
): Promise<T> {
  const { timeout = 10_000, ifAvailable = false } = options

  // 方案一：使用现代浏览器的 Web Locks API
  // 这是真正的跨标签页互斥锁实现
  if (typeof navigator !== 'undefined' && (navigator as any).locks && typeof (navigator as any).locks.request === 'function') {
    return new Promise<T>((resolve, reject) => {
      let timer: any
      
      // 设置超时处理，防止死锁
      const onTimeout = () => reject(new Error(`Lock '${key}' timeout after ${timeout}ms`))
      timer = setTimeout(onTimeout, timeout)
      
      // 请求获取互斥锁
      ;(navigator as any).locks
        .request(
          key, // 锁名称
          { 
            ifAvailable,           // 非阻塞模式
            mode: 'exclusive',     // 独占模式
            steal: false          // 不强制抢占其他锁
          },
          async (lock: any | null) => {
            // 在非阻塞模式下，如果锁被占用则 lock 为 null
            if (!lock && ifAvailable) {
              clearTimeout(timer)
              // 未获取到锁但允许非阻塞执行，直接运行函数（不保证互斥）
              resolve(await fn())
              return
            }
            
            try {
              // 成功获取锁，执行受保护的函数
              const result = await fn()
              clearTimeout(timer)
              resolve(result)
            } catch (e) {
              // 函数执行出错，清理定时器并传播错误
              clearTimeout(timer)
              reject(e)
            }
            // 注意：函数执行完毕后，锁会自动释放
          }
        )
        .catch((err: any) => {
          // 锁请求本身失败（如浏览器不支持等）
          clearTimeout(timer)
          reject(err)
        })
    })
  }

  // 方案二：降级处理 - 单标签页模式
  // 当浏览器不支持 Web Locks API 时，直接执行函数
  // 注意：此时无法保证跨标签页的互斥性
  return fn()
}