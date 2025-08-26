/**
 * HTTP模拟插件模块
 * 
 * 提供完整的HTTP请求模拟功能，支持复杂的模拟场景：
 * - 基于请求特征的灵活路由匹配
 * - 动态响应数据生成
 * - 可配置的延迟和状态码
 * - 与真实HTTP行为完全一致的模拟
 * 
 * 核心特性：
 * - 使用Axios适配器机制，完全短路HTTP请求
 * - 支持同步和异步响应数据生成
 * - 可配置的网络延迟模拟
 * - 自定义HTTP状态码和响应头
 * - 支持复杂的请求匹配逻辑
 * 
 * 使用场景：
 * - 开发阶段的API模拟
 * - 单元测试和集成测试
 * - 演示和原型开发
 * - 离线开发支持
 * - API契约测试
 * 
 * 技术实现：
 * - 利用Axios的adapter机制完全拦截请求
 * - 生成符合AxiosResponse格式的模拟响应
 * - 保持与真实请求相同的数据流和错误处理
 */

import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import type { HttpPlugin } from './types.js'

/**
 * 模拟路由配置接口
 * 定义单个API端点的模拟行为
 */
export interface MockRoute {
  /** 
   * 请求匹配判断函数
   * 
   * 根据请求配置判断是否命中当前路由
   * 支持基于URL、方法、参数、头部等任意条件的匹配
   * 
   * @param config Axios请求配置对象
   * @returns true表示命中此路由，false表示继续匹配下一个
   * 
   * @example
   * ```typescript
   * // 精确URL匹配
   * test: (config) => config.url === '/api/users'
   * 
   * // 正则表达式匹配
   * test: (config) => /^\/api\/users\/\d+$/.test(config.url || '')
   * 
   * // 方法和URL组合匹配
   * test: (config) => config.method === 'POST' && config.url === '/api/users'
   * 
   * // 基于请求参数匹配
   * test: (config) => {
   *   const { params } = config;
   *   return config.url === '/api/search' && params?.type === 'user';
   * }
   * 
   * // 基于请求头匹配
   * test: (config) => {
   *   return config.headers?.['X-API-Version'] === 'v2';
   * }
   * ```
   */
  test: (config: AxiosRequestConfig) => boolean
  
  /** 
   * 响应数据生成函数
   * 
   * 根据请求配置生成响应数据
   * 支持同步和异步数据生成，可以模拟复杂的业务逻辑
   * 
   * @param config Axios请求配置对象
   * @returns 响应数据（可以是任意类型）
   * 
   * @example
   * ```typescript
   * // 静态响应数据
   * response: () => ({ id: 1, name: 'John Doe' })
   * 
   * // 基于请求参数的动态响应
   * response: (config) => {
   *   const userId = config.url?.split('/').pop();
   *   return { id: userId, name: `User ${userId}` };
   * }
   * 
   * // 异步响应数据生成
   * response: async (config) => {
   *   await new Promise(resolve => setTimeout(resolve, 100));
   *   return { message: 'Async response' };
   * }
   * 
   * // 基于请求体的响应
   * response: (config) => {
   *   if (config.method === 'POST') {
   *     return { ...config.data, id: Date.now() };
   *   }
   *   return { message: 'OK' };
   * }
   * 
   * // 模拟分页响应
   * response: (config) => {
   *   const page = config.params?.page || 1;
   *   const size = config.params?.size || 10;
   *   return {
   *     data: Array(size).fill(null).map((_, i) => ({ id: (page-1)*size + i + 1 })),
   *     total: 100,
   *     page,
   *     size
   *   };
   * }
   * ```
   */
  response: (config: AxiosRequestConfig) => any | Promise<any>
  
  /** 
   * HTTP状态码，默认 200
   * 
   * 设置模拟响应的HTTP状态码
   * 可以模拟各种HTTP状态，包括错误状态
   * 
   * @example
   * ```typescript
   * status: 200  // 成功
   * status: 201  // 创建成功
   * status: 400  // 客户端错误
   * status: 401  // 未授权
   * status: 404  // 未找到
   * status: 500  // 服务器错误
   * ```
   */
  status?: number
  
  /** 
   * 响应延迟时间（毫秒），可选
   * 
   * 模拟网络延迟，用于测试异步行为和加载状态
   * 
   * @example
   * ```typescript
   * delayMs: 100   // 100ms延迟，模拟快速网络
   * delayMs: 1000  // 1秒延迟，模拟慢速网络
   * delayMs: 3000  // 3秒延迟，模拟超慢网络或测试超时
   * ```
   */
  delayMs?: number
  
  /** 
   * 额外的HTTP响应头，可选
   * 
   * 设置自定义的响应头，模拟真实API的行为
   * 
   * @example
   * ```typescript
   * headers: {
   *   'Content-Type': 'application/json',
   *   'X-Rate-Limit': '100',
   *   'X-Total-Count': '50'
   * }
   * ```
   */
  headers?: Record<string, string>
}

/**
 * 模拟插件配置选项接口
 */
export interface MockPluginOptions {
  /** 
   * 是否启用模拟功能，默认true
   * 
   * 可以用于动态开关模拟功能
   * 在生产环境可以设置为false来禁用模拟
   */
  enabled?: boolean
  
  /** 
   * 模拟路由配置列表
   * 
   * 按照数组顺序进行匹配，第一个匹配的路由生效
   * 建议将更具体的路由放在前面，通用的路由放在后面
   */
  routes: MockRoute[]
}

/**
 * 创建HTTP模拟插件工厂函数
 * 
 * 基于Axios适配器机制的请求模拟实现
 * 提供完整的HTTP请求拦截和响应模拟功能
 * 
 * @param options 模拟插件配置选项
 * @returns HttpPlugin 模拟插件实例
 * 
 * @example
 * ```typescript
 * // 基本用法
 * const mock = mockPlugin({
 *   routes: [
 *     {
 *       test: (config) => config.url === '/api/users',
 *       response: () => [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
 *     }
 *   ]
 * });
 * 
 * // 复杂模拟场景
 * const advancedMock = mockPlugin({
 *   enabled: process.env.NODE_ENV === 'development',
 *   routes: [
 *     // 用户列表API
 *     {
 *       test: (config) => config.method === 'GET' && config.url === '/api/users',
 *       response: (config) => {
 *         const page = parseInt(config.params?.page || '1');
 *         const size = parseInt(config.params?.size || '10');
 *         return {
 *           data: Array(size).fill(null).map((_, i) => ({
 *             id: (page - 1) * size + i + 1,
 *             name: `User ${(page - 1) * size + i + 1}`,
 *             email: `user${(page - 1) * size + i + 1}@example.com`
 *           })),
 *           total: 100,
 *           page,
 *           size
 *         };
 *       },
 *       delayMs: 500,  // 模拟网络延迟
 *       headers: { 'X-Total-Count': '100' }
 *     },
 *     
 *     // 用户详情API
 *     {
 *       test: (config) => /^\/api\/users\/\d+$/.test(config.url || ''),
 *       response: (config) => {
 *         const userId = config.url?.split('/').pop();
 *         return {
 *           id: parseInt(userId || '0'),
 *           name: `User ${userId}`,
 *           email: `user${userId}@example.com`,
 *           createdAt: new Date().toISOString()
 *         };
 *       },
 *       delayMs: 200
 *     },
 *     
 *     // 创建用户API
 *     {
 *       test: (config) => config.method === 'POST' && config.url === '/api/users',
 *       response: (config) => ({
 *         ...config.data,
 *         id: Date.now(),
 *         createdAt: new Date().toISOString()
 *       }),
 *       status: 201,
 *       delayMs: 300
 *     },
 *     
 *     // 错误模拟
 *     {
 *       test: (config) => config.url === '/api/error',
 *       response: () => ({ error: 'Internal Server Error' }),
 *       status: 500,
 *       delayMs: 100
 *     },
 *     
 *     // 认证错误模拟
 *     {
 *       test: (config) => config.url === '/api/protected' && !config.headers?.Authorization,
 *       response: () => ({ error: 'Unauthorized' }),
 *       status: 401
 *     }
 *   ]
 * });
 * 
 * // 在HTTP客户端中使用
 * const client = createHttpClient({
 *   plugins: [mock, auth, retry]
 * });
 * ```
 */
export function mockPlugin(options: MockPluginOptions): HttpPlugin {
  // 解构配置选项
  const { enabled = true, routes } = options
  
  return {
    name: 'mock',
    
    /**
     * 请求前处理：请求拦截和模拟响应生成
     * 
     * 核心模拟逻辑：
     * 1. 检查是否启用模拟功能
     * 2. 遍历路由配置查找匹配的路由
     * 3. 如果找到匹配路由，替换Axios适配器
     * 4. 生成模拟响应数据
     * 5. 模拟网络延迟
     * 6. 返回符合Axios格式的响应对象
     */
    async onRequest(config) {
      // 检查是否启用模拟功能
      if (!enabled) return config
      
      // 查找匹配的模拟路由（第一个匹配的路由生效）
      const matched = routes.find(r => r.test(config))
      if (!matched) return config
      
      // 提取路由配置
      const { delayMs = 0, status = 200, headers = {} } = matched
      
      // 保存原始适配器（用于调试或恢复）
      const originalAdapter = (config as any).adapter
      
      // 替换Axios适配器为模拟适配器
      ;(config as any).adapter = async () => {
        // 调用响应生成函数，支持同步和异步
        const data = await matched.response(config)
        
        // 模拟网络延迟
        if (delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }
        
        // 构造符合AxiosResponse格式的响应对象
        const resp = {
          data,                    // 响应数据
          status,                  // HTTP状态码
          statusText: String(status), // 状态文本
          headers,                 // 响应头
          config: config as any,   // 请求配置
          request: null,           // 请求对象（模拟时为null）
        } as any as AxiosResponse
        
        return resp
      }
      
      // 添加模拟标记，供其他插件或调试使用
      ;(config as any).__mocked = true
      ;(config as any).__originalAdapter = originalAdapter
      
      return config
    },
  }
}

