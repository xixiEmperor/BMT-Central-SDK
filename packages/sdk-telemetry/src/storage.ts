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
}

/**
 * 创建遥测存储
 */
export function createTelemetryStorage(): TelemetryStorage {
  // TODO: 实现遥测存储
  throw new Error('Telemetry storage not implemented yet')
}