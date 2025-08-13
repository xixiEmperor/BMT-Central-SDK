# BMT Central SDK

> BMT 技术中台前端 SDK 集合 - 提供统一的网络请求、性能监控、遥测上报、实时通信能力

## 📦 包列表

| 包名 | 描述 | 版本 | 状态 |
|------|------|------|------|
| [@platform/sdk-core](./packages/sdk-core) | 核心能力 - TaskQueue、重试退避、跨标签页协调 | ![npm](https://img.shields.io/npm/v/@platform/sdk-core) | 🚧 开发中 |
| [@platform/sdk-http](./packages/sdk-http) | HTTP 客户端 - Axios 单例、插件链、统一错误处理 | ![npm](https://img.shields.io/npm/v/@platform/sdk-http) | 🚧 开发中 |
| [@platform/sdk-perf](./packages/sdk-perf) | 性能监控 - Web Vitals、PerformanceObserver | ![npm](https://img.shields.io/npm/v/@platform/sdk-perf) | 🚧 开发中 |
| [@platform/sdk-telemetry](./packages/sdk-telemetry) | 遥测上报 - 事件缓冲、批量上报、跨标签页去重 | ![npm](https://img.shields.io/npm/v/@platform/sdk-telemetry) | 🚧 开发中 |
| [@platform/sdk-realtime](./packages/sdk-realtime) | 实时通信 - Socket.IO 可靠通道、心跳重连 | ![npm](https://img.shields.io/npm/v/@platform/sdk-realtime) | 🚧 开发中 |
| [@platform/adapters](./packages/adapters) | 框架适配 - React/Vue Query 默认项 | ![npm](https://img.shields.io/npm/v/@platform/adapters) | 🚧 开发中 |

## 🚀 快速开始

### 安装

```bash
# 使用 pnpm (推荐)
pnpm add @platform/sdk-core @platform/sdk-http

# 或使用 npm
npm install @platform/sdk-core @platform/sdk-http
```

### 基础用法

```typescript
import { initHttp } from '@platform/sdk-http'
import { Perf } from '@platform/sdk-perf'
import { Telemetry } from '@platform/sdk-telemetry'
import { Realtime } from '@platform/sdk-realtime'

// 初始化 HTTP 客户端
initHttp({ 
  baseURL: import.meta.env.VITE_API_BASE_URL 
})

// 初始化性能监控
Perf.init({
  sampleRate: 0.05,
  useWorker: true,
  onMetric: (m) => Telemetry.trackPerf(m),
})

// 初始化遥测
Telemetry.init({
  endpoint: import.meta.env.VITE_TELEMETRY_ENDPOINT,
  app: 'my-app',
  release: '1.0.0',
})

// 初始化实时通信
Realtime.init({
  url: import.meta.env.VITE_REALTIME_URL,
  auth: () => localStorage.getItem('token'),
})
```

## 🛠️ 开发

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 开发流程

```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 启动 playground 进行测试
pnpm playground

# 类型检查
pnpm typecheck

# 代码规范检查
pnpm lint
```

### 发布流程

```bash
# 标注变更
pnpm changeset

# 更新版本
pnpm changeset version

# 构建并发布
pnpm release
```

## 📚 文档

- [开发文档](./开发文档_单人SDK架构.md) - 详细的架构设计与开发计划
- [技术契约](./10_前端SDK_技术文档与API契约.md) - 原始技术规格文档
- [API 文档](./docs/) - 各包的 API 使用说明

## 🧪 测试

项目使用 [playground](./playground/) 进行手动验证，包含以下测试场景：

- ✅ 基本功能测试
- ✅ 错误处理验证
- ✅ 性能监控验证
- ✅ 实时通信测试
- ✅ 跨标签页协调

## 📄 许可证

MIT © BMT Platform Team

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

请遵循以下规范：
- 使用 [Conventional Commits](https://conventionalcommits.org/) 提交消息
- 运行 `pnpm lint` 确保代码规范
- 在 playground 中验证功能正常

## 📞 支持

如有问题请联系 BMT 平台团队或提交 Issue。