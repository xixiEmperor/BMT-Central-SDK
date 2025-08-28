# @wfynbzlx666/sdk-core

BMT 平台 SDK 核心能力包，提供高性能的任务队列管理、重试机制、跨标签页通信和互斥锁等核心功能。

## 🚀 特性

- **高并发任务队列**：支持并发控制、优先级排序、智能重试
- **重试与指数退避**：可配置的重试策略，支持多种退避算法
- **跨标签页通信**：基于 BroadcastChannel 的可靠通信机制
- **互斥锁协调**：防止多标签页冲突的资源锁定机制
- **TypeScript 支持**：完整的类型定义和 IntelliSense 支持

## 📦 安装

```bash
npm install @wfynbzlx666/sdk-core
```

## 🎯 核心模块

### TaskQueue - 任务队列管理

高并发任务队列管理器，解决高并发请求导致的性能问题，提供可靠的任务调度和执行。

#### 🔥 核心特性

- **并发控制**：限制同时执行的任务数量，避免系统过载
- **优先级调度**：支持任务优先级排序，重要任务优先执行
- **智能重试**：指数退避重试机制，提高任务成功率
- **状态监控**：实时进度追踪和状态回调
- **错误恢复**：失败任务自动重试和手动重试支持
- **取消控制**：支持任务取消和队列停止

#### 🚀 快速开始

```typescript
import { createTaskQueue } from '@wfynbzlx666/sdk-core'

// 创建任务队列
const queue = createTaskQueue({
  maxConcurrent: 3,     // 最大并发数
  requestInterval: 100, // 请求间隔(ms)
  maxRetries: 3,        // 最大重试次数
  timeout: 30000,       // 超时时间(ms)
  onProgress: (progress) => {
    console.log(`进度: ${progress.percentage}%`)
  }
})

// 添加任务
const task1 = queue.addTask(async (data) => {
  const response = await fetch('/api/data', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  return response.json()
}, { userId: 123 })

// 启动队列并等待完成
const results = await queue.start()
console.log('队列执行完成:', results)
```

#### 📋 预设队列类型

```typescript
import { 
  createHighConcurrencyTaskQueue,  // 高并发场景
  createLowConcurrencyTaskQueue,   // 低并发稳定场景
  createDatabaseTaskQueue          // 数据库操作场景
} from '@wfynbzlx666/sdk-core'

// 高并发队列 - 适合轻量级任务
const highQueue = createHighConcurrencyTaskQueue({
  maxConcurrent: 10,
  requestInterval: 50,
  maxRetries: 2
})

// 低并发队列 - 适合重量级任务
const lowQueue = createLowConcurrencyTaskQueue({
  maxConcurrent: 1,
  requestInterval: 500,
  maxRetries: 5
})

// 数据库队列 - 避免数据库死锁
const dbQueue = createDatabaseTaskQueue({
  maxConcurrent: 2,
  requestInterval: 200,
  maxRetries: 3
})
```

#### 🎛️ 高级用法

```typescript
// 批量添加任务
const tasks = [
  { fn: saveUser, data: { name: 'Alice' }, options: { priority: 1 } },
  { fn: saveUser, data: { name: 'Bob' }, options: { priority: 2 } },
  { fn: saveUser, data: { name: 'Charlie' }, options: { priority: 1 } }
]

const results = await queue.addTasks(tasks)

// 队列控制
queue.pause()    // 暂停队列
queue.resume()   // 恢复队列
queue.stop()     // 停止队列

// 状态监控
const status = queue.getStatus()
console.log({
  executing: status.executing,
  pending: status.pending,
  completed: status.completed,
  failed: status.failed
})

// 重试失败任务
queue.retryFailedTasks()

// 动态配置更新
queue.updateConfig({
  maxConcurrent: 5,
  timeout: 60000
})
```

#### 🔄 与浏览器事件循环的关系

本任务队列运行在浏览器事件循环之上，利用事件循环的异步能力，实现了更高级的任务调度和管理功能：

- **执行层级**：应用层面的任务管理，基于Promise和setTimeout
- **并发控制**：支持控制并发数量，可同时执行多个任务
- **调度策略**：可配置调度(优先级、间隔、重试)
- **错误处理**：内置重试机制和错误恢复

### Retry - 重试与指数退避

可配置的重试机制，支持多种退避策略。

```typescript
import { withRetry, createRetry } from '@wfynbzlx666/sdk-core'

// 直接使用重试包装函数
const result = await withRetry(async () => {
  return fetch('/api/data').then(r => r.json())
}, {
  retries: 3,
  baseMs: 1000,
  strategy: 'exponential',
  jitter: true
})

// 创建可复用的重试函数
const retryFetch = createRetry({
  retries: 5,
  baseMs: 500,
  capMs: 10000,
  strategy: 'exponential'
})

const data = await retryFetch(async () => {
  const response = await fetch('/api/data')
  if (!response.ok) throw new Error('请求失败')
  return response.json()
})
```

### Broadcast - 跨标签页通信

基于 BroadcastChannel 的跨标签页通信机制。

```typescript
import { createBroadcast } from '@wfynbzlx666/sdk-core'

const broadcast = createBroadcast('user-channel')

// 监听消息
broadcast.addEventListener((message) => {
  console.log('收到消息:', message)
})

// 发送消息
broadcast.postMessage('user-login', { userId: 123 })

// 清理资源
broadcast.close()
```

### Locks - 互斥锁协调

防止多标签页冲突的资源锁定机制。

```typescript
import { withLock } from '@wfynbzlx666/sdk-core'

// 使用互斥锁保护资源
const result = await withLock('user-data-update', async () => {
  // 只有一个标签页可以执行这个代码块
  const userData = await loadUserData()
  const updatedData = await updateUserData(userData)
  await saveUserData(updatedData)
  return updatedData
}, {
  timeoutMs: 10000
})
```

## 🛠️ 工具函数

```typescript
import { 
  sleep, 
  timeout, 
  isSupported,
  generateId,
  getCurrentTimestamp 
} from '@wfynbzlx666/sdk-core'

// 异步延迟
await sleep(1000)

// 超时控制
const result = await timeout(fetch('/api/data'), 5000)

// 功能支持检测
const support = isSupported()
console.log('BroadcastChannel 支持:', support.broadcastChannel)

// 生成唯一ID
const id = generateId()

// 获取当前时间戳
const now = getCurrentTimestamp()
```

## 📊 使用场景

### 1. 批量数据处理

```typescript
const queue = createDatabaseTaskQueue({
  onProgress: (progress) => {
    updateProgressBar(progress.percentage)
  }
})

// 批量保存用户数据
const users = await loadUsers()
const tasks = users.map(user => ({
  fn: async (userData) => {
    return await saveUserToDatabase(userData)
  },
  data: user,
  options: { priority: user.isVip ? 2 : 1 }
}))

await queue.addTasks(tasks)
const results = await queue.start()
```

### 2. 文件上传队列

```typescript
const uploadQueue = createTaskQueue({
  maxConcurrent: 3,
  timeout: 120000, // 2分钟超时
  onTaskComplete: (task, status) => {
    if (status === 'success') {
      showNotification(`文件 ${task.data.filename} 上传成功`)
    }
  }
})

files.forEach((file, index) => {
  uploadQueue.addTask(async (fileData) => {
    return await uploadFile(fileData.file)
  }, { file, filename: file.name }, { priority: files.length - index })
})
```

### 3. API 数据同步

```typescript
const syncQueue = createHighConcurrencyTaskQueue({
  maxConcurrent: 10,
  onError: (error) => {
    console.error('同步失败:', error)
  }
})

// 同步多个数据源
const dataSources = ['users', 'products', 'orders']
dataSources.forEach(source => {
  syncQueue.addTask(async () => {
    return await syncDataFromAPI(source)
  })
})

await syncQueue.start()
```

## 🔧 配置选项

### TaskQueue 配置

```typescript
interface TaskQueueOptions {
  maxConcurrent?: number     // 最大并发数，默认 3
  requestInterval?: number   // 请求间隔(ms)，默认 100
  maxRetries?: number        // 最大重试次数，默认 3
  retryDelay?: number        // 重试延迟(ms)，默认 1000
  timeout?: number           // 超时时间(ms)，默认 30000
  onProgress?: (progress: ProgressInfo) => void
  onTaskComplete?: (task: TaskItem, status: 'success' | 'failed') => void
  onQueueComplete?: (results: QueueResults) => void
  onError?: (error: Error) => void
}
```

### TaskOptions 配置

```typescript
interface TaskOptions {
  priority?: number     // 任务优先级，数字越大优先级越高
  maxRetries?: number   // 最大重试次数
  timeout?: number      // 任务超时时间
  retryDelay?: number   // 重试延迟
  [key: string]: any    // 自定义选项
}
```

## 🔍 类型定义

```typescript
// 任务状态
type TaskStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'retrying' | 'cancelled'

// 进度信息
interface ProgressInfo {
  total: number
  completed: number
  failed: number
  executing: number
  pending: number
  percentage: number
  isComplete: boolean
  elapsedTime: number
}

// 队列结果
interface QueueResults {
  stats: {
    total: number
    completed: number
    failed: number
    executing: number
    pending: number
    startTime?: number
    endTime?: number
  }
  completed: TaskItem[]
  failed: TaskItem[]
  isSuccess: boolean
  successRate: number
}
```

## 🚀 性能优化建议

### 1. 合理设置并发数

```typescript
// CPU 密集型任务
const cpuQueue = createTaskQueue({ maxConcurrent: 2 })

// I/O 密集型任务
const ioQueue = createTaskQueue({ maxConcurrent: 10 })

// 数据库操作
const dbQueue = createDatabaseTaskQueue({ maxConcurrent: 2 })
```

### 2. 使用优先级控制

```typescript
// 重要任务优先执行
queue.addTask(criticalTask, data, { priority: 10 })
queue.addTask(normalTask, data, { priority: 5 })
queue.addTask(lowPriorityTask, data, { priority: 1 })
```

### 3. 监控和调试

```typescript
const queue = createTaskQueue({
  onProgress: (progress) => {
    console.log(`进度: ${progress.percentage}% (${progress.completed}/${progress.total})`)
  },
  onTaskComplete: (task, status) => {
    console.log(`任务 ${task.id} ${status}, 耗时: ${task.duration}ms`)
  },
  onError: (error) => {
    console.error('任务执行错误:', error)
  }
})
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License