# 前端进阶学习路线（结合 BMT-Central-SDK 实战）

> 适用前置：已掌握 HTML/CSS/JS 基础、会 TypeScript，React 只会基础 hooks，微前端能按文档接入，Vite 只会简单配置。
>
> 目标周期：8–12 周（可按工作节奏弹性调整）。

---

## 0. 学习目标与衡量标准

- 掌握 React 核心渲染模型与性能优化，能用并发特性（useTransition/Suspense）设计交互。
- 搭建现代前端工程能力：Vite 深入与插件、单元/端到端测试、CI/CD、监控与性能优化。
- 体系化掌握微前端（选型/隔离/共享/部署），能完成一个 PoC 并写出选型报告。
- 将所学沉淀到本仓库：为 sdk-realtime、sdk-http、sdk-telemetry 分别补齐关键能力与测试。

衡量标准（自检清单在文末给出）：能解释一次渲染为何发生；明确区分服务器状态与全局 UI 状态；独立产出一个 Vite 插件；完成微前端 PoC 并落地经验文档；完成 SDK 的关键路径单测与一次小版本发布。

---

## 1. 路线总览（建议顺序）

- 第0阶段（贯穿）：JS/TS 进阶与异步模型（1–2 周碎片时间）
- 第1阶段：React 核心与模式（2–3 周）
- 第2阶段：状态管理与数据获取（1–2 周）
- 第3阶段：路由、表单、SSR/SSG（1–2 周）
- 第4阶段：Vite 深入与插件（1–1.5 周）
- 第5阶段：微前端体系化（2 周）
- 第6阶段：工程化与质量保障（测试/CI/性能/安全）（并行推进，1.5–2 周）
- 第7阶段（选修加强）：BFF/实时通信/可观测（1–2 周）

---

## 2. 各阶段要点与实践

### 第0阶段：JS/TS 进阶（并行）
- JS：事件循环、微任务、AbortController/Signal、重试与退避、幂等与去重。
- TS：泛型、条件类型、映射类型、模板字面量、声明合并，公共库 d.ts 设计。
- 实践：为 sdk-realtime 的事件/消息定义强类型事件映射；为重连策略写类型安全配置。

### 第1阶段：React 核心与模式
- 渲染与提交、闭包陷阱、依赖数组稳定性、useRef vs useState、受控/非受控。
- 并发特性：useTransition、useDeferredValue、Suspense（资源加载）。
- 复用与设计：容器/展示组件、Render Props、Custom Hooks、错误边界。
- 性能：重渲染定位、memo/useMemo/useCallback 的取舍、列表虚拟化（react-window/virtuoso）。
- 实践：做一个“实时消息面板”（ECharts/AntD），用本地模拟流；用 Profiler 解释优化收益。

### 第2阶段：状态管理与数据获取
- 全局状态（选一精通）：Redux Toolkit、Zustand、Recoil/Jotai。
- 服务器状态：TanStack Query（缓存/失效/重试/并行/分页/预取/乐观更新）。
- 表单：React Hook Form + Zod，复杂动态表单与性能优化。
- 实践：重构 playground 的数据层，支持离线/取消/失败重试与统一错误模型。

### 第3阶段：路由、表单、SSR/SSG
- React Router v6.4+ 数据路由（loader/action）、懒加载、错误边界。
- Next.js：文件路由、数据获取、流式渲染、图片优化与 SEO 思维。
- 实践：将 playground 拆成多路由文档/演示站；选 1–2 页面用 Next.js 做 SSR 版本对比首屏。

### 第4阶段：Vite 深入与插件
- 原理：依赖预构建（esbuild）、HMR、Rollup 构建管线、代码分割、环境与模式。
- 产物与体积：构建分析、缓存策略、Tree-shaking、sideEffects 标记、CDN 缓存。
- 插件：hook 生命周期、虚拟模块、transform/load/handleHotUpdate、与 Rollup 兼容。
- 实践：写一个“注入 SDK 版本与调试开关”的 Vite 插件，并用于 playground；再做一个“依赖体积报警”插件。

### 第5阶段：微前端体系化
- 流派：Module Federation（Webpack/Rspack）与基座型（single-spa/qiankun）。
- 隔离与共享：样式隔离（Shadow DOM/CSS Modules）、依赖共享治理、路由/通信（BroadcastChannel/CustomEvent/SharedWorker）。
- 构建与部署：子应用独立构建、基座路由与资源下发、灰度/回滚策略。
- 实践：主应用（Vite）+ 两个子应用（React/Vue3）；登录态共享、路由同步、依赖冲突化解；输出《选型与迁移手册》。

### 第6阶段：工程化与质量保障（并行）
- 测试：Vitest/Jest、React Testing Library、Playwright/Cypress。
- 质量：ESLint/Prettier/TS 严格模式、commitlint + lint-staged + husky、Changesets 与语义化版本。
- 监控与性能：FCP/LCP/INP/CLS、RUM 埋点、Source Map 上报、错误聚合、熔断与降级开关。
- 安全：XSS/CSRF、依赖审计、Token/Refresh、同源/CORS 策略。
- 实践：为 sdk-realtime 的“断线重连 + 指数退避 + 熔断 + 健康探测”加单测；playground 写 2 个 E2E 场景。

### 第7阶段（选修）：BFF 与实时能力
- BFF：Node/NestJS/Express 聚合鉴权、缓存（Redis）、限流；统一错误码与观测。
- 实时通信：WebSocket/Socket.IO、SSE、心跳/重连/顺序性/去重、背压与 QoS。
- 实践：写一个本地 BFF 代理 playground 的数据请求，模拟网络抖动与容错策略。

---

## 3. 与本仓库结合的里程碑任务（建议作为提交节点）

1) sdk-realtime
- 新增类型安全事件总线（Topic→Payload 的映射），约束监听与派发；
- 可配置的重连/退避/熔断策略与健康探测；
- Vitest 覆盖：事件顺序、重试边界、熔断恢复、异常路径。

2) sdk-http
- 拦截器：请求缓存、失败重试、取消、并发控制、统一错误模型；
- 集成 TanStack Query 的适配层；
- 单测：缓存命中、重试退避、取消竞态、错误转换。

3) sdk-telemetry
- 基础 RUM：PV、性能指标（FCP/LCP/INP/CLS）、JS 错误采集与上报（可先打印/本地服务）；
- Source Map 解码与错误聚合流程设计；
- 示例页面与文档。

4) playground
- 使用 React Router + TanStack Query + RHF 重构；
- 接入“实时消息面板”与 Vite 版本注入插件；
- Playwright E2E：首屏加载、消息订阅与断线恢复两个场景。

---

## 4. 周计划样例（10 周）

- 周1–2：React 核心与性能、TanStack Query 入门；完成 playground 数据层改造。
- 周3：表单/校验、数据路由；完成 1–2 个复杂表单。
- 周4：Vite 深入与插件；将插件用于 playground。
- 周5–6：微前端 PoC 与选型报告。
- 周7：测试体系（Vitest + RTL + Playwright）与 CI 门禁。
- 周8：sdk-realtime 重连/熔断能力与单测。
- 周9：Next.js SSR 对比与首屏优化；接入基础 RUM。
- 周10：总结与最佳实践固化，发布一次小版本。

---

## 5. 自检清单

- 能用工具解释一次渲染为何发生，并证明优化的收益；
- 清楚区分服务器状态与全局 UI 状态的边界；
- 能从 0 写一个 Vite 插件并上线使用；
- 能完成微前端 PoC（登录态共享、路由同步、依赖共享治理）并给出适用/不适用场景；
- 为 SDK 关键路径写出可靠单测与 E2E，并完成一次语义化发版。

---

## 6. 常见误区

- 为“用某库”而引入复杂度；先定义问题与指标再选型。
- 过度 useMemo/useCallback；先定位重渲染原因再优化。
- 把服务器状态塞进全局状态库；优先用数据请求库管理。
- 微前端为了解耦而解耦；规模/独立发布/异构不足时不建议采用。

---

## 7. 推荐资源（精简）

- React 官方文档（新版教程/性能章节）
- TanStack Query、React Hook Form + Zod 文档
- Vite 与 Rollup 插件开发指南
- Module Federation 与 qiankun 文档；微前端最佳实践文章
- Vitest、React Testing Library、Playwright 官方文档

---

## 8. 后续补充计划（将根据进展持续完善）

# 9. 可执行任务与验收标准（强落地版）

> 目的：把“学什么”转化为“做什么、做到什么程度算通过”。所有任务都应在本仓库建立对应分支与 PR，附变更说明与结果截图/报告。

## 9.1 sdk-realtime：类型安全事件总线与重连/熔断

- 任务A：事件总线（EventBus）
  - 要求：
    - 以 Topic→Payload 的映射定义事件类型；监听/派发需在编译期受约束（禁止 any）。
    - 支持 once/priority/取消订阅与批量订阅；提供“调试日志开关”。
  - 验收：
    - 单测覆盖：正确派发、顺序性、取消、错误隔离（监听器抛错不影响其他）。
    - 文档：README 增加用法、类型提示截图与 FAQ。

- 任务B：重连/熔断策略
  - 要求：
    - 重连：指数退避（上限/抖动），网络在线/离线监听，最大尝试次数与手动重置。
    - 熔断：半开状态、失败阈值、冷却时间、健康探测（ping/pong 或心跳）。
  - 验收：
    - 单测：失败累计→熔断→半开→恢复的完整状态机流转；异常边界（定时器清理、并发触发）。
    - Playground 演示：可切换“网络异常/恢复”模拟开关并观察 UI 状态。

- 任务C：指标与日志
  - 要求：
    - 关键指标：连接成功率、平均重连次数、平均恢复时长；
    - 调试日志：分级（info/warn/error），支持对单 Topic 打开。
  - 验收：
    - 在 sdk-telemetry 中接入基础采集（可先 console 输出）。

## 9.2 sdk-http：稳健的请求层

- 任务A：请求生命周期与统一错误模型
  - 要求：
    - 拦截器链：请求 ID、超时与取消（AbortController）、统一错误（业务码/HTTP/网络/取消）。
    - 并发控制与去重：相同 key 的请求可选择复用或取消旧请求。
  - 验收：
    - 单测：取消竞态、错误转换、去重命中、超时路径。

- 任务B：缓存与重试
  - 要求：
    - 缓存策略（memory，支持 TTL、stale-while-revalidate）；
    - 重试与退避，面向幂等 GET；
    - 提供与 TanStack Query 的适配层（queryFn）。
  - 验收：
    - 单测：缓存命中/过期/回源、重试次数与间隔校验。

## 9.3 sdk-telemetry：基础可观测

- 任务A：RUM 基础指标
  - 要求：PV、FCP/LCP/INP/CLS 采集；JS 错误与未处理 Promise 上报；Source Map 映射（可本地）。
  - 验收：
    - Playground 仪表盘打印/展示；控制采样率与上报开关。

## 9.4 playground：演示与测试场

- 任务A：数据层重构
  - 要求：TanStack Query 管理服务器状态；React Router v6.4+ 数据路由；RHF + Zod 完成多步表单。
  - 验收：
    - E2E（Playwright）：首屏加载、表单提交流与回退恢复；
    - 可视化一个“实时消息面板”，可人工触发网络抖动并观察恢复策略。

---

# 10. 代码与提交物模板

## 10.1 提交说明（PR 模板建议）

- 变更类型：feat | fix | perf | docs | test | chore
- 影响范围：packages/*（列出）
- 变更说明：
- 设计要点/权衡：
- 测试说明：单测覆盖率截图、E2E 关键场景说明
- 风险与回滚：

## 10.2 测试清单模板

- 单元测试
  - 正常路径：
  - 边界条件：
  - 错误注入：
- 组件测试（RTL）
  - 用户行为：
  - 可访问性：
- E2E（Playwright）
  - 场景1：首屏 → 断网 → 恢复
  - 场景2：并发请求 → 取消/复用

---

# 11. Vite 插件骨架与发布 Checklist

## 11.1 目标插件：注入 SDK 版本与调试开关

- 功能：在编译期注入 __SDK_VERSION__ 和 __SDK_DEBUG__；热更新时保持一致。
- 关键点：使用 configResolved/transform/handleHotUpdate 钩子；提供虚拟模块 virtual:sdk-info。
- 发布：
  - 产物：ESM+CJS，带 d.ts；
  - peer 依赖声明；
  - README 示例（playground 如何消费）。

## 11.2 发布 Checklist

- [ ] package.json: main/module/types/exports 完整
- [ ] d.ts 生成正确；source map 存在
- [ ] sideEffects 标记合理；tree-shaking 验证
- [ ] 变更日志（Changesets）与语义化版本

---

# 12. 微前端 PoC 设计提纲

- 架构：Vite 基座 + 子应用（React/Vue3）
- 能力：
  - 登录态共享（基于 cookie/Token + BroadcastChannel 同步）
  - 路由同步（hash/history 策略与边界）
  - 依赖共享治理（核心库锁定版本、冲突回退策略）
  - 样式隔离（Shadow DOM 或 CSS Modules）
- 部署：
  - 子应用独立构建与静态资源托管；
  - 基座按路由异步加载子应用；
  - 灰度与回滚脚本（保留 N 版）。
- 验收：
  - 手册：《微前端选型与迁移手册》含收益/风险/限制；
  - 演示视频/截图与脚本化一键启动。

---

# 13. 性能与监控预算（建议落库）

- 构建体积预算：初始 JS < 200KB gzip（示例，可按需调整）
- 首屏指标目标：LCP < 2.5s，INP < 200ms（实验值随项目校准）
- 运行时保护：
  - 开关：降级/熔断开关集中管理
  - 采样：RUM 1–5% 采样率
  - 日志：分级与采样、防止日志风暴

---

# 14. 90 天节奏建议（按周）

- 1–2：React 渲染模型 + Query 入门，落地数据层改造
- 3：表单/校验 + 数据路由
- 4：Vite 深入 + 插件上线到 playground
- 5–6：微前端 PoC 与文档
- 7：测试体系与 CI 门禁
- 8：sdk-realtime 重连/熔断 + 单测
- 9：SSR 对比与首屏优化 + 基础 RUM
- 10–12：收尾与提升（优化、压测、发布迭代）

---

# 15. 后续补充事项（待你确认优先级）

- 提供“事件总线类型映射”的代码骨架与迁移建议
- 输出 Playground 的 E2E 基础脚手架（脚本与 CI 集成）
- 整理“常见渲染性能陷阱”案例 10 条与定位步骤
- 给出“多包仓库发布策略”与版本对齐方案