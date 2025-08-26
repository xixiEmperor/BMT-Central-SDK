/**
 * HTTP插件系统类型定义模块
 * 
 * 定义了HTTP插件系统的核心类型和接口规范：
 * - 标准化的插件接口定义
 * - 完整的生命周期钩子支持
 * - 类型安全的扩展机制
 * - 灵活的异步处理支持
 * 
 * 设计原则：
 * - 最小化接口，最大化灵活性
 * - 支持函数式和面向对象的插件实现
 * - 完整的类型推导和智能提示
 * - 向后兼容和可扩展性
 * 
 * 插件系统架构：
 * - 基于中间件模式设计
 * - 支持请求/响应/错误的完整生命周期
 * - 允许插件链式组合和优先级控制
 * - 提供初始化和清理机制
 * 
 * 应用场景：
 * - 认证和授权处理
 * - 请求/响应数据转换
 * - 错误处理和重试机制
 * - 性能监控和日志记录
 * - 缓存和数据去重
 * - 限流和熔断保护
 */

// 导入 axios 相关类型，保持与现有生态系统的兼容性
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * HTTP插件核心接口
 * 
 * 定义了插件的标准结构和完整生命周期钩子函数
 * 插件可以在HTTP请求的不同阶段介入处理，实现各种功能扩展
 * 
 * 生命周期顺序：
 * 1. setup() - 插件安装时调用
 * 2. onRequest() - 每个请求发送前调用
 * 3. onResponse() - 请求成功时调用（与onError互斥）
 * 4. onError() - 请求失败时调用（与onResponse互斥）
 * 5. teardown() - 插件卸载时调用
 * 
 * 插件特性：
 * - 所有钩子函数都是可选的，插件可以只实现需要的部分
 * - 支持同步和异步处理，提供最大的实现灵活性
 * - 类型安全，支持泛型和完整的TypeScript类型推导
 * - 错误隔离，单个插件的错误不会影响其他插件
 */
export interface HttpPlugin {
  /** 
   * 插件唯一标识名称
   * 
   * 用于标识和管理插件，建议使用描述性的名称
   * 可用于插件的启用/禁用控制、日志记录、调试等
   * 
   * 命名建议：
   * - 使用kebab-case格式（如'auth', 'rate-limit'）
   * - 避免与其他插件冲突
   * - 体现插件的主要功能
   * 
   * @example
   * ```typescript
   * name: 'auth'              // 认证插件
   * name: 'rate-limit'        // 限流插件
   * name: 'circuit-breaker'   // 熔断器插件
   * name: 'custom-headers'    // 自定义头插件
   * ```
   */
  name: string
  
  /** 
   * 请求前处理钩子（可选）
   * 
   * 在HTTP请求发送前调用，允许插件修改请求配置
   * 这是插件影响请求行为的主要入口点
   * 
   * 常见用途：
   * - 添加认证头（Authorization、API Key等）
   * - 修改请求URL或参数
   * - 设置超时时间和重试配置
   * - 添加自定义请求头
   * - 请求数据序列化和转换
   * - 请求拦截和条件阻止
   * 
   * 执行时机：
   * - 在请求实际发送之前
   * - 在所有插件的onRequest按注册顺序依次执行
   * - 每次请求都会调用（包括重试）
   * 
   * @param config 原始Axios请求配置对象
   * @returns 修改后的请求配置（支持同步返回或Promise异步返回）
   * 
   * @example
   * ```typescript
   * // 同步修改请求配置
   * onRequest: (config) => {
   *   config.headers = config.headers || {};
   *   config.headers['X-Custom-Header'] = 'custom-value';
   *   return config;
   * }
   * 
   * // 异步修改请求配置
   * onRequest: async (config) => {
   *   const token = await getAuthToken();
   *   config.headers = config.headers || {};
   *   config.headers['Authorization'] = `Bearer ${token}`;
   *   return config;
   * }
   * 
   * // 条件性修改
   * onRequest: (config) => {
   *   if (config.url?.startsWith('/api/secure/')) {
   *     config.headers = config.headers || {};
   *     config.headers['X-Security-Level'] = 'high';
   *   }
   *   return config;
   * }
   * ```
   */
  onRequest?(config: AxiosRequestConfig): AxiosRequestConfig | Promise<AxiosRequestConfig>
  
  /** 
   * 成功响应处理钩子（可选）
   * 
   * 在HTTP请求成功完成后调用，允许插件处理和转换响应数据
   * 与onError钩子互斥，只有在请求成功时才会调用
   * 
   * 常见用途：
   * - 响应数据转换和格式化
   * - 数据解密和反序列化
   * - 缓存响应数据
   * - 记录成功请求的指标
   * - 提取和处理响应头信息
   * - 业务数据验证和清洗
   * 
   * 执行时机：
   * - 在收到HTTP响应且状态码表示成功时
   * - 在所有插件的onResponse按注册顺序依次执行
   * - 最终返回值将作为最终的响应数据
   * 
   * 注意事项：
   * - 返回值会覆盖原始响应数据
   * - 如果抛出异常，会转到错误处理流程
   * - 支持链式数据转换（上一个插件的输出作为下一个插件的输入）
   * 
   * @template T 响应数据的类型
   * @param response 原始Axios响应对象，包含数据、状态码、头部等信息
   * @returns 处理后的响应数据（支持同步返回或Promise异步返回）
   * 
   * @example
   * ```typescript
   * // 基础数据提取
   * onResponse: (response) => {
   *   return response.data;
   * }
   * 
   * // 数据格式转换
   * onResponse: (response) => {
   *   const data = response.data;
   *   if (data && typeof data === 'object') {
   *     // 将snake_case转换为camelCase
   *     return convertKeysToCamelCase(data);
   *   }
   *   return data;
   * }
   * 
   * // 异步数据处理
   * onResponse: async (response) => {
   *   const data = response.data;
   *   if (data.encrypted) {
   *     const decrypted = await decryptData(data.payload);
   *     return { ...data, payload: decrypted };
   *   }
   *   return data;
   * }
   * 
   * // 业务数据验证
   * onResponse: (response) => {
   *   const data = response.data;
   *   if (!isValidBusinessData(data)) {
   *     throw new Error('Invalid business data received');
   *   }
   *   return data;
   * }
   * 
   * // 条件性处理
   * onResponse: (response) => {
   *   const config = response.config;
   *   if (config.url?.includes('/api/cached/')) {
   *     // 缓存API响应
   *     cacheResponse(config.url, response.data);
   *   }
   *   return response.data;
   * }
   * ```
   */
  onResponse?<T = any>(response: AxiosResponse<T>): T | Promise<T>
  
  /** 
   * 错误处理钩子（可选）
   * 
   * 在HTTP请求发生错误时调用，允许插件进行错误处理、转换或恢复
   * 与onResponse钩子互斥，只有在请求失败时才会调用
   * 
   * 常见用途：
   * - 错误信息标准化和转换
   * - 特定错误的自动重试
   * - 错误日志记录和上报
   * - 认证错误的自动处理（如token刷新）
   * - 业务错误码的统一处理
   * - 错误降级和兜底策略
   * 
   * 执行时机：
   * - 在HTTP请求失败或抛出异常时
   * - 在所有插件的onError按注册顺序依次执行
   * - 如果插件处理了错误而不重新抛出，错误处理链会终止
   * 
   * 错误处理策略：
   * - 转换错误：修改错误信息但继续抛出
   * - 恢复错误：处理错误并返回正常值
   * - 透传错误：记录日志但不修改错误
   * - 阻止错误：完全处理错误，不向上传播
   * 
   * @param error 错误对象，可能包含响应信息、请求配置等
   * @throws 处理后的错误（支持同步抛出或Promise异步抛出）
   * @returns never（表示总是抛出错误）或Promise<never>
   * 
   * @example
   * ```typescript
   * // 错误信息标准化
   * onError: (error) => {
   *   const standardError = {
   *     code: error.response?.status || 'NETWORK_ERROR',
   *     message: error.response?.data?.message || error.message,
   *     details: error.response?.data
   *   };
   *   throw standardError;
   * }
   * 
   * // 认证错误自动处理
   * onError: async (error) => {
   *   if (error.response?.status === 401) {
   *     try {
   *       await refreshAuthToken();
   *       // 可以选择重新发起请求或让上层处理
   *       throw new Error('AUTH_TOKEN_REFRESHED');
   *     } catch (refreshError) {
   *       // 刷新失败，跳转登录页
   *       window.location.href = '/login';
   *       throw new Error('AUTH_FAILED');
   *     }
   *   }
   *   throw error;
   * }
   * 
   * // 错误日志记录
   * onError: (error) => {
   *   console.error('API Error:', {
   *     url: error.config?.url,
   *     method: error.config?.method,
   *     status: error.response?.status,
   *     message: error.message
   *   });
   *   
   *   // 发送错误报告到监控系统
   *   sendErrorReport(error);
   *   
   *   // 继续抛出原始错误
   *   throw error;
   * }
   * 
   * // 业务错误处理和降级
   * onError: (error) => {
   *   const status = error.response?.status;
   *   const businessCode = error.response?.data?.code;
   *   
   *   // 处理特定的业务错误码
   *   if (businessCode === 'QUOTA_EXCEEDED') {
   *     throw new Error('您的配额已用完，请升级套餐');
   *   }
   *   
   *   // 服务器错误时提供友好提示
   *   if (status && status >= 500) {
   *     throw new Error('服务暂时不可用，请稍后重试');
   *   }
   *   
   *   throw error;
   * }
   * ```
   */
  onError?(error: any): never | Promise<never>
  
  /** 
   * 插件初始化钩子（可选）
   * 
   * 在插件被注册到HTTP客户端时调用，用于执行一次性的初始化逻辑
   * 这是插件生命周期的第一个阶段，适合进行资源分配和配置验证
   * 
   * 常见用途：
   * - 验证插件配置的有效性
   * - 初始化外部资源（连接、缓存等）
   * - 设置定时器或事件监听器
   * - 预加载必要的数据或配置
   * - 插件间的依赖检查
   * - 环境兼容性检测
   * 
   * 执行时机：
   * - 在插件被添加到HTTP客户端时立即执行
   * - 在任何HTTP请求发送之前
   * - 按插件注册顺序依次执行
   * - 只执行一次（除非插件被重新注册）
   * 
   * 错误处理：
   * - 如果setup抛出异常，插件注册失败
   * - 建议在setup中处理所有可能的错误情况
   * - 可以通过抛出异常来阻止插件的使用
   * 
   * @returns void或Promise<void>
   * 
   * @example
   * ```typescript
   * // 同步初始化
   * setup: () => {
   *   console.log('插件初始化完成');
   *   validateConfig(this.options);
   * }
   * 
   * // 异步初始化
   * setup: async () => {
   *   // 初始化外部连接
   *   await connectToCache();
   *   
   *   // 预加载配置
   *   const config = await loadRemoteConfig();
   *   this.config = config;
   *   
   *   console.log('异步初始化完成');
   * }
   * 
   * // 带错误处理的初始化
   * setup: async () => {
   *   try {
   *     await initializePlugin();
   *   } catch (error) {
   *     console.error('插件初始化失败:', error);
   *     throw new Error('插件无法正常工作');
   *   }
   * }
   * 
   * // 环境检查
   * setup: () => {
   *   if (typeof window === 'undefined') {
   *     throw new Error('此插件仅支持浏览器环境');
   *   }
   *   
   *   if (!window.localStorage) {
   *     console.warn('localStorage不可用，某些功能可能受限');
   *   }
   * }
   * ```
   */
  setup?(): void | Promise<void>
  
  /** 
   * 插件销毁钩子（可选）
   * 
   * 在插件被从HTTP客户端卸载时调用，用于清理资源和执行收尾工作
   * 这是插件生命周期的最后阶段，确保没有资源泄漏
   * 
   * 常见用途：
   * - 关闭外部连接（数据库、缓存、WebSocket等）
   * - 清理定时器和事件监听器
   * - 保存状态数据到持久化存储
   * - 释放内存和其他系统资源
   * - 取消未完成的异步操作
   * - 发送最终的统计或日志数据
   * 
   * 执行时机：
   * - 在插件被从HTTP客户端移除时
   * - 在应用程序关闭或页面卸载时
   * - 按插件注册顺序的相反顺序执行
   * - 只执行一次（除非插件被重新注册）
   * 
   * 最佳实践：
   * - 确保teardown是幂等的（可重复执行）
   * - 处理异步清理操作的超时情况
   * - 记录清理过程中的错误但不阻止其他插件的清理
   * - 避免在teardown中抛出异常
   * 
   * @returns void或Promise<void>
   * 
   * @example
   * ```typescript
   * // 同步清理
   * teardown: () => {
   *   if (this.timer) {
   *     clearInterval(this.timer);
   *     this.timer = null;
   *   }
   *   console.log('插件已清理');
   * }
   * 
   * // 异步清理
   * teardown: async () => {
   *   // 保存状态数据
   *   await saveStateToStorage(this.state);
   *   
   *   // 关闭外部连接
   *   if (this.connection) {
   *     await this.connection.close();
   *   }
   *   
   *   console.log('异步清理完成');
   * }
   * 
   * // 带错误处理的清理
   * teardown: async () => {
   *   try {
   *     await Promise.all([
   *       this.closeConnections(),
   *       this.saveData(),
   *       this.sendFinalMetrics()
   *     ]);
   *   } catch (error) {
   *     console.warn('清理过程中发生错误:', error);
   *     // 不重新抛出错误，避免影响其他插件的清理
   *   }
   * }
   * 
   * // 超时保护的清理
   * teardown: async () => {
   *   const cleanupPromise = this.performCleanup();
   *   const timeoutPromise = new Promise((_, reject) => {
   *     setTimeout(() => reject(new Error('清理超时')), 5000);
   *   });
   *   
   *   try {
   *     await Promise.race([cleanupPromise, timeoutPromise]);
   *   } catch (error) {
   *     console.warn('强制清理:', error.message);
   *     this.forceCleanup();
   *   }
   * }
   * ```
   */
  teardown?(): void | Promise<void>
}