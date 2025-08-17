# @platform/sdk-http

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
npm install @platform/sdk-http
```

## 🎯 核心模块

### HTTP 客户端

高级 HTTP 客户端，支持插件化扩展。

#### 🚀 快速开始

```typescript
import { initHttp, http } from '@platform/sdk-http'

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
} from '@platform/sdk-http'

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
import { authPlugin } from '@platform/sdk-http'

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
import { retryPlugin } from '@platform/sdk-http'

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
import { dedupPlugin } from '@platform/sdk-http'

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
import { circuitBreakerPlugin } from '@platform/sdk-http'

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

**5. 遥测插件**

```typescript
import { telemetryPlugin } from '@platform/sdk-http'

const telemetryPluginInstance = telemetryPlugin({
  // 是否收集详细的请求指标
  collectDetailedMetrics: true,
  
  // 遥测数据处理器
  onMetric: (metric) => {
    console.log('请求指标:', metric)
    // 可以发送到分析平台
  },
  
  // 错误上报
  onError: (error, request) => {
    console.error('请求错误:', error)
    // 可以发送到错误监控平台
  }
})
```

#### 🛠️ 自定义插件

```typescript
import { HttpPlugin } from '@platform/sdk-http'

// 创建自定义插件
const customPlugin: HttpPlugin = {
  name: 'custom-plugin',
  
  async beforeRequest(config) {
    // 请求前处理
    console.log('发送请求:', config.url)
    config.headers['X-Request-ID'] = generateRequestId()
    return config
  },
  
  async afterResponse(response) {
    // 响应后处理
    console.log('收到响应:', response.status)
    return response
  },
  
  async onError(error) {
    // 错误处理
    console.error('请求失败:', error)
    throw error
  }
}

// 使用自定义插件
initHttp({
  baseURL: 'https://api.example.com',
  plugins: [customPlugin]
})
```

### BMT 平台 API

完整集成 BMT 平台的所有 API 接口。

#### 🔐 认证 API

```typescript
import { BMTAPI, AuthManager } from '@platform/sdk-http'

// 方式1：直接使用 API
const loginResult = await BMTAPI.auth.login({
  username: 'user@example.com',
  password: 'password123'
})

if (loginResult.success) {
  console.log('登录成功:', loginResult.data.user)
  const accessToken = loginResult.data.accessToken
}

// 方式2：使用认证管理器（推荐）
const authManager = new AuthManager()

await authManager.login('user@example.com', 'password123')

if (authManager.isAuthenticated()) {
  console.log('当前用户:', authManager.getCurrentUser())
  
  // 自动令牌刷新
  authManager.startAutoRefresh()
}

// 验证令牌
const verifyResult = await BMTAPI.auth.verify()
if (verifyResult.success) {
  console.log('令牌有效，用户信息:', verifyResult.data.user)
}

// 登出
await authManager.logout()
```

#### 📊 遥测 API

```typescript
import { BMTAPI, TelemetryBatcher } from '@platform/sdk-http'

// 方式1：直接上报事件
await BMTAPI.telemetry.ingestEvents({
  events: [
    {
      type: 'page_view',
      timestamp: Date.now(),
      data: {
        path: '/dashboard',
        title: 'Dashboard',
        loadTime: 1200
      }
    },
    {
      type: 'button_click',
      timestamp: Date.now(),
      data: {
        buttonId: 'save-btn',
        section: 'settings'
      }
    }
  ]
})

// 方式2：使用批次管理器（推荐）
const telemetryBatcher = new TelemetryBatcher({
  maxBatchSize: 50,
  flushInterval: 5000,
  onFlush: async (events) => {
    await BMTAPI.telemetry.ingestEvents({ events })
  }
})

// 添加事件到批次
telemetryBatcher.add({
  type: 'error',
  timestamp: Date.now(),
  data: {
    message: 'Network request failed',
    stack: error.stack
  }
})

// 获取遥测统计
const stats = await BMTAPI.telemetry.getStats()
console.log('遥测统计:', stats.data)
```

#### ⚙️ 配置 API

```typescript
import { BMTAPI } from '@platform/sdk-http'

// 获取 SDK 配置
const config = await BMTAPI.config.getConfig('my-app', '1.0.0')
console.log('SDK 配置:', config.data)

// 更新配置（需要管理员权限）
const accessToken = 'admin-access-token'
await BMTAPI.config.updateConfig(accessToken, {
  telemetry: {
    enabled: true,
    sampleRate: 0.1
  },
  features: {
    debugMode: false
  }
})

// 获取默认配置
const defaultConfig = BMTAPI.config.getDefaultConfig('user')
console.log('默认配置:', defaultConfig)

// 验证配置
const validation = BMTAPI.config.validateConfig(config.data)
if (!validation.valid) {
  console.error('配置验证失败:', validation.errors)
}
```

#### 🏥 健康检查 API

```typescript
import { BMTAPI, HealthMonitor } from '@platform/sdk-http'

// 检查服务健康状态
const health = await BMTAPI.health.check()
console.log('服务状态:', health.data.status) // healthy | degraded | unhealthy
console.log('服务详情:', health.data.services)

// 获取服务信息
const serviceInfo = await BMTAPI.health.getServiceInfo()
console.log('服务信息:', serviceInfo.data)

// 使用健康监控器（推荐）
const healthMonitor = new HealthMonitor({
  interval: 30000, // 30秒检查一次
  
  onStatusChange: (status, healthData) => {
    console.log('服务状态变化:', status)
  },
  
  onUnhealthy: (unhealthyServices, healthData) => {
    console.warn('不健康的服务:', unhealthyServices)
    // 可以发送告警
  },
  
  onRecovered: (healthData) => {
    console.log('服务已恢复正常')
  }
})

// 启动监控
healthMonitor.start()

// 停止监控
healthMonitor.stop()
```

#### 🔄 实时通信 API

```typescript
import { BMTAPI, ChannelPermissions } from '@platform/sdk-http'

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
} from '@platform/sdk-http'

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

### 2. Node.js 服务端集成

```typescript
// server/api.ts - 服务端 API 客户端
import { 
  initHttp, 
  http, 
  retryPlugin, 
  circuitBreakerPlugin 
} from '@platform/sdk-http'

// 服务端配置
initHttp({
  baseURL: process.env.INTERNAL_API_URL,
  timeout: 5000,
  plugins: [
    retryPlugin({
      retries: 3,
      retryDelay: (attempt) => 500 * attempt
    }),
    
    circuitBreakerPlugin({
      failureThreshold: 5,
      resetTimeout: 30000,
      onStateChange: (state) => {
        console.log(`Circuit breaker state: ${state}`)
      }
    })
  ]
})

// 服务间通信
export async function callInternalService(endpoint: string, data: any) {
  try {
    const response = await http.post(endpoint, data)
    return response.data
  } catch (error) {
    console.error('Internal service call failed:', error)
    throw error
  }
}
```

### 3. 微服务架构集成

```typescript
// services/authService.ts
import { BMTAPI, AuthManager } from '@platform/sdk-http'

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
import { TelemetryBatcher } from '@platform/sdk-http'

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
  beforeRequest?(config: HttpRequestConfig): HttpRequestConfig | Promise<HttpRequestConfig>
  afterResponse?(response: HttpResponse): HttpResponse | Promise<HttpResponse>
  onError?(error: HttpError): never | Promise<never>
}
```

## 🚀 性能优化建议

### 1. 合理配置插件

```typescript
// 生产环境配置
const productionPlugins = [
  authPlugin({ /* auth config */ }),
  retryPlugin({ retries: 2 }), // 减少重试次数
  // 不使用 telemetryPlugin 减少开销
]

// 开发环境配置
const developmentPlugins = [
  authPlugin({ /* auth config */ }),
  retryPlugin({ retries: 3 }),
  telemetryPlugin({ collectDetailedMetrics: true })
]

initHttp({
  baseURL: API_BASE_URL,
  plugins: process.env.NODE_ENV === 'production' 
    ? productionPlugins 
    : developmentPlugins
})
```

### 2. 请求优化

```typescript
// 使用去重插件避免重复请求
const dedupPluginInstance = dedupPlugin({
  cacheTime: 5000, // 5秒内相同请求直接返回缓存
  shouldDedupe: (config) => config.method === 'GET'
})

// 合理设置超时时间
initHttp({
  timeout: 10000, // 10秒超时
  plugins: [dedupPluginInstance]
})
```

### 3. 批量处理

```typescript
// 使用遥测批次管理器
const telemetryBatcher = new TelemetryBatcher({
  maxBatchSize: 50,
  flushInterval: 5000,
  maxWaitTime: 10000 // 最多等待10秒
})

// 批量上报，减少网络请求
telemetryBatcher.add(event1)
telemetryBatcher.add(event2)
telemetryBatcher.add(event3)
// 自动批量发送
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
