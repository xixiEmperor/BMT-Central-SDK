/**
 * HTTP遥测插件模块
 * 
 * 提供全面的HTTP请求监控和指标收集功能：
 * - 自动收集API调用指标和性能数据
 * - 可配置的采样率，优化性能开销
 * - 灵活的数据上报机制
 * - 支持详细数据收集和隐私保护
 * 
 * 核心特性：
 * - 实时性能指标监控（响应时间、状态码等）
 * - 智能采样策略，减少数据传输开销
 * - 可选的请求和响应数据收集
 * - 异步数据上报，不影响主请求性能
 * 
 * 监控数据类型：
 * - 基础指标：URL、HTTP方法、状态码、响应时间
 * - 扩展数据：请求参数、响应数据（可选）
 * - 自定义数据：用户ID、会话标识等
 * 
 * 使用场景：
 * - API性能监控和优化
 * - 用户行为分析
 * - 错误追踪和诊断
 * - SLA监控和告警
 * - 业务指标仪表板
 */

import type { HttpPlugin } from './types.js'

/**
 * 遥测插件配置选项接口
 * 定义了数据收集和上报的各种参数
 */
export interface TelemetryPluginOptions {
  /** 
   * 是否启用遥测功能，默认 true
   * 
   * 提供全局开关，可用于生产环境的动态控制
   * 建议根据环境或用户设置进行配置
   * 
   * @example
   * ```typescript
   * enabled: process.env.NODE_ENV === 'production'  // 只在生产环境启用
   * enabled: !window.location.hostname.includes('localhost')  // 非本地开发时启用
   * ```
   */
  enabled?: boolean
  
  /** 
   * 采样率，默认 1.0 (100%)
   * 
   * 控制数据收集的比例，优化性能和带宽使用
   * 值范围：0.0（不收集）到 1.0（全量收集）
   * 
   * 采样策略建议：
   * - 开发环境：1.0（全量收集，便于调试）
   * - 测试环境：0.5-1.0（高采样率，保证质量）
   * - 生产环境：0.01-0.1（低采样率，减少开销）
   * - 高流量系统：0.001-0.01（极低采样率）
   * 
   * @example
   * ```typescript
   * sampleRate: 1.0    // 100%收集，适合开发调试
   * sampleRate: 0.1    // 10%收集，适合中等流量系统
   * sampleRate: 0.01   // 1%收集，适合高流量系统
   * sampleRate: 0.001  // 0.1%收集，适合超高流量系统
   * ```
   */
  sampleRate?: number
  
  /** 
   * API调用数据上报回调函数（可选）
   * 
   * 当API调用完成时被调用，用于将数据发送到分析系统
   * 如果不提供，则仅收集数据但不上报
   * 
   * @param url 请求URL
   * @param method HTTP方法（大写）
   * @param status HTTP状态码
   * @param duration 请求耗时（毫秒）
   * 
   * @example
   * ```typescript
   * // 基本上报
   * onApiCall: (url, method, status, duration) => {
   *   console.log(`API: ${method} ${url} - ${status} (${duration}ms)`);
   * }
   * 
   * // 发送到分析服务
   * onApiCall: async (url, method, status, duration) => {
   *   await fetch('/analytics/api-calls', {
   *     method: 'POST',
   *     headers: { 'Content-Type': 'application/json' },
   *     body: JSON.stringify({ url, method, status, duration, timestamp: Date.now() })
   *   });
   * }
   * 
   * // 集成第三方分析工具
   * onApiCall: (url, method, status, duration) => {
   *   // Google Analytics
   *   gtag('event', 'api_call', {
   *     event_category: 'api',
   *     event_label: `${method} ${url}`,
   *     value: duration,
   *     custom_map: { status }
   *   });
   *   
   *   // 或者使用其他分析SDK
   *   analytics.track('API Call', { url, method, status, duration });
   * }
   * ```
   */
  onApiCall?: (url: string, method: string, status: number, duration: number) => void
  
  /** 
   * 是否在上报中包含请求参数，默认 false
   * 
   * 启用后会将请求参数和请求体传递给onApiCall回调
   * 注意隐私和安全问题，仅在必要时启用
   * 
   * 安全考虑：
   * - 避免收集敏感信息（密码、令牌等）
   * - 遵守GDPR等隐私法规
   * - 考虑数据传输和存储成本
   * 
   * @example
   * ```typescript
   * // 仅在开发环境启用详细数据收集
   * includeParams: process.env.NODE_ENV === 'development'
   * ```
   */
  includeParams?: boolean
  
  /** 
   * 是否在上报中包含响应数据，默认 false
   * 
   * 启用后会将响应数据传递给onApiCall回调
   * 警告：可能包含大量数据，影响性能和带宽
   * 
   * 使用场景：
   * - 错误响应分析
   * - API返回数据结构监控
   * - 业务数据质量检查
   * 
   * @example
   * ```typescript
   * // 仅在错误情况下收集响应数据
   * includeResponse: false,
   * onApiCall: (url, method, status, duration, params, response) => {
   *   if (status >= 400) {
   *     // 只在错误时记录响应数据
   *     console.error('API Error:', { url, method, status, response });
   *   }
   * }
   * ```
   */
  includeResponse?: boolean
}

/**
 * 创建HTTP遥测插件工厂函数
 * 
 * 提供全面的HTTP请求监控和数据收集功能
 * 支持灵活的采样策略和数据上报机制
 * 
 * @param options 遥测插件配置选项
 * @returns HttpPlugin 遥测插件实例
 * 
 * @example
 * ```typescript
 * // 基本使用
 * const telemetry = telemetryPlugin({
 *   onApiCall: (url, method, status, duration) => {
 *     console.log(`API Call: ${method} ${url} - ${status} (${duration}ms)`);
 *   }
 * });
 * 
 * // 生产环境配置
 * const prodTelemetry = telemetryPlugin({
 *   enabled: true,
 *   sampleRate: 0.1,  // 10%采样率
 *   includeParams: false,
 *   includeResponse: false,
 *   onApiCall: async (url, method, status, duration) => {
 *     // 发送到分析服务
 *     try {
 *       await fetch('/api/analytics/track', {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify({
 *           type: 'api_call',
 *           url,
 *           method,
 *           status,
 *           duration,
 *           timestamp: Date.now(),
 *           user_agent: navigator.userAgent,
 *           session_id: getSessionId()
 *         })
 *       });
 *     } catch (error) {
 *       console.warn('遥测数据上报失败:', error);
 *     }
 *   }
 * });
 * 
 * // 开发环境详细监控
 * const devTelemetry = telemetryPlugin({
 *   enabled: process.env.NODE_ENV === 'development',
 *   sampleRate: 1.0,  // 100%采样
 *   includeParams: true,
 *   includeResponse: true,
 *   onApiCall: (url, method, status, duration, params, response) => {
 *     const logData = { url, method, status, duration };
 *     if (params) logData.params = params;
 *     if (response) logData.response = response;
 *     
 *     if (status >= 400) {
 *       console.error('API Error:', logData);
 *     } else {
 *       console.log('API Success:', logData);
 *     }
 *   }
 * });
 * 
 * // 集成第三方分析工具
 * const analyticsIntegration = telemetryPlugin({
 *   onApiCall: (url, method, status, duration) => {
 *     // Google Analytics 4
 *     if (typeof gtag !== 'undefined') {
 *       gtag('event', 'api_request', {
 *         event_category: 'api',
 *         event_label: `${method} ${url}`,
 *         value: Math.round(duration),
 *         custom_map: {
 *           status_code: status,
 *           success: status < 400
 *         }
 *       });
 *     }
 *     
 *     // Segment/Mixpanel/其他分析工具
 *     if (typeof analytics !== 'undefined') {
 *       analytics.track('API Request', {
 *         url,
 *         method,
 *         status,
 *         duration,
 *         success: status < 400,
 *         error: status >= 400
 *       });
 *     }
 *   }
 * });
 * ```
 */
export function telemetryPlugin(options: TelemetryPluginOptions = {}): HttpPlugin {
  // 解构配置选项并设置默认值
  const {
    enabled = true,        // 默认启用
    sampleRate = 1.0,      // 默认100%采样
    onApiCall,             // 数据上报回调
    includeParams = false, // 默认不包含请求参数
    includeResponse = false, // 默认不包含响应数据
  } = options

  /**
   * 采样决策函数
   * 根据配置的采样率随机决定是否收集当前请求的数据
   * 
   * @returns true表示应该收集，false表示跳过
   */
  const shouldSample = (): boolean => {
    return Math.random() < sampleRate
  }

  const plugin: HttpPlugin = {
    name: 'telemetry',
    
    /**
     * 响应后处理：收集成功请求的指标数据
     * 
     * 在HTTP请求成功完成后调用，收集和上报相关指标
     * 包括响应时间、状态码、URL等信息
     */
    async onResponse(resp) {
      // 检查是否启用遥测
      if (!enabled) return resp.data
      
      // 检查是否命中采样
      if (!shouldSample()) return resp.data
      
      // 提取请求和响应信息
      const config = resp.config
      const url = config?.url ?? ''                           // 请求URL
      const method = (config?.method ?? 'GET').toUpperCase()   // HTTP方法（大写）
      const duration = (resp as any).duration ?? 0             // 响应时间（由HTTP客户端设置）
      const status = resp.status                               // HTTP状态码
      
      // 收集可选的额外数据
      let params: any = undefined
      let response: any = undefined
      
      if (includeParams) {
        // 收集请求参数（查询参数和请求体）
        params = {
          query: config?.params,
          body: config?.data
        }
      }
      
      if (includeResponse) {
        // 收集响应数据（注意数据量和隐私问题）
        response = resp.data
      }
      
      // 调用用户提供的上报回调
      if (onApiCall) {
        try {
          // 支持扩展参数（向后兼容）
          if (includeParams || includeResponse) {
            // 扩展版本：包含额外数据
            ;(onApiCall as any)(url, method, status, duration, params, response)
          } else {
            // 基础版本：只包含核心指标
            onApiCall(url, method, status, duration)
          }
        } catch (error) {
          // 静默忽略上报错误，避免影响主请求
          console.warn('遥测数据上报失败:', error)
        }
      }
      
      // 返回响应数据，保持数据流不变
      return resp.data
    },
    
    // 注意：当前版本不在onError中处理错误指标
    // 未来可以扩展支持错误监控：
    // async onError(error) {
    //   if (enabled && shouldSample() && onApiCall) {
    //     const config = error.config;
    //     const url = config?.url ?? '';
    //     const method = (config?.method ?? 'GET').toUpperCase();
    //     const status = error.response?.status ?? 0;
    //     const duration = error.response?.duration ?? 0;
    //     onApiCall(url, method, status, duration);
    //   }
    //   throw error;
    // }
  }

  return plugin
}