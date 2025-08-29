# Socket.IO 深度学习指南

## 目录

1. [简介](#简介)
2. [基础概念](#基础概念)
3. [安装与配置](#安装与配置)
4. [客户端基础用法](#客户端基础用法)
5. [服务端基础用法](#服务端基础用法)
6. [事件系统](#事件系统)
7. [命名空间与房间](#命名空间与房间)
8. [错误处理与重连](#错误处理与重连)
9. [高级特性](#高级特性)
10. [性能优化](#性能优化)
11. [实战案例](#实战案例)
12. [最佳实践](#最佳实践)
13. [常见问题与解决方案](#常见问题与解决方案)

---

## 简介

Socket.IO 是一个用于浏览器和服务器之间实时双向基于事件的通信库。它建立在 WebSocket 协议之上，但提供了额外的功能，包括自动回退到 HTTP 长轮询、断线重连、数据包缓冲等。

### 核心优势

- **实时通信**: 提供低延迟的双向通信
- **跨浏览器兼容**: 自动回退到不同的传输方式
- **自动重连**: 网络中断时自动尝试重新连接
- **房间和命名空间**: 支持复杂的消息路由
- **二进制支持**: 可以传输二进制数据
- **可扩展性**: 支持多服务器部署

### 应用场景

- 实时聊天应用
- 实时协作工具
- 在线游戏
- 实时数据展示
- 推送通知系统
- 实时监控系统

---

## 基础概念

### 1. 事件驱动模型

Socket.IO 基于事件驱动的架构，客户端和服务端都可以发送和接收事件：

```javascript
// 发送事件
socket.emit('message', { text: 'Hello World' });

// 监听事件
socket.on('message', (data) => {
  console.log('收到消息:', data);
});
```

### 2. 传输方式

Socket.IO 支持多种传输方式，按优先级排序：

1. **WebSocket**: 最优选择，提供最低延迟
2. **HTTP 长轮询**: WebSocket 不可用时的回退方案
3. **HTTP 短轮询**: 最后的回退方案

### 3. 连接生命周期

```javascript
// 连接状态
socket.on('connect', () => {
  console.log('已连接到服务器');
});

socket.on('disconnect', (reason) => {
  console.log('连接断开:', reason);
});

socket.on('connect_error', (error) => {
  console.log('连接错误:', error);
});
```

---

## 安装与配置

### 客户端安装

```bash
# npm
npm install socket.io-client

# yarn
yarn add socket.io-client

# pnpm
pnpm add socket.io-client
```

### 服务端安装

```bash
# npm
npm install socket.io

# yarn
yarn add socket.io

# pnpm
pnpm add socket.io
```

### 基础配置

#### 客户端配置

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  // 自动连接
  autoConnect: true,
  
  // 重连配置
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  
  // 超时配置
  timeout: 20000,
  
  // 传输方式
  transports: ['websocket', 'polling'],
  
  // 认证
  auth: {
    token: 'your-auth-token'
  }
});
```

#### 服务端配置

```javascript
import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer();
const io = new Server(httpServer, {
  // CORS 配置
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  },
  
  // 连接超时
  connectTimeout: 45000,
  
  // 传输方式
  transports: ['websocket', 'polling'],
  
  // 允许升级传输方式
  allowUpgrades: true
});

httpServer.listen(3000);
```

---

## 客户端基础用法

### 1. 建立连接

```javascript
import { io } from 'socket.io-client';

// 基础连接
const socket = io('http://localhost:3000');

// 带配置的连接
const socket = io('http://localhost:3000', {
  autoConnect: false,
  auth: {
    token: localStorage.getItem('token')
  }
});

// 手动连接
socket.connect();
```

### 2. 发送消息

```javascript
// 基础发送
socket.emit('message', 'Hello Server');

// 发送对象
socket.emit('user-data', {
  id: 123,
  name: 'John Doe',
  timestamp: Date.now()
});

// 带回调的发送
socket.emit('request', { action: 'getData' }, (response) => {
  console.log('服务器响应:', response);
});
```

### 3. 接收消息

```javascript
// 监听特定事件
socket.on('message', (data) => {
  console.log('收到消息:', data);
});

// 监听多个事件
socket.on('notification', handleNotification);
socket.on('user-update', handleUserUpdate);
socket.on('system-alert', handleSystemAlert);

// 一次性监听
socket.once('welcome', (data) => {
  console.log('欢迎消息:', data);
});
```

### 4. 取消监听

```javascript
// 取消特定事件的所有监听器
socket.off('message');

// 取消特定事件的特定监听器
socket.off('message', handleMessage);

// 取消所有事件的所有监听器
socket.removeAllListeners();
```

---

## 服务端基础用法

### 1. 处理连接

```javascript
import { Server } from 'socket.io';

const io = new Server(httpServer);

io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  
  // 处理断开连接
  socket.on('disconnect', (reason) => {
    console.log('用户断开连接:', socket.id, reason);
  });
});
```

### 2. 处理事件

```javascript
io.on('connection', (socket) => {
  // 处理消息
  socket.on('message', (data) => {
    console.log('收到消息:', data);
    
    // 广播给所有客户端
    io.emit('message', data);
    
    // 或者只回复发送者
    socket.emit('message-received', { status: 'ok' });
  });
  
  // 处理带回调的事件
  socket.on('request', (data, callback) => {
    // 处理请求
    const result = processRequest(data);
    
    // 回调响应
    callback(result);
  });
});
```

### 3. 发送消息

```javascript
io.on('connection', (socket) => {
  // 发送给当前客户端
  socket.emit('welcome', { message: '欢迎连接' });
  
  // 发送给除当前客户端外的所有客户端
  socket.broadcast.emit('user-joined', { 
    userId: socket.id,
    timestamp: Date.now()
  });
  
  // 发送给所有客户端
  io.emit('announcement', { 
    message: '系统维护通知'
  });
});
```

---

## 事件系统

### 1. 内置事件

Socket.IO 提供了一些内置的事件：

#### 客户端内置事件

```javascript
// 连接成功
socket.on('connect', () => {
  console.log('连接ID:', socket.id);
});

// 连接断开
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // 服务器主动断开，需要手动重连
    socket.connect();
  }
  // 否则自动重连
});

// 连接错误
socket.on('connect_error', (error) => {
  console.log('连接失败:', error.message);
});

// 重连尝试
socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('重连尝试:', attemptNumber);
});

// 重连成功
socket.on('reconnect', (attemptNumber) => {
  console.log('重连成功，尝试次数:', attemptNumber);
});

// 重连失败
socket.on('reconnect_failed', () => {
  console.log('重连失败');
});
```

#### 服务端内置事件

```javascript
io.on('connection', (socket) => {
  // 客户端连接
  console.log('新连接:', socket.id);
  
  socket.on('disconnect', (reason) => {
    console.log('断开连接:', reason);
  });
  
  socket.on('disconnecting', (reason) => {
    console.log('即将断开连接:', reason);
    // 此时还可以访问 socket.rooms
  });
});
```

### 2. 自定义事件

```javascript
// 定义事件名称常量
const EVENTS = {
  MESSAGE: 'message',
  USER_JOIN: 'user:join',
  USER_LEAVE: 'user:leave',
  CHAT_MESSAGE: 'chat:message',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop'
};

// 客户端发送
socket.emit(EVENTS.CHAT_MESSAGE, {
  text: 'Hello everyone!',
  timestamp: Date.now(),
  userId: currentUser.id
});

// 服务端处理
socket.on(EVENTS.CHAT_MESSAGE, (data) => {
  // 验证消息
  if (!data.text || !data.userId) {
    return socket.emit('error', { message: '消息格式无效' });
  }
  
  // 广播消息
  io.emit(EVENTS.CHAT_MESSAGE, {
    ...data,
    id: generateMessageId(),
    serverTimestamp: Date.now()
  });
});
```

### 3. 事件确认 (ACK)

```javascript
// 客户端发送带确认的消息
socket.emit('save-data', { name: 'John' }, (response) => {
  if (response.success) {
    console.log('数据保存成功');
  } else {
    console.log('保存失败:', response.error);
  }
});

// 服务端处理并确认
socket.on('save-data', (data, callback) => {
  try {
    // 保存数据逻辑
    const result = saveUserData(data);
    
    // 成功回调
    callback({ success: true, data: result });
  } catch (error) {
    // 失败回调
    callback({ success: false, error: error.message });
  }
});
```

### 4. 超时处理

```javascript
// 客户端设置超时
socket.timeout(5000).emit('request-data', (err, response) => {
  if (err) {
    console.log('请求超时');
  } else {
    console.log('收到响应:', response);
  }
});

// 服务端也可以设置超时
socket.timeout(5000).emit('notification', data, (err) => {
  if (err) {
    console.log('客户端响应超时');
  }
});
```

---

## 命名空间与房间

### 1. 命名空间 (Namespaces)

命名空间允许你将 Socket.IO 应用分割成多个独立的通信通道：

#### 服务端创建命名空间

```javascript
// 创建命名空间
const chatNamespace = io.of('/chat');
const gameNamespace = io.of('/game');

// 聊天命名空间
chatNamespace.on('connection', (socket) => {
  console.log('聊天用户连接:', socket.id);
  
  socket.on('message', (data) => {
    chatNamespace.emit('message', data);
  });
});

// 游戏命名空间
gameNamespace.on('connection', (socket) => {
  console.log('游戏用户连接:', socket.id);
  
  socket.on('move', (data) => {
    gameNamespace.emit('player-move', data);
  });
});
```

#### 客户端连接命名空间

```javascript
// 连接不同的命名空间
const chatSocket = io('/chat');
const gameSocket = io('/game');

// 聊天功能
chatSocket.on('message', (data) => {
  displayMessage(data);
});

// 游戏功能
gameSocket.on('player-move', (data) => {
  updatePlayerPosition(data);
});
```

### 2. 房间 (Rooms)

房间是命名空间内的任意通道，用于将套接字分组：

#### 加入和离开房间

```javascript
io.on('connection', (socket) => {
  // 加入房间
  socket.on('join-room', (roomName) => {
    socket.join(roomName);
    console.log(`用户 ${socket.id} 加入房间 ${roomName}`);
    
    // 通知房间内其他用户
    socket.to(roomName).emit('user-joined', {
      userId: socket.id,
      message: `用户 ${socket.id} 加入了房间`
    });
  });
  
  // 离开房间
  socket.on('leave-room', (roomName) => {
    socket.leave(roomName);
    console.log(`用户 ${socket.id} 离开房间 ${roomName}`);
    
    // 通知房间内其他用户
    socket.to(roomName).emit('user-left', {
      userId: socket.id,
      message: `用户 ${socket.id} 离开了房间`
    });
  });
  
  // 向房间发送消息
  socket.on('room-message', (data) => {
    const { roomName, message } = data;
    
    // 发送给房间内所有用户（包括发送者）
    io.to(roomName).emit('room-message', {
      userId: socket.id,
      message,
      timestamp: Date.now()
    });
  });
});
```

#### 房间管理

```javascript
// 获取房间信息
socket.on('get-room-info', (roomName, callback) => {
  const room = io.sockets.adapter.rooms.get(roomName);
  
  if (room) {
    callback({
      exists: true,
      size: room.size,
      members: Array.from(room)
    });
  } else {
    callback({
      exists: false,
      size: 0,
      members: []
    });
  }
});

// 获取用户所在的房间
socket.on('get-my-rooms', (callback) => {
  const rooms = Array.from(socket.rooms);
  callback(rooms.filter(room => room !== socket.id));
});
```

### 3. 动态房间管理

```javascript
class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
  }
  
  createRoom(roomId, options = {}) {
    if (this.rooms.has(roomId)) {
      throw new Error('房间已存在');
    }
    
    this.rooms.set(roomId, {
      id: roomId,
      created: Date.now(),
      maxUsers: options.maxUsers || 50,
      isPrivate: options.isPrivate || false,
      metadata: options.metadata || {}
    });
    
    return this.rooms.get(roomId);
  }
  
  joinRoom(socket, roomId, userInfo) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('房间不存在');
    }
    
    const currentSize = this.io.sockets.adapter.rooms.get(roomId)?.size || 0;
    if (currentSize >= room.maxUsers) {
      throw new Error('房间已满');
    }
    
    socket.join(roomId);
    socket.userInfo = userInfo;
    
    // 通知房间内其他用户
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      userInfo,
      timestamp: Date.now()
    });
    
    return room;
  }
  
  leaveRoom(socket, roomId) {
    socket.leave(roomId);
    
    // 通知房间内其他用户
    socket.to(roomId).emit('user-left', {
      userId: socket.id,
      userInfo: socket.userInfo,
      timestamp: Date.now()
    });
    
    // 如果房间为空，删除房间
    const room = this.io.sockets.adapter.rooms.get(roomId);
    if (!room || room.size === 0) {
      this.rooms.delete(roomId);
    }
  }
}

// 使用示例
const roomManager = new RoomManager(io);

io.on('connection', (socket) => {
  socket.on('create-room', (options, callback) => {
    try {
      const room = roomManager.createRoom(generateRoomId(), options);
      callback({ success: true, room });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });
  
  socket.on('join-room', (roomId, userInfo, callback) => {
    try {
      const room = roomManager.joinRoom(socket, roomId, userInfo);
      callback({ success: true, room });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });
});
```

---

## 错误处理与重连

### 1. 连接错误处理

```javascript
// 客户端错误处理
socket.on('connect_error', (error) => {
  console.log('连接错误:', error.message);
  
  switch (error.message) {
    case 'Authentication failed':
      // 重新获取认证信息
      refreshAuthToken().then(token => {
        socket.auth.token = token;
        socket.connect();
      });
      break;
      
    case 'Server unavailable':
      // 显示服务器不可用提示
      showServerUnavailableMessage();
      break;
      
    default:
      // 其他错误处理
      handleGenericError(error);
  }
});

// 服务端错误处理
io.on('connection', (socket) => {
  socket.on('error', (error) => {
    console.log('Socket错误:', error);
    socket.emit('error-response', {
      message: '服务器内部错误',
      code: 'INTERNAL_ERROR'
    });
  });
});
```

### 2. 自定义重连策略

```javascript
class ReconnectionManager {
  constructor(socket, options = {}) {
    this.socket = socket;
    this.maxAttempts = options.maxAttempts || 5;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.backoffFactor = options.backoffFactor || 2;
    
    this.attemptCount = 0;
    this.isReconnecting = false;
    
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    this.socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        // 服务器主动断开，需要手动重连
        this.startReconnection();
      }
    });
    
    this.socket.on('connect', () => {
      // 重连成功，重置计数器
      this.attemptCount = 0;
      this.isReconnecting = false;
    });
  }
  
  async startReconnection() {
    if (this.isReconnecting || this.attemptCount >= this.maxAttempts) {
      return;
    }
    
    this.isReconnecting = true;
    
    while (this.attemptCount < this.maxAttempts && !this.socket.connected) {
      this.attemptCount++;
      
      const delay = Math.min(
        this.baseDelay * Math.pow(this.backoffFactor, this.attemptCount - 1),
        this.maxDelay
      );
      
      console.log(`重连尝试 ${this.attemptCount}/${this.maxAttempts}，${delay}ms 后重试`);
      
      await this.sleep(delay);
      
      try {
        this.socket.connect();
        
        // 等待连接结果
        await this.waitForConnection(5000);
        
        if (this.socket.connected) {
          console.log('重连成功');
          break;
        }
      } catch (error) {
        console.log(`重连失败: ${error.message}`);
      }
    }
    
    if (!this.socket.connected) {
      console.log('重连失败，已达到最大尝试次数');
      this.onReconnectionFailed();
    }
    
    this.isReconnecting = false;
  }
  
  waitForConnection(timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('连接超时'));
      }, timeout);
      
      const onConnect = () => {
        clearTimeout(timer);
        this.socket.off('connect_error', onError);
        resolve();
      };
      
      const onError = (error) => {
        clearTimeout(timer);
        this.socket.off('connect', onConnect);
        reject(error);
      };
      
      this.socket.once('connect', onConnect);
      this.socket.once('connect_error', onError);
    });
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  onReconnectionFailed() {
    // 重连失败处理
    this.socket.emit('reconnection-failed');
  }
}

// 使用重连管理器
const socket = io('http://localhost:3000', {
  autoConnect: true,
  reconnection: false // 关闭自动重连，使用自定义重连
});

const reconnectionManager = new ReconnectionManager(socket, {
  maxAttempts: 10,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 1.5
});
```

### 3. 消息可靠性保障

```javascript
class ReliableMessaging {
  constructor(socket) {
    this.socket = socket;
    this.pendingMessages = new Map();
    this.messageId = 0;
    
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    // 处理消息确认
    this.socket.on('message-ack', (messageId) => {
      this.pendingMessages.delete(messageId);
    });
    
    // 重连后重发未确认的消息
    this.socket.on('connect', () => {
      this.resendPendingMessages();
    });
  }
  
  send(event, data, options = {}) {
    const messageId = ++this.messageId;
    const message = {
      id: messageId,
      event,
      data,
      timestamp: Date.now(),
      retries: 0
    };
    
    // 如果需要可靠传输，保存消息
    if (options.reliable !== false) {
      this.pendingMessages.set(messageId, message);
    }
    
    this.sendMessage(message, options);
    
    return messageId;
  }
  
  sendMessage(message, options = {}) {
    const timeout = options.timeout || 10000;
    
    this.socket.emit(message.event, {
      ...message.data,
      _messageId: message.id
    }, (response) => {
      // 收到确认，删除待发送消息
      this.pendingMessages.delete(message.id);
      
      if (options.callback) {
        options.callback(null, response);
      }
    });
    
    // 设置超时
    setTimeout(() => {
      if (this.pendingMessages.has(message.id)) {
        message.retries++;
        
        if (message.retries < (options.maxRetries || 3)) {
          console.log(`消息 ${message.id} 超时，重试第 ${message.retries} 次`);
          this.sendMessage(message, options);
        } else {
          console.log(`消息 ${message.id} 发送失败，已达到最大重试次数`);
          this.pendingMessages.delete(message.id);
          
          if (options.callback) {
            options.callback(new Error('消息发送失败'));
          }
        }
      }
    }, timeout);
  }
  
  resendPendingMessages() {
    console.log(`重新发送 ${this.pendingMessages.size} 条待确认消息`);
    
    for (const message of this.pendingMessages.values()) {
      this.sendMessage(message);
    }
  }
}

// 使用示例
const reliableMessaging = new ReliableMessaging(socket);

// 发送可靠消息
reliableMessaging.send('chat-message', {
  text: 'Hello World',
  userId: 123
}, {
  reliable: true,
  timeout: 5000,
  maxRetries: 3,
  callback: (error, response) => {
    if (error) {
      console.log('消息发送失败:', error.message);
    } else {
      console.log('消息发送成功:', response);
    }
  }
});
```

---

## 高级特性

### 1. 中间件

Socket.IO 支持中间件来处理连接认证、日志记录等：

#### 服务端中间件

```javascript
// 认证中间件
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('认证令牌缺失'));
  }
  
  // 验证令牌
  verifyToken(token)
    .then(user => {
      socket.userId = user.id;
      socket.user = user;
      next();
    })
    .catch(error => {
      next(new Error('认证失败'));
    });
});

// 日志中间件
io.use((socket, next) => {
  console.log(`新连接: ${socket.id}, IP: ${socket.handshake.address}`);
  next();
});

// 限流中间件
const connectionLimiter = new Map();

io.use((socket, next) => {
  const ip = socket.handshake.address;
  const currentTime = Date.now();
  
  if (!connectionLimiter.has(ip)) {
    connectionLimiter.set(ip, []);
  }
  
  const connections = connectionLimiter.get(ip);
  
  // 清理5分钟前的连接记录
  const fiveMinutesAgo = currentTime - 5 * 60 * 1000;
  connectionLimiter.set(ip, connections.filter(time => time > fiveMinutesAgo));
  
  // 检查连接频率
  if (connections.length >= 10) {
    return next(new Error('连接过于频繁，请稍后再试'));
  }
  
  connections.push(currentTime);
  next();
});
```

#### 命名空间中间件

```javascript
const chatNamespace = io.of('/chat');

chatNamespace.use((socket, next) => {
  // 检查用户是否有聊天权限
  if (!socket.user.permissions.includes('chat')) {
    return next(new Error('无聊天权限'));
  }
  next();
});
```

### 2. 适配器 (Adapters)

适配器用于在多个 Socket.IO 服务器实例之间同步状态：

#### Redis 适配器

```javascript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ host: 'localhost', port: 6379 });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

// 现在可以在多个服务器实例间同步房间和消息
```

#### 集群模式示例

```javascript
// server1.js
const io1 = new Server(3001);
io1.adapter(createAdapter(pubClient, subClient));

// server2.js  
const io2 = new Server(3002);
io2.adapter(createAdapter(pubClient, subClient));

// 用户连接到 server1，但消息可以从 server2 发送并被接收
```

### 3. 二进制数据传输

```javascript
// 发送文件
socket.emit('file-upload', {
  filename: 'image.jpg',
  data: fileBuffer, // Buffer 或 ArrayBuffer
  metadata: {
    size: fileBuffer.length,
    type: 'image/jpeg'
  }
});

// 接收文件
socket.on('file-upload', (data) => {
  const { filename, data: fileData, metadata } = data;
  
  // 保存文件
  fs.writeFile(filename, fileData, (err) => {
    if (err) {
      socket.emit('file-upload-error', { filename, error: err.message });
    } else {
      socket.emit('file-upload-success', { filename });
    }
  });
});

// 大文件分块传输
class FileTransfer {
  constructor(socket) {
    this.socket = socket;
    this.chunkSize = 64 * 1024; // 64KB chunks
    this.transfers = new Map();
  }
  
  sendFile(file, metadata) {
    const transferId = generateId();
    const chunks = Math.ceil(file.length / this.chunkSize);
    
    // 开始传输
    this.socket.emit('file-transfer-start', {
      transferId,
      filename: metadata.filename,
      totalSize: file.length,
      chunks,
      metadata
    });
    
    // 发送分块
    for (let i = 0; i < chunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, file.length);
      const chunk = file.slice(start, end);
      
      this.socket.emit('file-chunk', {
        transferId,
        chunkIndex: i,
        data: chunk,
        isLast: i === chunks - 1
      });
    }
  }
  
  handleFileTransfer() {
    this.socket.on('file-transfer-start', (data) => {
      this.transfers.set(data.transferId, {
        filename: data.filename,
        totalSize: data.totalSize,
        chunks: new Array(data.chunks),
        receivedChunks: 0,
        metadata: data.metadata
      });
    });
    
    this.socket.on('file-chunk', (data) => {
      const transfer = this.transfers.get(data.transferId);
      if (!transfer) return;
      
      transfer.chunks[data.chunkIndex] = data.data;
      transfer.receivedChunks++;
      
      if (data.isLast || transfer.receivedChunks === transfer.chunks.length) {
        // 合并分块
        const completeFile = Buffer.concat(transfer.chunks);
        
        // 保存文件
        this.saveFile(transfer.filename, completeFile, transfer.metadata);
        
        // 清理
        this.transfers.delete(data.transferId);
        
        // 通知完成
        this.socket.emit('file-transfer-complete', {
          transferId: data.transferId,
          filename: transfer.filename
        });
      }
    });
  }
}
```

### 4. 压缩

```javascript
// 启用压缩
const io = new Server(httpServer, {
  compression: true,
  httpCompression: true
});

// 客户端也会自动支持压缩
const socket = io('http://localhost:3000', {
  compression: true
});
```

---

## 性能优化

### 1. 连接池管理

```javascript
class ConnectionPool {
  constructor(maxConnections = 1000) {
    this.maxConnections = maxConnections;
    this.activeConnections = new Map();
    this.connectionQueue = [];
  }
  
  addConnection(socket) {
    if (this.activeConnections.size >= this.maxConnections) {
      // 连接池已满，加入队列或拒绝
      socket.emit('connection-rejected', {
        reason: 'Server is at capacity',
        queuePosition: this.connectionQueue.length
      });
      
      this.connectionQueue.push(socket);
      return false;
    }
    
    this.activeConnections.set(socket.id, {
      socket,
      connectedAt: Date.now(),
      lastActivity: Date.now()
    });
    
    this.setupActivityTracking(socket);
    return true;
  }
  
  removeConnection(socketId) {
    this.activeConnections.delete(socketId);
    
    // 处理队列中的连接
    if (this.connectionQueue.length > 0) {
      const nextSocket = this.connectionQueue.shift();
      this.addConnection(nextSocket);
    }
  }
  
  setupActivityTracking(socket) {
    const connection = this.activeConnections.get(socket.id);
    
    // 更新活动时间
    const updateActivity = () => {
      if (connection) {
        connection.lastActivity = Date.now();
      }
    };
    
    socket.onAny(updateActivity);
    
    socket.on('disconnect', () => {
      this.removeConnection(socket.id);
    });
  }
  
  // 清理不活跃连接
  cleanupInactiveConnections(inactiveThreshold = 30 * 60 * 1000) {
    const now = Date.now();
    
    for (const [socketId, connection] of this.activeConnections.entries()) {
      if (now - connection.lastActivity > inactiveThreshold) {
        connection.socket.emit('inactive-disconnect', {
          reason: 'Inactive for too long'
        });
        connection.socket.disconnect(true);
      }
    }
  }
  
  getStats() {
    return {
      activeConnections: this.activeConnections.size,
      queuedConnections: this.connectionQueue.length,
      maxConnections: this.maxConnections
    };
  }
}

const connectionPool = new ConnectionPool(1000);

io.on('connection', (socket) => {
  if (!connectionPool.addConnection(socket)) {
    // 连接被拒绝，已处理
    return;
  }
  
  // 正常处理连接
  console.log('新连接已接受:', socket.id);
});

// 定期清理不活跃连接
setInterval(() => {
  connectionPool.cleanupInactiveConnections();
}, 5 * 60 * 1000); // 每5分钟检查一次
```

### 2. 消息缓冲和批处理

```javascript
class MessageBuffer {
  constructor(socket, options = {}) {
    this.socket = socket;
    this.bufferSize = options.bufferSize || 100;
    this.flushInterval = options.flushInterval || 100; // ms
    this.buffer = [];
    this.flushTimer = null;
  }
  
  addMessage(event, data) {
    this.buffer.push({ event, data, timestamp: Date.now() });
    
    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }
  
  flush() {
    if (this.buffer.length === 0) return;
    
    // 发送批量消息
    this.socket.emit('message-batch', this.buffer);
    
    // 清空缓冲区
    this.buffer = [];
    
    // 清除定时器
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }
  
  destroy() {
    this.flush();
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
  }
}

// 使用消息缓冲
const messageBuffers = new Map();

io.on('connection', (socket) => {
  const buffer = new MessageBuffer(socket);
  messageBuffers.set(socket.id, buffer);
  
  // 高频消息使用缓冲
  socket.on('position-update', (data) => {
    buffer.addMessage('position-update', data);
  });
  
  socket.on('disconnect', () => {
    const buffer = messageBuffers.get(socket.id);
    if (buffer) {
      buffer.destroy();
      messageBuffers.delete(socket.id);
    }
  });
});
```

### 3. 内存优化

```javascript
class MemoryOptimizer {
  constructor(io) {
    this.io = io;
    this.messageHistory = new Map();
    this.maxHistorySize = 1000;
    this.cleanupInterval = 5 * 60 * 1000; // 5分钟
    
    this.startCleanupInterval();
  }
  
  addMessage(roomId, message) {
    if (!this.messageHistory.has(roomId)) {
      this.messageHistory.set(roomId, []);
    }
    
    const history = this.messageHistory.get(roomId);
    history.push({
      ...message,
      timestamp: Date.now()
    });
    
    // 限制历史消息数量
    if (history.length > this.maxHistorySize) {
      history.splice(0, history.length - this.maxHistorySize);
    }
  }
  
  getMessageHistory(roomId, limit = 50) {
    const history = this.messageHistory.get(roomId) || [];
    return history.slice(-limit);
  }
  
  startCleanupInterval() {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }
  
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    
    for (const [roomId, messages] of this.messageHistory.entries()) {
      // 检查房间是否还有活跃连接
      const room = this.io.sockets.adapter.rooms.get(roomId);
      
      if (!room || room.size === 0) {
        // 房间为空，清理历史消息
        this.messageHistory.delete(roomId);
        continue;
      }
      
      // 清理过期消息
      const validMessages = messages.filter(msg => 
        now - msg.timestamp < maxAge
      );
      
      if (validMessages.length !== messages.length) {
        this.messageHistory.set(roomId, validMessages);
      }
    }
    
    // 强制垃圾回收（如果可用）
    if (global.gc) {
      global.gc();
    }
  }
  
  getMemoryStats() {
    const used = process.memoryUsage();
    return {
      rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(used.external / 1024 / 1024 * 100) / 100,
      messageHistoryRooms: this.messageHistory.size,
      totalMessages: Array.from(this.messageHistory.values())
        .reduce((total, messages) => total + messages.length, 0)
    };
  }
}
```

---

## 实战案例

### 1. 实时聊天应用

```javascript
class ChatApplication {
  constructor(io) {
    this.io = io;
    this.users = new Map();
    this.rooms = new Map();
    this.messageHistory = new Map();
    
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('用户连接:', socket.id);
      
      // 用户认证
      socket.on('authenticate', (userData, callback) => {
        this.authenticateUser(socket, userData, callback);
      });
      
      // 加入聊天室
      socket.on('join-room', (roomId, callback) => {
        this.joinRoom(socket, roomId, callback);
      });
      
      // 发送消息
      socket.on('send-message', (data, callback) => {
        this.handleMessage(socket, data, callback);
      });
      
      // 输入状态
      socket.on('typing-start', (roomId) => {
        this.handleTyping(socket, roomId, true);
      });
      
      socket.on('typing-stop', (roomId) => {
        this.handleTyping(socket, roomId, false);
      });
      
      // 私聊
      socket.on('private-message', (data, callback) => {
        this.handlePrivateMessage(socket, data, callback);
      });
      
      // 断开连接
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }
  
  authenticateUser(socket, userData, callback) {
    // 验证用户信息
    if (!userData.username || !userData.token) {
      return callback({ success: false, error: '用户信息不完整' });
    }
    
    // 检查token有效性（这里简化处理）
    if (!this.verifyToken(userData.token)) {
      return callback({ success: false, error: '认证失败' });
    }
    
    // 保存用户信息
    this.users.set(socket.id, {
      id: socket.id,
      username: userData.username,
      avatar: userData.avatar,
      lastSeen: Date.now(),
      rooms: new Set()
    });
    
    socket.username = userData.username;
    socket.authenticated = true;
    
    callback({ 
      success: true, 
      user: this.users.get(socket.id) 
    });
    
    // 广播用户上线
    socket.broadcast.emit('user-online', {
      userId: socket.id,
      username: userData.username
    });
  }
  
  joinRoom(socket, roomId, callback) {
    if (!socket.authenticated) {
      return callback({ success: false, error: '未认证' });
    }
    
    // 创建或获取房间
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        name: `房间 ${roomId}`,
        users: new Set(),
        created: Date.now()
      });
      this.messageHistory.set(roomId, []);
    }
    
    const room = this.rooms.get(roomId);
    const user = this.users.get(socket.id);
    
    // 加入Socket.IO房间
    socket.join(roomId);
    
    // 更新数据结构
    room.users.add(socket.id);
    user.rooms.add(roomId);
    
    // 发送房间信息和历史消息
    callback({
      success: true,
      room: {
        ...room,
        users: Array.from(room.users).map(id => this.users.get(id))
      },
      messageHistory: this.getMessageHistory(roomId, 50)
    });
    
    // 通知房间内其他用户
    socket.to(roomId).emit('user-joined-room', {
      roomId,
      user: user,
      timestamp: Date.now()
    });
  }
  
  handleMessage(socket, data, callback) {
    if (!socket.authenticated) {
      return callback({ success: false, error: '未认证' });
    }
    
    const { roomId, text, type = 'text' } = data;
    
    if (!roomId || !text) {
      return callback({ success: false, error: '消息内容不完整' });
    }
    
    const user = this.users.get(socket.id);
    const room = this.rooms.get(roomId);
    
    if (!room || !room.users.has(socket.id)) {
      return callback({ success: false, error: '不在该房间内' });
    }
    
    // 创建消息对象
    const message = {
      id: this.generateMessageId(),
      roomId,
      userId: socket.id,
      username: user.username,
      avatar: user.avatar,
      text,
      type,
      timestamp: Date.now()
    };
    
    // 保存消息历史
    this.addMessageToHistory(roomId, message);
    
    // 广播消息
    this.io.to(roomId).emit('new-message', message);
    
    callback({ success: true, message });
  }
  
  handleTyping(socket, roomId, isTyping) {
    if (!socket.authenticated) return;
    
    const user = this.users.get(socket.id);
    
    socket.to(roomId).emit('user-typing', {
      roomId,
      userId: socket.id,
      username: user.username,
      isTyping
    });
  }
  
  handlePrivateMessage(socket, data, callback) {
    const { targetUserId, text } = data;
    const sender = this.users.get(socket.id);
    const target = this.users.get(targetUserId);
    
    if (!target) {
      return callback({ success: false, error: '目标用户不存在' });
    }
    
    const message = {
      id: this.generateMessageId(),
      fromUserId: socket.id,
      fromUsername: sender.username,
      toUserId: targetUserId,
      toUsername: target.username,
      text,
      timestamp: Date.now(),
      type: 'private'
    };
    
    // 发送给目标用户
    this.io.to(targetUserId).emit('private-message', message);
    
    // 发送给发送者（确认）
    socket.emit('private-message-sent', message);
    
    callback({ success: true, message });
  }
  
  handleDisconnect(socket) {
    const user = this.users.get(socket.id);
    
    if (user) {
      // 从所有房间移除用户
      for (const roomId of user.rooms) {
        const room = this.rooms.get(roomId);
        if (room) {
          room.users.delete(socket.id);
          
          // 通知房间内其他用户
          socket.to(roomId).emit('user-left-room', {
            roomId,
            userId: socket.id,
            username: user.username,
            timestamp: Date.now()
          });
          
          // 如果房间为空，清理房间
          if (room.users.size === 0) {
            this.rooms.delete(roomId);
            this.messageHistory.delete(roomId);
          }
        }
      }
      
      // 广播用户下线
      socket.broadcast.emit('user-offline', {
        userId: socket.id,
        username: user.username
      });
      
      // 清理用户数据
      this.users.delete(socket.id);
    }
  }
  
  // 工具方法
  verifyToken(token) {
    // 简化的token验证
    return token && token.length > 0;
  }
  
  generateMessageId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  addMessageToHistory(roomId, message) {
    const history = this.messageHistory.get(roomId) || [];
    history.push(message);
    
    // 限制历史消息数量
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
    
    this.messageHistory.set(roomId, history);
  }
  
  getMessageHistory(roomId, limit = 50) {
    const history = this.messageHistory.get(roomId) || [];
    return history.slice(-limit);
  }
  
  // 获取在线用户列表
  getOnlineUsers() {
    return Array.from(this.users.values());
  }
  
  // 获取房间列表
  getRoomList() {
    return Array.from(this.rooms.values()).map(room => ({
      ...room,
      userCount: room.users.size
    }));
  }
}

// 启动聊天应用
const chatApp = new ChatApplication(io);
```

### 2. 实时协作编辑器

```javascript
class CollaborativeEditor {
  constructor(io) {
    this.io = io;
    this.documents = new Map(); // 文档数据
    this.documentUsers = new Map(); // 文档用户
    this.cursors = new Map(); // 用户光标位置
    
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      // 加入文档编辑
      socket.on('join-document', (docId, callback) => {
        this.joinDocument(socket, docId, callback);
      });
      
      // 文本操作
      socket.on('text-operation', (operation) => {
        this.handleTextOperation(socket, operation);
      });
      
      // 光标位置更新
      socket.on('cursor-update', (data) => {
        this.handleCursorUpdate(socket, data);
      });
      
      // 选择区域更新
      socket.on('selection-update', (data) => {
        this.handleSelectionUpdate(socket, data);
      });
      
      // 离开文档
      socket.on('leave-document', (docId) => {
        this.leaveDocument(socket, docId);
      });
      
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }
  
  joinDocument(socket, docId, callback) {
    // 创建或获取文档
    if (!this.documents.has(docId)) {
      this.documents.set(docId, {
        id: docId,
        content: '',
        version: 0,
        operations: [], // 操作历史
        lastModified: Date.now()
      });
      this.documentUsers.set(docId, new Map());
    }
    
    const document = this.documents.get(docId);
    const users = this.documentUsers.get(docId);
    
    // 添加用户到文档
    socket.join(docId);
    users.set(socket.id, {
      id: socket.id,
      name: socket.username || `用户${socket.id.substr(0, 6)}`,
      color: this.generateUserColor(),
      cursor: { line: 0, column: 0 },
      selection: null,
      joinedAt: Date.now()
    });
    
    // 发送文档内容和用户列表
    callback({
      success: true,
      document: {
        id: document.id,
        content: document.content,
        version: document.version
      },
      users: Array.from(users.values()),
      operations: document.operations.slice(-100) // 最近100个操作
    });
    
    // 通知其他用户
    socket.to(docId).emit('user-joined-document', {
      user: users.get(socket.id),
      timestamp: Date.now()
    });
  }
  
  handleTextOperation(socket, operation) {
    const { docId, type, position, content, length, version } = operation;
    
    const document = this.documents.get(docId);
    if (!document) return;
    
    // 版本冲突检查
    if (version !== document.version) {
      // 需要进行操作转换
      const transformedOperation = this.transformOperation(operation, document);
      if (!transformedOperation) {
        socket.emit('operation-rejected', { 
          reason: 'Version conflict', 
          currentVersion: document.version 
        });
        return;
      }
      operation = transformedOperation;
    }
    
    // 应用操作
    const success = this.applyOperation(document, operation);
    if (!success) {
      socket.emit('operation-rejected', { 
        reason: 'Invalid operation' 
      });
      return;
    }
    
    // 更新文档版本
    document.version++;
    document.lastModified = Date.now();
    
    // 保存操作历史
    document.operations.push({
      ...operation,
      userId: socket.id,
      timestamp: Date.now(),
      version: document.version
    });
    
    // 限制操作历史长度
    if (document.operations.length > 1000) {
      document.operations.splice(0, document.operations.length - 1000);
    }
    
    // 广播操作给其他用户
    socket.to(docId).emit('text-operation', {
      ...operation,
      userId: socket.id,
      version: document.version
    });
    
    // 确认操作成功
    socket.emit('operation-applied', {
      version: document.version
    });
  }
  
  applyOperation(document, operation) {
    const { type, position, content, length } = operation;
    
    try {
      switch (type) {
        case 'insert':
          document.content = 
            document.content.slice(0, position) +
            content +
            document.content.slice(position);
          break;
          
        case 'delete':
          document.content = 
            document.content.slice(0, position) +
            document.content.slice(position + length);
          break;
          
        case 'replace':
          document.content = 
            document.content.slice(0, position) +
            content +
            document.content.slice(position + length);
          break;
          
        default:
          return false;
      }
      return true;
    } catch (error) {
      console.error('操作应用失败:', error);
      return false;
    }
  }
  
  transformOperation(operation, document) {
    // 简化的操作转换逻辑
    // 在实际应用中，这里需要实现完整的OT算法
    
    const recentOps = document.operations.slice(operation.version);
    let transformedOp = { ...operation };
    
    for (const op of recentOps) {
      transformedOp = this.transformAgainstOperation(transformedOp, op);
      if (!transformedOp) return null;
    }
    
    return transformedOp;
  }
  
  transformAgainstOperation(op1, op2) {
    // 简化的操作转换
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op2.position <= op1.position) {
        op1.position += op2.content.length;
      }
    } else if (op1.type === 'insert' && op2.type === 'delete') {
      if (op2.position < op1.position) {
        op1.position -= op2.length;
      }
    }
    // ... 更多转换规则
    
    return op1;
  }
  
  handleCursorUpdate(socket, data) {
    const { docId, cursor } = data;
    const users = this.documentUsers.get(docId);
    
    if (users && users.has(socket.id)) {
      const user = users.get(socket.id);
      user.cursor = cursor;
      
      // 广播光标位置
      socket.to(docId).emit('cursor-updated', {
        userId: socket.id,
        cursor
      });
    }
  }
  
  handleSelectionUpdate(socket, data) {
    const { docId, selection } = data;
    const users = this.documentUsers.get(docId);
    
    if (users && users.has(socket.id)) {
      const user = users.get(socket.id);
      user.selection = selection;
      
      // 广播选择区域
      socket.to(docId).emit('selection-updated', {
        userId: socket.id,
        selection
      });
    }
  }
  
  leaveDocument(socket, docId) {
    const users = this.documentUsers.get(docId);
    
    if (users && users.has(socket.id)) {
      const user = users.get(socket.id);
      users.delete(socket.id);
      socket.leave(docId);
      
      // 通知其他用户
      socket.to(docId).emit('user-left-document', {
        userId: socket.id,
        timestamp: Date.now()
      });
      
      // 如果文档没有用户，可以考虑保存到数据库
      if (users.size === 0) {
        this.saveDocument(docId);
      }
    }
  }
  
  handleDisconnect(socket) {
    // 从所有文档中移除用户
    for (const [docId, users] of this.documentUsers.entries()) {
      if (users.has(socket.id)) {
        this.leaveDocument(socket, docId);
      }
    }
  }
  
  generateUserColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FCEA2B', '#FF9F43', '#EE5A24', '#0984e3',
      '#6c5ce7', '#a29bfe', '#fd79a8', '#e84393'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  saveDocument(docId) {
    const document = this.documents.get(docId);
    if (document) {
      // 保存到数据库的逻辑
      console.log(`保存文档 ${docId}:`, document.content.length, '字符');
    }
  }
  
  // API方法
  getDocumentStats() {
    return {
      totalDocuments: this.documents.size,
      activeUsers: Array.from(this.documentUsers.values())
        .reduce((total, users) => total + users.size, 0)
    };
  }
}

// 启动协作编辑器
const collaborativeEditor = new CollaborativeEditor(io);
```

---

## 最佳实践

### 1. 架构设计原则

```javascript
// 1. 单一职责原则 - 分离不同功能
class ConnectionManager {
  // 只处理连接相关逻辑
}

class MessageHandler {
  // 只处理消息相关逻辑
}

class RoomManager {
  // 只处理房间相关逻辑
}

// 2. 事件命名规范
const EVENTS = {
  // 用户相关
  USER_CONNECT: 'user:connect',
  USER_DISCONNECT: 'user:disconnect',
  USER_UPDATE: 'user:update',
  
  // 消息相关
  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVE: 'message:receive',
  MESSAGE_DELETE: 'message:delete',
  
  // 房间相关
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_UPDATE: 'room:update'
};

// 3. 错误处理统一化
class ErrorHandler {
  static handle(socket, error, context = '') {
    console.error(`Socket错误 [${context}]:`, error);
    
    socket.emit('error', {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      context,
      timestamp: Date.now()
    });
  }
}
```

### 2. 安全性最佳实践

```javascript
// 1. 输入验证
class InputValidator {
  static validateMessage(data) {
    const errors = [];
    
    if (!data.text || typeof data.text !== 'string') {
      errors.push('消息内容无效');
    }
    
    if (data.text.length > 1000) {
      errors.push('消息过长');
    }
    
    if (!data.roomId || !/^[a-zA-Z0-9-_]+$/.test(data.roomId)) {
      errors.push('房间ID无效');
    }
    
    return errors;
  }
  
  static sanitizeText(text) {
    // XSS防护
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
}

// 2. 权限控制
class PermissionManager {
  static async checkRoomPermission(userId, roomId, action) {
    // 检查用户是否有权限执行指定操作
    const user = await getUserById(userId);
    const room = await getRoomById(roomId);
    
    if (!user || !room) return false;
    
    switch (action) {
      case 'join':
        return room.isPublic || room.members.includes(userId);
      case 'send_message':
        return room.members.includes(userId);
      case 'manage':
        return room.admins.includes(userId);
      default:
        return false;
    }
  }
}

// 3. 速率限制
class RateLimiter {
  constructor() {
    this.requests = new Map();
  }
  
  checkLimit(socketId, action, limit = 10, window = 60000) {
    const key = `${socketId}:${action}`;
    const now = Date.now();
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const requests = this.requests.get(key);
    
    // 清理过期请求
    const validRequests = requests.filter(time => now - time < window);
    this.requests.set(key, validRequests);
    
    if (validRequests.length >= limit) {
      return false; // 超出限制
    }
    
    validRequests.push(now);
    return true; // 允许请求
  }
}

const rateLimiter = new RateLimiter();

io.on('connection', (socket) => {
  socket.use((packet, next) => {
    const [event] = packet;
    
    if (!rateLimiter.checkLimit(socket.id, event)) {
      return next(new Error('请求过于频繁'));
    }
    
    next();
  });
});
```

### 3. 监控和日志

```javascript
class SocketIOMonitor {
  constructor(io) {
    this.io = io;
    this.metrics = {
      connections: 0,
      totalConnections: 0,
      messages: 0,
      errors: 0,
      rooms: 0
    };
    
    this.setupMetrics();
    this.startReporting();
  }
  
  setupMetrics() {
    this.io.on('connection', (socket) => {
      this.metrics.connections++;
      this.metrics.totalConnections++;
      
      socket.on('disconnect', () => {
        this.metrics.connections--;
      });
      
      socket.onAny(() => {
        this.metrics.messages++;
      });
      
      socket.on('error', () => {
        this.metrics.errors++;
      });
    });
  }
  
  startReporting() {
    setInterval(() => {
      this.logMetrics();
    }, 60000); // 每分钟报告一次
  }
  
  logMetrics() {
    const metrics = {
      ...this.metrics,
      rooms: this.io.sockets.adapter.rooms.size,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
    
    console.log('Socket.IO 指标:', JSON.stringify(metrics, null, 2));
    
    // 发送到监控系统
    this.sendToMonitoring(metrics);
  }
  
  sendToMonitoring(metrics) {
    // 发送到外部监控系统（如 Prometheus、DataDog 等）
    // this.prometheusClient.register.metrics();
  }
}

// 启动监控
const monitor = new SocketIOMonitor(io);
```

### 4. 测试策略

```javascript
// 单元测试示例
const { expect } = require('chai');
const Client = require('socket.io-client');
const { createServer } = require('http');
const { Server } = require('socket.io');

describe('Socket.IO 测试', () => {
  let io, serverSocket, clientSocket;
  
  before((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    
    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      
      clientSocket.on('connect', done);
    });
  });
  
  after(() => {
    io.close();
    clientSocket.close();
  });
  
  it('应该能够发送和接收消息', (done) => {
    clientSocket.emit('message', 'hello');
    
    serverSocket.on('message', (data) => {
      expect(data).to.equal('hello');
      done();
    });
  });
  
  it('应该能够加入房间', (done) => {
    clientSocket.emit('join-room', 'test-room');
    
    serverSocket.on('join-room', (roomId) => {
      expect(roomId).to.equal('test-room');
      expect(serverSocket.rooms.has('test-room')).to.be.true;
      done();
    });
  });
});

// 压力测试示例
class LoadTester {
  constructor(serverUrl, options = {}) {
    this.serverUrl = serverUrl;
    this.clientCount = options.clientCount || 100;
    this.messageInterval = options.messageInterval || 1000;
    this.clients = [];
  }
  
  async start() {
    console.log(`启动压力测试: ${this.clientCount} 个客户端`);
    
    // 创建客户端连接
    for (let i = 0; i < this.clientCount; i++) {
      const client = new Client(this.serverUrl);
      this.clients.push(client);
      
      client.on('connect', () => {
        console.log(`客户端 ${i} 已连接`);
      });
      
      client.on('disconnect', () => {
        console.log(`客户端 ${i} 已断开`);
      });
      
      // 定期发送消息
      setInterval(() => {
        client.emit('test-message', {
          clientId: i,
          timestamp: Date.now(),
          data: 'test data'
        });
      }, this.messageInterval);
    }
    
    // 监控性能
    this.startMonitoring();
  }
  
  startMonitoring() {
    setInterval(() => {
      const connectedClients = this.clients.filter(c => c.connected).length;
      console.log(`连接的客户端: ${connectedClients}/${this.clientCount}`);
    }, 5000);
  }
  
  stop() {
    this.clients.forEach(client => client.close());
    this.clients = [];
  }
}

// 运行压力测试
const loadTester = new LoadTester('http://localhost:3000', {
  clientCount: 500,
  messageInterval: 500
});

loadTester.start();
```

---

## 常见问题与解决方案

### 1. 连接问题

```javascript
// 问题1: CORS 错误
// 解决方案:
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "https://yourdomain.com"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 问题2: 连接超时
// 解决方案:
const socket = io('http://localhost:3000', {
  timeout: 20000,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  maxReconnectionAttempts: 5
});

// 问题3: 代理/负载均衡问题
// 解决方案:
const io = new Server(httpServer, {
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  pingTimeout: 60000,
  pingInterval: 25000
});
```

### 2. 性能问题

```javascript
// 问题1: 内存泄漏
// 解决方案: 正确清理事件监听器
socket.on('disconnect', () => {
  // 清理所有相关资源
  clearInterval(heartbeatTimer);
  removeUserFromAllRooms(socket.id);
  cleanupUserData(socket.id);
});

// 问题2: 消息堆积
// 解决方案: 实现消息队列和批处理
class MessageQueue {
  constructor(maxSize = 1000) {
    this.queue = [];
    this.maxSize = maxSize;
  }
  
  enqueue(message) {
    if (this.queue.length >= this.maxSize) {
      this.queue.shift(); // 移除最老的消息
    }
    this.queue.push(message);
  }
  
  dequeue() {
    return this.queue.shift();
  }
  
  clear() {
    this.queue = [];
  }
}

// 问题3: CPU 占用过高
// 解决方案: 使用 Worker Threads 处理复杂计算
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // 主线程
  const worker = new Worker(__filename, {
    workerData: { data: complexData }
  });
  
  worker.postMessage('process');
  worker.on('message', (result) => {
    socket.emit('processing-complete', result);
  });
} else {
  // Worker 线程
  parentPort.on('message', (message) => {
    if (message === 'process') {
      const result = processComplexData(workerData.data);
      parentPort.postMessage(result);
    }
  });
}
```

### 3. 扩展性问题

```javascript
// 问题1: 单点故障
// 解决方案: 使用 Redis 适配器实现集群
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
});

// 问题2: 跨服务器通信
// 解决方案: 实现服务器间通信机制
class ServerCommunication {
  constructor(io, serverId) {
    this.io = io;
    this.serverId = serverId;
    this.setupRedisListener();
  }
  
  setupRedisListener() {
    redisSubscriber.subscribe('server-communication');
    redisSubscriber.on('message', (channel, message) => {
      const data = JSON.parse(message);
      
      if (data.targetServer === this.serverId) {
        this.handleServerMessage(data);
      }
    });
  }
  
  sendToServer(targetServerId, event, data) {
    redisPublisher.publish('server-communication', JSON.stringify({
      targetServer: targetServerId,
      sourceServer: this.serverId,
      event,
      data,
      timestamp: Date.now()
    }));
  }
  
  handleServerMessage(message) {
    // 处理来自其他服务器的消息
    switch (message.event) {
      case 'broadcast-to-user':
        this.broadcastToUser(message.data.userId, message.data.event, message.data.payload);
        break;
      // 其他事件处理
    }
  }
}
```

### 4. 调试技巧

```javascript
// 1. 启用调试日志
// 客户端
localStorage.debug = 'socket.io-client:socket';

// 服务端
DEBUG=socket.io:* node app.js

// 2. 自定义调试工具
class SocketIODebugger {
  constructor(io) {
    this.io = io;
    this.eventLog = [];
    this.maxLogSize = 1000;
    
    this.setupLogging();
  }
  
  setupLogging() {
    // 记录所有事件
    this.io.on('connection', (socket) => {
      this.log('connection', { socketId: socket.id });
      
      socket.onAny((event, ...args) => {
        this.log('incoming', { 
          socketId: socket.id, 
          event, 
          args: args.slice(0, 2) // 限制日志大小
        });
      });
      
      socket.onAnyOutgoing((event, ...args) => {
        this.log('outgoing', { 
          socketId: socket.id, 
          event, 
          args: args.slice(0, 2)
        });
      });
      
      socket.on('disconnect', (reason) => {
        this.log('disconnect', { socketId: socket.id, reason });
      });
    });
  }
  
  log(type, data) {
    const logEntry = {
      type,
      timestamp: Date.now(),
      ...data
    };
    
    this.eventLog.push(logEntry);
    
    // 限制日志大小
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }
    
    // 输出到控制台
    console.log(`[${type.toUpperCase()}]`, logEntry);
  }
  
  getEventLog(filter = {}) {
    let logs = this.eventLog;
    
    if (filter.socketId) {
      logs = logs.filter(log => log.socketId === filter.socketId);
    }
    
    if (filter.type) {
      logs = logs.filter(log => log.type === filter.type);
    }
    
    if (filter.since) {
      logs = logs.filter(log => log.timestamp >= filter.since);
    }
    
    return logs;
  }
  
  clearLog() {
    this.eventLog = [];
  }
}

// 启用调试器
const debugger = new SocketIODebugger(io);

// 3. 健康检查端点
app.get('/socket-health', (req, res) => {
  const stats = {
    connectedClients: io.sockets.sockets.size,
    rooms: io.sockets.adapter.rooms.size,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
  
  res.json(stats);
});
```

---

## 总结

Socket.IO 是一个功能强大的实时通信库，通过本指南你应该已经掌握了：

1. **基础概念**: 事件驱动、连接管理、传输方式
2. **核心功能**: 消息发送接收、房间管理、命名空间
3. **高级特性**: 中间件、适配器、二进制传输
4. **性能优化**: 连接池、消息缓冲、内存管理
5. **实战案例**: 聊天应用、协作编辑器
6. **最佳实践**: 架构设计、安全性、监控测试
7. **问题解决**: 常见问题的诊断和解决方案

### 进一步学习资源

- [Socket.IO 官方文档](https://socket.io/docs/)
- [Socket.IO GitHub](https://github.com/socketio/socket.io)
- [实时Web技术指南](https://web.dev/websockets/)
- [WebSocket 协议规范](https://tools.ietf.org/html/rfc6455)

### 推荐工具

- **开发工具**: Socket.IO Admin UI
- **测试工具**: Artillery.io, Socket.IO Load Tester
- **监控工具**: Prometheus + Grafana
- **调试工具**: Chrome DevTools WebSockets

通过实践这些概念和技术，你将能够构建出高性能、可扩展的实时应用程序。记住，Socket.IO 的强大在于其简单的 API 背后隐藏的复杂性管理，正确理解和使用这些特性是成功的关键。