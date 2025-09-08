# CSS面试知识点整理

## 1. 盒子模型

### 标准盒子模型 vs IE盒子模型

- **标准盒子模型（content-box）**：width = content
- **IE盒子模型（border-box）**：width = content + padding + border

```css
/* 标准盒子模型 */
.standard-box {
    box-sizing: content-box;
    width: 200px;
    padding: 10px;
    border: 5px solid #000;
    /* 实际宽度 = 200 + 10*2 + 5*2 = 230px */
}

/* IE盒子模型 */
.border-box {
    box-sizing: border-box;
    width: 200px;
    padding: 10px;
    border: 5px solid #000;
    /* 实际宽度 = 200px，内容区域自动调整 */
}
```

### border-box的好处

- 更直观的尺寸控制
- 避免因padding和border导致的布局溢出
- 更容易实现响应式设计
- 计算更简单，所见即所得

## 2. Position定位

### position的取值及表现形式

| 值       | 表现形式           | 特点                                      |
| -------- | ------------------ | ----------------------------------------- |
| static   | 默认值，正常文档流 | 不能使用top、right、bottom、left          |
| relative | 相对定位           | 相对于自身原位置偏移，不脱离文档流        |
| absolute | 绝对定位           | 相对于最近的非static祖先元素，脱离文档流  |
| fixed    | 固定定位           | 相对于视口固定，脱离文档流                |
| sticky   | 粘性定位           | 在滚动范围内表现为relative，超出后为fixed |

```css
.relative {
    position: relative;
    top: 10px;
    left: 20px;
}

.absolute {
    position: absolute;
    top: 0;
    right: 0;
}

.fixed {
    position: fixed;
    bottom: 20px;
    right: 20px;
}

.sticky {
    position: sticky;
    top: 0;
}
```

## 3. 子元素水平垂直居中

### 方法一：Flexbox（推荐）

```css
.flex-center {
    display: flex;
    justify-content: center;
    align-items: center;
}
```

### 方法二：Grid布局

```css
.grid-center {
    display: grid;
    place-items: center;
}
```

### 方法三：绝对定位 + transform

```css
.absolute-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
```

### 方法四：绝对定位 + margin

```css
.absolute-margin {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin: auto;
    width: 100px;
    height: 100px;
}
```

## 4. CSS选择器及优先级

### 选择器类型

1. **基础选择器**：元素、类、ID、通配符
2. **组合选择器**：后代、子代、相邻兄弟、通用兄弟
3. **属性选择器**：[attr]、[attr=value]等
4. **伪类选择器**：:hover、:focus、:nth-child等
5. **伪元素选择器**：::before、::after等

### 优先级计算

优先级从高到低：

1. !important
2. 内联样式（1000）
3. ID选择器（100）
4. 类选择器、属性选择器、伪类（10）
5. 元素选择器、伪元素（1）

```css
/* 优先级示例 */
#header .nav li:hover { /* 100 + 10 + 1 + 10 = 121 */ }
.nav li.active { /* 10 + 1 + 10 = 21 */ }
li { /* 1 */ }
```

## 5. Flex布局

### 容器属性

```css
.flex-container {
    display: flex;
    flex-direction: row | row-reverse | column | column-reverse;
    flex-wrap: nowrap | wrap | wrap-reverse;
    justify-content: flex-start | flex-end | center | space-between | space-around | space-evenly;
    align-items: stretch | flex-start | flex-end | center | baseline;
    align-content: flex-start | flex-end | center | space-between | space-around | stretch;
}
```

### 项目属性

```css
.flex-item {
    flex-grow: 1; /* 放大比例 */
    flex-shrink: 1; /* 缩小比例 */
    flex-basis: auto; /* 分配多余空间前的主轴空间 */
    flex: 1 1 auto; /* 简写 */
    align-self: auto | flex-start | flex-end | center | baseline | stretch;
    order: 0; /* 排列顺序 */
}
```

### flex-grow、flex-shrink、flex-basis详解

- **flex-basis**：设置项目的初始主轴尺寸
- **flex-grow**：当有剩余空间时的放大比例
- **flex-shrink**：当空间不足时的缩小比例

```css
/* 如果flex-basis设定了固定值，仍然可能被grow/shrink影响 */
.item {
    flex-basis: 200px; /* 初始宽度200px */
    flex-grow: 1; /* 有剩余空间时会放大 */
    flex-shrink: 1; /* 空间不足时会缩小 */
}

### flex设置为1的效果
```

## 6. CSS实现三角形

### 方法一：border技巧

```css
.triangle {
    width: 0;
    height: 0;
    border-left: 50px solid transparent;
    border-right: 50px solid transparent;
    border-bottom: 100px solid #f00;
}
```

### 方法二：伪元素

```css
.triangle::before {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 25px 43px 25px;
    border-color: transparent transparent #f00 transparent;
}
```

## 7. 文档流

### 什么是文档流

文档流是指元素在HTML文档中的默认布局方式，按照从上到下、从左到右的顺序排列。

### 常见的文档流

1. **普通文档流**：块级元素垂直排列，内联元素水平排列
2. **浮动文档流**：float属性创建的布局流
3. **定位文档流**：position属性创建的布局流

### 脱离文档流的方式

1. **float**：浮动元素脱离文档流
2. **position: absolute/fixed**：绝对定位和固定定位
3. **display: none**：完全移除元素

## 8. Grid布局

### 基础概念

#### 什么是Grid布局？

CSS Grid布局是一个二维布局系统，可以同时处理行和列。与Flexbox（一维布局）不同，Grid可以创建复杂的网格结构，非常适合构建整体页面布局。

#### Grid的基本术语

- **Grid Container（网格容器）**：设置了`display: grid`的元素
- **Grid Item（网格项）**：网格容器的直接子元素
- **Grid Line（网格线）**：构成网格结构的分割线
- **Grid Track（网格轨道）**：两条相邻网格线之间的空间
- **Grid Cell（网格单元）**：两条相邻行线和两条相邻列线之间的空间
- **Grid Area（网格区域）**：由四条网格线围成的区域

### 容器属性详解

#### 基础设置

```css
.grid-container {
    display: grid; /* 或 inline-grid */
}
```

#### 定义网格轨道

**grid-template-columns 和 grid-template-rows**

```css
.grid-container {
    /* 定义3列，每列宽度不同 */
    grid-template-columns: 200px 1fr 100px;
    
    /* 定义2行，固定高度 */
    grid-template-rows: 100px 200px;
    
    /* 使用repeat()函数 */
    grid-template-columns: repeat(3, 1fr); /* 3列等宽 */
    grid-template-columns: repeat(2, 100px 200px); /* 重复模式：100px 200px 100px 200px */
    
    /* 使用minmax()函数 */
    grid-template-columns: minmax(100px, 1fr) 200px; /* 第一列最小100px，最大1fr */
    
    /* 使用auto-fit 和 auto-fill */
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* 自适应列数 */
    grid-template-columns: repeat(auto-fill, 200px); /* 自动填充 */
}
```

**单位说明**

- **fr（fraction）**：剩余空间的比例单位
- **auto**：根据内容自动调整大小
- **min-content**：内容的最小尺寸
- **max-content**：内容的最大尺寸

#### 网格区域命名

```css
.grid-container {
    grid-template-areas: 
        "header header header"
        "sidebar main main"
        "footer footer footer";
    grid-template-columns: 200px 1fr 200px;
    grid-template-rows: 80px 1fr 60px;
}
```

#### 间距设置

```css
.grid-container {
    /* 统一设置行列间距 */
    gap: 20px;
    
    /* 分别设置 */
    row-gap: 20px;
    column-gap: 30px;
    
    /* 简写 */
    gap: 20px 30px; /* 行间距 列间距 */
}
```

#### 对齐方式

```css
.grid-container {
    /* 网格项在单元格内的对齐 */
    justify-items: start | end | center | stretch; /* 水平对齐 */
    align-items: start | end | center | stretch; /* 垂直对齐 */
    place-items: center; /* 简写：align-items justify-items */
    
    /* 整个网格在容器中的对齐 */
    justify-content: start | end | center | stretch | space-around | space-between | space-evenly;
    align-content: start | end | center | stretch | space-around | space-between | space-evenly;
    place-content: center; /* 简写：align-content justify-content */
}
```

#### 隐式网格

```css
.grid-container {
    /* 隐式网格轨道大小 */
    grid-auto-rows: 100px; /* 自动创建的行高度 */
    grid-auto-columns: 200px; /* 自动创建的列宽度 */
    
    /* 自动放置算法 */
    grid-auto-flow: row | column | row dense | column dense;
}
```

### 项目属性详解

#### 基于网格线的定位

```css
.grid-item {
    /* 基于网格线编号 */
    grid-column-start: 1;
    grid-column-end: 3;
    grid-row-start: 1;
    grid-row-end: 2;
    
    /* 简写形式 */
    grid-column: 1 / 3; /* 从第1条线到第3条线 */
    grid-row: 1 / 2;
    
    /* 使用span关键字 */
    grid-column: 1 / span 2; /* 从第1条线开始，跨越2列 */
    grid-row: span 2; /* 跨越2行 */
    
    /* 使用网格线名称 */
    grid-column: start / end;
}
```

#### 基于网格区域的定位

```css
.grid-item {
    grid-area: header; /* 使用命名区域 */
    grid-area: 1 / 1 / 2 / 4; /* 简写：row-start / column-start / row-end / column-end */
}
```

#### 单个项目的对齐

```css
.grid-item {
    justify-self: start | end | center | stretch; /* 水平对齐 */
    align-self: start | end | center | stretch; /* 垂直对齐 */
    place-self: center; /* 简写 */
}
```

### 实际应用示例

#### 示例1：经典网页布局

```css
.page-layout {
    display: grid;
    grid-template-areas: 
        "header header header"
        "nav main aside"
        "footer footer footer";
    grid-template-columns: 200px 1fr 200px;
    grid-template-rows: 80px 1fr 60px;
    min-height: 100vh;
    gap: 10px;
}

.header { grid-area: header; }
.nav { grid-area: nav; }
.main { grid-area: main; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }
```

#### 示例2：响应式卡片布局

```css
.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    padding: 20px;
}

.card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
```

#### 示例3：复杂的图片画廊

```css
.gallery {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(3, 200px);
    gap: 10px;
}

.gallery-item:nth-child(1) {
    grid-column: 1 / 3;
    grid-row: 1 / 3;
}

.gallery-item:nth-child(2) {
    grid-column: 3 / 5;
    grid-row: 1 / 2;
}

.gallery-item:nth-child(3) {
    grid-column: 3 / 4;
    grid-row: 2 / 4;
}

.gallery-item:nth-child(4) {
    grid-column: 4 / 5;
    grid-row: 2 / 4;
}

.gallery-item:nth-child(5) {
    grid-column: 1 / 2;
    grid-row: 3 / 4;
}

.gallery-item:nth-child(6) {
    grid-column: 2 / 3;
    grid-row: 3 / 4;
}
```

### 响应式Grid布局

#### 媒体查询结合Grid

```css
.responsive-grid {
    display: grid;
    gap: 20px;
    
    /* 移动端：单列布局 */
    grid-template-columns: 1fr;
    grid-template-areas: 
        "header"
        "main"
        "sidebar"
        "footer";
}

@media (min-width: 768px) {
    .responsive-grid {
        /* 平板：两列布局 */
        grid-template-columns: 1fr 300px;
        grid-template-areas: 
            "header header"
            "main sidebar"
            "footer footer";
    }
}

@media (min-width: 1024px) {
    .responsive-grid {
        /* 桌面：三列布局 */
        grid-template-columns: 200px 1fr 300px;
        grid-template-areas: 
            "header header header"
            "nav main sidebar"
            "footer footer footer";
    }
}
```

#### 自适应列数

```css
.auto-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

/* auto-fit vs auto-fill 的区别 */
.auto-fit-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    /* 如果容器宽度大于所需宽度，列会拉伸填满 */
}

.auto-fill-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    /* 如果容器宽度大于所需宽度，会创建空列 */
}
```

### Grid vs Flexbox 对比

| 特性 | Grid | Flexbox |
|------|------|---------|
| 维度 | 二维（行+列） | 一维（行或列） |
| 适用场景 | 整体布局、复杂布局 | 组件内部布局、简单对齐 |
| 浏览器支持 | IE11+（部分支持） | IE10+ |
| 学习曲线 | 较陡峭 | 相对简单 |

### 常见问题和解决方案

#### 1. 网格项溢出问题

```css
.grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
}

.grid-item {
    /* 防止内容溢出 */
    min-width: 0;
    overflow: hidden;
}
```

#### 2. 等高列问题

```css
.equal-height-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    align-items: stretch; /* 默认值，确保等高 */
}
```

#### 3. 子网格（Subgrid）

```css
/* CSS Grid Level 2 特性，浏览器支持有限 */
.subgrid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
}

.subgrid-item {
    display: grid;
    grid-template-columns: subgrid; /* 继承父网格的列定义 */
}
```

### 性能考虑

- **避免过度嵌套**：过多的嵌套网格会影响性能
- **合理使用auto-fit/auto-fill**：在大数据量时要注意性能
- **优化重排重绘**：避免频繁改变grid属性

### 浏览器兼容性

- **现代浏览器**：完全支持
- **IE11**：支持旧版本语法（`-ms-`前缀）
- **移动端**：iOS Safari 10.3+，Android Chrome 57+

### 实用工具和资源

- **Firefox Grid Inspector**：最佳的Grid调试工具
- **Chrome DevTools**：Grid overlay功能
- **CSS Grid Generator**：在线Grid代码生成器

## 9. BFC（块格式化上下文）

### 什么是BFC

BFC是Web页面的可视化CSS渲染的一部分，是块盒子的布局过程发生的区域，也是浮动元素与其他元素交互的区域。

### 触发BFC的条件

1. 根元素（html）
2. float不为none
3. position为absolute或fixed
4. display为inline-block、table-cell、flex、grid等
5. overflow不为visible

### BFC的特性

1. 内部的Box会在垂直方向一个接一个排列
2. 垂直方向的距离由margin决定，相邻的margin会重叠
3. BFC的区域不会与float box重叠
4. 计算BFC高度时，浮动元素也参与计算

## 10. CSS两列布局

### 方法一：float + margin

```css
.left {
    float: left;
    width: 200px;
}
.right {
    margin-left: 200px;
}
```

### 方法二：flex布局

```css
.container {
    display: flex;
}
.left {
    width: 200px;
}
.right {
    flex: 1;
}
```

### 方法三：grid布局

```css
.container {
    display: grid;
    grid-template-columns: 200px 1fr;
}
```

## 11. 通过CSS类名切换自定义皮肤

### CSS变量方案

```css
:root {
    --primary-color: #007bff;
    --bg-color: #ffffff;
}

[data-theme="dark"] {
    --primary-color: #0d6efd;
    --bg-color: #121212;
}

.button {
    background-color: var(--primary-color);
    color: var(--bg-color);
}
```

### 类名切换方案

```css
.theme-light .header {
    background: #fff;
    color: #333;
}

.theme-dark .header {
    background: #333;
    color: #fff;
}
```

## 12. 左边固定，右边自适应

### 方法一：float + overflow

```css
.left {
    float: left;
    width: 200px;
}
.right {
    overflow: hidden;
}
```

### 方法二：flex布局

```css
.container {
    display: flex;
}
.left {
    width: 200px;
    flex-shrink: 0;
}
.right {
    flex: 1;
}
```

### 方法三：绝对定位

```css
.left {
    position: absolute;
    left: 0;
    width: 200px;
}
.right {
    margin-left: 200px;
}
```

## 13. 伪元素和伪类

### 伪类（Pseudo-classes）

选择器，用于选择特定状态的元素

```css
a:hover { color: red; }
li:nth-child(2) { font-weight: bold; }
input:focus { border-color: blue; }
```

### 伪元素（Pseudo-elements）

创建虚拟元素，用于样式化元素的特定部分

```css
p::first-line { font-weight: bold; }
p::before { content: "前缀"; }
p::after { content: "后缀"; }
```

### 主要区别

- 伪类用单冒号（:），伪元素用双冒号（::）
- 伪类选择现有元素的状态，伪元素创建新的虚拟元素
- 伪元素可以插入内容，伪类不能

## 14. 动画实现元素位移

### 推荐使用transform

```css
/* 推荐：使用transform */
.move-transform {
    transform: translateX(100px);
    transition: transform 0.3s ease;
}

/* 不推荐：使用left/top */
.move-position {
    left: 100px;
    transition: left 0.3s ease;
}
```

### 原因

- **性能更好**：transform不触发重排（reflow）
- **硬件加速**：可以利用GPU加速
- **更流畅**：避免了布局计算

## 15. Display的值及表现形式

| 值           | 表现形式               |
| ------------ | ---------------------- |
| block        | 块级元素，独占一行     |
| inline       | 内联元素，不可设置宽高 |
| inline-block | 内联块元素，可设置宽高 |
| flex         | 弹性盒子容器           |
| grid         | 网格容器               |
| table        | 表格元素               |
| none         | 不显示，不占空间       |

## 16. rem的理解

### 定义

rem是相对于根元素（html）字体大小的单位。

### 使用场景

```css
html {
    font-size: 16px;
}

.title {
    font-size: 2rem; /* 32px */
    margin: 1rem; /* 16px */
}
```

### 响应式设计

```css
/* 移动端适配 */
@media (max-width: 768px) {
    html {
        font-size: 14px;
    }
}
```

## 17. CSS变量

### 定义和使用

```css
:root {
    --main-color: #007bff;
    --padding: 16px;
}

.button {
    background-color: var(--main-color);
    padding: var(--padding);
}
```

### 动态修改

```javascript
document.documentElement.style.setProperty('--main-color', '#ff0000');
```

### 优势

- 减少代码重复
- 便于主题切换
- 支持继承和级联
- 可以通过JavaScript动态修改

## 18. 相邻节点选择器

### 选择器操作符

```css
/* 相邻兄弟选择器 */
h1 + p { margin-top: 0; }

/* 通用兄弟选择器 */
h1 ~ p { color: gray; }

/* 子选择器 */
div > p { font-weight: bold; }

/* 后代选择器 */
div p { line-height: 1.5; }
```

## 19. 响应式布局实现

### 媒体查询

```css
/* 移动优先 */
.container {
    width: 100%;
}

@media (min-width: 768px) {
    .container {
        width: 750px;
    }
}

@media (min-width: 1200px) {
    .container {
        width: 1170px;
    }
}
```

### 弹性布局

```css
.container {
    display: flex;
    flex-wrap: wrap;
}

.item {
    flex: 1 1 300px;
    min-width: 0;
}
```

### Grid响应式

```css
.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}
```

## 20. 相对单位

### 常见相对单位

- **em**：相对于当前元素的字体大小
- **rem**：相对于根元素的字体大小
- **%**：相对于父元素的对应属性
- **vw/vh**：相对于视口宽度/高度的1%
- **vmin/vmax**：相对于视口较小/较大边的1%

### 使用示例

```css
.responsive {
    width: 50%; /* 相对于父元素宽度 */
    font-size: 1.2em; /* 相对于当前字体大小 */
    padding: 2rem; /* 相对于根元素字体大小 */
    height: 50vh; /* 相对于视口高度 */
}
```

## 21. CSS动画实现

### Transition过渡

```css
.transition {
    transition: all 0.3s ease-in-out;
}

.transition:hover {
    transform: scale(1.1);
    background-color: #f0f0f0;
}
```

### Animation关键帧动画

```css
@keyframes slideIn {
    from {
        transform: translateX(-100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.animate {
    animation: slideIn 0.5s ease-out;
}
```

#### Animation详细用法

##### 1. @keyframes 关键帧定义方式

```css
/* 方式一：使用 from 和 to */
@keyframes slideIn {
    from {
        transform: translateX(-100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* 方式二：使用百分比 */
@keyframes bounce {
    0% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-20px);
    }
    100% {
        transform: translateY(0);
    }
}

/* 方式三：多个关键帧 */
@keyframes colorChange {
    0% { background-color: red; }
    25% { background-color: yellow; }
    50% { background-color: blue; }
    75% { background-color: green; }
    100% { background-color: red; }
}
```

##### 2. Animation属性详解

**完整语法：**
```css
animation: name duration timing-function delay iteration-count direction fill-mode play-state;
```

**各个属性说明：**

- **animation-name**：指定@keyframes的名称
- **animation-duration**：动画持续时间（s或ms）
- **animation-timing-function**：动画速度曲线
- **animation-delay**：动画延迟时间
- **animation-iteration-count**：动画播放次数
- **animation-direction**：动画播放方向
- **animation-fill-mode**：动画填充模式
- **animation-play-state**：动画播放状态

```css
.element {
    /* 动画名称 */
    animation-name: slideIn;
    
    /* 动画持续时间 */
    animation-duration: 2s; /* 2秒 */
    
    /* 动画速度曲线 */
    animation-timing-function: ease; /* ease | linear | ease-in | ease-out | ease-in-out | cubic-bezier() */
    
    /* 动画延迟时间 */
    animation-delay: 1s; /* 延迟1秒开始 */
    
    /* 动画播放次数 */
    animation-iteration-count: 3; /* 播放3次 | infinite 无限循环 */
    
    /* 动画播放方向 */
    animation-direction: normal; /* normal | reverse | alternate | alternate-reverse */
    
    /* 动画填充模式 */
    animation-fill-mode: forwards; /* none | forwards | backwards | both */
    
    /* 动画播放状态 */
    animation-play-state: running; /* running | paused */
}
```

##### 3. 实际应用示例

**淡入动画：**
```css
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.fade-in {
    animation: fadeIn 0.6s ease-out;
}
```

**旋转加载动画：**
```css
@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.loading {
    animation: spin 1s linear infinite;
}
```

**心跳动画：**
```css
@keyframes heartbeat {
    0% {
        transform: scale(1);
    }
    14% {
        transform: scale(1.3);
    }
    28% {
        transform: scale(1);
    }
    42% {
        transform: scale(1.3);
    }
    70% {
        transform: scale(1);
    }
}

.heartbeat {
    animation: heartbeat 1.5s ease-in-out infinite;
}
```

**多重动画组合：**
```css
.element {
    animation: 
        slideIn 1s ease-out,
        fadeIn 1s ease-out,
        bounce 2s ease-in-out 1s infinite;
}
```

##### 4. 动画事件监听

```javascript
const element = document.querySelector('.animate');

// 动画开始事件
element.addEventListener('animationstart', () => {
    console.log('动画开始');
});

// 动画结束事件
element.addEventListener('animationend', () => {
    console.log('动画结束');
});

// 动画重复事件
element.addEventListener('animationiteration', () => {
    console.log('动画重复');
});

// 控制动画播放状态
element.style.animationPlayState = 'paused'; // 暂停
element.style.animationPlayState = 'running'; // 播放
```

##### 5. 性能优化建议

- **使用transform和opacity**：这些属性不会触发重排重绘
- **避免动画width/height**：会引起布局重计算
- **使用will-change属性**：提前告知浏览器优化
- **合理使用硬件加速**：transform3d()可触发GPU加速

```css
.optimized-animation {
    will-change: transform;
    transform: translateZ(0); /* 强制开启硬件加速 */
}
```

## 总结

这些CSS知识点涵盖了前端开发中最重要的概念和技术。在面试中，建议：

1. **理解原理**：不仅要知道怎么用，还要知道为什么这样用
2. **实践经验**：结合具体项目经验来回答
3. **性能考虑**：了解不同方案的性能差异
4. **兼容性**：了解各种技术的浏览器支持情况
5. **最佳实践**：掌握业界推荐的最佳实践方案

掌握这些知识点，能够应对大部分CSS相关的面试问题。

