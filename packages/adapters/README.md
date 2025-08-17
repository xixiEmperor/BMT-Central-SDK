# @platform/adapters

BMT 平台 SDK 框架适配器包，提供 React、Vue 等前端框架的集成适配器，以及统一的 API 客户端和错误处理机制。

## 🚀 特性

- **框架集成**：提供 React Query、Vue Query 的最佳实践配置
- **统一 API 客户端**：集成所有 BMT 平台 API 接口
- **错误处理**：标准化的错误边界和错误处理机制
- **类型安全**：完整的 TypeScript 支持
- **开箱即用**：预配置的查询和缓存策略

## 📦 安装

```bash
npm install @platform/adapters
```

## 🎯 核心模块

### API 客户端

统一的 BMT 平台 API 访问入口。

#### 🚀 快速开始

```typescript
import { BMTAPI, AuthManager } from '@platform/adapters'

// 创建认证管理器
const authManager = new AuthManager()

// 用户登录
const loginResult = await BMTAPI.auth.login({
  username: 'user@example.com',
  password: 'password123'
})

if (loginResult.success) {
  console.log('登录成功:', loginResult.data.user)
  console.log('访问令牌:', loginResult.data.accessToken)
}

// 获取 SDK 配置
const config = await BMTAPI.config.getConfig('my-app', '1.0.0')
console.log('SDK 配置:', config)

// 上报遥测数据
await BMTAPI.telemetry.ingestEvents({
  events: [{
    type: 'page_view',
    timestamp: Date.now(),
    data: { path: '/dashboard' }
  }]
})
```

#### 🔧 认证管理

```typescript
import { AuthManager } from '@platform/adapters'

// 创建认证管理器（支持设备指纹）
const authManager = new AuthManager('device-fingerprint-123')

// 登录
await authManager.login('user@example.com', 'password123')

// 检查登录状态
if (authManager.isAuthenticated()) {
  console.log('用户已登录')
  console.log('当前用户:', authManager.getCurrentUser())
}

// 自动刷新令牌
authManager.startAutoRefresh()

// 登出
await authManager.logout()
```

### React 适配器

为 React 应用提供查询和错误处理的最佳实践。

#### 📋 React Query 集成

```typescript
import { createQueryClientDefaults, createErrorBoundary } from '@platform/adapters'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 创建 QueryClient（使用推荐配置）
const queryClientDefaults = createQueryClientDefaults()
const queryClient = new QueryClient(queryClientDefaults.defaultOptions)

// 创建错误边界
const ErrorBoundary = createErrorBoundary()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary
        fallback={({ error }) => <div>发生错误: {error.message}</div>}
        onError={(error, errorInfo) => {
          console.error('应用错误:', error, errorInfo)
        }}
      >
        <YourApp />
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
```

#### 🎯 API Hooks 示例

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import { BMTAPI } from '@platform/adapters'

// 用户信息查询
function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const result = await BMTAPI.auth.verify()
      return result.data.user
    },
    staleTime: 5 * 60 * 1000, // 5分钟内不重新请求
    retry: 2
  })
}

// 遥测数据上报
function useTelemetryMutation() {
  return useMutation({
    mutationFn: async (events) => {
      return await BMTAPI.telemetry.ingestEvents({ events })
    },
    onSuccess: () => {
      console.log('遥测数据上报成功')
    },
    onError: (error) => {
      console.error('遥测数据上报失败:', error)
    }
  })
}

// 在组件中使用
function UserProfile() {
  const { data: user, isLoading, error } = useUserProfile()
  const telemetryMutation = useTelemetryMutation()

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>加载失败: {error.message}</div>

  return (
    <div>
      <h1>欢迎, {user.name}</h1>
      <button
        onClick={() => {
          telemetryMutation.mutate([{
            type: 'button_click',
            timestamp: Date.now(),
            data: { button: 'profile-view' }
          }])
        }}
      >
        记录访问
      </button>
    </div>
  )
}
```

### Vue 适配器

为 Vue 应用提供查询和状态管理的最佳实践。

#### 📋 Vue Query 集成

```typescript
import { createVueQueryDefaults } from '@platform/adapters'
import { VueQueryPlugin } from '@tanstack/vue-query'

// 创建 Vue Query 配置
const vueQueryDefaults = createVueQueryDefaults()

// 在 Vue 应用中使用
const app = createApp(App)
app.use(VueQueryPlugin, vueQueryDefaults.defaultOptions)
```

#### 🎯 组合式 API 示例

```vue
<template>
  <div>
    <div v-if="isLoading">加载中...</div>
    <div v-else-if="error">加载失败: {{ error.message }}</div>
    <div v-else>
      <h1>欢迎, {{ user.name }}</h1>
      <button @click="trackClick">记录访问</button>
    </div>
  </div>
</template>

<script setup>
import { useQuery, useMutation } from '@tanstack/vue-query'
import { BMTAPI } from '@platform/adapters'

// 用户信息查询
const { data: user, isLoading, error } = useQuery({
  queryKey: ['user', 'profile'],
  queryFn: async () => {
    const result = await BMTAPI.auth.verify()
    return result.data.user
  }
})

// 遥测上报
const telemetryMutation = useMutation({
  mutationFn: async (events) => {
    return await BMTAPI.telemetry.ingestEvents({ events })
  }
})

const trackClick = () => {
  telemetryMutation.mutate([{
    type: 'button_click',
    timestamp: Date.now(),
    data: { button: 'profile-view' }
  }])
}
</script>
```

## 🛠️ 工具函数

### 错误处理

```typescript
import { 
  createDefaultErrorHandler,
  createDefaultRetryFn,
  isRetryableError 
} from '@platform/adapters'

// 创建默认错误处理器
const errorHandler = createDefaultErrorHandler({
  onError: (error) => {
    console.error('请求失败:', error)
    // 可以集成到错误上报系统
  }
})

// 创建重试函数
const retryFn = createDefaultRetryFn({
  retries: 3,
  retryCondition: isRetryableError
})

// 在查询中使用
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: retryFn,
      onError: errorHandler
    },
    mutations: {
      retry: retryFn,
      onError: errorHandler
    }
  }
})
```

### 权限管理

```typescript
import { ChannelPermissions } from '@platform/adapters'

// 检查用户权限
const hasPermission = await ChannelPermissions.checkChannelPermission(
  'notifications',
  'subscribe'
)

if (hasPermission) {
  console.log('用户有权限订阅通知频道')
}

// 获取用户所有权限
const permissions = await ChannelPermissions.getUserChannels()
console.log('用户可访问的频道:', permissions)
```

## 📊 使用场景

### 1. 企业级 React 应用

```typescript
// App.tsx
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createQueryClientDefaults, createErrorBoundary, AuthManager } from '@platform/adapters'

const queryClient = new QueryClient(createQueryClientDefaults().defaultOptions)
const ErrorBoundary = createErrorBoundary()
const authManager = new AuthManager()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </QueryClientProvider>
  )
}

// hooks/useAuth.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { BMTAPI } from '@platform/adapters'

export function useAuth() {
  return useQuery({
    queryKey: ['auth', 'verify'],
    queryFn: async () => {
      const result = await BMTAPI.auth.verify()
      return result.data.user
    },
    retry: false
  })
}

export function useLogin() {
  return useMutation({
    mutationFn: async ({ username, password }) => {
      return await BMTAPI.auth.login({ username, password })
    }
  })
}
```

### 2. Vue 3 SPA 应用

```typescript
// main.ts
import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createVueQueryDefaults } from '@platform/adapters'
import App from './App.vue'

const app = createApp(App)
app.use(VueQueryPlugin, createVueQueryDefaults().defaultOptions)
app.mount('#app')

// composables/useAPI.ts
import { useQuery, useMutation } from '@tanstack/vue-query'
import { BMTAPI } from '@platform/adapters'

export function useUserList() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // 假设有用户列表 API
      const result = await BMTAPI.auth.verify()
      return [result.data.user] // 简化示例
    }
  })
}

export function useCreateUser() {
  return useMutation({
    mutationFn: async (userData) => {
      // 假设有创建用户 API
      return await BMTAPI.auth.login(userData)
    }
  })
}
```

### 3. 多框架共存项目

```typescript
// shared/api.ts - 共享 API 逻辑
import { BMTAPI, AuthManager } from '@platform/adapters'

export const sharedAuthManager = new AuthManager()

export const apiClient = {
  async login(credentials) {
    return await BMTAPI.auth.login(credentials)
  },
  
  async getUserProfile() {
    const result = await BMTAPI.auth.verify()
    return result.data.user
  },
  
  async uploadTelemetry(events) {
    return await BMTAPI.telemetry.ingestEvents({ events })
  }
}

// react/App.tsx - React 部分
import { createQueryClientDefaults } from '@platform/adapters'
import { apiClient } from '../shared/api'

// vue/App.vue - Vue 部分  
import { createVueQueryDefaults } from '@platform/adapters'
import { apiClient } from '../shared/api'
```

## 🔧 配置选项

### QueryClient 配置

```typescript
interface QueryClientDefaults {
  queries: {
    staleTime: number        // 数据过期时间，默认 60 秒
    gcTime: number          // 缓存垃圾回收时间，默认 5 分钟
    retry: number           // 重试次数，默认 3 次
    retryDelay: Function    // 重试延迟函数
    enabled: boolean        // 是否启用查询，默认 true
  }
  mutations: {
    retry: number           // 变更重试次数，默认 0
  }
}
```

### 错误处理配置

```typescript
interface ErrorHandlerOptions {
  onError?: (error: Error) => void          // 错误回调
  enableConsoleLog?: boolean                // 是否输出到控制台
  enableTelemetry?: boolean                 // 是否上报遥测
}

interface RetryOptions {
  retries?: number                          // 重试次数
  retryCondition?: (error: Error) => boolean // 重试条件
  retryDelay?: (attempt: number) => number   // 重试延迟
}
```

## 🔍 类型定义

```typescript
// 基础查询选项
interface BaseQueryOptions {
  queryKey: readonly unknown[]
  queryFn: () => Promise<unknown>
  staleTime?: number
  gcTime?: number
  retry?: number | ((failureCount: number, error: Error) => boolean)
  retryDelay?: (attempt: number) => number
  enabled?: boolean
}

// API 响应类型
interface BaseResponse {
  success: boolean
  message: string
  timestamp: number
}

interface DataResponse<T = unknown> extends BaseResponse {
  data: T
}

interface ErrorResponse extends BaseResponse {
  error: {
    code: string
    details: string
  }
}
```

## 📚 API 参考

### BMTAPI

统一 API 客户端，包含所有平台接口：

```typescript
class BMTAPI {
  // 认证相关
  static auth: AuthAPI
  
  // 遥测相关  
  static telemetry: TelemetryAPI
  
  // 配置相关
  static config: ConfigAPI
  
  // 健康检查
  static health: HealthAPI
  
  // 实时通信
  static realtime: RealtimeAPI
  
  // 工厂方法
  static createAuthManager(fingerprint?: string): AuthManager
  static createTelemetryBatcher(options?: BatcherOptions): TelemetryBatcher
  static createHealthMonitor(options?: MonitorOptions): HealthMonitor
}
```

### AuthManager

认证状态管理器：

```typescript
class AuthManager {
  constructor(fingerprint?: string)
  
  // 认证操作
  async login(username: string, password: string): Promise<LoginResponse>
  async logout(): Promise<void>
  async refreshToken(): Promise<RefreshResponse>
  
  // 状态查询
  isAuthenticated(): boolean
  getCurrentUser(): User | null
  getAccessToken(): string | null
  
  // 自动刷新
  startAutoRefresh(): void
  stopAutoRefresh(): void
}
```

## 🚀 性能优化建议

### 1. 查询优化

```typescript
// 使用适当的 staleTime 减少不必要的重新请求
const { data } = useQuery({
  queryKey: ['user-profile'],
  queryFn: fetchUserProfile,
  staleTime: 5 * 60 * 1000 // 5分钟内不重新请求
})

// 预取数据提升用户体验
const queryClient = useQueryClient()
queryClient.prefetchQuery({
  queryKey: ['users'],
  queryFn: fetchUsers
})
```

### 2. 错误处理优化

```typescript
// 统一错误处理，避免重复代码
const globalErrorHandler = createDefaultErrorHandler({
  onError: (error) => {
    if (error.status === 401) {
      // 重定向到登录页
      window.location.href = '/login'
    }
  }
})
```

### 3. 内存优化

```typescript
// 合理设置 gcTime，避免内存泄漏
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 5 * 60 * 1000 // 5分钟后清理缓存
    }
  }
})
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
