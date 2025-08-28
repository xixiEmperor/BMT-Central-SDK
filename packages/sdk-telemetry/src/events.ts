/**
 * 遥测事件构建器模块
 * 
 * 该模块提供了一系列工厂函数，用于创建标准化的遥测事件对象。
 * 这些函数简化了事件创建过程，确保事件数据的一致性和完整性。
 * 
 * 主要功能：
 * - 提供各种事件类型的快速创建函数
 * - 自动填充常见的事件属性
 * - 确保事件结构的标准化
 * - 支持自定义属性扩展
 * 
 * 所有构建器函数返回部分事件对象，需要在Telemetry类中补充
 * app、release、ts、id等字段后才能成为完整的遥测事件。
 */

import type { 
  TelemetryEvent, 
  PageViewEvent, 
  CustomEvent, 
  ErrorEvent, 
  ApiEvent, 
  PerfEvent 
} from './types.js'

/**
 * 创建页面浏览事件
 * 
 * 用于追踪用户的页面访问行为。会自动获取当前页面的URL、标题、
 * 来源页面等信息，并支持通过props参数添加额外的页面相关数据。
 * 
 * @param {string} routeName 页面路由名称或路径标识
 * @param {Record<string, any>} [props] 额外的页面相关属性
 * @returns {Partial<PageViewEvent>} 部分页面浏览事件对象
 * 
 * @example
 * ```typescript
 * // 创建简单的页面浏览事件
 * const pageEvent = createPageEvent('/dashboard');
 * 
 * // 创建带有自定义属性的页面浏览事件
 * const pageEvent = createPageEvent('/user/profile', {
 *   userId: '12345',
 *   section: 'personal-info',
 *   loadTime: 1200
 * });
 * ```
 */
export function createPageEvent(
  routeName: string, 
  props?: Record<string, any>
): Partial<PageViewEvent> {
  return {
    type: 'page',
    name: routeName,
    props: {
      // 自动获取当前页面信息
      url: window?.location?.href,        // 完整URL
      title: document?.title,             // 页面标题
      referrer: document?.referrer,       // 来源页面
      // 合并用户提供的自定义属性
      ...props,
    },
  }
}

/**
 * 创建自定义事件
 * 
 * 用于追踪应用中的自定义用户行为和业务事件。
 * 这是最灵活的事件类型，可以用于任何需要追踪的用户操作。
 * 
 * @param {string} name 事件名称，建议使用描述性的命名
 * @param {Record<string, any>} [props] 事件相关的自定义属性
 * @returns {Partial<CustomEvent>} 部分自定义事件对象
 * 
 * @example
 * ```typescript
 * // 追踪按钮点击
 * const clickEvent = createCustomEvent('button_click', {
 *   buttonId: 'submit-form',
 *   buttonText: '提交',
 *   formType: 'user-registration'
 * });
 * 
 * // 追踪功能使用
 * const featureEvent = createCustomEvent('feature_used', {
 *   feature: 'dark-mode',
 *   enabled: true,
 *   source: 'settings-page'
 * });
 * ```
 */
export function createCustomEvent(
  name: string, 
  props?: Record<string, any>
): Partial<CustomEvent> {
  return {
    type: 'event',
    name,
    props,
  }
}

/**
 * 创建错误事件
 * 
 * 用于追踪应用中发生的错误和异常。支持详细的错误信息记录，
 * 包括错误消息、堆栈跟踪等，有助于问题定位和修复。
 * 
 * @param {string} name 错误名称或类型
 * @param {string} [message] 错误消息描述
 * @param {string} [stack] 错误堆栈跟踪信息
 * @param {Record<string, any>} [props] 其他错误相关属性
 * @returns {Partial<ErrorEvent>} 部分错误事件对象
 * 
 * @example
 * ```typescript
 * // 创建基础错误事件
 * const errorEvent = createErrorEvent(
 *   'NetworkError',
 *   'Failed to fetch user data',
 *   error.stack
 * );
 * 
 * // 创建带有详细上下文的错误事件
 * const errorEvent = createErrorEvent(
 *   'ValidationError',
 *   'Invalid email format',
 *   undefined,
 *   {
 *     field: 'email',
 *     value: 'invalid-email',
 *     component: 'RegistrationForm'
 *   }
 * );
 * ```
 */
export function createErrorEvent(
  name: string,
  message?: string,
  stack?: string,
  props?: Record<string, any>
): Partial<ErrorEvent> {
  return {
    type: 'error',
    name,
    props: {
      message,
      stack,
      ...props,
    },
  }
}

/**
 * 创建API调用事件
 * 
 * 用于追踪应用中的API调用性能和状态。记录请求的详细信息，
 * 包括URL、方法、状态码、耗时等，用于API性能监控和分析。
 * 
 * @param {string} url API路径或完整URL
 * @param {string} method HTTP请求方法
 * @param {number} status HTTP响应状态码
 * @param {number} duration 请求耗时（毫秒）
 * @param {Record<string, any>} [props] 其他API相关属性
 * @returns {Partial<ApiEvent>} 部分API事件对象
 * 
 * @example
 * ```typescript
 * // 创建API调用事件
 * const apiEvent = createApiEvent(
 *   '/api/users/123',
 *   'GET',
 *   200,
 *   250
 * );
 * 
 * // 创建带有额外信息的API事件
 * const apiEvent = createApiEvent(
 *   '/api/orders',
 *   'POST',
 *   201,
 *   800,
 *   {
 *     requestSize: 1024,
 *     responseSize: 512,
 *     cacheHit: false,
 *     retryCount: 0
 *   }
 * );
 * ```
 */
export function createApiEvent(
  url: string,
  method: string,
  status: number,
  duration: number,
  props?: Record<string, any>
): Partial<ApiEvent> {
  return {
    type: 'api',
    name: url,
    props: {
      method,
      status,
      duration,
      ...props,
    },
  }
}

/**
 * 创建性能事件
 * 
 * 用于追踪应用的性能指标，如页面加载时间、渲染时间、
 * Core Web Vitals等。这些数据用于性能分析和优化决策。
 * 
 * @param {string} name 性能指标名称
 * @param {number} value 性能指标数值（通常为时间，单位毫秒）
 * @param {string} [rating] 性能评级，如 'good', 'needs-improvement', 'poor'
 * @param {Record<string, any>} [props] 其他性能相关属性
 * @returns {Partial<PerfEvent>} 部分性能事件对象
 * 
 * @example
 * ```typescript
 * // 创建页面加载性能事件
 * const perfEvent = createPerfEvent(
 *   'page_load',
 *   1200,
 *   'good'
 * );
 * 
 * // 创建Core Web Vitals事件
 * const lcpEvent = createPerfEvent(
 *   'largest_contentful_paint',
 *   2500,
 *   'needs-improvement',
 *   {
 *     element: 'main-banner',
 *     renderType: 'image',
 *     cacheStatus: 'miss'
 *   }
 * );
 * ```
 */
export function createPerfEvent(
  name: string,
  value: number,
  rating?: string,
  props?: Record<string, any>
): Partial<PerfEvent> {
  return {
    type: 'perf',
    name,
    props: {
      value,
      rating,
      ...props,
    },
  }
}