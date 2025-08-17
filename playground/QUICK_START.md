# 🚀 快速启动指南

## 重要更新

Playground已经完全重构，**不再使用mock数据**，现在直接连接真实的后端服务。

## 🔧 配置你的后端地址

### 方法1：使用环境变量文件（推荐）

1. 复制示例配置文件：
```bash
cp .env.example .env.local
```

2. 编辑 `.env.local` 文件，设置你的后端地址：
```env
# 修改为你的后端地址
VITE_API_BASE_URL=http://your-backend:5000
VITE_REALTIME_URL=ws://your-backend:5000/realtime
VITE_TELEMETRY_ENDPOINT=http://your-backend:5000/api/telemetry/events
```

### 方法2：直接修改配置文件

编辑 `src/config/env.ts` 文件中的默认值。

## 🏃‍♂️ 启动步骤

1. **安装依赖**
```bash
pnpm install
```

2. **启动开发服务器**
```bash
pnpm dev
```

3. **打开浏览器**
```
http://localhost:5173
```

## 📋 测试清单

### ✅ 必须先实现的后端接口

在开始测试之前，确保你的后端已实现以下关键接口：

#### 基础健康检查
- `GET /api/health` - 返回服务健康状态

#### 认证接口（如需要）
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/verify` - Token验证

#### 遥测接口（如需要）
- `POST /api/telemetry/events` - 接收遥测事件

#### WebSocket服务（如需要）
- `ws://your-host/realtime` - 实时通信

### 🧪 测试流程

1. **检查配置信息** - 页面顶部显示当前配置的所有后端地址
2. **基础连接测试** - 点击"GET 请求"测试基本连接
3. **逐步测试各模块** - 按需测试其他功能模块
4. **查看详细日志** - 所有响应和错误都有详细展示

## 🐛 常见问题

### Q: 连接失败怎么办？
A: 
1. 检查后端服务是否启动
2. 验证CORS配置
3. 查看浏览器控制台错误信息

### Q: API调用失败？
A:
1. 确认端点路径是否正确
2. 检查请求格式是否符合后端期望
3. 查看后端日志

### Q: WebSocket连接不上？
A:
1. 确认WebSocket服务已启动
2. 检查认证Token是否正确
3. 验证WebSocket URL格式

## 💡 提示

- 所有日志都会同时输出到浏览器控制台
- 错误信息包含详细的HTTP状态码和响应内容
- 支持同时连接多个环境进行对比测试

## 📚 更多信息

详细文档请查看 [README.md](./README.md)
