# @platform/sdk-realtime

BMT 平台 SDK 实时通信模块，基于 Socket.IO 提供可靠的实时双向通信能力，支持心跳保活、自动重连、消息确认和跨标签页协调。

## 🚀 特性

- **Socket.IO 可靠通道**：基于 Socket.IO 的高可靠性实时通信
- **心跳保活**：自动心跳检测，保持连接活跃
- **自动重连**：断线后智能重连，支持指数退避
- **消息确认机制**：ACK 机制确保消息可靠传输
- **序列号有序**：消息序列号保证消息顺序
- **跨标签页协调**：多标签页间的连接协调和状态同步
- **频道权限管理**：基于权限的频道订阅和发布控制
- **TypeScript 支持**：完整的类型定义和 IntelliSense 支持

## 📦 安装

```bash
npm install @platform/sdk-realtime
```

## 🎯 核心模块

### Realtime 主类

实时通信系统的主入口，提供完整的 WebSocket 连接管理和消息处理能力。

#### 🚀 快速开始

```typescript
import { Realtime } from '@platform/sdk-realtime'

// 初始化实时通信
await Realtime.init({
  url: 'ws://localhost:5000',
  auth: () => 'your-access-token', // 认证令牌提供者
  namespace: '/', // Socket.IO 命名空间
  debug: true
})

// 订阅消息
const subscription = Realtime.subscribe('notifications', (message) => {
  console.log('收到通知:', message)
})

// 发布消息
await Realtime.publish('user-updates', {
  type: 'status',
  data: { status: 'online' }
})

// 取消订阅
subscription.unsubscribe()

// 断开连接
await Realtime.disconnect()
```

#### 🔧 高级配置

```typescript
import { Realtime } from '@platform/sdk-realtime'

// 完整配置示例
await Realtime.init({
  url: 'wss://api.example.com',
  
  // 认证配置
  auth: async () => {
    // 可以是同步或异步函数
    const token = await getAccessToken()
    return token
  },
  
  // Socket.IO 配置
  namespace: '/v1',
  transports: ['websocket', 'polling'],
  
  // 连接配置
  heartbeatInterval: 30000,     // 心跳间隔 30 秒
  reconnectDelay: 1000,         // 重连延迟 1 秒
  maxReconnectAttempts: 5,      // 最大重连次数
  
  // 消息配置
  messageTimeout: 10000,        // 消息确认超时 10 秒
  enableSequencing: true,       // 启用消息序列号
  enableCrossTabCoordination: true, // 启用跨标签页协调
  
  // 调试配置
  debug: process.env.NODE_ENV === 'development',
  
  // 事件回调
  onConnect: (socket) => {
    console.log('WebSocket 连接成功:', socket.id)
  },
  
  onDisconnect: (reason) => {
    console.log('WebSocket 连接断开:', reason)
  },
  
  onReconnect: (attempt) => {
    console.log(`第 ${attempt} 次重连成功`)
  },
  
  onError: (error) => {
    console.error('WebSocket 连接错误:', error)
  }
})
```

### 消息订阅与发布

支持灵活的消息订阅和发布模式。

#### 📨 消息订阅

```typescript
// 基础订阅
const subscription = Realtime.subscribe('notifications', (message) => {
  console.log('收到消息:', message.data)
})

// 带选项的订阅
const advancedSubscription = Realtime.subscribe('user-events', {
  onMessage: (message) => {
    console.log('用户事件:', message)
  },
  
  onError: (error) => {
    console.error('订阅错误:', error)
  },
  
  // 消息过滤器
  filter: (message) => {
    return message.type === 'important'
  },
  
  // 自动确认消息
  autoAck: true
})

// 订阅多个频道
const multiSubscription = Realtime.subscribeMultiple([
  'notifications',
  'system-alerts',
  'user-messages'
], {
  onMessage: (channel, message) => {
    console.log(`频道 ${channel} 收到消息:`, message)
  }
})

// 取消订阅
subscription.unsubscribe()
advancedSubscription.unsubscribe()
multiSubscription.unsubscribe()
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
const result = await Realtime.publish('important-data', {
  data: 'critical information'
}, {
  requireAck: true,          // 要求确认
  timeout: 5000,            // 确认超时时间
  retries: 3                // 重试次数
})

if (result.success) {
  console.log('消息发布成功')
} else {
  console.error('消息发布失败:', result.error)
}

// 广播到所有连接的客户端
await Realtime.broadcast('system-announcement', {
  message: '系统将于 30 分钟后维护',
  level: 'warning'
})

// 向特定用户发送私信
await Realtime.sendToUser('user123', 'private-message', {
  from: 'admin',
  content: '您有新的系统通知'
})
```

### 连接管理

高级连接管理功能，支持连接状态监控和控制。

#### 🔗 连接状态

```typescript
// 检查连接状态
if (Realtime.isConnected()) {
  console.log('WebSocket 已连接')
}

// 获取连接信息
const connectionInfo = Realtime.getConnectionInfo()
console.log('连接信息:', {
  id: connectionInfo.id,
  namespace: connectionInfo.namespace,
  transport: connectionInfo.transport,
  connectedAt: connectionInfo.connectedAt
})

// 监听连接状态变化
Realtime.onConnectionStateChange((state, info) => {
  console.log('连接状态变化:', state, info)
  
  switch (state) {
    case 'connecting':
      showLoadingIndicator()
      break
    case 'connected':
      hideLoadingIndicator()
      break
    case 'disconnected':
      showOfflineIndicator()
      break
    case 'error':
      showErrorMessage(info.error)
      break
  }
})
```

#### 🔄 手动重连

```typescript
// 手动重连
try {
  await Realtime.reconnect()
  console.log('重连成功')
} catch (error) {
  console.error('重连失败:', error)
}

// 重连到不同的服务器
await Realtime.reconnectTo('wss://backup.example.com')

// 获取重连统计
const reconnectStats = Realtime.getReconnectStats()
console.log('重连统计:', {
  attempts: reconnectStats.attempts,
  successes: reconnectStats.successes,
  lastAttempt: reconnectStats.lastAttempt
})
```

### 跨标签页协调

防止多个标签页建立重复连接，优化资源使用。

#### 🔀 标签页协调

```typescript
// 启用跨标签页协调
await Realtime.init({
  url: 'ws://localhost:5000',
  enableCrossTabCoordination: true,
  
  // 主标签页回调
  onBecomeMaster: () => {
    console.log('当前标签页成为主连接')
  },
  
  // 从标签页回调
  onBecomeSlave: () => {
    console.log('当前标签页成为从连接')
  },
  
  // 标签页间消息转发
  onCrossTabMessage: (message) => {
    console.log('跨标签页消息:', message)
  }
})

// 检查是否为主标签页
if (Realtime.isMasterTab()) {
  console.log('当前是主标签页，负责 WebSocket 连接')
}

// 向其他标签页发送消息
Realtime.sendToOtherTabs({
  type: 'user-action',
  data: { action: 'logout' }
})

// 监听其他标签页的消息
Realtime.onMessageFromOtherTabs((message) => {
  if (message.type === 'user-action' && message.data.action === 'logout') {
    // 同步登出状态
    handleLogout()
  }
})
```

### 权限管理

基于权限的频道访问控制。

#### 🔐 频道权限

```typescript
import { ChannelPermissions } from '@platform/sdk-realtime'

// 检查频道权限
const canSubscribe = await ChannelPermissions.checkChannelPermission(
  'admin-notifications',
  'subscribe'
)

if (canSubscribe) {
  const subscription = Realtime.subscribe('admin-notifications', handleAdminMessage)
} else {
  console.log('没有权限订阅管理员通知')
}

// 检查发布权限
const canPublish = await ChannelPermissions.checkChannelPermission(
  'user-events',
  'publish'
)

if (canPublish) {
  await Realtime.publish('user-events', eventData)
}

// 获取用户可访问的所有频道
const userChannels = await ChannelPermissions.getUserChannels()
console.log('可访问的频道:', userChannels)

// 监听权限变化
ChannelPermissions.onPermissionChange((channel, permission, granted) => {
  console.log(`频道 ${channel} 的 ${permission} 权限变化: ${granted}`)
  
  if (!granted && permission === 'subscribe') {
    // 权限被撤销，取消订阅
    Realtime.unsubscribe(channel)
  }
})
```

## 📊 使用场景

### 1. 实时聊天应用

```typescript
import { Realtime } from '@platform/sdk-realtime'

class ChatService {
  private messageSubscription: any
  
  async initializeChat(userId: string, roomId: string) {
    // 初始化实时连接
    await Realtime.init({
      url: 'wss://chat.example.com',
      auth: () => this.getAuthToken(),
      namespace: '/chat'
    })
    
    // 订阅聊天室消息
    this.messageSubscription = Realtime.subscribe(`room:${roomId}`, {
      onMessage: (message) => {
        this.handleChatMessage(message)
      },
      filter: (message) => {
        // 过滤掉自己发送的消息（避免重复显示）
        return message.senderId !== userId
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
        requireAck: true,
        timeout: 5000
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
      id: message.id,
      content: message.content,
      sender: message.senderId,
      timestamp: message.timestamp
    }
    
    // 更新 UI
    this.addMessageToUI(chatMessage)
    
    // 发送消息确认
    Realtime.ack(message.id)
  }
  
  private handleUserStatusUpdate(statusUpdate: any) {
    // 更新用户状态显示
    this.updateUserStatusInUI(statusUpdate.userId, statusUpdate.status)
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
import { Realtime } from '@platform/sdk-realtime'

class DashboardService {
  private subscriptions: Map<string, any> = new Map()
  
  async initializeDashboard() {
    await Realtime.init({
      url: 'wss://api.example.com',
      auth: () => this.getAuthToken(),
      namespace: '/dashboard',
      heartbeatInterval: 10000 // 更频繁的心跳，确保数据实时性
    })
    
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
      const subscription = Realtime.subscribe(source, {
        onMessage: (data) => {
          this.updateDashboardData(source, data)
        },
        onError: (error) => {
          console.error(`数据源 ${source} 订阅错误:`, error)
          this.showDataSourceError(source)
        }
      })
      
      this.subscriptions.set(source, subscription)
    })
  }
  
  private updateDashboardData(source: string, data: any) {
    switch (source) {
      case 'system-metrics':
        this.updateSystemMetrics(data)
        break
      case 'user-analytics':
        this.updateUserAnalytics(data)
        break
      case 'error-reports':
        this.updateErrorReports(data)
        break
      case 'performance-metrics':
        this.updatePerformanceMetrics(data)
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
import { Realtime } from '@platform/sdk-realtime'

class CollaborativeEditor {
  private documentId: string
  private userId: string
  private documentSubscription: any
  private cursorSubscription: any
  
  constructor(documentId: string, userId: string) {
    this.documentId = documentId
    this.userId = userId
  }
  
  async initialize() {
    await Realtime.init({
      url: 'wss://collab.example.com',
      auth: () => this.getAuthToken(),
      namespace: '/documents',
      enableSequencing: true // 确保操作顺序
    })
    
    // 订阅文档变更
    this.documentSubscription = Realtime.subscribe(
      `document:${this.documentId}:changes`,
      {
        onMessage: (operation) => {
          this.applyRemoteOperation(operation)
        },
        filter: (operation) => {
          // 过滤掉自己的操作
          return operation.userId !== this.userId
        }
      }
    )
    
    // 订阅光标位置
    this.cursorSubscription = Realtime.subscribe(
      `document:${this.documentId}:cursors`,
      {
        onMessage: (cursorUpdate) => {
          this.updateRemoteCursor(cursorUpdate)
        },
        filter: (update) => update.userId !== this.userId
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
      requireAck: true,
      timeout: 3000
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
    const transformedOperation = this.transformOperation(operation)
    this.applyOperationToDocument(transformedOperation)
    
    // 确认接收
    Realtime.ack(operation.id)
  }
  
  // 更新远程用户光标
  private updateRemoteCursor(cursorUpdate: any) {
    this.displayRemoteCursor(cursorUpdate.userId, cursorUpdate.position)
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
import { Realtime } from '@platform/sdk-realtime'

class NotificationService {
  private userId: string
  private subscriptions: Map<string, any> = new Map()
  
  constructor(userId: string) {
    this.userId = userId
  }
  
  async initialize() {
    await Realtime.init({
      url: 'wss://notifications.example.com',
      auth: () => this.getAuthToken(),
      namespace: '/notifications'
    })
    
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
      {
        onMessage: (notification) => {
          this.handlePersonalNotification(notification)
        },
        autoAck: true
      }
    )
    
    this.subscriptions.set('personal', subscription)
  }
  
  private subscribeToSystemNotifications() {
    const subscription = Realtime.subscribe('system:notifications', {
      onMessage: (notification) => {
        this.handleSystemNotification(notification)
      },
      filter: (notification) => {
        // 根据用户等级过滤通知
        return this.shouldReceiveSystemNotification(notification)
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
        {
          onMessage: (notification) => {
            this.handleGroupNotification(groupId, notification)
          }
        }
      )
      
      this.subscriptions.set(`group:${groupId}`, subscription)
    })
  }
  
  private handlePersonalNotification(notification: any) {
    // 显示个人通知
    this.showNotification({
      type: 'personal',
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      actions: notification.actions
    })
    
    // 更新未读计数
    this.updateUnreadCount('personal')
  }
  
  private handleSystemNotification(notification: any) {
    // 显示系统通知
    this.showNotification({
      type: 'system',
      title: '系统通知',
      message: notification.message,
      priority: 'high',
      persistent: true
    })
  }
  
  private handleGroupNotification(groupId: string, notification: any) {
    // 显示群组通知
    this.showNotification({
      type: 'group',
      title: `群组通知 - ${this.getGroupName(groupId)}`,
      message: notification.message,
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
        {
          onMessage: (notification) => {
            this.handleGroupNotification(groupId, notification)
          }
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
  // 连接配置
  url: string                           // WebSocket 服务器地址
  auth?: () => string | Promise<string> // 认证令牌提供者
  namespace?: string                    // Socket.IO 命名空间
  transports?: string[]                 // 传输方式
  
  // 重连配置
  reconnectDelay?: number              // 重连延迟，默认 1000ms
  maxReconnectAttempts?: number        // 最大重连次数，默认 5
  heartbeatInterval?: number           // 心跳间隔，默认 30000ms
  
  // 消息配置
  messageTimeout?: number              // 消息确认超时，默认 10000ms
  enableSequencing?: boolean           // 启用消息序列号，默认 false
  enableCrossTabCoordination?: boolean // 启用跨标签页协调，默认 false
  
  // 调试配置
  debug?: boolean                      // 调试模式，默认 false
  
  // 事件回调
  onConnect?: (socket: any) => void
  onDisconnect?: (reason: string) => void
  onReconnect?: (attempt: number) => void
  onError?: (error: Error) => void
  onBecomeMaster?: () => void
  onBecomeSlave?: () => void
}
```

### 订阅配置

```typescript
interface SubscriptionOptions {
  onMessage?: (message: any) => void    // 消息处理器
  onError?: (error: Error) => void      // 错误处理器
  filter?: (message: any) => boolean    // 消息过滤器
  autoAck?: boolean                     // 自动确认消息，默认 false
}
```

### 发布配置

```typescript
interface PublishOptions {
  requireAck?: boolean                  // 是否要求确认，默认 false
  timeout?: number                      // 确认超时时间，默认 10000ms
  retries?: number                      // 重试次数，默认 0
}
```

## 🔍 类型定义

```typescript
// 实时消息类型
interface RealtimeMessage {
  id: string
  channel: string
  data: any
  timestamp: number
  sequenceNumber?: number
  requiresAck?: boolean
}

// 订阅对象
interface Subscription {
  id: string
  channel: string
  unsubscribe(): void
  isActive(): boolean
}

// 连接信息
interface ConnectionInfo {
  id: string
  namespace: string
  transport: string
  connectedAt: number
  isConnected: boolean
}

// 重连统计
interface ReconnectStats {
  attempts: number
  successes: number
  failures: number
  lastAttempt?: number
  lastSuccess?: number
}
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
