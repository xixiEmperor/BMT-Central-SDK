# 📦 BMT Platform SDK 发布指南

本指南详细说明如何独立发布packages中的各个SDK包。

## 🏗️ 发布架构

### 包结构
```
packages/
├── sdk-core/         # @platform/sdk-core - 核心能力
├── sdk-http/         # @platform/sdk-http - HTTP客户端
├── sdk-perf/         # @platform/sdk-perf - 性能监控
├── sdk-telemetry/    # @platform/sdk-telemetry - 遥测上报
├── sdk-realtime/     # @platform/sdk-realtime - 实时通信
└── adapters/         # @platform/adapters - 框架适配器
```

### 依赖关系
```
sdk-http → sdk-core
sdk-telemetry → sdk-core, sdk-perf
sdk-realtime → sdk-core
adapters → sdk-http, sdk-telemetry
```

## 🚀 发布方式

### 方式一：批量发布（推荐）

使用Changesets进行版本管理和批量发布：

```bash
# 1. 记录变更
pnpm changeset

# 2. 更新版本号和生成changelog
pnpm changeset version

# 3. 构建并发布所有包
pnpm release
```

### 方式二：使用发布脚本

```bash
# 发布所有包
./scripts/publish.sh

# 发布单个包
./scripts/publish.sh @platform/sdk-core

# 发布单个包并指定版本类型
./scripts/publish.sh @platform/sdk-core patch
```

### 方式三：手动发布单个包

```bash
# 1. 构建指定包
pnpm --filter @platform/sdk-core build

# 2. 发布指定包
pnpm --filter @platform/sdk-core publish --access public
```

## 📋 发布前检查清单

### 必要条件
- [ ] 已登录npm: `npm login`
- [ ] Git工作目录干净
- [ ] 所有测试通过
- [ ] 类型检查通过: `pnpm -r typecheck`
- [ ] 代码规范检查通过: `pnpm -r lint`
- [ ] 构建成功: `pnpm -r build`

### 版本管理
- [ ] 根据变更类型选择正确的版本号(patch/minor/major)
- [ ] 更新CHANGELOG.md
- [ ] 内部依赖版本同步更新

## 🔧 配置说明

### publishConfig
每个包的`package.json`都已配置：
```json
{
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

### 文件白名单
只发布必要文件：
```json
{
  "files": ["dist"]
}
```

### 导出配置
清晰的模块导出：
```json
{
  "main": "./dist/index.js",
  "module": "./dist/index.js", 
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

## 📚 常用命令

### 开发时
```bash
# 安装依赖
pnpm install

# 开发模式（监听文件变化）
pnpm dev

# 构建所有包
pnpm build

# 清理构建产物
pnpm clean
```

### 发布时
```bash
# 创建变更记录
pnpm changeset

# 查看待发布的变更
pnpm changeset status

# 更新版本号
pnpm changeset version

# 发布所有包
pnpm release

# 使用脚本发布
./scripts/publish.sh
```

### 单包操作
```bash
# 构建单个包
pnpm --filter @platform/sdk-core build

# 发布单个包
pnpm --filter @platform/sdk-core publish --access public

# 测试单个包
pnpm --filter @platform/sdk-core test
```

## 🔄 Changesets工作流

### 1. 记录变更
```bash
pnpm changeset
```
选择要发布的包和变更类型：
- `patch`: 补丁版本（bug修复）
- `minor`: 次要版本（新功能，向后兼容）
- `major`: 主要版本（破坏性变更）

### 2. 版本管理
```bash
pnpm changeset version
```
- 自动更新package.json中的版本号
- 将workspace:*依赖解析为具体版本
- 生成CHANGELOG.md

### 3. 发布
```bash
pnpm release
```
- 构建所有包
- 发布到npm registry
- 创建git标签

## 🚨 常见问题

### Q: 发布失败怎么办？
A: 检查以下几点：
1. 是否已登录npm: `npm whoami`
2. 包名是否已存在且无权限
3. 网络连接是否正常
4. 构建是否成功

### Q: 如何撤销已发布的版本？
A: 使用npm unpublish（仅限24小时内）：
```bash
npm unpublish @platform/sdk-core@1.0.0
```

### Q: 如何发布beta版本？
A: 指定tag：
```bash
pnpm --filter @platform/sdk-core publish --tag beta
```

### Q: 内部依赖如何处理？
A: Changesets会自动：
- 将`workspace:*`解析为发布时的具体版本
- 自动更新依赖包的版本

## 📈 版本策略

### 语义化版本(SemVer)
- **MAJOR.MINOR.PATCH** (例如: 1.2.3)
- **MAJOR**: 不兼容的API变更
- **MINOR**: 向后兼容的功能新增
- **PATCH**: 向后兼容的问题修正

### 预发布版本
- **alpha**: 内部测试版本
- **beta**: 公开测试版本  
- **rc**: 候选发布版本

### 示例
```
1.0.0-alpha.1  # 内部测试
1.0.0-beta.1   # 公开测试
1.0.0-rc.1     # 候选版本
1.0.0          # 正式版本
```

## 🔐 权限管理

### npm组织
建议创建npm组织来管理包：
```bash
npm org create @your-org
npm org add-user @your-org username
```

### 发布权限
包的维护者需要有发布权限：
```bash
npm access grant read-write @your-org:developers @platform/sdk-core
```

## 📊 发布后续

### 监控发布状态
- 检查npm registry: https://npmjs.com/package/@platform/sdk-core
- 验证安装: `npm install @platform/sdk-core`
- 测试导入: `import { createTaskQueue } from '@platform/sdk-core'`

### 文档更新
- 更新README.md
- 更新API文档
- 通知团队发布信息

---

> 💡 **提示**: 首次发布前，建议先在私有registry或本地测试完整流程。