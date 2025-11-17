# @wfynbzlx666/sdk-http

BMT 平台 SDK HTTP 客户端模块，提供功能完整的 HTTP 客户端库，集成认证、遥测、配置管理、健康检查等完整的后端 API 接口。

## 🚀 特性

- **HTTP 客户端单例**：统一的请求接口和配置管理
- **插件系统**：支持功能扩展和自定义处理
- **统一错误处理**：标准化的错误类型和处理机制
- **请求去重**：防止相同请求并发执行
- **自动重试**：智能的失败重试机制
- **熔断保护**：防止服务雪崩
- **流量控制**：请求频率限制
- **完整 API 集成**：认证、遥测、配置、健康检查、实时通信

## 📦 安装

```bash
npm install @wfynbzlx666/sdk-http
```

## 🎯 核心模块

### HTTP 客户端

高级 HTTP 客户端，支持插件化扩展。

#### 🚀 快速开始

```typescript
import { initHttp, http } from '@wfynbzlx666/sdk-http'

// 初始化 HTTP 客户端
initHttp({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  plugins: [] // 稍后介绍插件
})

// 发送请求
const response = await http.get('/api/users')
console.log('用户列表:', response.data)

// POST 请求
const newUser = await http.post('/api/users', {
  name: 'John Doe',
  email: 'john@example.com'
})
```

#### 🔧 高级配置

```typescript
import { 
  initHttp, 
  http, 
  authPlugin, 
  retryPlugin, 
  rateLimitPlugin 
} from '@wfynbzlx666/sdk-http'

// 完整配置示例
initHttp({
  baseURL: 'https://api.example.com',
  timeout: 30000,
  headers: {
    'User-Agent': 'MyApp/1.0'
  },
  plugins: [
    // 认证插件 - 自动添加认证头
    authPlugin({
      tokenProvider: () => localStorage.getItem('access_token'),
      headerName: 'Authorization',
      tokenPrefix: 'Bearer'
    }),
    
    // 重试插件 - 失败自动重试
    retryPlugin({
      retries: 3,
      retryDelay: (attempt) => Math.pow(2, attempt) * 1000, // 指数退避
      retryCondition: (error) => error.status >= 500
    }),
    
    // 限流插件 - 控制请求频率
    rateLimitPlugin({
      maxRequests: 100,
      windowMs: 60000 // 每分钟最多100个请求
    })
  ]
})

// 使用配置后的客户端
const data = await http.get('/protected-endpoint')
```

### 插件系统

可扩展的插件架构，支持自定义处理逻辑。

#### 🔌 内置插件

**1. 认证插件**

```typescript
import { authPlugin } from '@wfynbzlx666/sdk-http'

const authPluginInstance = authPlugin({
  tokenProvider: async () => {
    // 从存储或认证服务获取令牌
    return await getAccessToken()
  },
  headerName: 'Authorization',
  tokenPrefix: 'Bearer',
  
  // 令牌刷新逻辑
  onTokenExpired: async () => {
    return await refreshToken()
  }
})
```

**2. 重试插件**

```typescript
import { retryPlugin } from '@wfynbzlx666/sdk-http'

const retryPluginInstance = retryPlugin({
  retries: 3,
  retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 10000),
  retryCondition: (error) => {
    // 仅在服务器错误或网络错误时重试
    return error.status >= 500 || error.code === 'NETWORK_ERROR'
  },
  onRetry: (attempt, error) => {
    console.log(`重试第 ${attempt} 次:`, error.message)
  }
})
```

**3. 去重插件**

```typescript
import { dedupPlugin } from '@wfynbzlx666/sdk-http'

const dedupPluginInstance = dedupPlugin({
  // 缓存时间（毫秒）
  cacheTime: 1000,
  
  // 生成请求唯一键的函数
  keyGenerator: (config) => {
    return `${config.method}:${config.url}:${JSON.stringify(config.params)}`
  },
  
  // 是否启用去重的条件
  shouldDedupe: (config) => {
    return config.method === 'GET'
  }
})
```

**4. 熔断器插件**

```typescript
import { circuitBreakerPlugin } from '@wfynbzlx666/sdk-http'

const circuitBreakerPluginInstance = circuitBreakerPlugin({
  // 失败阈值
  failureThreshold: 5,
  
  // 重置时间（毫秒）
  resetTimeout: 30000,
  
  // 监控时间窗口
  monitoringPeriod: 10000,
  
  // 熔断器状态变化回调
  onStateChange: (state, stats) => {
    console.log(`熔断器状态: ${state}`, stats)
  }
})
```

#### 🛠️ 自定义插件

```typescript
import { HttpPlugin } from '@wfynbzlx666/sdk-http'

// 创建自定义插件
const customPlugin: HttpPlugin = {
  name: 'custom-plugin',
  
  // 插件初始化钩子
  async setup() {
    console.log('插件初始化')
    // 初始化外部资源、验证配置等
  },
  
  async onRequest(config) {
    // 请求前处理
    console.log('发送请求:', config.url)
    config.headers = config.headers || {}
    config.headers['X-Request-ID'] = generateRequestId()
    return config
  },
  
  async onResponse(response) {
    // 响应后处理
    console.log('收到响应:', response.status)
    return response.data
  },
  
  async onError(error) {
    // 错误处理
    console.error('请求失败:', error)
    throw error
  },
  
  // 插件销毁钩子
  async teardown() {
    console.log('插件清理')
    // 清理资源、关闭连接等
  }
}

// 使用自定义插件
initHttp({
  baseURL: 'https://api.example.com',
  plugins: [customPlugin]
})
```

#### 🔄 实时通信 API

```typescript
import { BMTAPI, ChannelPermissions } from '@wfynbzlx666/sdk-http'

// 获取实时通信统计
const realtimeStats = await BMTAPI.realtime.getStats()
console.log('实时连接数:', realtimeStats.data.connections)

// 广播消息（需要权限）
await BMTAPI.realtime.broadcast({
  channel: 'notifications',
  event: 'new_message',
  data: { message: 'Hello everyone!' }
})

// 检查频道权限
const hasPermission = await ChannelPermissions.checkChannelPermission(
  'notifications',
  'subscribe'
)

if (hasPermission) {
  console.log('有权限订阅通知频道')
}

// 获取用户可访问的频道
const userChannels = await ChannelPermissions.getUserChannels()
console.log('可访问的频道:', userChannels)
```

## 📊 使用场景

### 1. 单页应用 (SPA) 集成

```typescript
// api/client.ts - API 客户端配置
import { 
  initHttp, 
  http, 
  authPlugin, 
  retryPlugin, 
  telemetryPlugin 
} from '@wfynbzlx666/sdk-http'

// 初始化 HTTP 客户端
initHttp({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: 15000,
  plugins: [
    authPlugin({
      tokenProvider: () => localStorage.getItem('access_token'),
      onTokenExpired: async () => {
        // 令牌过期时的处理逻辑
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const result = await BMTAPI.auth.refresh({ refreshToken })
          if (result.success) {
            localStorage.setItem('access_token', result.data.accessToken)
            return result.data.accessToken
          }
        }
        // 重定向到登录页
        window.location.href = '/login'
        return null
      }
    }),
    
    retryPlugin({
      retries: 2,
      retryCondition: (error) => error.status >= 500
    }),
    
    telemetryPlugin({
      onError: (error, request) => {
        // 自动上报 API 错误
        console.error('API Error:', error)
      }
    })
  ]
})

// services/userService.ts - 用户相关 API
export const userService = {
  async getProfile() {
    const response = await http.get('/api/user/profile')
    return response.data
  },
  
  async updateProfile(data) {
    const response = await http.put('/api/user/profile', data)
    return response.data
  },
  
  async uploadAvatar(file) {
    const formData = new FormData()
    formData.append('avatar', file)
    const response = await http.post('/api/user/avatar', formData)
    return response.data
  }
}
```

```typescript
// services/authService.ts
import { BMTAPI, AuthManager } from '@wfynbzlx666/sdk-http'

class AuthService {
  private authManager: AuthManager
  
  constructor() {
    this.authManager = new AuthManager()
  }
  
  async authenticate(username: string, password: string) {
    try {
      await this.authManager.login(username, password)
      
      // 启动自动刷新
      this.authManager.startAutoRefresh()
      
      return this.authManager.getCurrentUser()
    } catch (error) {
      console.error('Authentication failed:', error)
      throw error
    }
  }
  
  async logout() {
    await this.authManager.logout()
  }
  
  isAuthenticated() {
    return this.authManager.isAuthenticated()
  }
}

// services/telemetryService.ts
import { TelemetryBatcher } from '@wfynbzlx666/sdk-http'

class TelemetryService {
  private batcher: TelemetryBatcher
  
  constructor() {
    this.batcher = new TelemetryBatcher({
      maxBatchSize: 100,
      flushInterval: 10000,
      onFlush: this.flushTelemetryData.bind(this)
    })
  }
  
  trackEvent(type: string, data: any) {
    this.batcher.add({
      type,
      timestamp: Date.now(),
      data
    })
  }
  
  private async flushTelemetryData(events) {
    try {
      await BMTAPI.telemetry.ingestEvents({ events })
    } catch (error) {
      console.error('Failed to flush telemetry data:', error)
    }
  }
}

export const authService = new AuthService()
export const telemetryService = new TelemetryService()
```

## 🔧 配置选项

### HTTP 客户端配置

```typescript
interface HttpClientOptions {
  baseURL?: string                    // 基础 URL
  timeout?: number                    // 超时时间（毫秒）
  headers?: Record<string, string>    // 默认请求头
  plugins?: HttpPlugin[]              // 插件列表
  maxRedirects?: number              // 最大重定向次数
  validateStatus?: (status: number) => boolean // 状态码验证函数
}
```

### 插件配置

**认证插件配置**

```typescript
interface AuthPluginOptions {
  tokenProvider: () => string | Promise<string>  // 令牌提供者
  headerName?: string                            // 认证头名称，默认 'Authorization'
  tokenPrefix?: string                           // 令牌前缀，默认 'Bearer'
  onTokenExpired?: () => string | Promise<string> // 令牌过期处理
}
```

**重试插件配置**

```typescript
interface RetryPluginOptions {
  retries?: number                              // 重试次数，默认 3
  retryDelay?: (attempt: number) => number      // 重试延迟函数
  retryCondition?: (error: Error) => boolean    // 重试条件
  onRetry?: (attempt: number, error: Error) => void // 重试回调
}
```

**熔断器插件配置**

```typescript
interface CircuitBreakerOptions {
  failureThreshold?: number           // 失败阈值，默认 5
  resetTimeout?: number              // 重置时间，默认 30000ms
  monitoringPeriod?: number          // 监控周期，默认 10000ms
  onStateChange?: (state: string, stats: any) => void // 状态变化回调
}
```

## 🔍 类型定义

```typescript
// HTTP 响应类型
interface HttpResponse<T = any> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  config: HttpRequestConfig
}

// HTTP 错误类型
interface HttpError extends Error {
  name: 'HttpError'
  status?: number
  code?: string
  config?: HttpRequestConfig
  response?: HttpResponse
}

// 插件接口
interface HttpPlugin {
  name: string
  onRequest?(config: AxiosRequestConfig): AxiosRequestConfig | Promise<AxiosRequestConfig>
  onResponse?<T = any>(response: AxiosResponse<T>): T | Promise<T>
  onError?(error: any): never | Promise<never>
  setup?(): void | Promise<void>
  teardown?(): void | Promise<void>
}
```