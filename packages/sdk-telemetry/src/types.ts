/**
 * 遥测事件类型定义模块
 * 
 * 该模块定义了遥测系统中使用的所有类型接口，包括：
 * - 事件类型枚举
 * - 用户信息接口
 * - 各种具体事件接口
 * - 基础事件结构
 * 
 * 这些类型定义为遥测系统提供了完整的TypeScript类型支持，
 * 确保事件数据的结构一致性和类型安全。
 */

/**
 * 遥测事件类型枚举
 * 
 * 定义了遥测系统支持的所有事件类型，每种类型对应不同的监控场景。
 * 
 * @type {TelemetryEventType}
 * - 'page': 页面浏览事件，用于追踪用户页面访问
 * - 'event': 自定义事件，用于追踪用户行为和业务事件
 * - 'error': 错误事件，用于追踪应用错误和异常
 * - 'api': API调用事件，用于追踪接口调用性能
 * - 'perf': 性能事件，用于追踪应用性能指标
 */
export type TelemetryEventType = 'page' | 'event' | 'error' | 'api' | 'perf'

/**
 * 遥测用户信息接口
 * 
 * 定义了遥测事件中用户相关的信息结构。
 * 这些信息用于用户行为分析和个性化统计。
 */
export interface TelemetryUser {
  /** 
   * 用户唯一标识符
   * 可以是字符串或数字类型，用于标识不同的用户
   */
  id?: string | number
  
  /** 
   * 用户角色
   * 例如：'admin', 'user', 'guest' 等
   */
  role?: string
  
  /** 
   * 扩展属性
   * 允许添加任意的用户相关属性，如姓名、邮箱等
   */
  [key: string]: any
}

/**
 * 遥测事件基础结构接口
 * 
 * 所有遥测事件的基础接口，包含了所有事件类型共有的字段。
 * 具体的事件类型会基于此接口进行扩展。
 */
export interface TelemetryEvent {
  /** 
   * 事件类型
   * 决定了事件的处理方式和分析维度
   */
  type: TelemetryEventType
  
  /** 
   * 事件名称
   * 事件的具体标识，如页面路径、错误名称、API端点等
   */
  name: string
  
  /** 
   * 事件时间戳
   * 记录事件发生的确切时间，使用Unix时间戳（毫秒）
   */
  ts: number
  
  /** 
   * 应用名称
   * 标识事件来源的应用程序
   */
  app: string
  
  /** 
   * 应用版本号
   * 用于版本间的数据对比和问题定位
   */
  release: string
  
  /** 
   * 用户信息
   * 可选字段，包含事件关联的用户信息
   */
  user?: TelemetryUser
  
  /** 
   * 事件属性
   * 可选的扩展属性，用于存储事件相关的额外信息
   */
  props?: Record<string, any>
  
  /** 
   * 事件唯一标识符
   * 可选字段，用于事件去重和关联
   */
  id?: string
  
  /** 
   * 会话标识符
   * 可选字段，用于关联同一会话内的事件
   */
  sessionId?: string
}

/**
 * 页面浏览事件接口
 * 
 * 用于追踪用户的页面访问行为，包括页面路径、标题、来源等信息。
 * 这是最常见的遥测事件类型，用于分析用户的浏览路径和页面热度。
 * 
 * @extends TelemetryEvent
 */
export interface PageViewEvent extends TelemetryEvent {
  /** 固定为'page'，标识这是一个页面浏览事件 */
  type: 'page'
  
  /** 
   * 页面路由名称或路径
   * 例如：'/dashboard', '/user/profile', 'home' 等
   */
  name: string
  
  /** 页面浏览相关的扩展属性 */
  props?: {
    /** 完整的页面URL地址 */
    url?: string
    /** 页面标题 */
    title?: string
    /** 来源页面地址（referrer） */
    referrer?: string
    /** 其他页面相关的自定义属性 */
    [key: string]: any
  }
}

/**
 * 自定义事件接口
 * 
 * 用于追踪应用中的自定义用户行为和业务事件。
 * 这是最灵活的事件类型，可以用于追踪任何自定义的用户操作。
 * 
 * @extends TelemetryEvent
 */
export interface CustomEvent extends TelemetryEvent {
  /** 固定为'event'，标识这是一个自定义事件 */
  type: 'event'
  
  /** 
   * 自定义事件名称
   * 例如：'button_click', 'form_submit', 'video_play' 等
   */
  name: string
  
  /** 
   * 事件相关的自定义属性
   * 可以包含任意的事件相关数据
   */
  props?: Record<string, any>
}

/**
 * 错误事件接口
 * 
 * 用于追踪应用中发生的错误和异常情况。
 * 包含详细的错误信息，有助于问题定位和错误分析。
 * 
 * @extends TelemetryEvent
 */
export interface ErrorEvent extends TelemetryEvent {
  /** 固定为'error'，标识这是一个错误事件 */
  type: 'error'
  
  /** 
   * 错误名称或类型
   * 例如：'TypeError', 'NetworkError', 'ValidationError' 等
   */
  name: string
  
  /** 错误相关的详细信息 */
  props?: {
    /** 错误消息描述 */
    message?: string
    /** 错误堆栈跟踪信息 */
    stack?: string
    /** 发生错误的文件名 */
    filename?: string
    /** 错误发生的行号 */
    lineno?: number
    /** 错误发生的列号 */
    colno?: number
    /** 其他错误相关的自定义属性 */
    [key: string]: any
  }
}

/**
 * API调用事件接口
 * 
 * 用于追踪应用中的API调用性能和状态。
 * 包含请求方法、响应状态、耗时等信息，用于API性能监控。
 * 
 * @extends TelemetryEvent
 */
export interface ApiEvent extends TelemetryEvent {
  /** 固定为'api'，标识这是一个API调用事件 */
  type: 'api'
  
  /** 
   * API路径或端点
   * 例如：'/api/users', '/api/orders/123' 等
   */
  name: string
  
  /** API调用相关的性能和状态信息 */
  props?: {
    /** HTTP请求方法，如 'GET', 'POST', 'PUT' 等 */
    method?: string
    /** HTTP响应状态码，如 200, 404, 500 等 */
    status?: number
    /** 请求耗时（毫秒） */
    duration?: number
    /** 其他API调用相关的自定义属性 */
    [key: string]: any
  }
}

/**
 * 性能事件接口
 * 
 * 用于追踪应用的性能指标，如加载时间、渲染时间、FCP、LCP等。
 * 这些数据用于性能分析和优化决策。
 * 
 * @extends TelemetryEvent
 */
export interface PerfEvent extends TelemetryEvent {
  /** 固定为'perf'，标识这是一个性能事件 */
  type: 'perf'
  
  /** 
   * 性能指标名称
   * 例如：'page_load', 'first_paint', 'dom_ready', 'lcp', 'fid' 等
   */
  name: string
  
  /** 性能指标相关的数据 */
  props?: {
    /** 性能指标的数值（通常为时间，单位毫秒） */
    value?: number
    /** 性能评级，如 'good', 'needs-improvement', 'poor' */
    rating?: string
    /** 其他性能相关的自定义属性 */
    [key: string]: any
  }
}