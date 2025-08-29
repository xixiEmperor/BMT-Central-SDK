/**
 * SDK 使用示例
 * 展示如何使用集成了后端API的SDK
 */

import { sdkManager } from './sdk-manager.js';
import { Telemetry } from '@wfynbzlx666/sdk-telemetry';
import { Realtime } from '@wfynbzlx666/sdk-realtime';

/**
 * 基础使用示例
 */
export async function basicExample() {
  try {
    // 1. 初始化SDK，会自动获取配置和处理认证
    const config = await sdkManager.init({
      apiBaseURL: 'http://localhost:5000',
      app: 'my-app',
      release: '1.0.0',
      auth: {
        username: 'admin@example.com',
        password: 'password123'
      },
      debug: true,
      enableHealthMonitoring: true
    });

    console.log('SDK initialized with config:', config);

    // 2. 初始化遥测，会自动使用SDK配置并上报到后端
    Telemetry.init({
      app: 'my-app',
      release: '1.0.0',
      debug: true
    });

    // 3. 设置用户信息
    Telemetry.setUser({
      id: 'user_123',
      email: 'user@example.com',
      name: 'John Doe',
      role: 'user'
    });

    // 4. 跟踪页面浏览 - 会自动上报到后端
    Telemetry.trackPageView('/dashboard', {
      title: 'Dashboard',
      loadTime: 1200
    });

    // 5. 跟踪自定义事件 - 会自动上报到后端
    Telemetry.trackEvent('button_click', {
      buttonId: 'save-btn',
      section: 'settings'
    });

    // 6. 跟踪错误 - 会自动上报到后端
    Telemetry.trackError('javascript_error', 'TypeError: Cannot read property...', 'stack trace here');

    // 7. 初始化实时通信，会自动使用认证令牌
    await Realtime.init({
      url: config.realtime.url,
      auth: () => sdkManager.getAccessToken()
    });

    // 8. 订阅消息
    const subscription = Realtime.subscribe('public:notifications', (message) => {
      console.log('Received notification:', message);
    });

    // 9. 发布消息
    await Realtime.publish('public:chat', {
      message: 'Hello World!',
      timestamp: Date.now()
    });

    // 10. 获取服务器统计信息（集成了后端API）
    const serverStats = await Realtime.getServerStats();
    console.log('Server stats:', serverStats);

    // 11. 检查频道权限
    const canAccess = Realtime.canAccessChannel('private:admin', 'admin', 'user_123');
    console.log('Can access admin channel:', canAccess);

    console.log('All SDK features initialized and working!');

  } catch (error) {
    console.error('SDK initialization failed:', error);
  }
}

/**
 * 高级使用示例
 */
export async function advancedExample() {
  // 监听SDK状态变化
  sdkManager.onStatusChange((status, error) => {
    console.log('SDK status changed:', status);
    if (error) {
      console.error('SDK error:', error);
    }
  });

  // 初始化SDK
  await sdkManager.init({
    apiBaseURL: 'http://localhost:5000',
    app: 'advanced-app',
    release: '2.0.0',
    fingerprint: 'device_fingerprint_hash',
    enableHealthMonitoring: true,
    healthCheckInterval: 30000,
    debug: true
  });

  // 初始化遥测并配置高级选项
  Telemetry.init({
    app: 'advanced-app',
    release: '2.0.0',
    sampleRate: 0.1,  // 10% 采样
    batchSize: 100,   // 100个事件一批
    flushInterval: 3000, // 3秒上报一次
    retryCount: 5,    // 失败重试5次
    debug: true
  });

  // 模拟用户活动
  setInterval(() => {
    // 随机生成一些事件
    const events = [
      () => Telemetry.trackPageView('/page' + Math.floor(Math.random() * 10)),
      () => Telemetry.trackEvent('click', { target: 'button' + Math.floor(Math.random() * 5) }),
      () => Telemetry.trackApi('/api/data', 200, Math.random() * 1000),
    ];

    const randomEvent = events[Math.floor(Math.random() * events.length)];
    randomEvent();
  }, 5000);

  // 获取SDK统计信息
  setInterval(async () => {
    const stats = sdkManager.getStats();
    const queueStatus = await Telemetry.getQueueStatus();
    const realtimeStats = Realtime.getStats();

    console.log('SDK Stats:', {
      sdk: stats,
      telemetry: queueStatus,
      realtime: realtimeStats
    });
  }, 10000);
}

/**
 * React组件中的使用示例
 */
export function useSDKInReact() {
  // 在React组件中的使用方式
  const exampleComponent = `
    import React, { useEffect, useState } from 'react';
    import { sdkManager, Telemetry } from '@wfynbzlx666/sdk-core';

    function MyComponent() {
      const [sdkStatus, setSdkStatus] = useState('uninitialized');

      useEffect(() => {
        // 初始化SDK
        const initSDK = async () => {
          try {
            await sdkManager.init({
              apiBaseURL: 'http://localhost:5000',
              app: 'react-app',
              release: '1.0.0',
              debug: true
            });

            // 初始化遥测
            Telemetry.init({
              app: 'react-app',
              release: '1.0.0'
            });
          } catch (error) {
            console.error('SDK init failed:', error);
          }
        };

        initSDK();

        // 监听SDK状态
        const unsubscribe = sdkManager.onStatusChange((status) => {
          setSdkStatus(status);
        });

        return unsubscribe;
      }, []);

      const handleButtonClick = () => {
        // 跟踪按钮点击事件，会自动上报到后端
        Telemetry.trackEvent('button_click', {
          buttonId: 'example-btn',
          page: '/example'
        });
      };

      return (
        <div>
          <p>SDK Status: {sdkStatus}</p>
          <button onClick={handleButtonClick}>
            Click me (tracked)
          </button>
        </div>
      );
    }

    export default MyComponent;
  `;

  return exampleComponent;
}

/**
 * Vue组件中的使用示例
 */
export function useSDKInVue() {
  const exampleComponent = `
    <template>
      <div>
        <p>SDK Status: {{ sdkStatus }}</p>
        <button @click="handleButtonClick">
          Click me (tracked)
        </button>
      </div>
    </template>

    <script setup>
    import { ref, onMounted, onUnmounted } from 'vue';
    import { sdkManager, Telemetry } from '@wfynbzlx666/sdk-core';

    const sdkStatus = ref('uninitialized');
    let unsubscribe = null;

    onMounted(async () => {
      try {
        // 初始化SDK
        await sdkManager.init({
          apiBaseURL: 'http://localhost:5000',
          app: 'vue-app',
          release: '1.0.0',
          debug: true
        });

        // 初始化遥测
        Telemetry.init({
          app: 'vue-app',
          release: '1.0.0'
        });

        // 监听SDK状态
        unsubscribe = sdkManager.onStatusChange((status) => {
          sdkStatus.value = status;
        });
      } catch (error) {
        console.error('SDK init failed:', error);
      }
    });

    onUnmounted(() => {
      if (unsubscribe) {
        unsubscribe();
      }
    });

    const handleButtonClick = () => {
      // 跟踪按钮点击事件，会自动上报到后端
      Telemetry.trackEvent('button_click', {
        buttonId: 'example-btn',
        page: '/example'
      });
    };
    </script>
  `;

  return exampleComponent;
}

/**
 * 管理员功能示例
 */
export async function adminFeaturesExample() {
  try {
    // 使用管理员账户初始化
    await sdkManager.init({
      apiBaseURL: 'http://localhost:5000',
      app: 'admin-app',
      release: '1.0.0',
      auth: {
        username: 'admin@example.com',
        password: 'admin123'
      },
      debug: true
    });

    // 获取访问令牌
    const accessToken = await sdkManager.getAccessToken();
    if (!accessToken) {
      throw new Error('Failed to get access token');
    }

    // 初始化实时通信
    await Realtime.init({
      url: 'ws://localhost:5000',
      auth: () => sdkManager.getAccessToken()
    });

    // 发送系统广播
    const broadcastSuccess = await Realtime.broadcast(
      accessToken,
      'info',
      '系统将在10分钟后进行维护，请及时保存您的工作。'
    );
    console.log('System broadcast sent:', broadcastSuccess);

    // 发送针对特定用户的警告
    await Realtime.broadcast(
      accessToken,
      'warning',
      '您的账户存在异常登录，请检查安全设置。',
      ['user_123', 'user_456']
    );

    // 获取实时服务器统计信息
    const realtimeStats = await Realtime.getServerStats(accessToken);
    console.log('Realtime server stats:', realtimeStats);

    // 检查用户权限
    const adminChannels = Realtime.getAccessibleChannels('admin', 'admin_123');
    const userChannels = Realtime.getAccessibleChannels('user', 'user_123');
    
    console.log('Admin accessible channels:', adminChannels);
    console.log('User accessible channels:', userChannels);

  } catch (error) {
    console.error('Admin features demo failed:', error);
  }
}

/**
 * 错误处理示例
 */
export async function errorHandlingExample() {
  try {
    // 初始化SDK，处理各种错误场景
    await sdkManager.init({
      apiBaseURL: 'http://localhost:5000',
      app: 'error-demo',
      release: '1.0.0',
      auth: {
        username: 'user@example.com',
        password: 'wrong-password' // 故意使用错误密码
      }
    });
  } catch (error) {
    console.error('Authentication failed, continuing without auth:', error);
    
    // 即使认证失败，也可以继续使用基础功能
    try {
      await sdkManager.init({
        apiBaseURL: 'http://localhost:5000',
        app: 'error-demo',
        release: '1.0.0',
        // 不提供认证信息
      });

      // 初始化遥测（会使用默认配置）
      Telemetry.init({
        app: 'error-demo',
        release: '1.0.0',
        debug: true
      });

      console.log('SDK initialized in anonymous mode');
    } catch (finalError) {
      console.error('Complete SDK initialization failed:', finalError);
    }
  }
}

// 导出所有示例
export default {
  basicExample,
  advancedExample,
  useSDKInReact,
  useSDKInVue,
  adminFeaturesExample,
  errorHandlingExample
};
