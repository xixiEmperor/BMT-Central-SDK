/**
 * 遥测数据存储模块
 * 
 * 该模块负责遥测事件的本地存储管理，采用渐进式存储策略：
 * 1. 优先使用IndexedDB进行持久化存储（计划中）
 * 2. 降级到内存存储作为兜底方案
 * 
 * 存储模块的主要职责：
 * - 事件数据的增删改查
 * - 批量获取待上报事件
 * - 存储空间管理和统计
 * - 数据持久化和恢复
 * 
 * 当前实现为内存存储，适用于大多数场景。
 * 未来可扩展支持IndexedDB以提供更强的数据持久性。
 */

import type { TelemetryEvent } from './types.js'

/**
 * 遥测存储接口
 * 
 * 定义了遥测数据存储的标准接口，支持多种存储后端实现。
 * 所有存储操作都是异步的，以保持接口的一致性和可扩展性。
 */
export interface TelemetryStorage {
  /** 
   * 添加单个遥测事件到存储
   * 
   * @param {TelemetryEvent} event 要存储的遥测事件
   * @returns {Promise<void>} 添加完成时resolve
   */
  add(event: TelemetryEvent): Promise<void>
  
  /** 
   * 批量获取待上报的事件
   * 
   * 按照先进先出的顺序获取指定数量的事件，用于批量上报。
   * 
   * @param {number} size 要获取的事件数量上限
   * @returns {Promise<TelemetryEvent[]>} 返回事件数组，可能少于请求数量
   */
  getBatch(size: number): Promise<TelemetryEvent[]>
  
  /** 
   * 删除已上报的事件
   * 
   * 根据事件ID列表删除对应的事件，通常在上报成功后调用。
   * 
   * @param {string[]} eventIds 要删除的事件ID列表
   * @returns {Promise<void>} 删除完成时resolve
   */
  remove(eventIds: string[]): Promise<void>
  
  /** 
   * 清空所有存储的事件
   * 
   * 清除存储中的所有遥测事件，用于重置或清理操作。
   * 
   * @returns {Promise<void>} 清空完成时resolve
   */
  clear(): Promise<void>
  
  /** 
   * 获取存储统计信息
   * 
   * 返回当前存储的事件数量和占用空间大小的统计信息。
   * 
   * @returns {Promise<{count: number, size: number}>} 统计信息对象
   * @returns {number} returns.count 事件数量
   * @returns {number} returns.size 存储大小（字节）
   */
  getStats(): Promise<{ count: number; size: number }>
  
  /** 
   * 获取当前存储的事件数量
   * 
   * 快速获取存储中事件的总数，用于队列状态监控。
   * 
   * @returns {Promise<number>} 事件数量
   */
  getCount(): Promise<number>
}

/**
 * 创建遥测存储实例
 * 
 * 工厂函数，创建一个基于内存的遥测存储实例。
 * 当前实现使用内存数组作为存储后端，具有以下特点：
 * 
 * - 高性能：所有操作都在内存中完成
 * - 简单可靠：无需处理复杂的异步存储逻辑
 * - 易于调试：数据结构直观，便于开发时调试
 * - 临时性：页面刷新后数据会丢失
 * 
 * 适用场景：
 * - 开发和测试环境
 * - 对数据持久性要求不高的场景
 * - 作为更复杂存储方案的降级选项
 * 
 * @returns {TelemetryStorage} 遥测存储实例
 * 
 * @example
 * ```typescript
 * const storage = createTelemetryStorage();
 * 
 * // 添加事件
 * await storage.add({
 *   type: 'page',
 *   name: '/dashboard',
 *   ts: Date.now(),
 *   app: 'my-app',
 *   release: '1.0.0'
 * });
 * 
 * // 获取批次数据
 * const events = await storage.getBatch(10);
 * 
 * // 获取统计信息
 * const stats = await storage.getStats();
 * console.log(`存储了 ${stats.count} 个事件，占用 ${stats.size} 字节`);
 * ```
 */
export function createTelemetryStorage(): TelemetryStorage {
  // 使用数组作为内存存储，按照添加顺序存储事件
  const queue: TelemetryEvent[] = []
  
  return {
    /**
     * 添加事件到存储队列
     * 将新事件追加到队列末尾，保持先进先出的顺序
     */
    async add(event: TelemetryEvent): Promise<void> {
      queue.push(event)
    },

    /**
     * 获取指定数量的事件批次
     * 从队列头部获取事件，但不删除它们（需要显式调用remove）
     */
    async getBatch(size: number): Promise<TelemetryEvent[]> {
      return queue.slice(0, size)
    },

    /**
     * 根据ID删除指定事件
     * 遍历队列，删除ID匹配的事件。使用倒序遍历以避免索引问题。
     */
    async remove(ids: string[]): Promise<void> {
      // 空ID列表时直接返回，避免不必要的处理
      if (ids.length === 0) return
      
      // 使用Set提高查找效率
      const idSet = new Set(ids)
      
      // 倒序遍历，安全地删除匹配的事件
      for (let i = queue.length - 1; i >= 0; i--) {
        const event = queue[i]
        // 检查事件是否有ID且在删除列表中
        if (event.id && idSet.has(event.id)) {
          queue.splice(i, 1)
        }
      }
    },

    /**
     * 清空所有存储的事件
     * 将队列长度设为0，让垃圾回收器清理内存
     */
    async clear(): Promise<void> {
      queue.length = 0
    },

    /**
     * 获取存储统计信息
     * 计算当前事件数量和序列化后的大小
     */
    async getStats(): Promise<{ count: number; size: number }> {
      return {
        count: queue.length,
        // 通过JSON序列化估算存储大小（字节数）
        size: JSON.stringify(queue).length
      }
    },

    /**
     * 获取当前事件数量
     * 快速返回队列中事件的总数
     */
    async getCount(): Promise<number> {
      return queue.length
    },
  }
}