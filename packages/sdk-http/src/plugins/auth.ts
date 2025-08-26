/**
 * HTTP认证插件模块
 * 
 * 提供自动化的Token认证功能，支持：
 * - 自动在请求头中添加认证Token
 * - 401错误时的自动处理和回调
 * - 可配置的Token格式和请求头
 * - 支持Bearer Token等标准认证方式
 * 
 * 核心特性：
 * - 异步Token获取支持
 * - 灵活的认证头配置
 * - 401错误自动处理
 * - 类型安全的回调机制
 */

import type { HttpPlugin } from './types.js'

/**
 * 认证插件配置选项接口
 * 定义了认证插件的各种可配置参数
 */
export interface AuthPluginOptions {
  /** 
   * 获取当前有效Token的函数（可选）
   * 
   * @returns Token字符串、null（无Token）或Promise
   * 
   * 注意事项：
   * - 返回null时不会添加认证头
   * - 支持异步获取（如从存储中读取）
   * - 每次请求前都会调用此函数
   * 
   * @example
   * ```typescript
   * getToken: () => localStorage.getItem('access_token')
   * // 或异步获取
   * getToken: async () => {
   *   const token = await tokenManager.getCurrentToken();
   *   return token?.isValid() ? token.value : null;
   * }
   * ```
   */
  getToken?: () => string | null | Promise<string | null>
  
  /** 
   * 刷新Token的函数（可选，暂未使用）
   * 
   * @returns 新的Token字符串、null或Promise
   * 
   * 预留接口，用于未来实现自动Token刷新功能
   * 当前版本不会自动调用此函数
   */
  refreshToken?: () => string | null | Promise<string | null>
  
  /** 
   * Token过期时的回调函数（可选）
   * 
   * 当收到401状态码时会触发此回调
   * 可用于通知用户重新登录、清除本地Token等
   * 
   * @example
   * ```typescript
   * onTokenExpired: async () => {
   *   console.log('Token已过期，请重新登录');
   *   localStorage.removeItem('access_token');
   *   window.location.href = '/login';
   * }
   * ```
   */
  onTokenExpired?: () => void | Promise<void>
  
  /** 
   * Token所在的HTTP头名称，默认 'Authorization'
   * 
   * 大多数API使用标准的Authorization头，但某些API可能使用自定义头名
   * 
   * @example
   * ```typescript
   * tokenHeader: 'X-API-Key'        // 自定义API密钥头
   * tokenHeader: 'X-Access-Token'   // 自定义访问Token头
   * ```
   */
  tokenHeader?: string
  
  /** 
   * Token的前缀，默认 'Bearer '
   * 
   * 用于构造完整的认证头值：`${tokenPrefix}${token}`
   * 注意Bearer后面有一个空格
   * 
   * @example
   * ```typescript
   * tokenPrefix: 'Bearer '    // 标准Bearer Token格式
   * tokenPrefix: 'Token '     // 简单Token格式  
   * tokenPrefix: ''           // 无前缀，直接使用Token值
   * ```
   */
  tokenPrefix?: string
}

/**
 * 创建HTTP认证插件工厂函数
 * 
 * 根据配置选项创建一个认证插件实例，用于HTTP客户端的请求认证
 * 
 * @param options 认证插件配置选项
 * @returns HttpPlugin 认证插件实例
 * 
 * @example
 * ```typescript
 * // 基本使用 - Bearer Token认证
 * const auth = authPlugin({
 *   getToken: () => localStorage.getItem('access_token'),
 *   onTokenExpired: () => {
 *     console.log('Token过期，请重新登录');
 *     window.location.href = '/login';
 *   }
 * });
 * 
 * // 自定义认证头格式
 * const apiKeyAuth = authPlugin({
 *   getToken: () => process.env.API_KEY,
 *   tokenHeader: 'X-API-Key',
 *   tokenPrefix: ''  // 无前缀
 * });
 * 
 * // 异步Token获取
 * const asyncAuth = authPlugin({
 *   getToken: async () => {
 *     const refreshToken = localStorage.getItem('refresh_token');
 *     if (!refreshToken) return null;
 *     
 *     const newToken = await refreshAccessToken(refreshToken);
 *     return newToken;
 *   }
 * });
 * ```
 */
export function authPlugin(options: AuthPluginOptions = {}): HttpPlugin {
  // 解构配置选项并设置默认值
  const {
    getToken = () => null,           // 默认返回null，不添加认证头
    refreshToken,                    // 刷新Token函数（预留）
    onTokenExpired,                  // Token过期回调
    tokenHeader = 'Authorization',   // 默认使用标准Authorization头
    tokenPrefix = 'Bearer ',         // 默认使用Bearer Token格式
  } = options

  return {
    name: 'auth',
    
    /**
     * 请求前处理：自动添加认证头
     * 
     * 在每个HTTP请求发送前调用，负责：
     * 1. 获取当前有效的Token
     * 2. 如果Token存在，添加到请求头中
     * 3. 保持请求配置的其他部分不变
     */
    async onRequest(config) {
      // 调用用户提供的getToken函数获取Token
      const token = await getToken()
      
      if (token) {
        // 确保headers对象存在
        config.headers = config.headers ?? {}
        
        // 添加认证头：格式为 "${tokenPrefix}${token}"
        // 例如：Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
        ;(config.headers as any)[tokenHeader] = `${tokenPrefix}${token}`
      }
      
      return config
    },
    
    /**
     * 错误处理：检测认证失败并触发回调
     * 
     * 当HTTP请求发生错误时调用，特别处理：
     * 1. 检测401未授权错误
     * 2. 触发用户配置的Token过期回调
     * 3. 重新抛出错误供上层处理
     */
    async onError(error) {
      // 检查是否为401未授权错误
      if (error && error.status === 401) {
        try {
          // 安全调用用户提供的过期回调函数
          // 使用可选链操作符和try-catch确保回调执行失败不影响主流程
          await onTokenExpired?.()
        } catch {
          // 静默忽略回调函数执行中的错误
          // 避免回调错误干扰原始的认证错误处理
        }
      }
      
      // 重新抛出原始错误，让上层调用者处理
      // 插件不应该吞掉错误，而是提供附加功能后透传
      throw error
    },
  }
}