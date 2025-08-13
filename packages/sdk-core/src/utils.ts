/**
 * 工具函数
 */

import type { SupportInfo } from './types.js'

/**
 * 异步睡眠
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 为 Promise 添加超时
 */
export function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    )
  ])
}

/**
 * 检测浏览器功能支持情况
 */
export function isSupported(): SupportInfo {
  return {
    broadcastChannel: typeof BroadcastChannel !== 'undefined',
    navigatorLocks: typeof navigator !== 'undefined' && 'locks' in navigator,
    indexedDB: typeof indexedDB !== 'undefined',
    webWorker: typeof Worker !== 'undefined',
    serviceWorker: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    localStorage: typeof localStorage !== 'undefined',
    sessionStorage: typeof sessionStorage !== 'undefined',
  }
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

/**
 * 获取当前时间戳
 */
export function getCurrentTimestamp(): number {
  return Date.now()
}