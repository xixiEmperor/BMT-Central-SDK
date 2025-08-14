# PerformanceObserver 与 performance API 知识点

本文从角色定位、触发/获取机制、数据范围、典型用法与常见坑等角度，系统梳理 PerformanceObserver 与 window.performance（Performance API）的差异与最佳实践。

## 1. 角色定位
- PerformanceObserver：事件驱动的“订阅-回调”模型，适合持续产生、会动态更新的性能条目（如 LCP、CLS、INP 等）。
- Performance API（window.performance）：拉取式快照模型，适合一次性读取或按需取数（如 Navigation/Resource/Measure 等）。

## 2. 触发/获取机制
- PerformanceObserver：
  - 通过 observe 指定类型（type/entryTypes）后，浏览器在有“新条目”产生时调用回调。
  - 可以设置 buffered: true 以补发页面加载早期的历史条目，避免错过关键事件（例如在 observer 创建之前就发生的 LCP 候选）。
  - 回调参数 PerformanceObserverEntryList 仅包含“本次回调新增且匹配类型”的条目。
- Performance API：
  - 需要开发者主动调用 getEntries/getEntriesByType/getEntriesByName 拉取当前“已存在”的条目。
  - 属于全量快照（或按类型筛选的快照），不会自动推送后续新增，需要自行轮询或再次拉取。

## 3. 数据范围与过滤
- PerformanceObserver：天然“只看我订阅的”，避免被无关条目干扰。例如订阅 'largest-contentful-paint' 就只会接收到 LCP 条目。
- Performance API：默认返回全量（或按类型筛选后的）条目，若直接看“最后一条”，很可能是 resource 等与目标无关的条目。

## 4. 常用 API 速查
- PerformanceObserver
  - new PerformanceObserver(callback)
  - observe({ type | entryTypes, buffered? })
  - disconnect()
  - takeRecords()：立即取出当前已缓存在观察器中的条目（不触发回调）。
  - 回调参数 PerformanceObserverEntryList：getEntries()/getEntriesByType()/getEntriesByName()
- Performance（window.performance）
  - now()、timeOrigin
  - getEntries()/getEntriesByType()/getEntriesByName()
  - mark()/measure()/clearMarks()/clearMeasures()
  - navigation、timing（现代浏览器以 Navigation Timing Level 2 为主）

### PerformanceObserver 支持的 type 类型

#### 核心性能指标类型
- **`navigation`**：页面导航时序（Navigation Timing），包含 DNS、TCP、请求、响应、DOM 解析等各阶段耗时
  - **Navigation 条目的关键属性：**
    - `domainLookupStart/End`: DNS 查询时间
    - `connectStart/End`: TCP 连接时间
    - `requestStart`: 请求开始时间
    - `responseStart/End`: 响应时间
    - `domInteractive`: DOM 可交互时间
    - `domContentLoadedEventStart/End`: DOMContentLoaded 事件时间
    - `loadEventStart/End`: load 事件时间
    - `type`: 导航类型（navigate、reload、back_forward、prerender）

- **`resource`**：资源加载时序（Resource Timing），记录 CSS、JS、图片等静态资源的请求详情
  - **Resource 条目的关键属性：**
    - `name`: 资源 URL
    - `initiatorType`: 发起者类型（script、link、img、fetch、xmlhttprequest等）
    - `fetchStart`: 开始获取资源的时间
    - `domainLookupStart/End`: DNS 查询时间
    - `connectStart/End`: 连接建立时间
    - `requestStart`: 请求开始时间
    - `responseStart/End`: 响应时间
    - `transferSize`: 传输大小（包含头部）
    - `encodedBodySize`: 编码后的响应体大小
    - `decodedBodySize`: 解码后的响应体大小

- **`paint`**：绘制时序，包含 `first-paint`（FP）和 `first-contentful-paint`（FCP）
  - **Paint 条目的关键属性：**
    - `name`: 绘制类型（"first-paint" 或 "first-contentful-paint"）
    - `startTime`: 绘制发生的时间戳
    - `duration`: 通常为 0（瞬时事件）

- **`largest-contentful-paint`**：最大内容绘制（LCP），Web Vitals 核心指标之一
  - **LCP 条目的关键属性：**
    - `startTime`: LCP 元素完成渲染的时间
    - `size`: LCP 元素的大小（像素面积）
    - `id`: LCP 元素的 ID（如果有）
    - `url`: LCP 元素的 URL（如果是图片）
    - `element`: LCP 元素的 DOM 引用

- **`layout-shift`**：布局偏移（CLS 相关），记录页面元素的意外位移
  - **LayoutShift 条目的关键属性：**
    - `value`: number - 布局偏移分数（影响分数 × 距离分数）
    - `hadRecentInput`: boolean - 是否由用户交互引起（500ms内）
    - `lastInputTime`: number - 最近一次用户输入的时间戳
    - `sources`: LayoutShiftAttribution[] - 偏移源信息数组
      - `node`: Element - 发生偏移的DOM元素
      - `previousRect`: DOMRectReadOnly - 偏移前的位置和尺寸
      - `currentRect`: DOMRectReadOnly - 偏移后的位置和尺寸

- **`longtask`**：长任务（超过 50ms 的主线程阻塞任务）
  - **LongTask 条目的关键属性：**
    - `startTime`: 长任务开始时间
    - `duration`: 任务持续时间（> 50ms）
    - `attribution`: TaskAttributionTiming[] - 任务归因信息
      - `containerType`: 容器类型（iframe、embed等）
      - `containerSrc`: 容器源地址
      - `containerId`: 容器ID
      - `containerName`: 容器名称

#### 交互与用户体验类型
- **`event`**：事件时序（Event Timing），记录用户交互事件的处理耗时
  - **Event 条目的关键属性：**
    - `name`: 事件类型（click、keydown、pointerdown等）
    - `startTime`: 事件开始处理的时间
    - `duration`: 事件处理总耗时
    - `processingStart`: 事件处理开始时间
    - `processingEnd`: 事件处理结束时间
    - `cancelable`: 事件是否可取消
    - `target`: 事件目标元素

- **`first-input`**：首次输入延迟（FID 相关），记录用户首次交互的响应时间
  - **FirstInput 条目的关键属性：**
    - `name`: 首次输入事件类型
    - `startTime`: 用户输入的时间
    - `duration`: 输入延迟时间（FID值 + 处理时间）
    - `processingStart`: 开始处理输入的时间
    - `processingEnd`: 处理输入结束的时间
    - `cancelable`: 事件是否可取消

- **`visibility-state`**：页面可见性变化事件 
  - **VisibilityState 条目的关键属性：**
    - `name`: 可见性状态（"visible" 或 "hidden"）
    - `startTime`: 状态变化的时间戳
    - `duration`: 通常为 0（瞬时事件）

#### 自定义与开发者工具类型
- **`mark`**：开发者通过 `performance.mark()` 创建的时间标记
  - **Mark 条目的关键属性：**
    - `name`: 标记名称（开发者自定义）
    - `startTime`: 标记创建的时间戳
    - `duration`: 通常为 0（瞬时标记）
    - `detail`: 可选的附加数据

- **`measure`**：开发者通过 `performance.measure()` 创建的时间区间测量
  - **Measure 条目的关键属性：**
    - `name`: 测量名称（开发者自定义）
    - `startTime`: 测量开始时间
    - `duration`: 测量持续时间
    - `detail`: 可选的附加数据

- **`user-timing`**：包含 mark 和 measure 的统称

#### 其他类型
- **`taskattribution`**：长任务归因信息，帮助定位长任务的具体来源
  - **TaskAttribution 条目的关键属性：**
    - `containerType`: 容器类型（iframe、embed等）
    - `containerSrc`: 容器源地址
    - `containerId`: 容器ID
    - `containerName`: 容器名称
    - `scriptURL`: 脚本URL（如果适用）

- **`back-forward-cache`**：往返缓存相关的性能信息
  - **BackForwardCache 条目的关键属性：**
    - `name`: 缓存事件类型
    - `startTime`: 事件发生时间
    - `duration`: 通常为 0
    - `id`: 导航ID
    - `size`: 缓存大小信息

- **`soft-navigation`**：软导航（SPA 路由切换）的性能信息
  - **SoftNavigation 条目的关键属性：**
    - `name`: 软导航标识
    - `startTime`: 导航开始时间
    - `duration`: 导航持续时间
    - `url`: 目标URL
    - `navigationId`: 导航唯一标识

#### 使用示例
```javascript
// 单一类型监听
observer.observe({ type: 'largest-contentful-paint', buffered: true })

// 多类型监听
observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] })

// 检查浏览器支持
if (PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
  // 支持 LCP 监听
}
```

#### 兼容性注意事项
- 不同浏览器对各类型的支持程度不同，建议使用 `PerformanceObserver.supportedEntryTypes` 检查
- 部分类型（如 `largest-contentful-paint`、`layout-shift`）需要较新的浏览器版本
- 移动端浏览器的支持可能滞后于桌面端

## 5. Web Vitals 的推荐做法
- 使用 PerformanceObserver（并开启 buffered: true）
  - LCP（largest-contentful-paint）
  - CLS（cumulative-layout-shift）
  - INP/FID（输入延迟相关，基于 Event Timing）
- 使用 Performance API
  - Navigation Timing（如首字节时间、DNS、TCP、TTFB 等拆解）
  - Resource Timing（静态资源请求明细）
  - 自定义埋点的 mark/measure（性能区间的度量）

## 6. 术语与时间含义
- startTime：从 timeOrigin（通常接近 navigationStart）起算的“绝对时间戳”，不是多个任务的累加。
- duration：条目持续时长（如某些事件可能为 0，表示瞬时发生）。
- LCP 的 startTime：表示“当前最大内容元素完成渲染”的时间点。随着更大的候选出现会更新，但始终是独立时间点而非叠加。

## 7. 典型示例（简化）
- 观察 LCP：
  - 使用 PerformanceObserver 订阅 'largest-contentful-paint'，配合 buffered: true 获取早期候选；在回调中取最后一个 LCP 候选的 startTime 作为最新值。
- 读取导航/资源：
  - 使用 window.performance.getEntriesByType('navigation'|'resource') 获取当前快照，按需解析各阶段耗时。

## 8. 常见坑与规避
- 误区一：“list.getEntries() 等价于 window.performance.getEntries()”
  - 错：前者是“本次回调中新产生且匹配订阅类型的条目集合”；后者是“当前时刻的全量（或按类型筛过）的条目集合”。
- 误区二：直接取 window.performance.getEntries() 的“最后一条”当作 LCP
  - 很可能拿到的是 resource 等与 LCP 无关的条目，造成数值异常（远大于真实 LCP）。
- 误区三：未开启 buffered 导致漏掉早期事件
  - 例如 observer 创建较晚时，早期 LCP 候选不会自动推送，必须使用 buffered: true 才能补发。
- 误区四：忽略可见性与终止时机
  - LCP 在页面首次进入后台或用户交互到某些状态后就应停止更新；应结合 visibilitychange 等事件在合适时机“封箱”。
- 误区五：未做兼容性/能力检测
  - 通过 PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint') 等检查能力，必要时降级到其它策略。

## 9. 选择建议（类比）
- 想要“自动挡”：持续、增量、按类型推送 → 用 PerformanceObserver。
- 想要“手动挡”：一次性快照、全量拉取、灵活拼装 → 用 Performance API。

## 10. 结论
- 两者并非替代关系，而是互补：观察者擅长“持续监听与推送”，Performance API 擅长“按需拉取快照与自定义度量”。实际项目中常常组合使用：用观察者获取 Web Vitals，用 Performance API 补齐导航/资源/自定义区间的细节。