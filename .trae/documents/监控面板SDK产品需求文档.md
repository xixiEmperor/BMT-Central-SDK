# 监控面板SDK产品需求文档

## 1. Product Overview
基于React生态的监控面板SDK，为开发者提供开箱即用的性能监控、错误追踪、用户行为分析等可视化组件。
- 解决开发者需要快速集成监控面板但不想从零开发的痛点，提供高度可定制的React组件库。
- 目标是成为React生态中最易用的监控面板解决方案，帮助开发者快速构建专业级监控系统。

## 2. Core Features

### 2.1 User Roles
| Role | Registration Method | Core Permissions |
|------|---------------------|------------------|
| 开发者 | npm安装使用 | 可使用所有组件和API，配置监控面板 |
| 最终用户 | 无需注册 | 查看监控数据，使用面板功能 |

### 2.2 Feature Module
我们的监控面板SDK包含以下核心模块：
1. **核心组件库**：仪表盘、图表、指标卡片、告警组件等基础监控组件
2. **数据适配器**：支持多种数据源接入，包括REST API、WebSocket、GraphQL等
3. **主题系统**：内置多套主题，支持自定义主题配置
4. **配置管理**：可视化配置界面，支持拖拽布局和参数调整
5. **插件系统**：支持自定义插件扩展功能
6. **DOM挂载系统**：支持Portal、Shadow DOM、浮动面板等多种挂载方式
7. **性能隔离系统**：确保监控面板不影响用户应用的真实性能

### 2.3 Page Details
| Page Name | Module Name | Feature description |
|-----------|-------------|---------------------|
| 仪表盘组件 | Dashboard | 提供网格布局系统，支持拖拽调整组件位置和大小 |
| 图表组件 | Charts | 包含折线图、柱状图、饼图、热力图等多种图表类型，基于ECharts或D3.js |
| 指标卡片 | MetricCard | 显示关键指标数值，支持趋势显示和阈值告警 |
| 数据表格 | DataTable | 支持分页、排序、筛选的数据展示表格 |
| 告警中心 | AlertCenter | 实时告警展示，支持告警级别分类和处理状态管理 |
| 配置面板 | ConfigPanel | 可视化配置界面，支持组件参数调整和布局设置 |
| 主题切换 | ThemeProvider | 主题管理系统，支持亮色/暗色主题切换 |

## 3. Core Process

**开发者集成流程：**
1. 通过npm安装SDK包
2. 在React项目中导入所需组件
3. 配置数据源和API接口
4. 使用内置组件构建监控面板
5. 可选择使用配置面板进行可视化调整

**最终用户使用流程：**
1. 访问集成了SDK的监控面板
2. 查看实时监控数据和图表
3. 使用筛选和搜索功能定位问题
4. 接收和处理告警信息

```mermaid
graph TD
    A[开发者安装SDK] --> B[导入组件]
    B --> C[配置数据源]
    C --> D[构建监控面板]
    D --> E[部署应用]
    E --> F[最终用户访问]
    F --> G[查看监控数据]
    G --> H[处理告警]
```

## 4. User Interface Design

### 4.1 Design Style
- **主色调**：深蓝色(#1890ff)作为主色，灰色(#f0f2f5)作为背景色
- **按钮样式**：圆角按钮，支持多种尺寸和状态
- **字体**：系统默认字体栈，主要文字14px，标题16-24px
- **布局风格**：卡片式布局，网格系统，响应式设计
- **图标风格**：线性图标，统一的视觉语言

### 4.2 Page Design Overview
| Page Name | Module Name | UI Elements |
|-----------|-------------|-------------|
| 仪表盘组件 | Dashboard | 网格布局容器，拖拽手柄，组件边框，深色主题#001529背景 |
| 图表组件 | Charts | 图表容器，图例，工具栏，缩放控件，颜色渐变#1890ff到#69c0ff |
| 指标卡片 | MetricCard | 白色卡片背景，数值高亮显示，趋势箭头图标，状态色彩指示 |
| 告警中心 | AlertCenter | 列表布局，状态标签，时间戳，严重程度颜色编码(红#ff4d4f/橙#fa8c16/黄#fadb14) |

### 4.3 Responsiveness
桌面优先设计，完全支持移动端适配，包括触摸手势优化和响应式布局调整。在移动端自动调整组件尺寸和交互方式。

## 5. Technical Features

### 5.1 DOM挂载方案
**三种挂载方式满足不同场景需求：**

1. **Portal模式**
   - 用户指定容器，SDK渲染到指定位置
   - 适用场景：集成到现有页面布局中
   - 使用方式：`BMTDashboard.mount('#container', options)`

2. **Shadow DOM隔离模式**
   - 完全样式隔离，不会被用户CSS影响
   - 适用场景：需要完全独立的监控面板
   - 技术优势：避免样式冲突，确保视觉一致性

3. **浮动面板模式**
   - 可拖拽、可最小化的悬浮监控面板
   - 适用场景：开发调试、生产环境快速监控
   - 使用方式：`BMTDashboard.createFloating(options)`

### 5.2 性能隔离保证
**零性能影响承诺：**

| 性能指标 | 限制阈值 | 保证措施 |
|---------|---------|---------|
| CPU使用率 | ≤ 10% | 时间切片 + requestIdleCallback |
| 内存使用 | ≤ 50MB | 循环缓冲区 + 虚拟滚动 + 定期清理 |
| 渲染时间 | ≤ 16ms/帧 | 帧率限制 + 自动降级 |
| 网络请求 | ≤ 5个/秒 | 请求合并 + 批处理 |

**自动性能调优机制：**
- 实时监控自身性能影响
- 超出阈值自动进入低性能模式
- 动态调整更新频率和数据量
- Web Worker处理重计算任务

### 5.3 与BMT-Central-SDK集成优势

**数据源无缝集成：**
- 自动集成`@wfynbzlx666/sdk-perf`的性能数据
- 复用`@wfynbzlx666/sdk-telemetry`的事件追踪
- 利用`@wfynbzlx666/sdk-realtime`的实时通信
- 共享`@wfynbzlx666/sdk-http`的网络能力

**统一开发体验：**
- 相同的构建工具链和发布流程
- 统一的TypeScript配置和代码规范
- 版本同步，避免兼容性问题
- 一站式SDK解决方案

## 6. Integration Examples

### 6.1 最简集成示例
```typescript
import { BMTDashboard } from '@wfynbzlx666/sdk-dashboard'

// 一行代码集成监控面板
BMTDashboard.mount('#dashboard', {
  config: {
    theme: { mode: 'dark' },
    dataSource: { type: 'rest', endpoint: '/api/metrics' }
  }
})
```

### 6.2 高级配置示例
```typescript
BMTDashboard.createFloating({
  position: 'bottom-right',
  minimizable: true,
  config: {
    layout: [
      { id: 'perf', component: 'MetricCard', x: 0, y: 0, w: 4, h: 2 },
      { id: 'errors', component: 'ChartContainer', x: 4, y: 0, w: 8, h: 4 }
    ]
  },
  performance: {
    maxCPUUsage: 0.05, // 限制5% CPU使用
    enableAutoDegrade: true
  },
  mount: {
    mode: 'shadow-dom',
    isolated: true
  }
})
```

### 6.3 与现有监控系统集成
```typescript
// 支持多种数据源
BMTDashboard.mount('#dashboard', {
  config: {
    dataSource: [
      { type: 'rest', endpoint: '/api/prometheus/metrics' },
      { type: 'websocket', endpoint: 'ws://grafana.com/live' },
      { type: 'graphql', endpoint: '/graphql' }
    ]
  }
})
```

## 7. Success Metrics

### 7.1 技术指标
- **集成时间** < 5分钟（从安装到显示第一个图表）
- **包体积** < 500KB（gzipped）
- **性能影响** < 5%（CPU和内存使用）
- **浏览器兼容性** 支持Chrome 60+、Firefox 58+、Safari 12+

### 7.2 用户体验指标
- **学习成本** < 30分钟（从零基础到熟练使用）
- **定制化程度** 支持90%以上的常见监控场景
- **稳定性** 99.9%运行时可用性
- **社区活跃度** 目标1000+ GitHub stars