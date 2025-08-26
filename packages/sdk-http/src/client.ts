/**
 * HTTP 客户端主入口
 * 提供统一的 HTTP 请求接口，支持插件系统、请求去重、重试机制等功能
 */

// 导入 axios 相关类型和工具函数
import axios, { isAxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
// 导入插件系统类型定义
import type { HttpPlugin } from './plugins/types.js'
// 导入 HTTP 请求配置类型
import type { HttpRequestConfig } from './types.js'
// 导入重试机制相关工具
import { withRetry, type RetryOptions } from '@platform/sdk-core'
// 导入 HTTP 错误处理类
import { HttpError } from './errors.js'

/**
 * HTTP 客户端初始化选项
 * 用于配置 HTTP 客户端的各种行为和功能
 */
export interface HttpClientOptions {
  /** API 基础地址 - 所有请求的根路径 */
  baseURL: string
  /** 插件列表 - 用于扩展 HTTP 客户端功能的插件数组 */
  plugins?: HttpPlugin[]
  /** 默认重试配置 - 请求失败时的重试策略 */
  retry?: RetryOptions
  /** 限流配置 - 控制请求频率 */
  rateLimit?: {
    /** 每秒请求数限制 */
    rps: number
  }
  /** 是否启用请求去重，默认 true - 防止相同请求并发执行 */
  requestDedup?: boolean
  /** 请求超时时间，默认 10000ms - 单个请求的最大等待时间 */
  timeout?: number
}

/**
 * HTTP 客户端接口定义
 * 提供标准的 HTTP 方法，支持泛型返回类型
 */
export interface HttpClient {
  /** GET 请求 - 获取资源 */
  get<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T>
  /** POST 请求 - 创建资源 */
  post<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>
  /** PUT 请求 - 更新资源（完整替换） */
  put<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>
  /** DELETE 请求 - 删除资源 */
  delete<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T>
  /** PATCH 请求 - 部分更新资源 */
  patch<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>
  /** HEAD 请求 - 获取资源头信息 */
  head<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T>
  /** OPTIONS 请求 - 获取资源支持的方法 */
  options<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T>
}

// ============ 全局状态管理 ============

/** HTTP 客户端实例 - 单例模式 */
let httpInstance: HttpClient | null = null

/** Axios 实例 - 底层 HTTP 请求库实例 */
let axiosInstance: AxiosInstance | null = null

/** 已安装的插件列表 - 存储当前激活的插件 */
let installedPlugins: HttpPlugin[] = []

/** 请求去重开关 - 控制是否启用请求去重功能 */
let requestDedupEnabled = true

/** 进行中的请求映射表 - 用于请求去重，存储正在执行的请求 */
const inflightMap = new Map<string, Promise<any>>()

// ============ 工具函数 ============

/**
 * 稳定的 JSON 序列化函数
 * 确保相同的对象总是产生相同的字符串，用于请求去重的键生成
 * @param value 要序列化的值
 * @returns 序列化后的字符串
 */
function stableStringify(value: unknown): string {
  // 处理基本类型和 null
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  
  // 处理数组类型
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  
  // 处理对象类型 - 按键名排序确保稳定性
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`
}

/**
 * 构建请求去重的唯一键
 * 基于请求方法、URL、参数和请求体生成唯一标识
 * @param method HTTP 方法
 * @param url 请求 URL
 * @param config 请求配置（包含查询参数等）
 * @param data 请求体数据
 * @returns 去重键字符串
 */
function buildDedupKey(method: string, url: string, config?: AxiosRequestConfig, data?: unknown): string {
  // 序列化查询参数
  const paramsStr = config?.params ? stableStringify(config.params) : ''
  // 序列化请求体数据
  const dataStr = data !== undefined ? stableStringify(data) : ''
  // 组合成唯一键：方法 + URL + 参数 + 请求体
  return `${method.toUpperCase()} ${url}?${paramsStr} body:${dataStr}`
}

// ============ 插件系统处理函数 ============

/**
 * 应用所有插件的请求前处理
 * 按顺序执行所有插件的 onRequest 钩子
 * @param config 原始请求配置
 * @returns 经过插件处理后的请求配置
 */
async function applyOnRequest(config: AxiosRequestConfig): Promise<AxiosRequestConfig> {
  let current = config
  // 遍历所有已安装的插件
  for (const p of installedPlugins) {
    // 如果插件定义了请求前处理函数，则执行它
    if (p.onRequest) current = await p.onRequest(current)
  }
  return current
}

/**
 * 应用所有插件的响应后处理
 * 按顺序执行所有插件的 onResponse 钩子
 * @param resp 原始响应对象
 * @returns 经过插件处理后的响应数据
 */
async function applyOnResponse<T>(resp: AxiosResponse<T>): Promise<T> {
  let payload: any = resp
  // 遍历所有已安装的插件
  for (const p of installedPlugins) {
    // 如果插件定义了响应后处理函数，则执行它
    if (p.onResponse) payload = await p.onResponse(payload)
  }
  // 如果处理后的结果仍然是 AxiosResponse 格式，提取 data 字段
  if (payload && 'data' in payload) return (payload as AxiosResponse<T>).data as T
  // 否则直接返回处理后的数据
  return payload as T
}

/**
 * 应用所有插件的错误处理
 * 按顺序执行所有插件的 onError 钩子
 * @param error 错误对象
 * @throws 总是重新抛出错误
 */
async function applyOnError(error: any): Promise<never> {
  // 遍历所有已安装的插件
  for (const p of installedPlugins) {
    // 如果插件定义了错误处理函数，则执行它
    if (p.onError) {
      await p.onError(error)
    }
  }
  // 插件处理完成后，重新抛出错误
  throw error
}

// ============ 主要导出函数 ============

/**
 * 初始化 HTTP 客户端
 * 创建并配置 HTTP 客户端实例，设置拦截器、插件等
 * @param options 客户端配置选项
 * @returns 配置完成的 HTTP 客户端实例
 */
export function initHttp(options: HttpClientOptions): HttpClient {
  // 解构配置选项，设置默认值
  const {
    baseURL,                    // API 基础地址
    plugins = [],              // 插件列表，默认为空数组
    retry,                     // 重试配置
    rateLimit,                 // 限流配置
    requestDedup = true,       // 请求去重开关，默认启用
    timeout = 10_000,          // 超时时间，默认 10 秒
  } = options

  // 创建 axios 实例，配置基础 URL 和超时时间
  axiosInstance = axios.create({ baseURL, timeout })
  
  // ============ 请求时间测量拦截器 ============
  // 请求拦截器：记录请求开始时间
  axiosInstance.interceptors.request.use((cfg) => {
    // 在请求配置中添加开始时间戳
    ;(cfg as any).__startTime = Date.now()
    return cfg
  })
  
  // 响应拦截器：计算请求耗时
  axiosInstance.interceptors.response.use(
    // 成功响应处理
    (resp) => {
      const start = (resp.config as any).__startTime
      // 计算并添加请求耗时到响应对象
      ;(resp as any).duration = typeof start === 'number' ? Date.now() - start : 0
      return resp
    },
    // 错误响应处理
    (err) => {
      if (err && err.config) {
        const start = (err.config as any).__startTime
        // 如果有响应对象，也添加耗时信息
        if (err.response) {
          ;(err.response as any).duration = typeof start === 'number' ? Date.now() - start : 0
        }
      }
      return Promise.reject(err)
    }
  )
  
  // 保存插件列表和去重配置到全局变量
  installedPlugins = plugins
  requestDedupEnabled = requestDedup

  // ============ 核心请求处理函数 ============
  
  /**
   * 通用请求处理函数
   * 处理所有 HTTP 方法的请求，包含插件处理、错误映射、重试和去重逻辑
   * @param method HTTP 方法
   * @param url 请求 URL
   * @param data 请求体数据（可选）
   * @param config 请求配置（可选）
   * @returns Promise<T> 响应数据
   */
  const makeRequest = async <T>(
    method: AxiosRequestConfig['method'],
    url: string,
    data?: unknown,
    config?: HttpRequestConfig
  ): Promise<T> => {
    // 检查 axios 实例是否已初始化
    if (!axiosInstance) throw new Error('Axios instance not initialized')
    
    // 构建请求配置对象
    const reqConfig: AxiosRequestConfig = { ...(config ?? {}), method, url, data }
    // 应用插件的请求前处理
    const finalConfig = await applyOnRequest(reqConfig)

    /**
     * 执行单次请求的内部函数
     * 包含错误处理和插件应用逻辑
     */
    const exec = async () => {
      try {
        // 发送 HTTP 请求
        const resp = await axiosInstance!.request<T>(finalConfig)
        // 应用插件的响应后处理
        return await applyOnResponse<T>(resp)
      } catch (err: any) {
        let mapped: any = err
        
        // ============ 错误类型映射 ============
        if (isAxiosError(err)) {
          if (err.code === 'ECONNABORTED') {
            // 超时错误
            mapped = HttpError.timeout(err.message)
          } else if (err.response) {
            // HTTP 状态码错误（4xx, 5xx）
            mapped = HttpError.http(err.response.status, err.message, err.response.data)
          } else if (err.request) {
            // 网络错误（无响应）
            mapped = HttpError.network(err.message || 'Network Error')
          }
        }
        
        // 应用插件的错误处理（不阻塞错误抛出）
        try {
          await applyOnError(mapped)
        } catch {
          /* 插件错误处理失败时忽略，继续抛出原错误 */
        }
        throw mapped
      }
    }

    // 包装重试逻辑的函数
    // execWithRetry只是一个函数名，执行后返回任务函数，等同于execWithRetry = await fn()
    const execWithRetry = () => withRetry(exec, { ...(retry ?? {}), ...(config?.retryConfig ?? {}) })

    // ============ 请求去重逻辑 ============
    const dedupEnabled = (config?.enableDedup ?? true) && requestDedupEnabled
    if (dedupEnabled && finalConfig.method && finalConfig.url) {
      // 生成去重键
      const key = buildDedupKey(finalConfig.method, finalConfig.url, finalConfig, finalConfig.data)
      // 如果相同请求正在进行中，直接返回该 Promise
      if (inflightMap.has(key)) return inflightMap.get(key) as Promise<T>
      // 执行请求并在完成后清理去重映射
      // 这里execWithRetry()是异步的，不会阻塞同步代码执行，所以会先set再等待请求执行完后触发finally，删除inflightMap中的key
      const p = execWithRetry().finally(() => inflightMap.delete(key))
      inflightMap.set(key, p)
      return p
    }
    // 不需要去重时直接执行，返回任务函数
    return execWithRetry()
  }

  // ============ 创建客户端实例 ============
  
  /**
   * HTTP 客户端实例
   * 提供所有标准 HTTP 方法的封装
   */
  const client: HttpClient = {
    // GET 请求 - 不包含请求体
    get: (url, config) => makeRequest('GET', url, undefined, config),
    // DELETE 请求 - 不包含请求体
    delete: (url, config) => makeRequest('DELETE', url, undefined, config),
    // HEAD 请求 - 不包含请求体
    head: (url, config) => makeRequest('HEAD', url, undefined, config),
    // OPTIONS 请求 - 不包含请求体
    options: (url, config) => makeRequest('OPTIONS', url, undefined, config),
    // POST 请求 - 包含请求体
    post: (url, data, config) => makeRequest('POST', url, data, config),
    // PUT 请求 - 包含请求体
    put: (url, data, config) => makeRequest('PUT', url, data, config),
    // PATCH 请求 - 包含请求体
    patch: (url, data, config) => makeRequest('PATCH', url, data, config),
  }

  // ============ 更新全局单例对象 ============
  // 将客户端方法绑定到全局 http 对象上，实现单例模式
  // http中原本的get等处理逻辑会被client中的请求逻辑覆盖
  // client中的get,post等都是被makeRequest处理过的
  ;(http as any).get = client.get
  ;(http as any).post = client.post
  ;(http as any).put = client.put
  ;(http as any).delete = client.delete
  ;(http as any).patch = client.patch
  ;(http as any).head = client.head
  ;(http as any).options = client.options

  // 保存客户端实例到全局变量
  httpInstance = client
  return client
}

// ============ 全局单例导出 ============

/**
 * HTTP 客户端全局单例
 * 在调用 initHttp() 之前，所有方法都会抛出未初始化错误
 * 初始化后，这些方法会被替换为实际的请求处理函数
 */
export const http: HttpClient = {
  /** GET 请求方法 - 初始化前会抛出错误 */
  get: () => {
    throw new Error('HTTP client not initialized. Call initHttp() first.')
  },
  /** POST 请求方法 - 初始化前会抛出错误 */
  post: () => {
    throw new Error('HTTP client not initialized. Call initHttp() first.')
  },
  /** PUT 请求方法 - 初始化前会抛出错误 */
  put: () => {
    throw new Error('HTTP client not initialized. Call initHttp() first.')
  },
  /** DELETE 请求方法 - 初始化前会抛出错误 */
  delete: () => {
    throw new Error('HTTP client not initialized. Call initHttp() first.')
  },
  /** PATCH 请求方法 - 初始化前会抛出错误 */
  patch: () => {
    throw new Error('HTTP client not initialized. Call initHttp() first.')
  },
  /** HEAD 请求方法 - 初始化前会抛出错误 */
  head: () => {
    throw new Error('HTTP client not initialized. Call initHttp() first.')
  },
  /** OPTIONS 请求方法 - 初始化前会抛出错误 */
  options: () => {
    throw new Error('HTTP client not initialized. Call initHttp() first.')
  },
}