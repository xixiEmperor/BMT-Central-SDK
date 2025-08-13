/**
 * 认证插件 - 自动附带 Bearer Token，401 时刷新
 */

import type { HttpPlugin } from './types.js'

export interface AuthPluginOptions {
  /** 获取 Token 的函数 */
  getToken?: () => string | null | Promise<string | null>
  /** 刷新 Token 的函数 */
  refreshToken?: () => string | null | Promise<string | null>
  /** Token 过期时的回调 */
  onTokenExpired?: () => void | Promise<void>
  /** Token 头名称，默认 'Authorization' */
  tokenHeader?: string
  /** Token 前缀，默认 'Bearer ' */
  tokenPrefix?: string
}

/**
 * 创建认证插件
 */
export function authPlugin(options: AuthPluginOptions = {}): HttpPlugin {
  // TODO: 实现认证插件
  throw new Error('Auth plugin not implemented yet')
}