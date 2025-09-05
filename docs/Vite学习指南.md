# Vite 完整学习指南

## 目录

1. [Vite 简介](#vite-简介)
2. [核心概念](#核心概念)
3. [工作原理](#工作原理)
4. [快速开始](#快速开始)
5. [项目结构](#项目结构)
6. [配置详解](#配置详解)
7. [插件系统](#插件系统)
8. [开发服务器](#开发服务器)
9. [构建打包](#构建打包)
10. [静态资源处理](#静态资源处理)
11. [环境变量](#环境变量)
12. [TypeScript 支持](#typescript-支持)
13. [CSS 处理](#css-处理)
14. [依赖预构建](#依赖预构建)
15. [热更新机制](#热更新机制)
16. [性能优化](#性能优化)
17. [部署策略](#部署策略)
18. [常见问题与解决方案](#常见问题与解决方案)
19. [与其他工具对比](#与其他工具对比)
20. [最佳实践](#最佳实践)

---

## Vite 简介

### 什么是 Vite？

Vite（法语意为"快速"）是一个现代化的前端构建工具，由 Vue.js 作者尤雨溪开发。它旨在提供更快的开发体验和更高效的构建过程。

### 核心特性

- **极速的冷启动**：利用原生 ES 模块，无需打包即可启动
- **即时热更新**：基于 ESM 的 HMR，更新速度不受应用规模影响
- **真正的按需编译**：只编译当前屏幕上实际导入的代码
- **开箱即用**：对 TypeScript、JSX、CSS 预处理器等的内置支持
- **优化的构建**：使用 Rollup 进行生产构建，预配置了多种优化策略
- **通用插件接口**：在开发和构建之间共享 Rollup 兼容插件
- **完全类型化的 API**：灵活的 API 和完整的 TypeScript 类型

---

## 核心概念

### 1. ESM（ES Modules）优先

Vite 基于浏览器原生 ES 模块支持，彻底改变了传统构建工具的工作方式：

#### 1.1 传统打包 vs Vite 方式

```javascript
// 传统打包工具（Webpack）的工作方式：
// 1. 扫描所有模块依赖
// 2. 将所有代码打包成 bundle
// 3. 浏览器加载打包后的文件

// Vite 的工作方式：
// 1. 浏览器直接请求具体模块
// 2. Vite 服务器按需编译返回
// 3. 利用浏览器原生 import 语法
import { createApp } from 'vue'  // 浏览器直接发起 HTTP 请求
import App from './App.vue'      // Vite 实时编译 Vue SFC

createApp(App).mount('#app')
```

#### 1.2 浏览器原生 ESM 支持

```html
<!-- 现代浏览器原生支持 -->
<script type="module">
  import { utils } from '/src/utils.js'  // 直接加载，无需打包
  import config from '/src/config.json'  // JSON 模块
  import styles from '/src/styles.css'   // CSS 模块
</script>
```

#### 1.3 模块解析优势

```javascript
// 传统方式：需要解析整个依赖树
Bundle: [main.js + utils.js + config.js + ...] → 一个大文件

// Vite 方式：按需加载
/src/main.js     → 实时编译返回
/src/utils.js    → 缓存或实时编译
/src/config.js   → 按需加载
```

### 2. 开发与生产分离

Vite 采用双模式架构，针对不同环境优化：

#### 2.1 开发环境特点

```javascript
// 开发环境架构
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   浏览器     │◄──►│  Vite Dev   │◄──►│  esbuild    │
│             │    │   Server    │    │  (转换器)   │
│ 原生 ESM    │    │             │    │             │
│ 按需加载    │    │ 请求拦截     │    │ 超快编译     │
│ HMR 支持    │    │ 路径重写     │    │ TS/JSX 支持  │
└─────────────┘    └─────────────┘    └─────────────┘

// 特点：
// - 无需打包，启动速度极快（冷启动 < 1s）
// - 按需编译，只处理当前访问的模块
// - esbuild 编译速度比 Babel 快 10-100 倍
```

#### 2.2 生产环境特点

```javascript
// 生产环境架构
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   源代码     │───►│   Rollup    │───►│  优化输出    │
│             │    │   构建器     │    │             │
│ TS/Vue/CSS  │    │             │    │ 压缩代码     │
│ 静态资源    │    │ Tree-shake  │    │ 代码分割     │
│ 第三方依赖   │    │ 代码分割     │    │ 资源优化     │
└─────────────┘    └─────────────┘    └─────────────┘

// 特点：
// - 使用 Rollup 进行生产优化
// - Tree-shaking 移除未使用代码
// - 代码分割和懒加载
// - 静态资源处理和压缩
```

### 3. 依赖预构建（Pre-bundling）

Vite 的依赖预构建是性能优化的核心机制：

#### 3.1 预构建原因

```javascript
// 问题：第三方依赖格式不统一
node_modules/
├── lodash/          (CommonJS 格式)
├── react/           (UMD 格式)
├── vue/             (多种格式混合)
└── antd/            (包含数百个子模块)

// 解决方案：预构建转换
.vite/deps/
├── lodash.js        (转换为 ESM)
├── react.js         (转换为 ESM)
├── vue.js           (转换为 ESM)
└── antd.js          (合并为单个 ESM)
```

#### 3.2 预构建流程

```javascript
// 1. 扫描阶段 - 发现依赖
import { debounce } from 'lodash'     // 发现 lodash 依赖
import { Button } from 'antd'         // 发现 antd 依赖

// 2. 预构建阶段 - 使用 esbuild
esbuild({
  entryPoints: ['lodash', 'antd'],
  bundle: true,
  format: 'esm',
  outdir: '.vite/deps'
})

// 3. 路径重写阶段
import { debounce } from 'lodash'
// ↓ 重写为
import { debounce } from '/@modules/lodash'

// 4. 缓存机制
// 基于 package-lock.json 和 vite.config.js 生成缓存 hash
// 依赖变化时自动重新预构建
```

#### 3.3 预构建配置

```javascript
// vite.config.js
export default {
  optimizeDeps: {
    // 强制预构建某些依赖
    include: ['lodash-es', 'date-fns'],
    
    // 排除某些依赖的预构建
    exclude: ['your-local-package'],
    
    // esbuild 选项
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
}
```

### 4. 热模块替换（HMR）

Vite 的 HMR 基于 ESM 实现精确更新：

#### 4.1 HMR 工作原理

```javascript
// 1. 文件监听
文件变化 → Vite 检测 → 分析依赖链 → 确定更新范围

// 2. WebSocket 通信
Vite Server ←─────→ Browser Client
    │                    │
    ├─ 发送更新通知        │
    ├─ 发送新模块代码      │
    └─ 发送 HMR 指令      │

// 3. 模块热替换
旧模块 → 卸载 → 新模块 → 重新执行 → 状态保持
```

#### 4.2 HMR API 详解

```javascript
// 基础 HMR API
if (import.meta.hot) {
  // 接受自身更新
  import.meta.hot.accept((newModule) => {
    // 更新逻辑
    console.log('模块已更新:', newModule)
  })
  
  // 接受依赖更新
  import.meta.hot.accept('./dependency.js', (newDep) => {
    // 处理依赖更新
    updateDependency(newDep)
  })
  
  // 模块卸载时的清理
  import.meta.hot.dispose((data) => {
    // 保存状态到 data
    data.state = currentState
    // 清理副作用
    clearTimeout(timer)
  })
  
  // 获取上次的数据
  if (import.meta.hot.data.state) {
    currentState = import.meta.hot.data.state
  }
}
```

#### 4.3 框架集成示例

```javascript
// Vue SFC HMR
// 组件更新时保持状态
<template>
  <div>{{ count }}</div>
  <button @click="increment">+</button>
</template>

<script>
export default {
  data() {
    return { count: 0 }
  },
  methods: {
    increment() { this.count++ }
  }
}

// 模板更新 → 重新渲染，状态保持
// 脚本更新 → 重新实例化，状态重置
// 样式更新 → 直接替换，无需重新渲染
</script>

// React Fast Refresh
function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <span>{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  )
}

// 组件更新时：
// - 保持 Hook 状态
// - 保持组件树结构
// - 只更新变化的部分
```

#### 4.4 HMR 边界和传播

```javascript
// HMR 更新传播机制
A.js (接受更新) ←─ B.js ←─ C.js (文件变化)
  │
  └─ 更新停止，不向上传播

A.js (不接受) ←─ B.js ←─ C.js (文件变化)
  │                │
  └─ 向上传播 ←─────┘
  
// 如果没有模块接受更新 → 页面刷新

// 设置 HMR 边界
if (import.meta.hot) {
  import.meta.hot.accept() // 接受自身更新，阻止向上传播
}
```

---

## 工作原理

### 开发时原理

1. **启动开发服务器**
   ```
   客户端请求 → Vite 开发服务器 → 实时编译 → 返回转换后的代码
   ```

2. **模块解析流程**
   ```
   浏览器请求 /src/main.js
   ↓
   Vite 拦截请求
   ↓
   检查是否需要转换（TypeScript、Vue SFC 等）
   ↓
   使用 esbuild 快速转换
   ↓
   返回 ES 模块代码
   ```

3. **依赖处理**
   ```
   import vue from 'vue'
   ↓
   重写为: import vue from '/@modules/vue'
   ↓
   从预构建缓存返回
   ```

### 构建时原理

1. **使用 Rollup**
   - Tree-shaking 移除死代码
   - 代码分割和懒加载
   - 资源优化和压缩

2. **构建流程**
   ```
   源代码分析 → 依赖图构建 → 模块打包 → 资源优化 → 输出文件
   ```

### 核心架构

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│   浏览器         │◄──►│   Vite 服务器  │◄──►│   文件系统   │
│                 │    │              │    │             │
│ - ES 模块加载    │    │ - 请求拦截    │    │ - 源代码     │
│ - HMR 客户端     │    │ - 实时编译    │    │ - 依赖       │
│ - 开发工具       │    │ - 依赖预构建  │    │ - 静态资源   │
└─────────────────┘    └──────────────┘    └─────────────┘
```

---

## 快速开始

### 1. 创建项目

```bash
# npm
npm create vite@latest my-project

# yarn
yarn create vite my-project

# pnpm
pnpm create vite my-project

# 指定模板
npm create vite@latest my-project -- --template react
npm create vite@latest my-project -- --template vue
npm create vite@latest my-project -- --template svelte
```

### 2. 可用模板

| 模板 | JavaScript | TypeScript |
|------|------------|------------|
| Vanilla | `vanilla` | `vanilla-ts` |
| Vue | `vue` | `vue-ts` |
| React | `react` | `react-ts` |
| Preact | `preact` | `preact-ts` |
| Lit | `lit` | `lit-ts` |
| Svelte | `svelte` | `svelte-ts` |

### 3. 启动开发

```bash
cd my-project
npm install
npm run dev
```

### 4. 基本命令

```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 类型检查（TypeScript 项目）
npm run type-check
```

---

## 项目结构

### 典型项目结构

```
my-vite-project/
├── public/                 # 静态资源目录
│   ├── favicon.ico
│   └── robots.txt
├── src/                    # 源代码目录
│   ├── assets/            # 资源文件
│   │   ├── images/
│   │   └── styles/
│   ├── components/        # 组件
│   ├── utils/             # 工具函数
│   ├── types/             # 类型定义
│   ├── App.vue            # 根组件
│   └── main.ts            # 入口文件
├── index.html             # HTML 模板
├── vite.config.ts         # Vite 配置文件
├── tsconfig.json          # TypeScript 配置
├── package.json           # 项目配置
└── README.md
```

### 入口文件

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vite App</title>
</head>
<body>
  <div id="app"></div>
  <!-- 注意：直接引用 TypeScript 文件 -->
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

---

## 配置详解

### 基本配置文件

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  // 插件配置
  plugins: [vue()],
  
  // 开发服务器选项
  server: {
    port: 3000,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  
  // 构建选项
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      input: 'index.html',
      output: {
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: '[ext]/[name]-[hash].[ext]'
      }
    }
  },
  
  // 路径解析
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils')
    }
  },
  
  // CSS 相关
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/styles/variables.scss";'
      }
    },
    modules: {
      localsConvention: 'camelCase'
    }
  },
  
  // 环境变量
  envPrefix: 'VITE_',
  
  // 依赖优化
  optimizeDeps: {
    include: ['vue', 'axios'],
    exclude: ['@vueuse/core']
  }
})
```

### 条件配置

```typescript
// 基于环境的配置
export default defineConfig(({ command, mode }) => {
  const config = {
    plugins: [vue()],
    // 通用配置
  }
  
  if (command === 'serve') {
    // 开发环境配置
    config.server = {
      port: 3000
    }
  } else {
    // 构建环境配置
    config.build = {
      minify: 'terser'
    }
  }
  
  return config
})
```

### 配置选项详解

#### 服务器配置

```typescript
interface ServerOptions {
  host?: string | boolean        // 指定服务器主机名
  port?: number                  // 指定开发服务器端口
  strictPort?: boolean          // 端口被占用时退出
  https?: boolean | object      // 启用 TLS + HTTP/2
  open?: boolean | string       // 启动时自动打开浏览器
  proxy?: Record<string, any>   // 代理配置
  cors?: boolean | CorsOptions  // CORS 配置
  headers?: OutgoingHttpHeaders // 响应头
  hmr?: boolean | object        // HMR 配置
  watch?: object                // 文件监听配置
  middlewareMode?: boolean      // 中间件模式
  fs?: object                   // 文件系统配置
}
```

#### 构建配置

```typescript
interface BuildOptions {
  target?: string               // 浏览器兼容性目标
  outDir?: string              // 输出目录
  assetsDir?: string           // 静态资源目录
  assetsInlineLimit?: number   // 内联资源大小限制
  cssCodeSplit?: boolean       // CSS 代码分割
  cssTarget?: string           // CSS 兼容性目标
  sourcemap?: boolean          // 生成 sourcemap
  minify?: boolean | string    // 压缩器
  terserOptions?: object       // Terser 选项
  write?: boolean              // 写入文件系统
  emptyOutDir?: boolean        // 构建前清空输出目录
  rollupOptions?: object       // Rollup 选项
  lib?: object                 // 库模式
  manifest?: boolean           // 生成 manifest.json
  ssrManifest?: boolean        // 生成 SSR manifest
  reportCompressedSize?: boolean // 报告压缩大小
  chunkSizeWarningLimit?: number // chunk 大小警告限制
}
```

---

## 插件系统

### 官方插件

#### @vitejs/plugin-vue

```typescript
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      include: [/\.vue$/],           // 包含的文件
      exclude: [],                   // 排除的文件
      reactivityTransform: true,     // 响应式语法糖
      script: {
        defineModel: true,           // 启用 defineModel
        propsDestructure: true       // 启用 props 解构
      },
      template: {
        transformAssetUrls: {        // 资源路径转换
          img: ['src'],
          image: ['xlink:href']
        }
      }
    })
  ]
})
```

#### @vitejs/plugin-react

```typescript
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      include: "**/*.{jsx,tsx}",     // 包含的文件
      exclude: /node_modules/,       // 排除的文件
      jsxImportSource: '@emotion/react', // JSX 运行时
      jsxRuntime: 'automatic',       // JSX 转换
      babel: {                       // Babel 配置
        plugins: ['babel-plugin-styled-components']
      }
    })
  ]
})
```

### 常用社区插件

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// 自动导入
import AutoImport from 'unplugin-auto-import/vite'
// 组件自动导入
import Components from 'unplugin-vue-components/vite'
// PWA
import { VitePWA } from 'vite-plugin-pwa'
// ESLint
import eslint from 'vite-plugin-eslint'
// Mock
import { viteMockServe } from 'vite-plugin-mock'

export default defineConfig({
  plugins: [
    vue(),
    
    // 自动导入 API
    AutoImport({
      imports: ['vue', 'vue-router'],
      dts: true, // 生成类型定义文件
      eslintrc: {
        enabled: true
      }
    }),
    
    // 自动导入组件
    Components({
      dirs: ['src/components'],
      extensions: ['vue'],
      dts: true
    }),
    
    // ESLint 集成
    eslint({
      include: ['src/**/*.{js,ts,vue}'],
      exclude: ['node_modules']
    }),
    
    // PWA 支持
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    }),
    
    // Mock 服务
    viteMockServe({
      mockPath: 'mock',
      localEnabled: command === 'serve',
      prodEnabled: command !== 'serve' && prodMock,
      injectCode: `
        import { setupProdMockServer } from './mockProdServer';
        setupProdMockServer();
      `
    })
  ]
})
```

### 自定义插件

#### 简单插件示例

```typescript
// plugins/custom-plugin.ts
import type { Plugin } from 'vite'

export function customPlugin(): Plugin {
  return {
    name: 'custom-plugin',
    
    // 构建开始
    buildStart(opts) {
      console.log('构建开始')
    },
    
    // 解析模块
    resolveId(id) {
      if (id === 'virtual:my-module') {
        return id
      }
    },
    
    // 加载模块
    load(id) {
      if (id === 'virtual:my-module') {
        return 'export const msg = "Hello from virtual module"'
      }
    },
    
    // 转换代码
    transform(code, id) {
      if (id.endsWith('.special')) {
        return `export default ${JSON.stringify(code)}`
      }
    },
    
    // 生成文件
    generateBundle(opts, bundle) {
      this.emitFile({
        type: 'asset',
        fileName: 'custom.txt',
        source: 'Custom file content'
      })
    }
  }
}
```

#### 插件钩子生命周期

```typescript
// 通用钩子（Rollup）
buildStart     // 构建开始
resolveId      // 解析模块 ID
load          // 加载模块
transform     // 转换代码
buildEnd      // 构建结束
generateBundle // 生成包
writeBundle   // 写入包

// Vite 特有钩子
config        // 修改配置
configResolved // 配置解析完成
configureServer // 配置开发服务器
handleHotUpdate // 处理热更新
```

---

## 开发服务器

### 启动与配置

```bash
# 基本启动
npm run dev

# 指定端口
npm run dev -- --port 8080

# 指定主机
npm run dev -- --host 0.0.0.0

# 开启 HTTPS
npm run dev -- --https
```

### 服务器配置详解

```typescript
export default defineConfig({
  server: {
    // 基本配置
    host: '0.0.0.0',     // 监听所有地址
    port: 3000,          // 端口号
    strictPort: true,    // 端口被占用时退出
    open: true,          // 自动打开浏览器
    
    // HTTPS 配置
    https: {
      key: fs.readFileSync('path/to/key.pem'),
      cert: fs.readFileSync('path/to/cert.pem')
    },
    
    // 代理配置
    proxy: {
      // 字符串简写
      '/foo': 'http://localhost:4567',
      
      // 完整配置
      '/api': {
        target: 'http://jsonplaceholder.typicode.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      
      // 正则表达式
      '^/fallback/.*': {
        target: 'http://jsonplaceholder.typicode.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fallback/, '')
      },
      
      // WebSocket 代理
      '/socket.io': {
        target: 'ws://localhost:3001',
        ws: true
      }
    },
    
    // CORS 配置
    cors: {
      origin: ['http://localhost:3000', 'https://example.com'],
      credentials: true
    },
    
    // 自定义响应头
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
})
```

### 中间件配置

```typescript
export default defineConfig({
  server: {
    middlewareMode: 'ssr', // 或 'html'
  }
})

// 在 Express 中使用
const express = require('express')
const { createServer } = require('vite')

async function createExpressServer() {
  const app = express()
  
  const vite = await createServer({
    server: { middlewareMode: 'ssr' }
  })
  
  app.use(vite.middlewares)
  
  app.listen(3000)
}
```

---

## 构建打包

### 基本构建

```bash
# 生产构建
npm run build

# 构建并预览
npm run build && npm run preview

# 分析构建结果
npm run build -- --mode analyze

# 构建时指定环境
npm run build -- --mode production
npm run build -- --mode staging

# 监听模式构建（用于开发库）
npm run build -- --watch
```

### 构建配置详解

#### 基础配置选项

```typescript
export default defineConfig({
  build: {
    // ==================== 输出配置 ====================
    
    /** 
     * 输出目录
     * @default 'dist'
     * 相对于项目根目录的构建输出目录
     */
    outDir: 'dist',
    
    /** 
     * 静态资源目录
     * @default 'assets'  
     * 在输出目录下存放静态资源的子目录名
     * 最终路径: outDir/assetsDir/
     */
    assetsDir: 'assets',
    
    /** 
     * 构建前清空输出目录
     * @default true
     * 防止旧文件残留影响新构建
     */
    emptyOutDir: true,
    
    // ==================== 资源处理 ====================
    
    /** 
     * 内联资源大小限制（字节）
     * @default 4096 (4KB)
     * 小于此大小的资源会被内联为 base64 URL
     * 减少 HTTP 请求，但会增加 bundle 大小
     */
    assetsInlineLimit: 4096,
    
    /** 
     * 静态资源处理
     * 可以是数字（字节）或函数
     */
    assetsInlineLimit: (filePath, content) => {
      // 自定义内联逻辑
      if (filePath.includes('icons')) {
        return content.length < 8192 // 图标文件 8KB 以下内联
      }
      return content.length < 4096 // 其他文件 4KB 以下内联
    },
    
    // ==================== 代码分割 ====================
    
    /** 
     * CSS 代码分割
     * @default true
     * true: 每个异步 chunk 的 CSS 提取到独立文件
     * false: 所有 CSS 提取到一个文件
     */
    cssCodeSplit: true,
    
    /** 
     * 动态导入的 polyfill
     * @default true
     * 为不支持动态导入的浏览器提供 polyfill
     */
    dynamicImportVarsOptions: {
      warnOnError: true,
      exclude: [/node_modules/]
    },
    
    // ==================== 压缩与优化 ====================
    
    /** 
     * 代码压缩器
     * @default 'esbuild'
     * 'terser': 更小的输出，但构建较慢
     * 'esbuild': 更快的构建，输出稍大
     * false: 不压缩
     */
    minify: 'terser',
    
    /** 
     * Terser 压缩选项
     * 仅在 minify: 'terser' 时生效
     */
    terserOptions: {
      compress: {
        // 移除 console 语句
        drop_console: true,
        // 移除 debugger 语句  
        drop_debugger: true,
        // 移除未使用的函数
        unused: true,
        // 移除死代码
        dead_code: true,
        // 移除无效的代码
        side_effects: false
      },
      mangle: {
        // 混淆变量名
        properties: {
          // 混淆属性名（谨慎使用）
          regex: /^_/
        }
      },
      format: {
        // 移除注释
        comments: false
      }
    },
    
    /** 
     * esbuild 压缩选项
     * 仅在 minify: 'esbuild' 时生效
     */
    esbuildOptions: {
      drop: ['console', 'debugger'],
      legalComments: 'none'
    },
    
    // ==================== 调试与分析 ====================
    
    /** 
     * 生成 sourcemap
     * @default false
     * true: 生成 .map 文件
     * 'inline': 内联到文件中
     * 'hidden': 生成但不在文件中引用
     */
    sourcemap: true, // 或 'inline' | 'hidden'
    
    /** 
     * 报告压缩后大小
     * @default true
     * 构建时显示 gzip 压缩后的文件大小
     * 大型项目可设为 false 加快构建
     */
    reportCompressedSize: false,
    
    /** 
     * chunk 大小警告限制（KB）
     * @default 500
     * 超过此大小会显示警告
     */
    chunkSizeWarningLimit: 500,
    
    // ==================== 目标与兼容性 ====================
    
    /** 
     * 构建目标
     * @default 'modules'
     * 'modules': 支持原生 ES 模块的浏览器
     * 'esnext': 最新 ES 特性
     * ['es2015', 'safari11']: 多目标构建
     */
    target: 'modules', // 或 'es2015' | 'es2017' | 'es2018' | 'es2019' | 'es2020' | 'esnext'
    
    /** 
     * 多目标构建
     * 为不同浏览器生成不同的 bundle
     */
    target: ['es2015', 'safari11'],
    
    // ==================== 高级选项 ====================
    
    /** 
     * 构建时的 polyfill 注入
     * @default true
     */
    polyfillModulePreload: true,
    
    /** 
     * 模块预加载的 polyfill
     * 为不支持 modulepreload 的浏览器提供支持
     */
    modulePreload: {
      polyfill: true,
      resolveDependencies: (filename, deps) => {
        // 自定义依赖解析逻辑
        return deps.filter(dep => !dep.includes('chunk-'))
      }
    },
    
    /** 
     * 实验性功能：CSS 文件名哈希
     * @default false
     */
    cssMinify: true, // 或 'esbuild' | 'lightningcss'
    
    // ==================== Rollup 配置 ====================
    
    rollupOptions: {
      // 输入配置
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
        mobile: resolve(__dirname, 'mobile/index.html')
      },
      
      // 外部依赖（不打包的依赖）
      external: ['vue', 'react', 'lodash'],
      
      // 输出配置
      output: {
        // ==================== 手动分包策略 ====================
        
        /** 
         * 手动分包配置
         * 将特定模块分离到独立的 chunk
         */
        manualChunks: {
          // 基础框架
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // 工具库
          'utils': ['lodash', 'dayjs', 'axios'],
          
          // UI 组件库
          'ui-vendor': ['element-plus', 'ant-design-vue'],
          
          // 图表库
          'charts': ['echarts', 'chart.js', 'd3']
        },
        
        /** 
         * 动态分包函数
         * 更灵活的分包策略
         */
        manualChunks: (id) => {
          // 第三方依赖
          if (id.includes('node_modules')) {
            // 大型库独立分包
            if (id.includes('echarts')) return 'echarts'
            if (id.includes('element-plus')) return 'element-plus'
            if (id.includes('ant-design-vue')) return 'antd'
            
            // 小型工具库合并
            if (id.includes('lodash') || id.includes('dayjs')) return 'utils'
            
            // 其他第三方库
            return 'vendor'
          }
          
          // 业务代码按目录分包
          if (id.includes('/src/components/')) return 'components'
          if (id.includes('/src/utils/')) return 'utils'
          if (id.includes('/src/views/admin/')) return 'admin'
        },
        
        // ==================== 文件命名策略 ====================
        
        /** 
         * 入口文件命名
         * [name]: 入口名称
         * [hash]: 基于内容的哈希
         * [format]: 输出格式 (es, cjs, umd, iife)
         */
        entryFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId?.includes('admin')) {
            return 'admin/[name].[hash].js'
          }
          return 'js/[name].[hash].js'
        },
        
        /** 
         * 代码块文件命名
         * 用于懒加载和分包的 chunk
         */
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          
          // 按功能模块分目录
          if (facadeModuleId?.includes('/admin/')) {
            return 'js/admin/[name].[hash].js'
          }
          if (facadeModuleId?.includes('/mobile/')) {
            return 'js/mobile/[name].[hash].js'
          }
          
          return 'js/chunks/[name].[hash].js'
        },
        
        /** 
         * 静态资源文件命名
         * 处理图片、字体、CSS 等资源
         */
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const extType = info[info.length - 1].toLowerCase()
          
          // 图片资源
          if (/^(png|jpe?g|gif|svg|ico|webp|avif)$/i.test(extType)) {
            return `images/[name].[hash][extname]`
          }
          
          // 视频音频
          if (/^(mp4|webm|ogg|mp3|wav|flac|aac|m4a)$/i.test(extType)) {
            return `media/[name].[hash][extname]`
          }
          
          // 字体文件
          if (/^(woff2?|eot|ttf|otf)$/i.test(extType)) {
            return `fonts/[name].[hash][extname]`
          }
          
          // CSS 文件
          if (extType === 'css') {
            // 按来源分目录
            if (assetInfo.name?.includes('vendor')) {
              return `styles/vendor/[name].[hash][extname]`
            }
            return `styles/[name].[hash][extname]`
          }
          
          // 其他文件
          return `assets/[name].[hash][extname]`
        },
        
        // ==================== 输出格式配置 ====================
        
        /** 
         * 输出格式
         * 'es': ES 模块
         * 'cjs': CommonJS
         * 'umd': UMD 格式
         * 'iife': 立即执行函数
         */
        format: 'es',
        
        /** 
         * 全局变量名（UMD/IIFE 格式需要）
         */
        name: 'MyApp',
        
        /** 
         * 外部依赖的全局变量映射
         * 用于 UMD 格式
         */
        globals: {
          vue: 'Vue',
          react: 'React',
          'react-dom': 'ReactDOM',
          lodash: '_',
          axios: 'axios'
        },
        
        // ==================== 高级输出选项 ====================
        
        /** 
         * 代码分割时的导入函数名
         * @default 'import'
         */
        dynamicImportFunction: 'import',
        
        /** 
         * 是否保留模块结构
         * @default false
         */
        preserveModules: false,
        
        /** 
         * 保留模块时的根目录
         */
        preserveModulesRoot: 'src',
        
        /** 
         * 输出时的缩进
         * @default true
         */
        indent: '  ', // 或 false | true
        
        /** 
         * 是否生成 sourcemap
         * 会覆盖顶层的 sourcemap 配置
         */
        sourcemap: true,
        
        /** 
         * sourcemap 文件的基础路径
         */
        sourcemapBaseUrl: 'https://cdn.example.com/',
        
        /** 
         * 是否在文件中包含 sourcemap 引用
         * @default true
         */
        sourcemapExcludeSources: false
      },
      
      // ==================== 插件配置 ====================
      
      plugins: [
        // Rollup 插件（仅构建时使用）
        // 注意：这些插件只在构建时生效，不影响开发服务器
      ],
      
      // ==================== 监听选项 ====================
      
      watch: {
        // 监听的文件/目录
        include: 'src/**',
        exclude: 'node_modules/**',
        
        // 监听选项
        buildDelay: 100,
        chokidar: {
          usePolling: false,
          interval: 100
        }
      }
    }
  }
})
```

#### 环境特定配置

```typescript
// 根据环境调整构建配置
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  const isStaging = mode === 'staging'
  const isDevelopment = command === 'serve'
  
  return {
    build: {
      // 开发构建：快速构建，保留调试信息
      ...(isDevelopment && {
        minify: 'esbuild',
        sourcemap: true,
        reportCompressedSize: false
      }),
      
      // 预发布环境：平衡性能和调试
      ...(isStaging && {
        minify: 'terser',
        sourcemap: 'hidden',
        terserOptions: {
          compress: {
            drop_console: false, // 保留 console
            drop_debugger: true
          }
        }
      }),
      
      // 生产环境：最大优化
      ...(isProduction && {
        minify: 'terser',
        sourcemap: false,
        reportCompressedSize: true,
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info']
          }
        }
      })
    }
  }
})
```

### 库模式构建

```typescript
// 构建库
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MyLib',
      fileName: (format) => `my-lib.${format}.js`,
      formats: ['es', 'cjs', 'umd', 'iife']
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})
```

### 多页面应用

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about/index.html'),
        contact: resolve(__dirname, 'contact/index.html')
      }
    }
  }
})
```

### 构建分析

```bash
# 安装分析工具
npm install --save-dev rollup-plugin-visualizer

# 配置插件
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
})
```

---

## 静态资源处理

### 资源导入

```typescript
// 显式 URL 导入
import imgUrl from './img.png'
document.getElementById('hero-img').src = imgUrl

// 内联资源
import imgInline from './img.png?inline'

// 原始资源
import imgRaw from './shader.glsl?raw'

// URL 资源
import imgUrl from './img.png?url'

// Worker 资源
import Worker from './worker.js?worker'
const worker = new Worker()
```

### 资源处理选项

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    // 内联资源大小限制
    assetsInlineLimit: 4096, // 4kb
    
    // 自定义资源文件名
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const extType = info[info.length - 1]
          
          if (/\.(png|jpe?g|gif|svg|ico|webp)(\?.*)?$/i.test(assetInfo.name)) {
            return `images/[name].[hash][extname]`
          }
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
            return `media/[name].[hash][extname]`
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            return `fonts/[name].[hash][extname]`
          }
          
          return `assets/[name].[hash][extname]`
        }
      }
    }
  }
})
```

### public 目录

```
public/
├── favicon.ico       # http://localhost:3000/favicon.ico
├── robots.txt        # http://localhost:3000/robots.txt
└── images/
    └── logo.png      # http://localhost:3000/images/logo.png
```

```html
<!-- 引用 public 资源 -->
<img src="/images/logo.png" alt="Logo">

<!-- 在 JavaScript 中 -->
<script>
// 开发环境和生产环境都可用
const logoUrl = '/images/logo.png'
</script>
```

### 动态资源导入

```typescript
// 动态导入图片
async function loadImage(name: string) {
  const modules = import.meta.glob('./assets/images/*.png')
  const mod = await modules[`./assets/images/${name}.png`]()
  return mod.default
}

// 批量导入
const modules = import.meta.glob('./assets/images/*.png', { eager: true })
const images = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => {
    const name = path.split('/').pop()?.replace('.png', '')
    return [name, mod.default]
  })
)
```

---

## 环境变量

### 环境文件

```bash
.env                # 所有环境加载
.env.local          # 所有环境加载，但被 git 忽略
.env.[mode]         # 指定模式下加载
.env.[mode].local   # 指定模式下加载，但被 git 忽略
```

### 环境变量文件示例

```bash
# .env
VITE_APP_TITLE=My App
VITE_API_URL=https://api.example.com

# .env.development
VITE_API_URL=http://localhost:3000/api
VITE_DEBUG=true

# .env.production
VITE_API_URL=https://prod-api.example.com
VITE_DEBUG=false

# .env.staging
VITE_API_URL=https://staging-api.example.com
```

### 在代码中使用

```typescript
// 环境变量类型定义
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_URL: string
  readonly VITE_DEBUG: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 使用环境变量
console.log(import.meta.env.VITE_APP_TITLE)
console.log(import.meta.env.VITE_API_URL)
console.log(import.meta.env.MODE) // 'development' | 'production'
console.log(import.meta.env.DEV)  // boolean
console.log(import.meta.env.PROD) // boolean

// 带默认值的环境变量
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
```

### 配置环境变量前缀

```typescript
// vite.config.ts
export default defineConfig({
  envPrefix: 'APP_', // 默认是 'VITE_'
})
```

### 模式与环境

```bash
# 开发模式
npm run dev                    # mode: development
npm run dev -- --mode staging # mode: staging

# 构建模式
npm run build                     # mode: production
npm run build -- --mode staging  # mode: staging
```

---

## TypeScript 支持

### 基本配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    
    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    
    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/utils/*": ["src/utils/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Vite 类型扩展

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_URL: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 声明模块类型
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.md' {
  const content: string
  export default content
}

declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.png' {
  const src: string
  export default src
}
```

### 客户端类型

```typescript
// 热更新 API
if (import.meta.hot) {
  import.meta.hot.accept()
  import.meta.hot.dispose(() => {
    // 清理逻辑
  })
}

// 环境变量
import.meta.env.MODE
import.meta.env.DEV
import.meta.env.PROD

// 动态导入
import.meta.glob('./modules/*.ts')
import.meta.globEager('./modules/*.ts')

// URL 构造
new URL('./worker.js', import.meta.url)
```

### 类型检查

```bash
# 安装类型检查工具
npm install --save-dev typescript

# package.json 脚本
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch"
  }
}

# 运行类型检查
npm run type-check
```

---

## CSS 处理

### CSS 预处理器

```bash
# 安装预处理器
npm install -D sass              # Sass/SCSS
npm install -D less              # Less
npm install -D stylus            # Stylus
```

```typescript
// vite.config.ts
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "@/styles/variables.scss";'
      },
      less: {
        modifyVars: {
          'primary-color': '#1890ff'
        },
        javascriptEnabled: true
      },
      stylus: {
        define: {
          $specialColor: new stylus.nodes.RGBA(51, 197, 255, 1)
        }
      }
    }
  }
})
```

### CSS Modules

```typescript
// 开启 CSS Modules
export default defineConfig({
  css: {
    modules: {
      localsConvention: 'camelCase', // 类名转换
      scopeBehaviour: 'local',       // 作用域行为
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    }
  }
})
```

```css
/* styles.module.css */
.button {
  background: blue;
  color: white;
}

.buttonPrimary {
  background: green;
}
```

```typescript
// 使用 CSS Modules
import styles from './styles.module.css'

// styles.button -> 'button__button___2J_zZ'
// styles.buttonPrimary -> 'button__buttonPrimary___1X_aQ'
```

### PostCSS

```bash
# 安装 PostCSS 插件
npm install -D autoprefixer postcss-preset-env
```

```javascript
// postcss.config.js
export default {
  plugins: {
    autoprefixer: {},
    'postcss-preset-env': {
      stage: 0
    }
  }
}
```

### CSS 框架集成

#### Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
```

```css
/* src/style.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### UnoCSS

```bash
npm install -D unocss
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  plugins: [
    UnoCSS({
      // 配置选项
    })
  ]
})
```

### CSS-in-JS

#### Styled Components

```bash
npm install styled-components
npm install -D @types/styled-components
```

```typescript
import styled from 'styled-components'

const Button = styled.button`
  background: ${props => props.primary ? 'blue' : 'white'};
  color: ${props => props.primary ? 'white' : 'blue'};
  padding: 12px 24px;
  border: 2px solid blue;
  border-radius: 4px;
`
```

#### Emotion

```bash
npm install @emotion/react @emotion/styled
```

```typescript
import { css } from '@emotion/react'
import styled from '@emotion/styled'

const style = css`
  color: hotpink;
  &:hover {
    color: darkred;
  }
`

const Button = styled.button`
  background: papayawhip;
  color: palevioletred;
`
```

---

## 依赖预构建

### 原理解析

Vite 使用 esbuild 预构建依赖，将 CommonJS 和 UMD 模块转换为 ESM：

```
node_modules/lodash (CommonJS)
    ↓ esbuild 转换
.vite/deps/lodash.js (ESM)
```

### 预构建配置

```typescript
export default defineConfig({
  optimizeDeps: {
    // 强制包含的依赖
    include: [
      'vue',
      'axios',
      'lodash-es',
      '@vueuse/core'
    ],
    
    // 排除的依赖
    exclude: [
      'your-local-package'
    ],
    
    // 预构建选项
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      plugins: [
        // esbuild 插件
      ]
    },
    
    // 强制重新预构建
    force: false
  }
})
```

### 预构建缓存

```bash
# 缓存位置
node_modules/.vite/deps/
├── _metadata.json       # 依赖元数据
├── vue.js              # 预构建的 Vue
├── axios.js            # 预构建的 Axios
└── ...

# 清除缓存
rm -rf node_modules/.vite
# 或
npx vite --force
```

### 依赖发现

```typescript
// 自动发现
import { ref } from 'vue'          // 自动添加到预构建
import axios from 'axios'          // 自动添加到预构建

// 动态导入
const { default: lodash } = await import('lodash') // 可能需要手动包含

// 手动包含动态依赖
export default defineConfig({
  optimizeDeps: {
    include: ['lodash'] // 手动包含动态导入的依赖
  }
})
```

### 条件导入

```typescript
// 某些包需要特殊处理
export default defineConfig({
  optimizeDeps: {
    include: [
      // 包含特定的子路径
      'some-package/sub-module',
      
      // 包含条件导入
      'package > sub-package'
    ]
  }
})
```

---

## 热更新机制

### HMR 原理

1. **文件监听**：Vite 监听源文件变化
2. **模块图分析**：分析模块依赖关系
3. **精确更新**：只更新变化的模块
4. **状态保持**：保持应用状态

```
文件变化 → 模块分析 → 生成更新 → 发送到客户端 → 应用更新
```

### HMR API

```typescript
// 接受自身更新
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    // 使用新模块更新应用
    updateComponent(newModule)
  })
}

// 接受依赖更新
if (import.meta.hot) {
  import.meta.hot.accept('./dependency.js', (newDep) => {
    // 依赖更新时的处理
  })
}

// 处理失效
if (import.meta.hot) {
  import.meta.hot.dispose((data) => {
    // 清理当前模块
    data.cleanup = performCleanup
  })
}

// 数据传递
if (import.meta.hot) {
  if (import.meta.hot.data.count) {
    // 使用之前的数据
    count = import.meta.hot.data.count
  }
  
  import.meta.hot.dispose((data) => {
    // 保存数据到下次更新
    data.count = count
  })
}
```

### 框架 HMR 集成

#### Vue HMR

```vue
<template>
  <div>{{ count }}</div>
  <button @click="increment">+</button>
</template>

<script setup>
import { ref } from 'vue'

// 热更新时状态会保持
const count = ref(0)

const increment = () => {
  count.value++
}

// Vue 组件自动支持 HMR
</script>
```

#### React HMR

```typescript
// 需要额外配置
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // 启用 Fast Refresh
      fastRefresh: true
    })
  ]
})
```

### HMR 配置

```typescript
export default defineConfig({
  server: {
    hmr: {
      port: 24678,          // HMR 端口
      host: 'localhost',    // HMR 主机
      clientPort: 3001,     // 客户端端口
      overlay: true         // 错误覆盖层
    }
  }
})

// 禁用 HMR
export default defineConfig({
  server: {
    hmr: false
  }
})
```

### 自定义 HMR

```typescript
// 创建自定义 HMR 处理
function createHMRHandler() {
  let state = {}
  
  if (import.meta.hot) {
    // 加载保存的状态
    if (import.meta.hot.data.state) {
      state = import.meta.hot.data.state
    }
    
    // 接受更新
    import.meta.hot.accept((newModule) => {
      // 使用新模块和保存的状态
      newModule.render(state)
    })
    
    // 保存状态
    import.meta.hot.dispose((data) => {
      data.state = state
    })
  }
  
  return {
    updateState: (newState) => {
      state = { ...state, ...newState }
    }
  }
}
```

---

## 性能优化

### 开发性能优化

#### 1. 依赖优化

```typescript
export default defineConfig({
  optimizeDeps: {
    // 预构建大型依赖
    include: [
      'lodash-es',
      '@ant-design/icons',
      'echarts'
    ],
    
    // 排除不需要预构建的包
    exclude: [
      'your-local-package'
    ]
  }
})
```

#### 2. 文件监听优化

```typescript
export default defineConfig({
  server: {
    watch: {
      // 忽略大型目录
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**'
      ]
    }
  }
})
```

#### 3. 源码映射优化

```typescript
export default defineConfig({
  build: {
    // 开发时使用 cheap-module-eval-source-map
    sourcemap: process.env.NODE_ENV === 'development'
  }
})
```

### 构建性能优化

#### 1. 代码分割

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 第三方库分包
          vendor: ['vue', 'vue-router'],
          utils: ['lodash', 'axios', 'dayjs'],
          ui: ['ant-design-vue', '@ant-design/icons']
        }
      }
    }
  }
})

// 动态分包
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 将 node_modules 中的包打包到 vendor 中
          if (id.includes('node_modules')) {
            return 'vendor'
          }
          
          // 将组件打包到单独的 chunk
          if (id.includes('/src/components/')) {
            return 'components'
          }
        }
      }
    }
  }
})
```

#### 2. 压缩优化

```typescript
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,    // 移除 console
        drop_debugger: true,   // 移除 debugger
        pure_funcs: ['console.log'] // 移除特定函数
      },
      mangle: {
        safari10: true
      }
    }
  }
})
```

#### 3. 并行处理

```bash
# 使用更多 CPU 核心
npm run build -- --max-parallel 8
```

### 运行时性能优化

#### 1. 懒加载

```typescript
// 路由懒加载
const routes = [
  {
    path: '/home',
    component: () => import('./views/Home.vue')
  },
  {
    path: '/about',
    component: () => import('./views/About.vue')
  }
]

// 组件懒加载
import { defineAsyncComponent } from 'vue'

const AsyncComponent = defineAsyncComponent(() =>
  import('./components/HeavyComponent.vue')
)
```

#### 2. 预加载

```typescript
// 预加载关键资源
const criticalChunks = [
  () => import('./views/Home.vue'),
  () => import('./utils/api.ts')
]

// 空闲时预加载
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    criticalChunks.forEach(chunk => chunk())
  })
}
```

#### 3. 资源优化

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // 分离 CSS
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'css/[name].[hash].css'
          }
          return 'assets/[name].[hash][extname]'
        }
      }
    }
  }
})
```

### 性能监控

```typescript
// 构建分析
import { defineConfig } from 'vite'
import { Bundle } from 'rollup'

export default defineConfig({
  plugins: [
    {
      name: 'build-analyzer',
      generateBundle(options, bundle) {
        // 分析构建结果
        const stats = {}
        for (const [fileName, chunk] of Object.entries(bundle)) {
          if (chunk.type === 'chunk') {
            stats[fileName] = {
              size: chunk.code.length,
              modules: Object.keys(chunk.modules).length
            }
          }
        }
        console.table(stats)
      }
    }
  ]
})
```

---

## 部署策略

### 静态部署

#### 1. 基本构建

```bash
# 构建
npm run build

# 构建结果
dist/
├── index.html
├── assets/
│   ├── index.js
│   ├── index.css
│   └── logo.png
└── favicon.ico
```

#### 2. 基础路径配置

```typescript
// vite.config.ts
export default defineConfig({
  base: '/my-app/', // 部署到子路径
  
  // 或使用环境变量
  base: process.env.NODE_ENV === 'production' ? '/my-app/' : '/',
  
  // 相对路径（适用于不确定部署路径的情况）
  base: './',
})
```

#### 3. 常见部署平台

##### Netlify

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

##### Vercel

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

##### GitHub Pages

```bash
# 部署脚本
#!/usr/bin/env sh
set -e

npm run build
cd dist

git init
git add -A
git commit -m 'deploy'
git push -f git@github.com:username/repo.git main:gh-pages

cd -
```

#### 4. Docker 部署

```dockerfile
# Dockerfile
FROM node:16-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location /assets/ {
        root /usr/share/nginx/html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### SSR 部署

#### 1. Vite SSR 配置

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    ssr: 'src/entry-server.ts'
  }
})
```

#### 2. 服务端入口

```typescript
// src/entry-server.ts
import { renderToString } from 'vue/server-renderer'
import { createApp } from './main'

export async function render(url: string, manifest: any) {
  const { app, router } = createApp()
  
  await router.push(url)
  await router.isReady()
  
  const html = await renderToString(app)
  
  return {
    html,
    preloadLinks: renderPreloadLinks(manifest)
  }
}
```

#### 3. Express 服务器

```typescript
// server.js
import express from 'express'
import { createServer as createViteServer } from 'vite'

async function createServer() {
  const app = express()
  
  // 创建 Vite 服务器
  const vite = await createViteServer({
    server: { middlewareMode: 'ssr' }
  })
  
  app.use(vite.middlewares)
  
  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl
      
      // 获取 index.html
      let template = fs.readFileSync(
        path.resolve(__dirname, 'index.html'),
        'utf-8'
      )
      
      // 应用 Vite HTML 转换
      template = await vite.transformIndexHtml(url, template)
      
      // 加载服务端入口
      const { render } = await vite.ssrLoadModule('/src/entry-server.ts')
      
      // 渲染应用
      const { html } = await render(url, {})
      
      // 注入渲染后的 HTML
      const finalHtml = template.replace('<!--ssr-outlet-->', html)
      
      res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml)
    } catch (e) {
      vite.ssrFixStacktrace(e)
      res.status(500).end(e.stack)
    }
  })
  
  app.listen(3000)
}

createServer()
```

### 性能优化部署

#### 1. 资源压缩

```typescript
export default defineConfig({
  build: {
    // 启用 gzip 压缩
    rollupOptions: {
      plugins: [
        // 可以使用 rollup-plugin-gzip
      ]
    }
  }
})
```

#### 2. HTTP/2 服务器推送

```html
<!-- 预加载关键资源 -->
<link rel="preload" href="/assets/main.js" as="script">
<link rel="preload" href="/assets/main.css" as="style">
```

#### 3. CDN 配置

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['vue', 'vue-router'],
      output: {
        globals: {
          vue: 'Vue',
          'vue-router': 'VueRouter'
        }
      }
    }
  }
})
```

```html
<!-- 使用 CDN -->
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<script src="https://unpkg.com/vue-router@4/dist/vue-router.global.js"></script>
```

---

## 常见问题与解决方案

### 1. 依赖问题

#### CommonJS 依赖处理

```typescript
// 错误：Cannot use import statement outside a module
// 解决：预构建依赖
export default defineConfig({
  optimizeDeps: {
    include: ['problematic-package']
  }
})

// 或者使用动态导入
const pkg = await import('problematic-package')
```

#### 依赖版本冲突

```bash
# 检查依赖冲突
npm ls

# 解决版本冲突
npm install package@specific-version

# 使用 resolutions (package.json)
{
  "resolutions": {
    "problematic-package": "1.2.3"
  }
}
```

### 2. 路径问题

#### 别名配置不生效

```typescript
// 确保 TypeScript 配置同步
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}

// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})
```

#### 动态导入路径问题

```typescript
// 错误：动态路径不会被处理
const module = await import(`./modules/${name}.js`)

// 正确：使用 import.meta.glob
const modules = import.meta.glob('./modules/*.js')
const module = await modules[`./modules/${name}.js`]()
```

### 3. 构建问题

#### 内存不足

```bash
# 增加 Node.js 内存限制
node --max-old-space-size=8192 node_modules/vite/bin/vite.js build

# 或在 package.json 中
{
  "scripts": {
    "build": "node --max-old-space-size=8192 node_modules/vite/bin/vite.js build"
  }
}
```

#### 构建产物过大

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 分离大型依赖
          'vendor-ui': ['ant-design-vue'],
          'vendor-utils': ['lodash', 'dayjs'],
          'vendor-charts': ['echarts']
        }
      }
    }
  }
})
```

### 4. 环境变量问题

#### 环境变量不生效

```bash
# 确保变量名以 VITE_ 开头
VITE_API_URL=http://localhost:3000

# 检查文件加载顺序
.env.production.local
.env.local
.env.production
.env
```

#### 类型定义缺失

```typescript
// vite-env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_TITLE: string
}
```

### 5. HMR 问题

#### HMR 不工作

```typescript
// 检查 HMR 配置
export default defineConfig({
  server: {
    hmr: {
      overlay: false // 禁用错误覆盖层
    }
  }
})

// 检查文件监听
export default defineConfig({
  server: {
    watch: {
      usePolling: true // 在某些环境下需要启用轮询
    }
  }
})
```

#### 状态丢失

```typescript
// 使用 HMR API 保持状态
if (import.meta.hot) {
  import.meta.hot.dispose((data) => {
    data.myState = getCurrentState()
  })
  
  if (import.meta.hot.data.myState) {
    restoreState(import.meta.hot.data.myState)
  }
}
```

### 6. TypeScript 问题

#### 类型错误

```typescript
// 忽略类型检查
export default defineConfig({
  esbuild: {
    // 忽略类型错误（不推荐）
    // logLevel: 'error'
  }
})

// 分离类型检查
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "type-check": "tsc --noEmit"
  }
}
```

### 7. 调试技巧

#### 开启调试日志

```bash
# 开启详细日志
DEBUG=vite:* npm run dev

# 特定模块日志
DEBUG=vite:deps npm run dev
```

#### 分析构建结果

```typescript
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    visualizer({
      filename: 'dist/stats.html',
      open: true
    })
  ]
})
```

---

## 与其他工具对比

### Vite vs Webpack

| 特性 | Vite | Webpack |
|------|------|---------|
| **启动速度** | 极快（利用 ESM） | 较慢（需要打包） |
| **热更新** | 极快（精确更新） | 较慢（重新编译） |
| **生态系统** | 新兴，插件较少 | 成熟，插件丰富 |
| **配置复杂度** | 简单，开箱即用 | 复杂，需要配置 |
| **生产构建** | Rollup | 自身 |
| **学习曲线** | 平缓 | 陡峭 |

### Vite vs Parcel

| 特性 | Vite | Parcel |
|------|------|--------|
| **配置** | 可配置 | 零配置 |
| **性能** | 更快 | 快 |
| **插件生态** | 丰富 | 有限 |
| **框架支持** | 更广泛 | 内置支持 |

### Vite vs Create React App

| 特性 | Vite | CRA |
|------|------|-----|
| **启动速度** | 极快 | 慢 |
| **配置灵活性** | 高 | 低（需要 eject） |
| **构建工具** | Rollup | Webpack |
| **生态支持** | 需要配置 | 开箱即用 |

### 选择建议

#### 选择 Vite 的场景

- 新项目开发
- 需要快速开发体验
- 现代浏览器为主
- Vue/React 等现代框架
- 团队技术水平较高

#### 选择 Webpack 的场景

- 大型企业项目
- 需要丰富的插件生态
- 复杂的构建需求
- 需要兼容老旧浏览器
- 现有项目迁移成本高

---

## 最佳实践

### 1. 项目结构

```
src/
├── assets/              # 静态资源
│   ├── images/
│   ├── styles/
│   └── fonts/
├── components/          # 通用组件
│   ├── common/         # 基础组件
│   └── business/       # 业务组件
├── composables/         # 组合式函数
├── stores/             # 状态管理
├── utils/              # 工具函数
├── types/              # 类型定义
├── views/              # 页面组件
├── router/             # 路由配置
└── api/                # API 接口
```

### 2. 配置管理

```typescript
// 环境配置
const config = {
  development: {
    apiUrl: 'http://localhost:3000',
    debug: true
  },
  production: {
    apiUrl: 'https://api.example.com',
    debug: false
  }
}

export default config[import.meta.env.MODE]
```

### 3. 性能优化

#### 代码分割策略

```typescript
// 路由级别分割
const routes = [
  {
    path: '/heavy-page',
    component: () => import('./views/HeavyPage.vue')
  }
]

// 组件级别分割
const HeavyComponent = defineAsyncComponent(() =>
  import('./components/HeavyComponent.vue')
)

// 工具函数分割
const loadUtilities = () => import('./utils/heavy-utils')
```

#### 资源优化

```typescript
// 图片优化
export default defineConfig({
  plugins: [
    // 图片压缩插件
    {
      name: 'image-optimization',
      generateBundle() {
        // 图片压缩逻辑
      }
    }
  ]
})
```

### 4. 开发体验

#### 自动导入配置

```typescript
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  plugins: [
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        '@vueuse/core'
      ],
      dts: true
    }),
    
    Components({
      dirs: ['src/components'],
      dts: true
    })
  ]
})
```

#### 开发工具集成

```typescript
export default defineConfig({
  plugins: [
    // ESLint 集成
    eslint({
      include: ['src/**/*.{js,ts,vue}']
    }),
    
    // 类型检查
    checker({
      typescript: true,
      vueTsc: true,
      eslint: {
        lintCommand: 'eslint "./src/**/*.{js,ts,vue}"'
      }
    })
  ]
})
```

### 5. 团队协作

#### 代码规范

```json
// .eslintrc.js
{
  "extends": [
    "@vue/typescript/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "vue/multi-word-component-names": "off"
  }
}
```

#### Git Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "src/**/*.{js,ts,vue}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### 6. 部署优化

#### 构建配置

```typescript
export default defineConfig({
  build: {
    // 报告大小
    reportCompressedSize: false,
    
    // 分包策略
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('vue')) return 'vue-vendor'
            if (id.includes('lodash')) return 'utils-vendor'
            return 'vendor'
          }
        }
      }
    }
  }
})
```

#### 缓存策略

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // 长期缓存
        chunkFileNames: 'js/[name].[hash].js',
        entryFileNames: 'js/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    }
  }
})
```

### 7. 监控与调试

#### 性能监控

```typescript
// 性能监控
if (import.meta.env.PROD) {
  import('./utils/performance-monitor').then(({ init }) => {
    init()
  })
}
```

#### 错误处理

```typescript
// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)
  
  // 上报错误
  if (import.meta.env.PROD) {
    reportError(err, info)
  }
}
```

---

## 总结

Vite 作为新一代前端构建工具，通过利用现代浏览器的原生 ES 模块支持和高性能的构建工具（esbuild、Rollup），显著提升了前端开发体验。其核心优势包括：

1. **极速的开发启动**：基于 ESM 的开发服务器，无需预打包
2. **即时热更新**：精确的模块热替换，更新速度不受应用规模影响
3. **优化的生产构建**：使用 Rollup 进行高度优化的生产构建
4. **简单的配置**：开箱即用，同时保持高度可配置性
5. **丰富的生态**：活跃的插件生态和社区支持

通过本指南的学习，你应该能够：

- 理解 Vite 的工作原理和核心概念
- 熟练配置和使用 Vite 进行项目开发
- 掌握性能优化和部署策略
- 解决常见问题和调试技巧
- 应用最佳实践提升开发效率

Vite 的快速发展和广泛采用表明了前端工具链的发展趋势，掌握 Vite 将有助于你在现代前端开发中保持竞争力。

---

## 参考资源

- [Vite 官方文档](https://vitejs.dev/)
- [Vue.js 官方文档](https://vuejs.org/)
- [Rollup 官方文档](https://rollupjs.org/)
- [esbuild 官方文档](https://esbuild.github.io/)
- [Vite 插件库](https://github.com/vitejs/awesome-vite)
- [ES 模块规范](https://tc39.es/ecma262/#sec-modules)

---

*最后更新：2024年1月*