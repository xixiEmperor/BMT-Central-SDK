
import type { HttpPlugin } from './types.js'

/**
 * 认证插件配置选项接口
 * 定义了认证插件的各种可配置参数
 */
export interface AuthPluginOptions {

  getToken?: () => string | null | Promise<string | null>

  refreshToken?: () => string | null | Promise<string | null>

  onTokenExpired?: () => void | Promise<void>

  tokenHeader?: string

  tokenPrefix?: string
}

/**
 * 创建HTTP认证插件工厂函数
 * 
 * 根据配置选项创建一个认证插件实例，用于HTTP客户端的请求认证
 * 
 * @param options 认证插件配置选项
 * @returns HttpPlugin 认证插件实例
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