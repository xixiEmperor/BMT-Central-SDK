# @wfynbzlx666/sdk-realtime

BMT 平台 SDK 实时通信模块，基于 Socket.IO 提供可靠的实时双向通信能力，支持心跳保活、自动重连、消息确认和跨标签页协调。

## 🚀 特性

- **Socket.IO 可靠通道**：基于 Socket.IO 的高可靠性实时通信
- **心跳保活**：自动心跳检测，保持连接活跃
- **自动重连**：断线后智能重连，支持指数退避
- **消息确认机制**：ACK 机制确保消息可靠传输
- **离线消息队列**：连接断开时缓存消息，重连后自动发送

- **频道权限检查**：集成后端API的频道访问权限验证
- **TypeScript 支持**：完整的类型定义和 IntelliSense 支持

## 📦 安装

```bash
npm install @wfynbzlx666/sdk-realtime
```

## 🎯 核心模块

### Realtime 主类

实时通信系统的主入口，提供完整的 WebSocket 连接管理和消息处理能力。

#### 🚀 快速开始

```typescript
import { Realtime } from '@wfynbzlx666/sdk-realtime'

// 初始化实时通信
Realtime.init({
  url: 'ws://localhost:5000',
  auth: () => 'your-access-token' // 认证令牌提供者
})

// 连接到服务器
await Realtime.connect()

// 订阅消息
const subscription = Realtime.subscribe('notifications', (message) => {
  console.log('收到通知:', message.payload)
})

// 发布消息
await Realtime.publish('user-updates', {
  type: 'status',
  data: { status: 'online' }
})

// 取消订阅
subscription.unsubscribe()
```

#### 🔧 高级配置

```typescript
import { Realtime } from '@wfynbzlx666/sdk-realtime'

// 完整配置示例
Realtime.init({
  url: 'wss://api.example.com',
  
  // 认证配置
  auth: async () => {
    // 可以是同步或异步函数
    const token = await getAccessToken()
    return token
  },
  
  // 连接配置
  heartbeatInterval: 30000,     // 心跳间隔 30 秒
  
  // 重连配置
  reconnect: {
    enabled: true,              // 启用自动重连
    maxAttempts: 5,            // 最大重连次数
    baseMs: 1000,              // 重连基础间隔
    capMs: 30000               // 重连最大间隔
  },
  
  // 消息配置
  ackTimeout: 10000,          // ACK确认超时 10 秒
  maxRetries: 3,              // 消息最大重试次数
  maxQueueSize: 1000          // 消息队列最大长度
})

// 连接到服务器
await Realtime.connect()
```

### 消息订阅与发布

支持灵活的消息订阅和发布模式。

#### 📨 消息订阅

```typescript
// 基础订阅
const subscription = Realtime.subscribe('notifications', (message) => {
  console.log('收到消息:', message.payload)
})

// 订阅多个频道
const subscription1 = Realtime.subscribe('notifications', (message) => {
  console.log('通知消息:', message.payload)
})

const subscription2 = Realtime.subscribe('system-alerts', (message) => {
  console.log('系统警报:', message.payload)
})

const subscription3 = Realtime.subscribe('user-messages', (message) => {
  console.log('用户消息:', message.payload)
})

// 取消订阅
subscription.unsubscribe()
subscription1.unsubscribe()
subscription2.unsubscribe()
subscription3.unsubscribe()
```

#### 📤 消息发布

```typescript
// 基础发布
await Realtime.publish('user-status', {
  userId: '123',
  status: 'online',
  timestamp: Date.now()
})

// 带确认的发布
try {
  await Realtime.publish('important-data', {
    data: 'critical information'
  }, {
    ackRequired: true          // 要求确认，默认为true
  })
  console.log('消息发布成功')
} catch (error) {
  console.error('消息发布失败:', error)
}

// 不需要确认的发布
await Realtime.publish('system-announcement', {
  message: '系统将于 30 分钟后维护',
  level: 'warning'
}, {
  ackRequired: false
})
```

### 连接管理

高级连接管理功能，支持连接状态监控和控制。

#### 🔗 连接状态

```typescript
// 检查连接状态
const status = Realtime.getStatus()
if (status === 'connected') {
  console.log('WebSocket 已连接')
}

// 获取客户端统计信息
const stats = Realtime.getStats()
console.log('客户端统计:', {
  status: stats.status,
  subscriptions: stats.subscriptions,
  queueSize: stats.queueSize,
  reconnectCount: stats.reconnectCount
})

// 监听连接状态变化
const unsubscribe = Realtime.onConnectionChange((status, error) => {
  console.log('连接状态变化:', status)
  
  switch (status) {
    case 'connecting':
      console.log('正在连接...')
      break
    case 'connected':
      console.log('连接成功')
      break
    case 'disconnected':
      console.log('连接断开')
      break
    case 'reconnecting':
      console.log('正在重连...')
      break
    case 'error':
      console.error('连接错误:', error)
      break
  }
})

// 取消监听
// unsubscribe()
```

#### 🔄 重连机制

```typescript
// 重连是自动进行的，可以通过配置控制
Realtime.init({
  url: 'ws://localhost:5000',
  reconnect: {
    enabled: true,        // 启用自动重连
    maxAttempts: 5,      // 最大重连次数，-1表示无限重连
    baseMs: 1000,        // 重连基础间隔
    capMs: 30000         // 重连最大间隔
  }
})

// 监听重连过程
Realtime.onConnectionChange((status) => {
  if (status === 'reconnecting') {
    const stats = Realtime.getStats()
    console.log(`正在进行第 ${stats.reconnectCount} 次重连...`)
  }
})
```

### 管理功能

提供服务器统计和系统广播功能。

#### 📊 服务器统计

```typescript
// 获取服务器统计信息
try {
  const serverStats = await Realtime.getServerStats()
  console.log('服务器统计:', {
    connectedClients: serverStats.connectedClients,
    totalMessages: serverStats.totalMessages,
    uptime: serverStats.uptime
  })
} catch (error) {
  console.error('获取服务器统计失败:', error)
}
```

#### 📢 系统广播

```typescript
// 发送系统广播消息
try {
  await Realtime.broadcast('系统维护通知', 'info', ['user1', 'user2'])
  console.log('广播发送成功')
} catch (error) {
  console.error('广播发送失败:', error)
}

// 发送警告级别的广播
await Realtime.broadcast('服务器负载过高', 'warning')

// 发送错误级别的广播
await Realtime.broadcast('系统出现异常', 'error')
```

#### 🔐 频道权限检查

```typescript
// 检查频道访问权限
try {
  const hasAccess = await Realtime.canAccessChannel('admin-channel')
  if (hasAccess.canSubscribe) {
    const subscription = Realtime.subscribe('admin-channel', (message) => {
      console.log('管理员消息:', message.payload)
    })
  }
  
  if (hasAccess.canPublish) {
    await Realtime.publish('admin-channel', {
      type: 'admin-action',
      data: { action: 'user-ban', userId: '123' }
    })
  }
} catch (error) {
  console.error('权限检查失败:', error)
}
```

## 📊 使用场景

### 1. 实时聊天应用

```typescript
import { Realtime } from '@wfynbzlx666/sdk-realtime'

class ChatService {
  private messageSubscription: any
  
  async initializeChat(userId: string, roomId: string) {
    // 初始化实时连接
    Realtime.init({
      url: 'wss://chat.example.com',
      auth: () => this.getAuthToken()
    })
    
    // 连接到服务器
    await Realtime.connect()
    
    // 订阅聊天室消息
    this.messageSubscription = Realtime.subscribe(`room:${roomId}`, (message) => {
      // 过滤掉自己发送的消息（避免重复显示）
      if (message.payload.senderId !== userId) {
        this.handleChatMessage(message)
      }
    })
    
    // 订阅用户状态更新
    Realtime.subscribe(`user:${userId}:status`, (statusUpdate) => {
      this.handleUserStatusUpdate(statusUpdate)
    })
  }
  
  async sendMessage(roomId: string, content: string, userId: string) {
    try {
      await Realtime.publish(`room:${roomId}`, {
        type: 'message',
        content,
        senderId: userId,
        timestamp: Date.now()
      }, {
        ackRequired: true
      })
    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    }
  }
  
  async updateUserStatus(userId: string, status: 'online' | 'away' | 'offline') {
    await Realtime.publish(`user:${userId}:status`, {
      userId,
      status,
      timestamp: Date.now()
    })
  }
  
  private handleChatMessage(message: any) {
    // 处理接收到的聊天消息
    const chatMessage = {
      id: message.payload.id,
      content: message.payload.content,
      sender: message.payload.senderId,
      timestamp: message.payload.timestamp
    }
    
    // 更新 UI
    this.addMessageToUI(chatMessage)
  }
  
  private handleUserStatusUpdate(statusUpdate: any) {
    // 更新用户状态显示
    this.updateUserStatusInUI(statusUpdate.payload.userId, statusUpdate.payload.status)
  }
  
  private getAuthToken(): string {
    // 实现获取认证令牌的逻辑
    return 'your-auth-token'
  }
  
  private addMessageToUI(message: any) {
    // 实现添加消息到UI的逻辑
    console.log('新消息:', message)
  }
  
  private updateUserStatusInUI(userId: string, status: string) {
    // 实现更新用户状态UI的逻辑
    console.log(`用户 ${userId} 状态变更为: ${status}`)
  }
  
  cleanup() {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe()
    }
    Realtime.disconnect()
  }
}
```

### 2. 实时数据看板

```typescript
import { Realtime } from '@wfynbzlx666/sdk-realtime'

class DashboardService {
  private subscriptions: Map<string, any> = new Map()
  
  async initializeDashboard() {
    Realtime.init({
      url: 'wss://api.example.com',
      auth: () => this.getAuthToken(),
      heartbeatInterval: 10000 // 更频繁的心跳，确保数据实时性
    })
    
    // 连接到服务器
    await Realtime.connect()
    
    // 订阅多个数据源
    this.subscribeToDataSources([
      'system-metrics',
      'user-analytics',
      'error-reports',
      'performance-metrics'
    ])
  }
  
  private subscribeToDataSources(dataSources: string[]) {
    dataSources.forEach(source => {
      const subscription = Realtime.subscribe(source, (data) => {
        this.updateDashboardData(source, data)
      })
      
      this.subscriptions.set(source, subscription)
    })
  }
  
  private updateDashboardData(source: string, data: any) {
    switch (source) {
      case 'system-metrics':
        this.updateSystemMetrics(data.payload)
        break
      case 'user-analytics':
        this.updateUserAnalytics(data.payload)
        break
      case 'error-reports':
        this.updateErrorReports(data.payload)
        break
      case 'performance-metrics':
        this.updatePerformanceMetrics(data.payload)
        break
    }
  }
  
  // 请求历史数据
  async requestHistoricalData(source: string, timeRange: string) {
    await Realtime.publish(`${source}:request`, {
      type: 'historical-data',
      timeRange,
      requestId: this.generateRequestId()
    })
  }
  
  private getAuthToken(): string {
    // 实现获取认证令牌的逻辑
    return 'your-auth-token'
  }
  
  private generateRequestId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }
  
  private updateSystemMetrics(data: any) {
    // 实现系统指标更新逻辑
    console.log('系统指标更新:', data)
  }
  
  private updateUserAnalytics(data: any) {
    // 实现用户分析更新逻辑
    console.log('用户分析更新:', data)
  }
  
  private updateErrorReports(data: any) {
    // 实现错误报告更新逻辑
    console.log('错误报告更新:', data)
  }
  
  private updatePerformanceMetrics(data: any) {
    // 实现性能指标更新逻辑
    console.log('性能指标更新:', data)
  }
  
  cleanup() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe()
    })
    this.subscriptions.clear()
    Realtime.disconnect()
  }
}
```

### 3. 多人协作编辑

```typescript
import { Realtime } from '@wfynbzlx666/sdk-realtime'

class CollaborativeEditor {
  private documentId: string
  private userId: string
  private documentSubscription: any
  private cursorSubscription: any
  private sequenceNumber: number = 0
  
  constructor(documentId: string, userId: string) {
    this.documentId = documentId
    this.userId = userId
  }
  
  async initialize() {
    Realtime.init({
      url: 'wss://collab.example.com',
      auth: () => this.getAuthToken()
    })
    
    // 连接到服务器
    await Realtime.connect()
    
    // 订阅文档变更
    this.documentSubscription = Realtime.subscribe(
      `document:${this.documentId}:changes`,
      (operation) => {
        // 过滤掉自己的操作
        if (operation.payload.userId !== this.userId) {
          this.applyRemoteOperation(operation)
        }
      }
    )
    
    // 订阅光标位置
    this.cursorSubscription = Realtime.subscribe(
      `document:${this.documentId}:cursors`,
      (cursorUpdate) => {
        if (cursorUpdate.payload.userId !== this.userId) {
          this.updateRemoteCursor(cursorUpdate)
        }
      }
    )
    
    // 通知其他用户自己加入了编辑
    await this.notifyUserJoined()
  }
  
  // 发送文档操作
  async sendOperation(operation: any) {
    await Realtime.publish(`document:${this.documentId}:changes`, {
      ...operation,
      userId: this.userId,
      timestamp: Date.now(),
      sequenceNumber: this.getNextSequenceNumber()
    }, {
      ackRequired: true
    })
  }
  
  // 发送光标位置更新
  async updateCursorPosition(position: number) {
    await Realtime.publish(`document:${this.documentId}:cursors`, {
      userId: this.userId,
      position,
      timestamp: Date.now()
    })
  }
  
  // 通知用户加入编辑
  private async notifyUserJoined() {
    await Realtime.publish(`document:${this.documentId}:presence`, {
      type: 'user-joined',
      userId: this.userId,
      username: this.getUsername(),
      timestamp: Date.now()
    })
  }
  
  // 应用远程操作
  private applyRemoteOperation(operation: any) {
    // 应用操作变换（OT 算法）
    const transformedOperation = this.transformOperation(operation.payload)
    this.applyOperationToDocument(transformedOperation)
  }
  
  // 更新远程用户光标
  private updateRemoteCursor(cursorUpdate: any) {
    this.displayRemoteCursor(cursorUpdate.payload.userId, cursorUpdate.payload.position)
  }
  
  private getAuthToken(): string {
    // 实现获取认证令牌的逻辑
    return 'your-auth-token'
  }
  
  private getUsername(): string {
    // 实现获取用户名的逻辑
    return `User_${this.userId}`
  }
  
  private getNextSequenceNumber(): number {
    return ++this.sequenceNumber
  }
  
  private transformOperation(operation: any): any {
    // 实现操作变换逻辑（OT算法）
    return operation
  }
  
  private applyOperationToDocument(operation: any) {
    // 实现将操作应用到文档的逻辑
    console.log('应用操作到文档:', operation)
  }
  
  private displayRemoteCursor(userId: string, position: number) {
    // 实现显示远程用户光标的逻辑
    console.log(`用户 ${userId} 光标位置:`, position)
  }
  
  cleanup() {
    // 通知其他用户自己离开了编辑
    Realtime.publish(`document:${this.documentId}:presence`, {
      type: 'user-left',
      userId: this.userId,
      timestamp: Date.now()
    })
    
    if (this.documentSubscription) {
      this.documentSubscription.unsubscribe()
    }
    if (this.cursorSubscription) {
      this.cursorSubscription.unsubscribe()
    }
    
    Realtime.disconnect()
  }
}
```

### 4. 实时通知系统

```typescript
import { Realtime } from '@wfynbzlx666/sdk-realtime'

class NotificationService {
  private userId: string
  private subscriptions: Map<string, any> = new Map()
  
  constructor(userId: string) {
    this.userId = userId
  }
  
  async initialize() {
    Realtime.init({
      url: 'wss://notifications.example.com',
      auth: () => this.getAuthToken()
    })
    
    // 连接到服务器
    await Realtime.connect()
    
    // 订阅个人通知
    this.subscribeToPersonalNotifications()
    
    // 订阅系统通知
    this.subscribeToSystemNotifications()
    
    // 订阅群组通知
    this.subscribeToGroupNotifications()
  }
  
  private subscribeToPersonalNotifications() {
    const subscription = Realtime.subscribe(
      `user:${this.userId}:notifications`,
      (notification) => {
        this.handlePersonalNotification(notification)
      }
    )
    
    this.subscriptions.set('personal', subscription)
  }
  
  private subscribeToSystemNotifications() {
    const subscription = Realtime.subscribe('system:notifications', (notification) => {
      // 根据用户等级过滤通知
      if (this.shouldReceiveSystemNotification(notification.payload)) {
        this.handleSystemNotification(notification)
      }
    })
    
    this.subscriptions.set('system', subscription)
  }
  
  private subscribeToGroupNotifications() {
    // 获取用户所属的群组
    const userGroups = this.getUserGroups()
    
    userGroups.forEach(groupId => {
      const subscription = Realtime.subscribe(
        `group:${groupId}:notifications`,
        (notification) => {
          this.handleGroupNotification(groupId, notification)
        }
      )
      
      this.subscriptions.set(`group:${groupId}`, subscription)
    })
  }
  
  private handlePersonalNotification(notification: any) {
    // 显示个人通知
    this.showNotification({
      type: 'personal',
      title: notification.payload.title,
      message: notification.payload.message,
      priority: notification.payload.priority,
      actions: notification.payload.actions
    })
    
    // 更新未读计数
    this.updateUnreadCount('personal')
  }
  
  private handleSystemNotification(notification: any) {
    // 显示系统通知
    this.showNotification({
      type: 'system',
      title: '系统通知',
      message: notification.payload.message,
      priority: 'high',
      persistent: true
    })
  }
  
  private handleGroupNotification(groupId: string, notification: any) {
    // 显示群组通知
    this.showNotification({
      type: 'group',
      title: `群组通知 - ${this.getGroupName(groupId)}`,
      message: notification.payload.message,
      groupId
    })
    
    this.updateUnreadCount(`group:${groupId}`)
  }
  
  // 标记通知为已读
  async markAsRead(notificationId: string) {
    await Realtime.publish(`user:${this.userId}:mark-read`, {
      notificationId,
      timestamp: Date.now()
    })
  }
  
  // 订阅新群组的通知
  async subscribeToGroup(groupId: string) {
    if (!this.subscriptions.has(`group:${groupId}`)) {
      const subscription = Realtime.subscribe(
        `group:${groupId}:notifications`,
        (notification) => {
          this.handleGroupNotification(groupId, notification)
        }
      )
      
      this.subscriptions.set(`group:${groupId}`, subscription)
    }
  }
  
  // 取消订阅群组通知
  unsubscribeFromGroup(groupId: string) {
    const subscription = this.subscriptions.get(`group:${groupId}`)
    if (subscription) {
      subscription.unsubscribe()
      this.subscriptions.delete(`group:${groupId}`)
    }
  }
  
  private getAuthToken(): string {
    // 实现获取认证令牌的逻辑
    return 'your-auth-token'
  }
  
  private getUserGroups(): string[] {
    // 实现获取用户群组的逻辑
    return ['group1', 'group2']
  }
  
  private shouldReceiveSystemNotification(notification: any): boolean {
    // 实现系统通知过滤逻辑
    return true
  }
  
  private showNotification(notification: any) {
    // 实现显示通知的逻辑
    console.log('显示通知:', notification)
  }
  
  private updateUnreadCount(type: string) {
    // 实现更新未读计数的逻辑
    console.log(`更新未读计数: ${type}`)
  }
  
  private getGroupName(groupId: string): string {
    // 实现获取群组名称的逻辑
    return `Group ${groupId}`
  }
  
  cleanup() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe()
    })
    this.subscriptions.clear()
    Realtime.disconnect()
  }
}
```

## 🔧 配置选项

### Realtime 配置

```typescript
interface RealtimeOptions {
  /** WebSocket 服务器地址 */
  url: string
  
  /** 认证令牌提供者函数 */
  auth?: () => string | Promise<string>
  
  /** 心跳间隔时间（毫秒），默认 30000 */
  heartbeatInterval?: number
  
  /** 重连配置选项 */
  reconnect?: {
    /** 是否启用自动重连，默认 true */
    enabled?: boolean
    /** 最大重连尝试次数，-1表示无限重连，默认 -1 */
    maxAttempts?: number
    /** 重连间隔基础时间（毫秒），默认 1000 */
    baseMs?: number
    /** 最大重连间隔时间（毫秒），默认 30000 */
    capMs?: number
  }
  
  /** ACK确认超时时间（毫秒），默认 5000 */
  ackTimeout?: number
  
  /** 消息最大重发次数，默认 3 */
  maxRetries?: number
  
  /** 消息队列最大长度，默认 1000 */
  maxQueueSize?: number
}
```

### 发布配置

```typescript
interface PublishOptions {
  /** 是否需要ACK确认，默认 true */
  ackRequired?: boolean
}
```

## 🔍 类型定义

```typescript
// 连接状态枚举
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

// 消息类型枚举
type MessageType = 'event' | 'ack' | 'error' | 'subscribe' | 'publish'

// 基础消息结构
interface RealtimeMessage<T = unknown> {
  type: MessageType
  topic?: string
  id?: string
  seq?: number
  payload?: T
  code?: string
  message?: string
  ts?: number
}

// 事件消息
interface EventMessage<T = unknown> extends RealtimeMessage<T> {
  type: 'event'
  topic: string
  payload: T
}

// 订阅对象
interface Subscription {
  unsubscribe(): void
  getTopic(): string
  isActive(): boolean
}

// 消息监听器
type MessageListener<T = unknown> = (message: RealtimeMessage<T>) => void

// 连接状态监听器
type ConnectionListener = (status: ConnectionStatus, error?: Error) => void
```

## 🚀 性能优化建议

### 1. 连接优化

```typescript
// 使用连接池减少连接开销
const connectionPool = new Map()

async function getRealtimeConnection(namespace: string) {
  if (!connectionPool.has(namespace)) {
    const connection = await Realtime.init({
      url: 'wss://api.example.com',
      namespace,
      auth: () => getSharedToken()
    })
    connectionPool.set(namespace, connection)
  }
  
  return connectionPool.get(namespace)
}
```

### 2. 消息优化

```typescript
// 批量处理消息，减少 UI 更新频率
class MessageBatcher {
  private messages: any[] = []
  private flushTimer: any
  
  addMessage(message: any) {
    this.messages.push(message)
    
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flush()
      }, 100) // 100ms 批量处理
    }
  }
  
  private flush() {
    if (this.messages.length > 0) {
      this.processBatchedMessages(this.messages)
      this.messages = []
    }
    this.flushTimer = null
  }
}
```

### 3. 内存管理

```typescript
// 及时清理订阅，避免内存泄漏
class SubscriptionManager {
  private subscriptions: Map<string, Subscription> = new Map()
  
  subscribe(channel: string, handler: Function) {
    const subscription = Realtime.subscribe(channel, handler)
    this.subscriptions.set(channel, subscription)
    return subscription
  }
  
  unsubscribe(channel: string) {
    const subscription = this.subscriptions.get(channel)
    if (subscription) {
      subscription.unsubscribe()
      this.subscriptions.delete(channel)
    }
  }
  
  cleanup() {
    this.subscriptions.forEach(subscription => {
      subscription.unsubscribe()
    })
    this.subscriptions.clear()
  }
}
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
