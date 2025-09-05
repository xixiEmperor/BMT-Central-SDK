## Monorepo 架构实践指南（面试向）

### 定义与价值

- **Monorepo（多包单仓）**：用一个代码仓库集中管理多个相互关联的包/应用，统一依赖、构建、测试与发布流程。
- **核心价值**：
  - **效率**：跨包联动改动一次提交，统一工具链减少心智与维护成本。
  - **一致性**：TypeScript/ESLint/Commit 规范等在根级统一，保证风格与质量一致。
  - **复用**：公共能力抽包复用，类型与工具共享，避免重复造轮子。
  - **可控演进**：依赖图驱动的构建/测试/发布流程，风险可控、可回溯。

### 何时适合/不适合

- **适合**
  - 多个包共享大量基建（类型、工具、打包、测试）。
  - 跨包联动改动频繁（核心类型或协议演进）。
  - 需要统一标准（语言版本、风格、质量门禁）。
- **不适合**
  - 团队强边界、包之间几乎无耦合。
  - 超大规模、构建耗时难以控制又不愿引入任务图/缓存。

## Monorepo 的五大支柱

### 1) 工作区与依赖管理

- **工具选择**：`pnpm workspaces`（推荐），或 Yarn/NPM workspaces。
- **优势（pnpm）**：内容寻址 + 硬链接，极大节省磁盘；严格依赖解析，避免“幽灵依赖”。
- **包间依赖**：使用 `workspace:*`/`workspace:^` 明确本地依赖关系。
- **依赖分层原则**：
  - 运行时必需：放 `dependencies`
  - 仅开发期：放 `devDependencies`
  - 宿主约束：放 `peerDependencies`（如 React/Vue/Socket.IO 客户端）

### 2) 任务编排与构建加速

- **任务图工具**：`Turborepo` 或 `Nx`（仅构建受影响包，提供本地/远程缓存）。
- **TypeScript 增量**：`projectReferences + composite` 仅编译变更子图。
- **打包工具**：`tsup`/`rollup`/`esbuild`（本仓库已使用 `tsup`）。
- **关键机制**：拓扑排序 + 哈希缓存（输入=源码+锁文件+环境配置）。

### 3) 版本与发布（Release）

- **工具**：`Changesets`（事实标准）、或 `semantic-release`。
- **策略**：
  - 固定版本（fixed/lockstep）：所有包同一版本，适合强耦合套件。
  - 独立版本（independent）：各包独立语义化版本，适合相对解耦生态。
- **发布顺序**：依赖图拓扑排序，先底层后上层；支持 canary/prerelease。

### 4) 质量与一致性

- 根级统一：`tsconfig.base.json`、ESLint/Prettier、Commitlint、Husky + lint-staged。
- 类型共享：抽公共类型包，减少重复定义。
- 测试策略：按“受影响包”选择性运行；核心路径做集成/E2E 兜底。

### 5) CI/CD 流程

- 缓存：`pnpm store` 缓存 + 构建缓存（Turborepo/Nx 远程缓存）。
- 基本流程：安装 → 计算受影响包 → lint/test/build → version & changelog → 按拓扑发布。
- 分支策略：保护主分支；PR 必须包含变更集（changeset）。

## 与本仓库（BMT-Central-SDK）的映射

- 结构：`packages/` 下多包：`sdk-core`、`sdk-http`、`sdk-realtime`、`sdk-telemetry`、`adapters`、`sdk-perf`，以及 `playground` 示例。
- 统一配置：`tsconfig.base.json`、各包 `tsup.config.ts`、发布脚本与文档齐全。
- 版本与发布：已引入 `.changeset/config.json`，建议在 CI 中强制 PR 携带 changeset。
- 下一步增强建议：
  - 引入 `Turborepo` 任务图与远程缓存，缩短 CI 时长。
  - 为需要宿主的库添加 `peerDependencies`（如 React/Vue/socket.io-client）。
  - 打通 TS 项目引用（references），加速增量构建与 d.ts 产物联动。
  - CI 强化：受影响包检测 + 拓扑构建 + 拓扑发布。

## 常见配置片段（可直接参考）

### pnpm 工作区

```yaml
packages:
  - "packages/*"
  - "playground"
```

### 包间本地依赖与 peer 依赖

```json
{
  "dependencies": {
    "@bmt/sdk-core": "workspace:^"
  },
  "peerDependencies": {
    "react": ">=18"
  }
}
```

### Turborepo 任务图（示例）

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "dependsOn": ["^build"] },
    "lint": {}
  }
}
```

### TypeScript 项目引用（子包 tsconfig）

```json
{
  "files": [],
  "references": [{ "path": "../sdk-core" }],
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true
  }
}
```

### 统一脚本与发布流程（根 package.json）

```json
{
  "scripts": {
    "lint": "turbo run lint",
    "build": "turbo run build",
    "test": "turbo run test",
    "release": "changeset version && pnpm -r build && changeset publish"
  }
}
```

## 高频考点与应答要点

- **依赖提升与幽灵依赖**：pnpm 默认不 hoist 且严格解析，幽灵依赖难以出现；如需兼容老工具链，可配置 `public-hoist-pattern`。
- **Peer Dependencies**：表达“对宿主的版本约束”，避免重复打包与多实例冲突（典型如 React）。
- **循环依赖治理**：按“领域→能力→适配层”分层；抽公共基座包；周期性跑循环依赖检查。
- **导出条件与模块格式**：在 `package.json` 中使用 `exports`，明确 CJS/ESM 条目与 `types`；避免双包陷阱。
- **路径别名一致性**：TS `paths` 与打包/运行时解析一致；谨防编译后找不到模块。
- **构建输出规范**：各包 `dist/` 仅存构建产物；禁止跨包直接引用他人 `dist`，统一通过入口导出依赖。

## 面试 1–2 分钟话术范例

“我们用 Monorepo 管理多个 SDK 包，底层用 pnpm workspaces 管理依赖，配合 Changesets 做语义化版本与拓扑发布。构建上采用 tsup，叠加 Turborepo 的任务图与缓存，只构建受影响的包，CI 时间显著下降。类型与质量层面，通过根级 tsconfig.base、ESLint、Commitlint 统一约束，并在必要处使用 TS Project References 实现增量编译。依赖管理上严格区分 dependencies/peerDependencies，避免幽灵依赖与多实例问题。整体收益是联动修改成本低、一致性强、发布自动化且可追溯。”

## 最佳实践清单（Checklist）

- pnpm + Changesets + Turborepo/Nx 作为基座工具链。
- 根级统一 tsconfig/ESLint/Prettier/Commitlint，Husky + lint-staged 兜底。
- 严格区分 `dependencies` / `devDependencies` / `peerDependencies`，包间用 `workspace:*`。
- 启用 TS 项目引用与 d.ts 输出，保持类型链路闭环。
- 受影响包选择性构建/测试，启用本地/远程缓存。
- 禁止跨包引用 `dist`，仅通过入口导出。
- CI 强制 PR 携带 changeset，主分支受保护。

## 进一步落地建议（针对本仓库）

1. 新增 `turbo.json` 并在根 `package.json` 融合脚本，统一跑 lint/test/build。
2. 为 `adapters`、`sdk-perf` 等对框架有诉求的包声明 `peerDependencies`（如 React/Vue）。
3. 在 `sdk-http`/`sdk-realtime` 与 `sdk-core` 之间建立 TS `references`，缩短增量编译路径。
4. 在 CI（GitHub Actions/其他）串联：安装 → 受影响包 → lint/test/build → changeset 校验 → 拓扑发布。

—— 完 ——


