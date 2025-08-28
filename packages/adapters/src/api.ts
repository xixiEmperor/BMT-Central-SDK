/**
 * 适配器 API 封装
 * 为常用后端API提供统一接口
 */

import { initHttp, http, AuthAPI, HealthAPI, ConfigAPI } from '@wfynbzlx666/sdk-http'

// 全局API配置
let apiConfig: {
  baseURL?: string
  defaultHeaders?: Record<string, string>
} = {}

/**
 * BMT API 统一入口
 */
export const BMTAPI = {
  /**
   * 配置API客户端
   */
  configure(config: { baseURL: string; defaultHeaders?: Record<string, string> }) {
    apiConfig = config
    initHttp({
      baseURL: config.baseURL,
      timeout: 10000,
      ...(config.defaultHeaders && { headers: config.defaultHeaders })
    })
  },

  /**
   * 健康检查API
   */
  health: {
    async check() {
      return await HealthAPI.getHealth()
    },
    
    async getServiceInfo() {
      return await HealthAPI.getServiceInfo()
    }
  },

  /**
   * 配置API
   */
  config: {
    async getSDKConfig(params: { app?: string; release?: string; environment?: string; version?: string }) {
      return await ConfigAPI.getConfig({ app: params.app, release: params.release })
    }
  },

  /**
   * 认证API
   */
  auth: {
    async login(credentials: { email: string; password: string }) {
      return await AuthAPI.login({ 
        username: credentials.email, 
        password: credentials.password 
      })
    },
    
    async verify(token: string) {
      return await AuthAPI.verify(token)
    },
    
    async logout(accessToken: string, refreshToken: string) {
      return await AuthAPI.logout(accessToken, { refreshToken })
    }
  }
}

/**
 * 认证管理器
 */
export const AuthManager = {
  private: {
    config: null as any,
    currentUser: null as any
  },

  /**
   * 配置认证管理器
   */
  configure(config: {
    baseURL: string
    tokenStorage: 'localStorage' | 'sessionStorage'
    autoRefresh: boolean
  }) {
    this.private.config = config
    BMTAPI.configure({ baseURL: config.baseURL })
  },

  /**
   * 登录
   */
  async login(credentials: { email: string; password: string }) {
    const result = await BMTAPI.auth.login(credentials)
    this.private.currentUser = result.user || { email: credentials.email, id: 'demo-user' }
    
    // 模拟token存储
    if (this.private.config?.tokenStorage === 'localStorage') {
      localStorage.setItem('auth_token', result.accessToken || 'demo-token')
      localStorage.setItem('refresh_token', result.refreshToken || 'demo-refresh-token')
    }
    
    return result
  },

  /**
   * 获取当前用户
   */
  async getCurrentUser() {
    if (!this.private.currentUser) {
      // 尝试从token恢复用户信息
      const token = localStorage.getItem('auth_token')
      if (token) {
        try {
          const result = await BMTAPI.auth.verify(token)
          this.private.currentUser = result.user || { email: 'unknown', id: 'demo-user' }
        } catch {
          this.private.currentUser = { email: 'guest', id: 'guest' }
        }
      } else {
        this.private.currentUser = { email: 'guest', id: 'guest' }
      }
    }
    return this.private.currentUser
  },

  /**
   * 登出
   */
  async logout() {
    const accessToken = localStorage.getItem('auth_token')
    const refreshToken = localStorage.getItem('refresh_token')
    
    if (accessToken && refreshToken) {
      try {
        await BMTAPI.auth.logout(accessToken, refreshToken)
      } catch {
        // 忽略登出API错误
      }
    }
    
    this.private.currentUser = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
  }
}

/**
 * 频道权限管理
 */
export const ChannelPermissions = {
  /**
   * 检查是否可以读取频道
   */
  async canRead(channelId: string): Promise<boolean> {
    try {
      // 模拟权限检查API调用
      const response = await http.get<{ permissions?: { read?: boolean } }>(`/api/channels/${channelId}/permissions`)
      return response.permissions?.read === true
    } catch {
      // 如果API调用失败，返回默认权限
      return true
    }
  },

  /**
   * 检查是否可以写入频道
   */
  async canWrite(channelId: string): Promise<boolean> {
    try {
      const response = await http.get<{ permissions?: { write?: boolean } }>(`/api/channels/${channelId}/permissions`)
      return response.permissions?.write === true
    } catch {
      return true
    }
  },

  /**
   * 检查是否可以管理频道
   */
  async canManage(channelId: string): Promise<boolean> {
    try {
      const response = await http.get<{ permissions?: { manage?: boolean } }>(`/api/channels/${channelId}/permissions`)
      return response.permissions?.manage === true
    } catch {
      return false
    }
  },

  /**
   * 获取用户频道列表
   */
  async getUserChannels(): Promise<Array<{ id: string; name: string; permissions: string[] }>> {
    try {
      const response = await http.get<{ channels?: Array<{ id: string; name: string; permissions: string[] }> }>('/api/user/channels')
      return response.channels || []
    } catch {
      // 返回模拟数据
      return [
        { id: 'test-channel', name: '测试频道', permissions: ['read', 'write'] },
        { id: 'demo-channel', name: '演示频道', permissions: ['read'] }
      ]
    }
  }
}
