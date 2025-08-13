# 前端 SDK 技术文档与 API 契约（技术中台）

> 包含：sdk-core、sdk-http、sdk-perf、sdk-telemetry、sdk-realtime。以“稳定 API + 默认参数 + 错误约定 + 事件 schema”为核心，便于 C/B 两端统一接入。

---

## 总览与初始化

### 包与职责
- `@platform/sdk-core`：TaskQueue/重试与指数退避/跨标签页协调（BroadcastChannel/navigator.locks 降级）。
- `@platform/sdk-http`：Axios 单例 + 插件链（去重/重试/熔断/限流/令牌刷新/统一错误+返回 unwrap），React/Vue Query 适配。
- `@platform/sdk-perf`：Performance API 采集（Web Vitals + PO + User Timing），阈值/采样、Worker 聚合、Dev Overlay（可选）。
- `@platform/sdk-telemetry`：page/event/error/api/perf 统一上报、IndexedDB 批量缓冲、sendBeacon 兜底、多标签页去重。
- `@platform/sdk-realtime`：Socket.IO 可靠通道（心跳/指数退避/ack/重发/序列号有序/反压/跨标签页单连接）。

### 环境变量约定
- `VITE_API_BASE_URL`：HTTP 基础地址
- `VITE_TELEMETRY_ENDPOINT`：遥测/性能上报地址（若区分 perf，可另配 `VITE_PERF_ENDPOINT`）
- `VITE_REALTIME_URL`：Socket.IO 服务器地址

### 统一初始化示例
```ts
import { initHttp } from '@platform/sdk-http'
import { Perf } from '@platform/sdk-perf'
import { Telemetry } from '@platform/sdk-telemetry'
import { Realtime } from '@platform/sdk-realtime'

initHttp({ baseURL: import.meta.env.VITE_API_BASE_URL })

Perf.init({
  sampleRate: 0.05,
  useWorker: true,
  onMetric: (m) => Telemetry.trackPerf(m),
})

Telemetry.init({
  endpoint: import.meta.env.VITE_TELEMETRY_ENDPOINT,
  app: 'admin',
  release: __APP_VERSION__,
})

Realtime.init({
  url: import.meta.env.VITE_REALTIME_URL,
  auth: () => localStorage.getItem('token'),
})
```

---

## sdk-core（基础能力）

### TaskQueue
```ts
type Task<T> = () => Promise<T>
createTaskQueue<T>({
  concurrency?: number,           // 默认 2
  timeoutMs?: number,             // 默认 10_000
  retry?: { retries: number; baseMs: number; capMs: number }, // 指数退避
}): { add(task: Task<T>): void; start(): Promise<void>; clear(): void }
```
- 行为：按并发/超时/重试执行；失败重试使用 Full Jitter；可随时清空与停止。

### 跨标签页协调
- `createBroadcast(name)`：封装 BroadcastChannel，降级为 localStorage 事件。
- `withLock(key, fn)`：基于 `navigator.locks` 的互斥，降级为“单 Tab 模式”。

---

## sdk-http（HTTP 客户端）

### 初始化与插件
```ts
initHttp({
  baseURL: string,
  plugins?: HttpPlugin[],
  retry?: { retries: number; baseMs: number; capMs: number },
  rateLimit?: { rps: number },
  requestDedup?: boolean,         // 默认 true（method+url+sorted(params)+hash(body)）
})

export interface HttpPlugin {
  onRequest?(config: AxiosRequestConfig): AxiosRequestConfig | Promise<AxiosRequestConfig>
  onResponse?<T = any>(resp: AxiosResponse<T>): T | Promise<T>
  onError?(error: any): never | Promise<never>
}
```

### 统一返回（unwrap）
```ts
http.get<T>(url, config?): Promise<T>
http.post<T>(url, data?, config?): Promise<T>
http.put<T>(url, data?, config?): Promise<T>
http.delete<T>(url, config?): Promise<T>
```

### 内置插件（建议默认开启）
- Auth：自动附带 Bearer Token；401 时单航刷新（Single-Flight），失败则登出。
- Telemetry：在请求完成后发出 `trackApi(url, status, duration)`。
- Retry：Full Jitter；对 GET/HEAD/OPTIONS/PUT/DELETE 等幂等/可安全重试的方法生效。
- CircuitBreaker：滚动窗口错误率/超时触发打开，半开探测；返回 `ServiceUnavailable`。
- RateLimit：瞬时限流，保护后端与前端资源。

### 错误约定
```ts
type HttpError = {
  type: 'Network' | 'Timeout' | 'Http',
  status?: number,
  message: string,
  data?: unknown,
}
```

### React/Vue 适配（可选）
- React：提供 `createQueryClientDefaults()`；统一 `staleTime/retry/retryDelay/gcTime/onError`。
- Vue：提供 `@tanstack/vue-query` 默认项；或 SWRV 适配器。

---

## sdk-perf（性能监控）

### 初始化与采集开关
```ts
Perf.init({
  sampleRate?: number,            // 默认 0.05
  useWorker?: boolean,            // 默认 true
  thresholds?: { longTaskMs?: number; lcpPoorMs?: number },
  onMetric?: (metric: PerfMetric) => void,
})

Perf.enableWebVitals()                      // LCP/CLS/INP/TTFB
Perf.observe(['navigation','resource','paint','longtask','event'])
Perf.mark('job:start'); Perf.mark('job:end'); Perf.measure('job', 'job:start', 'job:end')
```

### 事件模型
```ts
type PerfMetric = {
  type: 'vitals' | 'longtask' | 'resource' | 'navigation' | 'custom',
  name: string,
  value: number,
  rating?: 'good' | 'ni' | 'poor',
  ts: number,
  attrs?: Record<string, any>,
}
```

### Worker 聚合（建议）
- 将 PerformanceObserver 收集的数据在 Worker 内聚合与采样，降低主线程开销。
- 与 `sdk-telemetry` 对接：`Telemetry.trackPerf(metric)` 批量上报。

---

## sdk-telemetry（遥测）

### 初始化与事件
```ts
Telemetry.init({ endpoint: string, app: string, release: string, sampleRate?: number })
Telemetry.trackPageView(routeName)
Telemetry.trackEvent(name, props?)
Telemetry.trackError(name, message, stack?)
Telemetry.trackApi(url, status, duration)
Telemetry.trackPerf(metric: PerfMetric)
Telemetry.flush()
```

### 缓冲与批量
- IndexedDB（或内存）缓冲；累计阈值（如 20 条）或定时（如 10s）后 flush。
- 页面隐藏/卸载时 `sendBeacon` 兜底；多标签页通过 `BroadcastChannel` 去重与互斥。

### 事件 Schema（核心字段）
```ts
{
  type: 'page'|'event'|'error'|'api'|'perf',
  name: string,
  ts: number,
  app: string,
  release: string,
  user?: { id?: string|number; role?: string },
  props?: Record<string, any>
}
```

---

## sdk-realtime（可靠实时）

### 初始化与订阅
```ts
Realtime.init({ url: string, auth?: () => string | null })
const sub = Realtime.subscribe('orders:123', (msg) => { /* ... */ })
Realtime.publish('orders:123', { type: 'create', payload: { ... } })
sub.unsubscribe()
```

### 可靠性语义
- 心跳保活、指数退避重连（上限）。
- ack/重发：消息需得到 ack；超时自动重发（次数/间隔可配）。
- 序列有序：topic 级 `seq`；乱序丢弃或缓冲重排。
- 反压：客户端缓存上限与丢弃策略；监控队列长度并报警。
- 跨标签页：`BroadcastChannel` + `navigator.locks`，单物理连接共享，自动重订阅。

### 消息格式（建议）
```ts
{
  type: 'event'|'ack'|'error'|'subscribe'|'publish',
  topic?: string,
  id?: string,
  seq?: number,
  payload?: any,
  code?: string,
  message?: string,
  ts?: number,
}
```

---

## 集成清单（C/B 端）
- 统一在应用入口进行 `initHttp`、`Perf.init`、`Telemetry.init`、`Realtime.init`。
- React：提供默认 `QueryClient` 与错误边界（ui-kit 可选）。
- Vue：提供 Vue Query/SWRV 适配；全局错误捕获与路由埋点。
- 配置环境变量与灰度开关；支持旁路模式（仅采集不拦截）。

## 版本与发布
- 使用 Changesets 做 SemVer；breaking 变更提供迁移指南。
- peerDependencies 锁定运行时库版本；apps 明确安装。
