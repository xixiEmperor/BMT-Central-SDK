/**
 * 遥测数据存储 - IndexedDB 优先，降级到内存
 */

import type { TelemetryEvent } from './types.js'

export interface TelemetryStorage {
  /** 添加事件 */
  add(event: TelemetryEvent): Promise<void>
  /** 获取待上报事件 */
  getBatch(size: number): Promise<TelemetryEvent[]>
  /** 删除已上报事件 */
  remove(eventIds: string[]): Promise<void>
  /** 清空所有事件 */
  clear(): Promise<void>
  /** 获取存储统计 */
  getStats(): Promise<{ count: number; size: number }>
  /** 获取事件数量 */
  getCount(): Promise<number>
}

/**
 * 创建遥测存储
 */
export function createTelemetryStorage(): TelemetryStorage {
  const queue: TelemetryEvent[] = []
  return {
    async add(event) {
      queue.push(event)
    },
    async getBatch(size) {
      return queue.slice(0, size)
    },
    async remove(ids) {
      if (ids.length === 0) return
      const set = new Set(ids)
      for (let i = queue.length - 1; i >= 0; i--) {
        const e = queue[i]
        if (e.id && set.has(e.id)) {
          queue.splice(i, 1)
        }
      }
    },
    async clear() {
      queue.length = 0
    },
    async getStats() {
      return { count: queue.length, size: JSON.stringify(queue).length }
    },
    async getCount() {
      return queue.length
    },
  }
}