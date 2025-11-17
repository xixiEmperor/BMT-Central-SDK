# Output 配置修复说明

## 问题描述

在之前的实现中，`AuditConfig` 中的 `output` 配置项没有被充分利用：

- ✅ `output.verbose` - 已被使用（控制日志级别）
- ❌ `output.format` - 传递给 Lighthouse 的格式不正确（应该是数组）
- ❌ `output.path` - 虽然传递了，但没有明确文档说明

## 修复内容

### 1. 修复 `output.format` 传递格式

**问题：** Lighthouse API 要求 `output` 参数必须是数组格式，但之前传递的是字符串。

**修复前：**
```typescript
const lighthouseFlags = {
  port: parseInt(new URL(browserWSEndpoint).port),
  output: config.output?.format ? config.output.format : 'json',  // ❌ 字符串格式
  outputPath: config.output?.path ? config.output.path : undefined,
  logLevel: config.output?.verbose ? 'info' : 'error'
}
```

**修复后：**
```typescript
const lighthouseFlags = {
  port: parseInt(new URL(browserWSEndpoint).port),
  output: (config.output?.format ? [config.output.format] : ['json']) as ('json' | 'html' | 'csv')[], // ✅ 数组格式
  outputPath: config.output?.path ? config.output.path : undefined,
  logLevel: (config.output?.verbose ? 'info' : 'error') as 'info' | 'error'
}
```

### 2. 添加详细的代码注释

在 `audit.ts` 中添加了详细的注释，说明每个配置项的作用：

```typescript
// 构建 Lighthouse flags（命令行选项）
// 这些参数会传递给 Lighthouse API
const lighthouseFlags = {
  port: parseInt(new URL(browserWSEndpoint).port),
  // output: 报告输出格式（必须是数组）
  // 支持: ['json'], ['html'], ['csv'] 或多格式 ['json', 'html']
  output: (config.output?.format ? [config.output.format] : ['json']) as ('json' | 'html' | 'csv')[],
  // outputPath: 报告文件保存路径
  // 如果指定，Lighthouse 会自动将报告保存到该路径
  outputPath: config.output?.path ? config.output.path : undefined,
  // logLevel: 日志级别
  // 'info' - 详细日志，'error' - 只显示错误
  logLevel: (config.output?.verbose ? 'info' : 'error') as 'info' | 'error'
}
```

### 3. 完善 README 文档

在 `README.md` 中添加了完整的 `Output 配置` 章节，包括：

#### 报告格式（format）
- `'json'`: JSON 格式（默认），返回完整的结构化数据
- `'html'`: HTML 格式，生成可视化的审计报告
- `'csv'`: CSV 格式，适合表格导入和数据分析

#### 输出路径（path）
- 指定报告文件的保存路径（可选）
- 如果不指定，审计结果只会在内存中返回
- Lighthouse 会自动将报告保存到指定路径

#### 详细日志（verbose）
- `true`: 输出详细的审计过程日志
- `false`: 只输出错误日志（默认）

#### 工作原理说明

```typescript
// 配置示例
output: {
  format: 'html',
  path: './reports/audit-report.html'
}

// Lighthouse 会：
// 1. 生成 HTML 格式的报告
// 2. 自动保存到 ./reports/audit-report.html
// 3. 同时在返回结果中包含完整的审计数据
```

### 4. 更新示例代码

在 `examples/audit-example.js` 中添加了 **示例 4: Output 配置完整演示**，展示：

- 4.1 保存 JSON 报告
- 4.2 保存 HTML 报告
- 4.3 保存 CSV 报告
- 4.4 不保存文件（只返回结果）
- 4.5 批量审计并保存报告

## 配置项完整利用情况

| 配置项 | 状态 | 说明 |
|--------|------|------|
| `output.format` | ✅ 已修复 | 以数组格式传递给 Lighthouse API |
| `output.path` | ✅ 已利用 | 传递给 Lighthouse 的 `outputPath` 参数 |
| `output.verbose` | ✅ 已利用 | 映射为 Lighthouse 的 `logLevel` 参数 |

## 使用示例

```typescript
import { auditSinglePage } from '@wfynbzlx666/sdk-perf-spa'

const result = await auditSinglePage('https://example.com', {
  lighthouse: {
    formFactor: 'mobile',
    categories: ['performance']
  },
  output: {
    format: 'html',              // 生成 HTML 报告
    path: './reports/perf.html', // 自动保存到本地文件
    verbose: true                // 输出详细日志
  }
})

// 结果：
// 1. Lighthouse 生成 HTML 报告并保存到 ./reports/perf.html
// 2. 控制台输出详细的审计过程
// 3. result 中包含完整的 JSON 格式审计数据
```

## 技术细节

### Lighthouse API 参数映射

| AuditConfig | Lighthouse Flags | 说明 |
|-------------|------------------|------|
| `output.format` | `output: ['json']` | 输出格式（数组） |
| `output.path` | `outputPath: './path'` | 输出文件路径 |
| `output.verbose` | `logLevel: 'info'` | 日志级别 |

### TypeScript 类型断言

为了通过 TypeScript 类型检查，对参数进行了明确的类型断言：

```typescript
output: (config.output?.format ? [config.output.format] : ['json']) as ('json' | 'html' | 'csv')[]
logLevel: (config.output?.verbose ? 'info' : 'error') as 'info' | 'error'
```

## 总结

现在 `AuditConfig` 中的所有 `output` 配置项都已经被充分利用并正确传递给 Lighthouse API：

1. ✅ `format` - 控制报告输出格式
2. ✅ `path` - 自动保存报告到指定路径
3. ✅ `verbose` - 控制日志详细程度

所有配置项都有详细的文档说明和使用示例。








