# 🚀 快速发布指南

> 5分钟上手BMT Platform SDK包发布

## 📋 发布前准备

```bash
# 1. 登录npm
npm login

# 2. 检查登录状态
npm whoami

# 3. 确保代码质量
pnpm -r typecheck && pnpm -r lint
```

## 🎯 三种发布方式

### 方式一：自动化发布（推荐）⭐

```bash
# 1. 记录变更
pnpm changeset
# 选择包和版本类型(patch/minor/major)

# 2. 一键发布
pnpm release
# 自动构建和发布所有变更的包
```

### 方式二：使用发布脚本

```bash
# 发布所有包
./scripts/publish.sh

# 发布单个包
./scripts/publish.sh @platform/sdk-core patch
```

### 方式三：手动发布

```bash
# 构建并发布指定包
pnpm --filter @platform/sdk-core build
pnpm --filter @platform/sdk-core publish --access public
```

## 📦 可发布的包

| 包名 | 描述 | 主要功能 |
|------|------|----------|
| `@platform/sdk-core` | 核心能力 | TaskQueue、重试、广播 |
| `@platform/sdk-http` | HTTP客户端 | 插件化、熔断、限流 |
| `@platform/sdk-perf` | 性能监控 | Web Vitals、Observer |
| `@platform/sdk-telemetry` | 遥测上报 | 事件追踪、批量上报 |
| `@platform/sdk-realtime` | 实时通信 | WebSocket、心跳重连 |
| `@platform/adapters` | 框架适配 | React/Vue集成 |

## 🔄 版本类型说明

- **patch** (1.0.0 → 1.0.1): Bug修复
- **minor** (1.0.0 → 1.1.0): 新功能，向后兼容
- **major** (1.0.0 → 2.0.0): 破坏性变更

## ⚡ 常用命令

```bash
# 开发
pnpm dev              # 监听构建
pnpm build            # 构建所有包
pnpm playground       # 启动测试沙盒

# 发布
pnpm changeset        # 记录变更
pnpm release          # 发布变更
pnpm publish          # 使用发布脚本

# 版本管理
pnpm version-bump patch           # 所有包增加patch版本
pnpm version-bump @platform/sdk-core minor  # 单包版本更新
```

## 🚨 注意事项

1. **首次发布**需要`--access public`（脚本已处理）
2. **内部依赖**会自动同步版本（Changesets处理）
3. **发布后**记得推送标签：`git push --tags`
4. **回滚**24小时内可用：`npm unpublish @platform/sdk-core@1.0.0`

## 📊 发布后验证

```bash
# 检查包是否发布成功
npm view @platform/sdk-core

# 测试安装
npm install @platform/sdk-core

# 验证导入
node -e "console.log(require('@platform/sdk-core'))"
```

---

**遇到问题？** 查看完整的 [PUBLISHING.md](./PUBLISHING.md) 文档