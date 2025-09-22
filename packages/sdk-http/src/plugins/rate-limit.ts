import type { HttpPlugin } from './types.js'

/**
 * 限流插件配置选项接口
 * 定义了限流行为的各种可配置参数
 */
export interface RateLimitOptions {
  /** 
   * 每秒请求数（Request Per Second），默认 10
   * 
   * 控制长期平均请求速率，即令牌生成速率
   * 这是限流的核心参数，决定了系统的稳态吞吐量
   * 
   * 设置建议：
   * - 根据API提供商限制设置（如GitHub API: 5000/hour ≈ 1.4/s）
   * - 考虑网络带宽和延迟
   * - 预留一定余量以应对重试等情况
   * 
   * @example
   * ```typescript
   * rps: 5      // 每秒最多5个请求
   * rps: 100    // 每秒最多100个请求（高频场景）
   * rps: 0.5    // 每2秒最多1个请求（低频场景）
   * ```
   */
  rps?: number
  
  /** 
   * 突发请求缓冲区大小，默认等于 rps
   * 
   * 令牌桶的最大容量，决定了能处理的最大突发请求数
   * 较大的burst值允许更多突发请求，但可能导致瞬时压力
   * 
   * 设置原则：
   * - burst >= rps：保证至少1秒的突发能力
   * - burst = rps * N：支持N秒的突发积累
   * - 考虑下游服务的承载能力
   * 
   * @example
   * ```typescript
   * // rps=10, burst=20: 允许20个并发请求，然后限制为每秒10个
   * { rps: 10, burst: 20 }
   * 
   * // rps=5, burst=5: 严格限制，无突发能力
   * { rps: 5, burst: 5 }
   * 
   * // rps=10, burst=50: 高突发能力，适合间歇性高峰
   * { rps: 10, burst: 50 }
   * ```
   */
  burst?: number
  
  /** 
   * 等待队列最大长度，默认 100
   * 
   * 当令牌不足时，请求会进入等待队列
   * 队列满时新请求会立即失败，防止内存无限增长
   * 
   * 队列长度设计考虑：
   * - 太小：请求容易失败，用户体验差
   * - 太大：内存占用高，响应延迟长
   * - 建议：rps * 预期最大等待时间(秒)
   * 
   * @example
   * ```typescript
   * // rps=10, maxQueueSize=50: 最多等待5秒
   * { rps: 10, maxQueueSize: 50 }
   * 
   * // 零容忍模式：队列长度为0，请求立即成功或失败
   * { rps: 5, maxQueueSize: 0 }
   * ```
   */
  maxQueueSize?: number
}

/**
 * 创建HTTP请求限流插件工厂函数
 * 
 * 基于令牌桶算法实现的请求频率控制插件
 * 每个插件实例维护独立的令牌桶和等待队列
 * 
 * @param options 限流配置选项
 * @returns HttpPlugin 限流插件实例
 * 
 * @example
 * ```typescript
 * // 基本使用 - 每秒10个请求
 * const rateLimiter = rateLimitPlugin({
 *   rps: 10,
 *   burst: 20,
 *   maxQueueSize: 50
 * });
 * 
 * // 严格限流 - 无突发能力
 * const strictLimiter = rateLimitPlugin({
 *   rps: 5,
 *   burst: 5,
 *   maxQueueSize: 0  // 立即失败，不排队
 * });
 * 
 * // 第三方API限流 - 基于API文档设置
 * const githubLimiter = rateLimitPlugin({
 *   rps: 1.4,        // GitHub API: 5000/hour
 *   burst: 10,       // 允许一定突发
 *   maxQueueSize: 20 // 最多等待约14秒
 * });
 * ```
 */
export function rateLimitPlugin(options: RateLimitOptions = {}): HttpPlugin {
  // 解构配置选项并设置默认值
  const { rps = 10, burst = rps, maxQueueSize = 100 } = options
  
  // 令牌桶状态
  let tokens = burst        // 当前可用令牌数，初始化为满桶
  let lastRefill = Date.now()  // 上次令牌补充的时间戳
  
  // 等待队列：存储等待令牌的请求回调函数
  const queue: Array<() => void> = []

  /**
   * 令牌补充函数
   * 根据经过的时间和配置的RPS向令牌桶添加令牌
   * 
   * 算法逻辑：
   * 1. 计算自上次补充以来经过的时间（秒）
   * 2. 根据RPS计算应添加的令牌数
   * 3. 将令牌数限制在桶容量（burst）内
   * 4. 更新上次补充时间
   */
  const refill = () => {
    const now = Date.now()
    const elapsed = (now - lastRefill) / 1000  // 转换为秒
    const add = Math.floor(elapsed * rps)       // 计算应添加的令牌数
    
    if (add > 0) {
      // 添加令牌，但不超过桶容量
      tokens = Math.min(tokens + add, burst)
      // 这里必须要在更新令牌数之后更新上次补充时间，否则会导致令牌数不准确
      // 假设我每秒请求10次，但是我有一堆请求，这个时候就会存在请求进入等待状态，
      // 而定时器中也调用了refill，如果不等补充成功后才更新时间，会导致上一次的补充时间一直在变化
      // 这样一来就可能导致(now - lastRefill) / 1000 * rps一直等于0，直接不发令牌了
      lastRefill = now
    }
  }

  /**
   * 获取令牌函数
   * 尝试为当前请求获取一个令牌，如果没有令牌则加入等待队列
   * 
   * @returns Promise<void> 获取到令牌时resolve，队列溢出时reject
   * 
   * 处理逻辑：
   * 1. 先尝试补充令牌
   * 2. 如果有可用令牌，立即消耗并返回
   * 3. 如果没有令牌且队列未满，加入等待队列
   * 4. 如果队列已满，立即拒绝请求
   */
  const acquire = (): Promise<void> => {
    refill()  // 先尝试补充令牌
    
    if (tokens > 0) {
      // 有可用令牌，立即消耗并允许请求通过
      tokens--
      return Promise.resolve()
    }
    
    // 没有可用令牌，检查队列容量
    if (queue.length >= maxQueueSize) {
      return Promise.reject(new Error('Rate limit queue overflow'))
    }
    
    // 加入等待队列，返回Promise等待后续处理
    // 有多少任务就有多少resolve，等待队列并不需要记录任务和resolve的对应关系
    // 只要是还没有通过检查的请求就会被await一直堵塞，等待队列其实就是相当于给正在排队的请求发一个通行证
    return new Promise((resolve) => queue.push(resolve))
  }

  /**
   * 定时器：定期处理等待队列
   * 
   * 每100ms执行一次：
   * 1. 补充令牌
   * 2. 处理等待队列中的请求
   * 3. 直到令牌用完或队列为空
   * 
   * 注意：100ms的间隔是性能和响应性的平衡
   * - 间隔太短：CPU开销大
   * - 间隔太长：响应延迟高
   */
  setInterval(() => {
    refill()  // 补充令牌
    
    // 处理等待队列：为每个等待的请求分配令牌
    while (tokens > 0 && queue.length > 0) {
      tokens--  // 消耗令牌
      const next = queue.shift()!  // 取出等待的请求回调
      next()  // 执行回调，允许请求继续
    }
  }, 100)

  return {
    name: 'rate-limit',
    
    /**
     * 请求前处理：令牌获取和限流控制
     * 
     * 在每个HTTP请求发送前调用，负责：
     * 1. 尝试获取令牌
     * 2. 如果成功获取，允许请求继续
     * 3. 如果令牌不足，等待或拒绝请求
     * 
     * 这是限流的核心控制点，所有请求都必须通过此检查
     */
    async onRequest(config) {
      // 尝试获取令牌，可能会等待或抛出队列溢出错误
      await acquire()
      
      // 获取到令牌，请求可以继续
      return config
    },
  }
}