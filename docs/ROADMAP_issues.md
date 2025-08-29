# BMT-Central-SDK 里程碑 Issue 列表（按包划分）

说明
- 目的：将“学习路线与里程碑”拆解为可直接创建的 GitHub Issues。
- 规范：分支命名 feature/<scope>-<short>；PR 需附变更说明、截图/报告、测试结果。标签建议：pkg:*、type:feat/fix/test/docs、priority:P1~P3。
- 参考文档：docs/前端进阶学习路线_BMT-Central-SDK.md。

---

## 一、sdk-realtime

### Issue 1：类型安全事件总线（EventBus）
- 目标：为 Topic→Payload 建立强类型映射，限制 on/emit 参数类型；支持 once/priority/unsubscribe。
- 交付：实现/单测/README 用法与 FAQ。
- 验收（DoD）
  - [ ] 所有 API 无 any；错误监听互不影响；支持批量取消。
  - [ ] Vitest 覆盖：派发顺序、取消、异常隔离（监听器抛错）。

### Issue 2：重连与熔断策略（可配置）
- 目标：指数退避（含抖动与上限）、最大尝试、在线/离线感知；熔断状态机（关闭→半开→打开）。
- 交付：实现/状态图/配置示例/单测。
- 验收
  - [ ] 单测覆盖：失败累计→熔断→半开→恢复；定时器清理；并发触发幂等。
  - [ ] Playground 能手动模拟“断网/恢复”，UI 可见状态变化。

### Issue 3：实时指标与调试日志
- 目标：收集连接成功率、平均重连次数、恢复时长；日志分级与按 Topic 开关。
- 交付：采集接口、示例接入 sdk-telemetry、README。
- 验收
  - [ ] 指标在控制台或本地服务可观测；日志可按级别/Topic 过滤。

---

## 二、sdk-http

### Issue 4：请求生命周期与统一错误模型
- 目标：请求 ID、超时/取消（AbortController）、统一错误结构（业务码/HTTP/网络/取消）。
- 验收
  - [ ] 拦截器可配置；错误对象结构一致；
  - [ ] 单测：取消竞态、超时、错误转换。

### Issue 5：缓存与重试 + TanStack Query 适配
- 目标：内存缓存（TTL、stale-while-revalidate）、GET 重试与退避；提供 queryFn 适配层。
- 验收
  - [ ] 单测：命中/过期/回源、重试次数与间隔；
  - [ ] 示例与文档：如何在 playground 中与 Query 配合。

---

## 三、sdk-telemetry

### Issue 6：RUM 基础与错误采集
- 目标：PV、FCP/LCP/INP/CLS 采集；JS 错误与未处理 Promise；采样率与上报开关。
- 验收
  - [ ] Playground 有简单仪表盘（或控制台输出）；
  - [ ] Source Map 映射流程（可本地）与 README 指南。

---

## 四、playground

### Issue 7：数据层重构（Router + Query + RHF + Zod）
- 目标：使用 React Router v6.4+ 数据路由；服务器状态交给 Query；完成 1 个多步表单。
- 验收
  - [ ] 页面切换与 loader/action 正常；表单有校验与回退恢复；
  - [ ] 代码演示 Query 的缓存/失效/预取。

### Issue 8：实时消息面板 Demo
- 目标：展示 sdk-realtime 的订阅、断线重连与状态；提供“网络抖动”模拟开关。
- 验收
  - [ ] UI 可观察到连接状态与重连次数；
  - [ ] 可视化最近 N 条消息与丢失/去重。

### Issue 9：Vite 插件——注入 SDK 版本与调试开关
- 目标：编译期注入 __SDK_VERSION__/__SDK_DEBUG__；提供虚拟模块 virtual:sdk-info。
- 验收
  - [ ] ESM+CJS 产物与 d.ts；
  - [ ] playground 读取并展示版本与开关；README 有使用说明。

### Issue 10：E2E 测试（Playwright）
- 目标：两条关键流程：首屏加载、断网→恢复→重连成功。
- 验收
  - [ ] CI 可运行；生成 HTML 报告；
  - [ ] 断网场景通过（使用路由拦截或 service worker 模拟）。

---

## 五、工程化（所有包通用）

### Issue 11：测试与发布基线
- 目标：Vitest 配置与覆盖率阈值；Changesets 语义化发版；CI（构建+测试门禁）。
- 验收
  - [ ] 所有 packages 可独立运行单测；
  - [ ] PR 必须通过 CI；release 有版本 Changelog。

### Issue 12：打包产物矩阵与 sideEffects
- 目标：每个包产出 ESM/CJS/types，source map，合理 external 与 sideEffects；
- 验收
  - [ ] package.json exports/main/module/types 完整；
  - [ ] 体积报告与 tree-shaking 验证说明。

---

使用方式
- 直接在 GitHub 上新建对应 Issue，复制本条目内容；或在本地作为迭代计划执行。
- 若需要，我可以把这些条目转成 .github/ISSUE_TEMPLATE 与自动标签脚本，方便一键创建。