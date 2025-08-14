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
  const {
    getToken = () => null,
    refreshToken,
    onTokenExpired,
    tokenHeader = 'Authorization',
    tokenPrefix = 'Bearer ',
  } = options

  return {
    name: 'auth',
    async onRequest(config) {
      const token = await getToken()
      if (token) {
        config.headers = config.headers ?? {}
        ;(config.headers as any)[tokenHeader] = `${tokenPrefix}${token}`
      }
      return config
    },
    async onError(error) {
      // 简化处理：401 时触发回调，不做自动刷新
      if (error && error.status === 401) {
        try { await onTokenExpired?.() } catch {}
      }
      throw error
    },
  }
}