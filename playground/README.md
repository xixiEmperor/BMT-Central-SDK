# BMT Platform SDK 测试沙箱

一个集成了所有 BMT Platform SDK 模块的测试环境，用于验证SDK功能和与后端服务的集成。

## 🚀 快速开始

### 1. 安装依赖
```bash
pnpm install
```

### 2. 配置环境
复制环境配置文件：
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，配置你的后端服务地址：
```env
# 后端API基础地址
VITE_API_BASE_URL=http://localhost:5000

# WebSocket服务地址  
VITE_REALTIME_URL=ws://localhost:5000/realtime

# 遥测数据上报端点
VITE_TELEMETRY_ENDPOINT=http://localhost:5000/api/telemetry/events
```

### 3. 启动开发服务器
```bash
pnpm dev
```

访问 `http://localhost:5173` 查看测试沙箱。

## 📦 功能模块

### SDK Core
- ✅ TaskQueue 任务队列
- ✅ 重试机制
- ✅ 跨标签页通信
- ✅ 互斥锁
- ✅ SDK Manager

### SDK HTTP
- ✅ 基础HTTP请求
- ✅ 错误处理
- ✅ 重试插件
- ✅ 熔断器
- ✅ 限流插件
- ✅ 请求去重
- ✅ 认证插件
- ✅ Auth API
- ✅ Health API
- ✅ Config API
- ✅ Telemetry API

### SDK Telemetry
- ✅ 事件跟踪
- ✅ 页面浏览统计
- ✅ 错误跟踪
- ✅ 批量上报

### SDK Realtime
- ✅ WebSocket连接
- ✅ 频道订阅/发布
- ✅ 心跳保活
- ✅ 自动重连

### SDK Performance
- ✅ 性能指标收集
- ✅ Web Vitals
- ✅ 自定义指标

### Adapters
- ✅ 错误处理器
- ✅ 重试函数
- ✅ BMT API
- ✅ 认证管理器
- ✅ 频道权限

## 🔧 配置说明

### 环境变量

| 变量名 | 描述 | 默认值 |
|-------|------|--------|
| `VITE_API_BASE_URL` | 后端API基础地址 | `http://localhost:5000` |
| `VITE_REALTIME_URL` | WebSocket服务地址 | `ws://localhost:5000/realtime` |
| `VITE_TELEMETRY_ENDPOINT` | 遥测数据上报端点 | `http://localhost:5000/api/telemetry/events` |
| `VITE_ENV` | 环境标识 | `development` |
| `VITE_APP_NAME` | 应用名称 | `playground` |
| `VITE_APP_VERSION` | 应用版本 | `1.0.0` |
| `VITE_ENABLE_TELEMETRY` | 启用遥测 | `true` |
| `VITE_ENABLE_REALTIME` | 启用实时通信 | `true` |
| `VITE_ENABLE_PERFORMANCE` | 启用性能监控 | `true` |
| `VITE_DEBUG_MODE` | 调试模式 | `true` |
| `VITE_CONSOLE_LOG` | 控制台日志 | `true` |

### 配置文件

配置集中管理在 `src/config/env.ts`，所有组件都通过这个文件获取配置。

## 🧪 测试指南

### 1. 准备后端服务

确保你的后端服务已启动并提供以下端点：

#### 核心API
- `GET /api/health` - 健康检查
- `GET /api/health/info` - 服务信息

#### 认证API
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/verify` - Token验证
- `POST /api/auth/refresh` - Token刷新

#### 遥测API
- `POST /api/telemetry/events` - 事件上报
- `GET /api/telemetry/stats` - 统计信息

#### WebSocket服务
- `ws://localhost:5000/realtime` - 实时通信

### 2. 运行测试

1. 打开浏览器到 `http://localhost:5173`
2. 查看配置信息是否正确
3. 逐个测试各个模块功能
4. 观察日志输出和错误信息

### 3. 查看日志

- **浏览器控制台**：所有日志同时输出到控制台
- **页面日志区域**：每个模块都有独立的日志显示区域
- **详细信息**：错误日志包含HTTP状态码、请求URL等详细信息

## 🔍 故障排除

### 连接失败
1. 检查后端服务是否启动
2. 验证环境配置中的URL是否正确
3. 检查CORS配置是否允许前端域名

### API调用失败
1. 查看浏览器控制台的详细错误信息
2. 检查后端服务的日志
3. 验证API端点是否正确实现

### WebSocket连接问题
1. 确认WebSocket服务器已启动
2. 检查认证Token是否有效
3. 验证WebSocket URL格式是否正确

## 📚 相关文档

- [SDK架构文档](../BMT-SDK-Architecture.md)
- [API集成指南](../SDK-API-Integration-Guide.md)
- [后端接口契约](../docs/后端接口契约简表.md)
- [后端接口需求](../docs/后端接口需求文档.md)

## 🤝 贡献

如需添加新的测试功能或修复问题，请：

1. 在相应的组件文件中添加测试函数
2. 使用统一的日志记录方式
3. 更新此README文档
4. 确保所有功能都有适当的错误处理

## 📄 许可证

本项目仅用于测试目的。