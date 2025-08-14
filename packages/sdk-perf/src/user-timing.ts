/**
 * User Timing API 封装
 * 
 * 该模块对浏览器原生User Timing API进行了封装，提供了更便捷和安全的
 * 性能标记和测量功能。User Timing API允许开发者在代码中创建自定义的
 * 性能标记和测量，用于精确分析应用程序的性能表现。
 * 
 * 主要功能：
 * - 创建和管理性能标记（mark）
 * - 创建和管理性能测量（measure）
 * - 清理标记和测量数据
 * - 查询性能条目
 * 
 * 使用场景：
 * - 测量关键业务流程的执行时间
 * - 监控组件生命周期性能
 * - 分析异步操作的耗时
 * - 创建自定义的性能监控点
 * 
 * 兼容性说明：
 * - 所有函数都包含浏览器兼容性检查
 * - 在不支持的环境中静默失败，不影响业务逻辑
 * - 支持所有现代浏览器和Node.js环境
 */

/**
 * 创建性能标记
 * 
 * 在时间轴上创建一个命名的时间戳标记，用于标识应用程序中的
 * 重要事件或里程碑。标记本身几乎不消耗性能，可以安全地在生产环境中使用。
 * 
 * @param name 标记名称，应该具有描述性，便于后续分析和理解
 * 
 * 标记命名建议：
 * - 使用描述性的名称，如 'user-login-start'、'data-fetch-begin'
 * - 使用一致的命名约定，如 '{action}-{phase}'
 * - 避免使用特殊字符和空格
 * - 保持名称简洁但有意义
 * 
 * 使用场景：
 * - 标记功能模块的开始/结束时刻
 * - 标记用户交互的关键时刻
 * - 标记异步操作的关键节点
 * - 为性能测量提供参考点
 * 
 * @example
 * ```typescript
 * // 标记用户操作开始
 * mark('user-search-start')
 * // ... 执行搜索逻辑 ...
 * mark('user-search-end')
 * 
 * // 标记组件生命周期
 * mark('component-mount-start')
 * // ... 组件挂载逻辑 ...
 * mark('component-mount-complete')
 * ```
 */
export function mark(name: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    try {
      performance.mark(name)
    } catch (error) {
      console.warn(`创建性能标记失败: ${name}`, error)
    }
  }
}

/**
 * 创建性能测量
 * 
 * 计算两个时间点之间的持续时间，生成一个可被性能观察器捕获的测量条目。
 * 测量是性能分析的核心工具，可以精确量化代码执行时间和性能瓶颈。
 * 
 * @param name 测量名称，应该清楚地描述所测量的操作或过程
 * @param startMark 起始标记名称，不提供则从导航开始时间计算
 * @param endMark 结束标记名称，不提供则以当前时间为结束点
 * 
 * 测量模式：
 * 1. measure(name) - 从导航开始到当前时间的测量
 * 2. measure(name, startMark) - 从指定标记到当前时间的测量
 * 3. measure(name, startMark, endMark) - 两个指定标记之间的测量
 * 
 * 注意事项：
 * - 标记必须在测量之前创建
 * - 不存在的标记会导致错误
 * - 测量结果会自动加入性能条目列表
 * 
 * @example
 * ```typescript
 * // 基本使用模式
 * mark('task-start')
 * // ... 执行任务 ...
 * mark('task-end')
 * measure('task-duration', 'task-start', 'task-end')
 * 
 * // 测量从特定时间点到现在
 * mark('api-call-start')
 * // ... API调用 ...
 * measure('api-response-time', 'api-call-start')
 * 
 * // 测量从页面加载开始到现在
 * measure('page-interactive-time')
 * ```
 */
export function measure(name: string, startMark?: string, endMark?: string): void {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      if (startMark && endMark) {
        // 两个标记之间的测量
        performance.measure(name, startMark, endMark)
      } else if (startMark) {
        // 从指定标记到当前时间的测量
        performance.measure(name, startMark)
      } else {
        // 从导航开始到当前时间的测量
        performance.measure(name)
      }
    } catch (error) {
      console.warn(`创建性能测量失败: ${name}`, error)
    }
  }
}

/**
 * 清除性能标记
 * 
 * 从浏览器的性能缓冲区中移除指定的或所有的性能标记。
 * 这对于管理内存使用和避免性能数据过多积累非常有用。
 * 
 * @param name 可选的标记名称。如果提供，只清除指定名称的标记；如果不提供，清除所有标记
 * 
 * 使用场景：
 * - 在长时间运行的应用中定期清理性能数据
 * - 在单页应用的路由切换时清理上一个页面的标记
 * - 在性能测试结束后清理测试数据
 * - 避免内存泄漏和数据污染
 * 
 * 注意事项：
 * - 清除后的标记无法恢复
 * - 正在使用的标记也会被清除，可能影响正在进行的测量
 * - 谨慎在生产环境中使用全部清除
 * 
 * @example
 * ```typescript
 * // 清除特定标记
 * clearMarks('user-action-start')
 * 
 * // 清除所有标记（谨慎使用）
 * clearMarks()
 * 
 * // 在组件卸载时清理相关标记
 * clearMarks('component-lifecycle-start')
 * clearMarks('component-lifecycle-end')
 * ```
 */
export function clearMarks(name?: string): void {
  if (typeof performance !== 'undefined' && performance.clearMarks) {
    try {
      performance.clearMarks(name)
    } catch (error) {
      console.warn(`清除性能标记失败: ${name || '全部'}`, error)
    }
  }
}

/**
 * 清除性能测量
 * 
 * 从浏览器的性能缓冲区中移除指定的或所有的性能测量结果。
 * 这对于管理内存使用和保持数据清洁非常重要。
 * 
 * @param name 可选的测量名称。如果提供，只清除指定名称的测量；如果不提供，清除所有测量
 * 
 * 使用场景：
 * - 在性能测试轮次之间清理上一轮的测量结果
 * - 在应用状态重置时清理历史性能数据
 * - 避免性能数据过多导致的内存压力
 * - 在开发调试时清理测试数据
 * 
 * 注意事项：
 * - 清除后的测量结果无法恢复
 * - 对于已经被性能观察器捕获的数据不会影响
 * - 谨慎在生产环境中使用全部清除
 * 
 * @example
 * ```typescript
 * // 清除特定测量
 * clearMeasures('api-call-duration')
 * 
 * // 清除所有测量（谨慎使用）
 * clearMeasures()
 * 
 * // 在性能测试结束后清理
 * clearMeasures('test-scenario-duration')
 * clearMeasures('user-interaction-time')
 * ```
 */
export function clearMeasures(name?: string): void {
  if (typeof performance !== 'undefined' && performance.clearMeasures) {
    try {
      performance.clearMeasures(name)
    } catch (error) {
      console.warn(`清除性能测量失败: ${name || '全部'}`, error)
    }
  }
}

/**
 * 按名称查询性能条目
 * 
 * 根据指定的名称和可选的类型查询性能条目。这是获取特定性能数据的
 * 主要方式之一，特别适用于查找用户自定义的标记和测量结果。
 * 
 * @param name 性能条目的名称，必须与创建时的名称完全匹配
 * @param type 可选的性能条目类型，用于进一步过滤结果
 * @returns 匹配的性能条目数组，如果没有找到或不支持则返回空数组
 * 
 * 支持的性能条目类型：
 * - 'mark': 用户自定义标记
 * - 'measure': 用户自定义测量
 * - 'navigation': 页面导航性能
 * - 'resource': 资源加载性能
 * - 'paint': 绘制事件
 * - 其他浏览器支持的类型
 * 
 * 使用场景：
 * - 查询特定名称的性能数据
 * - 验证标记和测量是否成功创建
 * - 获取特定操作的详细性能数据
 * - 分析和报告性能数据
 * 
 * @example
 * ```typescript
 * // 查找特定名称的所有条目
 * const entries = getEntriesByName('user-action-duration')
 * console.log(`找到 ${entries.length} 个相关条目`)
 * 
 * // 查找特定类型的条目
 * const measures = getEntriesByName('api-call', 'measure')
 * const marks = getEntriesByName('api-call', 'mark')
 * 
 * // 获取最新的测量结果
 * const latestMeasure = getEntriesByName('task-duration', 'measure').pop()
 * if (latestMeasure) {
 *   console.log(`任务耗时: ${latestMeasure.duration}ms`)
 * }
 * ```
 */
export function getEntriesByName(name: string, type?: string): PerformanceEntry[] {
  if (typeof performance !== 'undefined' && performance.getEntriesByName) {
    try {
      return performance.getEntriesByName(name, type)
    } catch (error) {
      console.warn(`查询性能条目失败: ${name}`, error)
      return []
    }
  }
  return []
}

/**
 * 按类型查询性能条目
 * 
 * 根据指定的类型获取所有相关的性能条目。这对于批量分析某类型的
 * 性能数据非常有用，例如分析所有的资源加载性能或用户自定义测量。
 * 
 * @param type 性能条目类型
 * @returns 指定类型的所有性能条目数组，如果没有找到或不支持则返回空数组
 * 
 * 常用性能条目类型：
 * - 'mark': 所有用户自定义标记
 * - 'measure': 所有用户自定义测量
 * - 'navigation': 页面导航数据（通常只有1个）
 * - 'resource': 所有资源加载数据
 * - 'paint': 绘制事件（FP、FCP等）
 * - 'longtask': 长任务数据
 * - 'largest-contentful-paint': LCP数据
 * - 'first-input': FID数据
 * - 'layout-shift': CLS数据
 * 
 * 使用场景：
 * - 批量分析某类型的性能数据
 * - 生成性能报告和统计
 * - 监控和警告系统
 * - 性能基准测试和对比
 * 
 * @example
 * ```typescript
 * // 获取所有用户自定义测量
 * const measures = getEntriesByType('measure')
 * console.log(`共有 ${measures.length} 个测量结果`)
 * 
 * // 分析所有资源加载性能
 * const resources = getEntriesByType('resource')
 * const slowResources = resources.filter(r => r.duration > 1000)
 * console.log(`发现 ${slowResources.length} 个加载超过1秒的资源`)
 * 
 * // 获取所有标记进行分类
 * const marks = getEntriesByType('mark')
 * const userMarks = marks.filter(m => m.name.startsWith('user-'))
 * const systemMarks = marks.filter(m => m.name.startsWith('system-'))
 * ```
 */
export function getEntriesByType(type: string): PerformanceEntry[] {
  if (typeof performance !== 'undefined' && performance.getEntriesByType) {
    try {
      return performance.getEntriesByType(type)
    } catch (error) {
      console.warn(`查询性能条目失败: ${type}`, error)
      return []
    }
  }
  return []
}