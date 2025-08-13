# 单人 SDK 架构设计与开发计划

> 基于原有五大 SDK 包技术契约，极简为"单人维护 + Monorepo + 无测试 + 后端独立"的架构设计。

---

## 架构总览

### 核心原则
- **单人高效**：去掉测试、后端服务，专注 SDK 包本身
- **稳定契约**：保持原有 API 设计与错误/事件约定
- **Monorepo**：统一构建、发布、版本管理
- **手动验证**：用 playground 替代测试进行功能验证

### 包结构与职责

```
@platform/sdk-core       TaskQueue / 重试退避 / 跨标签页协调
@platform/sdk-http       Axios 单例 + 插件链 + unwrap + 错误约定
@platform/sdk-perf       Web Vitals + PO + User Timing + Worker 聚合
@platform/sdk-telemetry  事件模型 + 缓冲 + 批量 + Beacon 兜底
@platform/sdk-realtime   可靠通道 (心跳/退避/ack/重发/序列号/反压)
@platform/adapters       React/Vue 适配与默认项 (可选)
```

---

## 仓库结构

```
BMT-Central-SDK/
├── packages/
│   ├── sdk-core/           # TaskQueue、重试、跨标签页
│   ├── sdk-http/           # HTTP 客户端与插件
│   ├── sdk-perf/           # 性能采集
│   ├── sdk-telemetry/      # 遥测上报
│   ├── sdk-realtime/       # 实时通信
│   └── adapters/           # React/Vue 适配 (可选)
├── playground/             # 手动验证沙箱
├── docs/                   # API 契约与集成示例
├── .changeset/             # 版本管理
├── tsconfig.base.json      # TypeScript 基础配置
├── pnpm-workspace.yaml     # 工作区配置
├── package.json            # 根包管理
└── README.md               # 使用说明
```

---

## 技术栈与工具

### 包管理
- **pnpm**：工作区、安装速度、依赖隔离
- **workspace**：统一管理五个 SDK 包

### 构建
- **tsup**：快速 TypeScript 构建，输出 ESM + .d.ts
- **rollup** (可选)：复杂场景下的 bundle 优化

### 版本与发布
- **Changesets**：SemVer 管理，自动生成 Changelog
- **Conventional Commits**：提交规范，自动化版本说明

### 质量门槛 (轻量)
- **TypeScript**：类型检查
- **ESLint**：代码规范
- **playground**：手动功能验证

---

## 依赖关系与边界

### 包间依赖
```
sdk-http → sdk-core (重试原语)
sdk-http → sdk-telemetry (插件回调，可选)
sdk-perf → sdk-telemetry (指标输出，可选)
sdk-realtime → sdk-core (可靠性原语)
adapters → sdk-http, sdk-telemetry (默认项包装)
```

### 设计边界
- **解耦原则**：通过回调/插件避免硬依赖
- **契约稳定**：公开 API、错误模型、事件 Schema 受 SemVer 管控
- **后端独立**：仅通过环境变量与 HTTP/WebSocket 接口对接

---

## 环境变量约定

```bash
VITE_API_BASE_URL          # HTTP 基础地址
VITE_TELEMETRY_ENDPOINT    # 遥测上报地址
VITE_REALTIME_URL          # Socket.IO 服务器地址
```

---

## 构建与发布流程

### 日常开发
```bash
# 安装依赖
pnpm install

# 类型检查与代码规范
pnpm -r typecheck
pnpm -r lint

# 构建所有包
pnpm -r build

# 本地验证
cd playground && pnpm dev
```

### 版本发布
```bash
# 1. 标注变更 (patch/minor/major)
pnpm changeset

# 2. 统一更新版本与 Changelog
pnpm changeset version

# 3. 构建与发布
pnpm -r build
pnpm -r publish --access public

# 4. 推送 tag 与更新文档
git push --tags
```

---

## 落地计划 (7 天滚动)

### Day 1: 基础设施
- [x] 创建开发文档
- [ ] 搭建 Monorepo (pnpm、tsconfig、tsup、Changesets)
- [ ] 创建五个包的空壳与公共类型

### Day 2: 核心能力
- [ ] 实现 `@platform/sdk-core`
  - TaskQueue (并发/超时/重试)
  - 指数退避 (Full Jitter)
  - 跨标签页协调 (BroadcastChannel/navigator.locks 降级)

### Day 3: HTTP 客户端
- [ ] 实现 `@platform/sdk-http`
  - Axios 单例与插件链
  - 请求去重/重试/熔断/限流
  - 令牌刷新 (Single-Flight)
  - 统一 unwrap 与错误约定
  - 在 playground 验证 GET/401/重试流程

### Day 4: 可观测性
- [ ] 实现 `@platform/sdk-perf`
  - Web Vitals (LCP/CLS/INP/TTFB)
  - PerformanceObserver (navigation/resource/longtask)
  - User Timing (mark/measure)
  - Worker 聚合 (可选)
- [ ] 实现 `@platform/sdk-telemetry`
  - 统一事件模型 (page/event/error/api/perf)
  - IndexedDB 缓冲与批量上报
  - sendBeacon 兜底与采样
  - 多标签页去重

### Day 5: 实时通信
- [ ] 实现 `@platform/sdk-realtime`
  - Socket.IO 客户端封装
  - 心跳保活与指数退避重连
  - ack/重发机制
  - 序列号有序与反压
  - 跨标签页单连接共享
  - 接入后端测试端点验证

### Day 6: 适配层与文档
- [ ] 创建 `@platform/adapters` (可选)
  - React Query 默认项
  - Vue Query/SWRV 适配
- [ ] 完善 `docs/` 
  - API 契约文档
  - 集成示例与最佳实践

### Day 7: 发布与基线
- [ ] 首次发布流程验证
- [ ] 版本基线与 Changelog
- [ ] 记录默认参数与破坏性变更策略

---

## 质量保障 (无测试前提)

### 手动验证清单 (playground)
- [ ] HTTP 基本功能：GET/POST/PUT/DELETE
- [ ] 错误处理：网络错误/超时/401/403/500
- [ ] 重试机制：幂等重试/指数退避
- [ ] 熔断与限流：错误率触发/恢复探测
- [ ] 令牌刷新：401 触发/Single-Flight/失败登出
- [ ] 性能采集：Web Vitals/LongTask/User Timing
- [ ] 遥测上报：事件缓冲/批量/Beacon 兜底
- [ ] 实时通信：订阅/发布/断线重连/ack 机制
- [ ] 跨标签页：BroadcastChannel/locks 协调

### 兜底策略
- **旁路模式**：环境变量控制"仅采集不拦截"
- **默认参数**：保守的重试次数、熔断阈值、采样率
- **错误边界**：SDK 内部异常不应影响业务逻辑
- **降级方案**：关键功能的 fallback (如 localStorage 降级)

---

## 治理与演进

### 稳定 API 管控
- **公开 API 清单**：在 docs 明确列出受 SemVer 保护的接口
- **破坏性变更**：保留兼容开关，提供迁移指南与过渡期
- **默认参数演进**：基于生产数据调优，通过 minor 版本更新

### 发布策略
- **语义化版本**：patch (修复) / minor (功能) / major (破坏性)
- **变更日志**：Changesets 自动生成，人工补充迁移说明
- **向后兼容**：至少支持一个 major 版本的过渡期

### 监控与反馈
- **包体积**：bundlephobia 监控，保持轻量
- **兼容性**：browserslist 与 TypeScript 版本矩阵
- **使用数据**：通过遥测了解 API 使用分布，指导演进方向

---

## 总结

这个设计将原有的完整技术中台 SDK 精简为"单人可维护"的形态，保持了核心技术契约与 API 稳定性，通过 Monorepo + Changesets 实现高效的开发与发布流程。重点是：

1. **专注 SDK**：去掉测试与后端，只做客户端能力
2. **手动验证**：用 playground 替代自动化测试
3. **稳定契约**：维护原有 API 设计与错误/事件约定
4. **高效发布**：Changesets 管理版本与变更日志
5. **渐进演进**：7天基础完成，后续按需迭代

接下来开始按计划执行代码生成。

为本地测试，你可以按如下步骤进行：
1) 终端运行：pnpm install
2) 运行：pnpm --filter playground dev
3) 浏览器打开：http://localhost:3000
4) 使用页面上的各按钮做手动验证（当前会提示“尚未实现”，后续我们逐步填充功能）
我已创建 playground/.env.local，默认：
VITE_API_BASE_URL=https://httpbin.org
VITE_TELEMETRY_ENDPOINT=https://httpbin.org/post
VITE_REALTIME_URL=http://localhost:5174
当前构建状态：除了 sdk-telemetry 还在生成类型时报错外，其它包已能成功产物。你仍可启动 playground 界面做交互联调 UI。接下来我会继续实现 sdk-core，修复类型与实现，逐步让按钮具备真实功能。