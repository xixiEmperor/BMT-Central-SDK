/**
 * 事件构建器
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
 */
export function createPageEvent(
  routeName: string, 
  props?: Record<string, any>
): Partial<PageViewEvent> {
  return {
    type: 'page',
    name: routeName,
    props: {
      url: window?.location?.href,
      title: document?.title,
      referrer: document?.referrer,
      ...props,
    },
  }
}

/**
 * 创建自定义事件
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
 * 创建 API 事件
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