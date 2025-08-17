# BMT Platform SDK API 集成指南

本指南说明了如何使用已集成后端API的BMT Platform SDK。SDK现在会自动处理与后端的通信，用户只需调用SDK方法，数据就会自动上报到后端。

## 🚀 快速开始

### 1. 基础设置

```typescript
import { sdkManager, Telemetry, Realtime } from '@platform/sdk-core';

// 初始化SDK - 会自动获取配置、处理认证
const config = await sdkManager.init({
  apiBaseURL: 'http://localhost:5000',
  app: 'my-app',
  release: '1.0.0',
  auth: {
    username: 'admin@example.com',
    password: 'password123'
  },
  debug: true
});

// 初始化遥测 - 会自动使用后端配置
Telemetry.init({
  app: 'my-app',
  release: '1.0.0'
});
```

### 2. 使用遥测功能

```typescript
// 设置用户信息
Telemetry.setUser({
  id: 'user_123',
  email: 'user@example.com',
  name: 'John Doe'
});

// 跟踪页面浏览 - 自动上报到 /v1/telemetry/ingest
Telemetry.trackPageView('/dashboard', {
  title: 'Dashboard',
  loadTime: 1200
});

// 跟踪自定义事件 - 自动上报到后端
Telemetry.trackEvent('button_click', {
  buttonId: 'save-btn',
  section: 'settings'
});

// 跟踪错误 - 自动上报到后端
Telemetry.trackError('javascript_error', 'Error message', 'stack trace');
```

### 3. 使用实时通信

```typescript
// 初始化实时通信 - 自动使用认证令牌
await Realtime.init({
  url: config.realtime.url,
  auth: () => sdkManager.getAccessToken()
});

// 订阅消息
const subscription = Realtime.subscribe('public:notifications', (message) => {
  console.log('收到通知:', message);
});

// 发布消息 - 自动发送到后端WebSocket服务
await Realtime.publish('public:chat', {
  message: 'Hello World!',
  timestamp: Date.now()
});
```

## 📋 主要特性

### ✅ 自动化处理

- **自动认证**: SDK会自动处理用户登录和令牌刷新
- **自动配置**: 从后端获取最新的SDK配置
- **自动上报**: 遥测数据自动批量上报到后端API
- **自动重试**: 网络失败时自动重试上报
- **自动采样**: 根据后端配置自动应用采样率

### ✅ 智能降级

- **离线支持**: 网络断开时数据存储在本地
- **Beacon降级**: API失败时使用sendBeacon作为备选方案
- **配置降级**: 远程配置失败时使用默认配置

### ✅ 开发友好

- **调试模式**: 详细的日志输出
- **状态监控**: 实时SDK状态和健康检查
- **错误处理**: 优雅的错误处理和恢复

## 🔧 配置选项

### SDK初始化选项

```typescript
interface SDKInitOptions {
  /** API 基础地址 */
  apiBaseURL: string;
  /** 应用名称 */
  app: string;
  /** 应用版本 */
  release: string;
  /** 用户认证信息（可选） */
  auth?: {
    username: string;
    password: string;
  };
  /** 设备指纹（可选） */
  fingerprint?: string;
  /** 是否自动获取配置，默认 true */
  autoConfig?: boolean;
  /** 是否启用健康监控，默认 false */
  enableHealthMonitoring?: boolean;
  /** 调试模式，默认 false */
  debug?: boolean;
}
```

### 遥测配置选项

```typescript
interface TelemetryOptions {
  /** 应用名称 */
  app: string;
  /** 版本号 */
  release: string;
  /** 采样率，默认从后端配置获取 */
  sampleRate?: number;
  /** 批量上报阈值，默认从后端配置获取 */
  batchSize?: number;
  /** 上报间隔（毫秒），默认从后端配置获取 */
  flushInterval?: number;
  /** 调试模式，默认 false */
  debug?: boolean;
}
```

## 🌟 在框架中使用

### React 集成

```typescript
import React, { useEffect, useState } from 'react';
import { sdkManager, Telemetry } from '@platform/sdk-core';

function App() {
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    const initSDK = async () => {
      try {
        await sdkManager.init({
          apiBaseURL: 'http://localhost:5000',
          app: 'react-app',
          release: '1.0.0',
          debug: true
        });

        Telemetry.init({
          app: 'react-app',
          release: '1.0.0'
        });

        setSdkReady(true);
      } catch (error) {
        console.error('SDK初始化失败:', error);
      }
    };

    initSDK();

    // 监听SDK状态
    const unsubscribe = sdkManager.onStatusChange((status) => {
      console.log('SDK状态:', status);
    });

    return unsubscribe;
  }, []);

  const handleClick = () => {
    // 自动上报到后端
    Telemetry.trackEvent('button_click', {
      buttonId: 'main-btn',
      page: '/'
    });
  };

  if (!sdkReady) {
    return <div>SDK初始化中...</div>;
  }

  return (
    <div>
      <h1>我的应用</h1>
      <button onClick={handleClick}>
        点击我（会被跟踪）
      </button>
    </div>
  );
}
```

### Vue 集成

```vue
<template>
  <div>
    <h1>我的应用</h1>
    <p v-if="!sdkReady">SDK初始化中...</p>
    <button v-else @click="handleClick">
      点击我（会被跟踪）
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { sdkManager, Telemetry } from '@platform/sdk-core';

const sdkReady = ref(false);

onMounted(async () => {
  try {
    await sdkManager.init({
      apiBaseURL: 'http://localhost:5000',
      app: 'vue-app',
      release: '1.0.0',
      debug: true
    });

    Telemetry.init({
      app: 'vue-app',
      release: '1.0.0'
    });

    sdkReady.value = true;
  } catch (error) {
    console.error('SDK初始化失败:', error);
  }
});

const handleClick = () => {
  // 自动上报到后端
  Telemetry.trackEvent('button_click', {
    buttonId: 'main-btn',
    page: '/'
  });
};
</script>
```

## 📊 监控和调试

### 获取SDK状态

```typescript
// 获取SDK统计信息
const stats = sdkManager.getStats();
console.log('SDK状态:', stats);

// 获取遥测队列状态
const queueStatus = await Telemetry.getQueueStatus();
console.log('待上报事件数:', queueStatus.pending);

// 获取实时通信状态
const realtimeStats = Realtime.getStats();
console.log('WebSocket状态:', realtimeStats);
```

### 监听状态变化

```typescript
// 监听SDK状态变化
sdkManager.onStatusChange((status, error) => {
  console.log('SDK状态变化:', status);
  if (error) {
    console.error('SDK错误:', error);
  }
});

// 监听实时通信状态
Realtime.onConnectionChange((status, error) => {
  console.log('连接状态:', status);
});
```

## 🔄 数据流程

### 遥测数据流程

1. **用户调用** `Telemetry.trackEvent()` 等方法
2. **本地存储** - 事件存储在本地IndexedDB/localStorage
3. **批量收集** - 达到批次大小或时间间隔时触发上报
4. **应用采样** - 根据后端配置应用采样率
5. **API调用** - 调用 `/v1/telemetry/ingest` 接口上报
6. **失败重试** - 失败时自动重试，支持指数退避
7. **降级方案** - API失败时使用sendBeacon降级
8. **清理数据** - 成功上报后从本地存储删除

### 实时通信流程

1. **初始化连接** - 使用SDK管理器提供的认证令牌
2. **自动重连** - 连接断开时自动重连
3. **消息队列** - 离线时消息缓存在队列中
4. **权限检查** - 自动处理频道权限
5. **心跳保活** - 定期发送心跳保持连接

## ⚠️ 注意事项

### 认证处理

- SDK会自动刷新过期的访问令牌
- 如果刷新令牌也过期，需要重新登录
- 可以监听认证状态变化并提示用户

### 网络处理

- 离线时数据会缓存在本地
- 网络恢复时自动上报缓存的数据
- 建议设置合理的缓存大小限制

### 性能考虑

- 采样率可以有效控制数据量
- 批量上报减少网络请求频率
- sendBeacon在页面卸载时也能正常工作

### 隐私保护

- 用户可以选择不提供某些信息
- 支持数据匿名化
- 遵循GDPR等隐私法规

## 🔗 API接口映射

SDK方法与后端API的对应关系：

| SDK方法 | 后端API | 说明 |
|---------|---------|------|
| `sdkManager.init()` | `/api/sdk/config`, `/v1/auth/login` | 获取配置和认证 |
| `Telemetry.trackEvent()` | `/v1/telemetry/ingest` | 遥测数据上报 |
| `Telemetry.trackPerf()` | `/v1/telemetry/perf` | 性能数据上报 |
| `Realtime.connect()` | WebSocket连接 | 实时通信连接 |
| `Realtime.subscribe()` | WebSocket `subscribe` | 订阅频道 |
| `Realtime.publish()` | WebSocket `publish` | 发布消息 |

## 📚 更多资源

- [API文档](./API-Documentation.md) - 完整的后端API文档
- [SDK源码](./packages/) - SDK包源代码
- [示例项目](./playground/) - 完整的使用示例

---

现在您可以直接使用SDK的功能，而无需关心底层的API调用细节。SDK会自动处理与后端的通信，让您专注于业务逻辑的实现！
