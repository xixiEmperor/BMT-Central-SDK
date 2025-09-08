# HTML面试知识点整理

## 1. HTML语义化

### 什么是HTML语义化
HTML语义化是指使用恰当的HTML标签来描述内容的含义和结构，而不仅仅是为了样式展示。

### 语义化的好处
1. **提高可读性**：代码更易于理解和维护
2. **SEO优化**：搜索引擎更好地理解页面内容
3. **无障碍访问**：屏幕阅读器等辅助技术能更好地解析内容
4. **设备兼容性**：在不同设备上都能良好显示
5. **团队协作**：统一的语义标准便于团队开发

### 常用语义化标签
```html
<!-- 页面结构 -->
<header>页面头部</header>
<nav>导航栏</nav>
<main>主要内容</main>
<section>章节</section>
<article>文章</article>
<aside>侧边栏</aside>
<footer>页面底部</footer>

<!-- 内容语义 -->
<h1>主标题</h1>
<h2>副标题</h2>
<p>段落</p>
<strong>重要内容</strong>
<em>强调内容</em>
<mark>标记内容</mark>
<time>时间</time>
<address>地址信息</address>

<!-- 列表 -->
<ul>无序列表</ul>
<ol>有序列表</ol>
<dl>定义列表</dl>

<!-- 表格 -->
<table>
  <thead>表头</thead>
  <tbody>表体</tbody>
  <tfoot>表尾</tfoot>
</table>
```

### 语义化实践示例
```html
<!-- 不好的做法 -->
<div class="header">
  <div class="nav">导航</div>
</div>
<div class="content">
  <div class="article">文章内容</div>
</div>

<!-- 好的做法 -->
<header>
  <nav>
    <ul>
      <li><a href="#home">首页</a></li>
      <li><a href="#about">关于</a></li>
    </ul>
  </nav>
</header>
<main>
  <article>
    <h1>文章标题</h1>
    <p>文章内容</p>
  </article>
</main>
```

## 2. DOCTYPE声明

### 什么是DOCTYPE
DOCTYPE是文档类型声明，告诉浏览器使用哪种HTML或XHTML规范来解析文档。

### HTML5的DOCTYPE
```html
<!DOCTYPE html>
```

### 不同DOCTYPE的影响
```html
<!-- HTML5 -->
<!DOCTYPE html>

<!-- HTML 4.01 Strict -->
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" 
"http://www.w3.org/TR/html4/strict.dtd">

<!-- HTML 4.01 Transitional -->
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" 
"http://www.w3.org/TR/html4/loose.dtd">

<!-- XHTML 1.0 Strict -->
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" 
"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
```

### DOCTYPE的作用
1. **触发标准模式**：确保浏览器使用标准模式渲染
2. **避免怪异模式**：防止浏览器进入兼容模式
3. **统一渲染行为**：不同浏览器表现一致

### 标准模式 vs 怪异模式
- **标准模式**：按照W3C标准渲染页面
- **怪异模式**：模拟老版本浏览器的行为
- **近标准模式**：介于两者之间

## 3. 块级元素和内联元素

### 块级元素（Block-level Elements）
独占一行，可以设置宽高、内外边距。

```html
<!-- 常见块级元素 -->
<div>通用容器</div>
<p>段落</p>
<h1>-<h6>标题</h6>
<ul>、<ol>、<li>列表</li>
<table>表格</table>
<form>表单</form>
<header>、<footer>、<nav>、<section>、<article>
```

### 内联元素（Inline Elements）
不独占一行，不能设置宽高。

```html
<!-- 常见内联元素 -->
<span>通用内联容器</span>
<a>链接</a>
<img>图片</img>
<input>输入框</input>
<strong>、<em>、<b>、<i>文本格式</i>
<label>标签</label>
```

### 内联块元素（Inline-block Elements）
结合了内联和块级元素的特点。

```html
<!-- 内联块元素 -->
<img>图片</img>
<input>输入框</input>
<button>按钮</button>
```

### 元素类型转换
```css
/* 转换为块级元素 */
span {
    display: block;
}

/* 转换为内联元素 */
div {
    display: inline;
}

/* 转换为内联块元素 */
div {
    display: inline-block;
}
```

### 特点对比
| 特性 | 块级元素 | 内联元素 | 内联块元素 |
|------|----------|----------|------------|
| 独占一行 | 是 | 否 | 否 |
| 可设置宽高 | 是 | 否 | 是 |
| 可设置margin/padding | 是 | 水平方向可以 | 是 |
| 默认宽度 | 父元素100% | 内容宽度 | 内容宽度 |

## 4. HTML5新特性

### 新增语义化标签
```html
<!-- 结构标签 -->
<header>头部</header>
<nav>导航</nav>
<main>主要内容</main>
<section>章节</section>
<article>文章</article>
<aside>侧边栏</aside>
<footer>底部</footer>
<figure>图表</figure>
<figcaption>图表标题</figcaption>

<!-- 内容标签 -->
<mark>标记文本</mark>
<time>时间</time>
<progress>进度条</progress>
<meter>度量</meter>
<details>详情</details>
<summary>摘要</summary>
```

### 新增表单元素
```html
<!-- 新输入类型 -->
<input type="email" placeholder="邮箱">
<input type="url" placeholder="网址">
<input type="tel" placeholder="电话">
<input type="number" min="0" max="100">
<input type="range" min="0" max="100">
<input type="date">
<input type="time">
<input type="datetime-local">
<input type="month">
<input type="week">
<input type="color">
<input type="search">

<!-- 新表单属性 -->
<input type="text" placeholder="占位符" required>
<input type="email" pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$">
<input type="text" autofocus>
<input type="text" autocomplete="off">
```

### 多媒体元素
```html
<!-- 音频 -->
<audio controls>
  <source src="audio.mp3" type="audio/mpeg">
  <source src="audio.ogg" type="audio/ogg">
  您的浏览器不支持音频播放
</audio>

<!-- 视频 -->
<video width="320" height="240" controls>
  <source src="video.mp4" type="video/mp4">
  <source src="video.webm" type="video/webm">
  您的浏览器不支持视频播放
</video>

<!-- 画布 -->
<canvas id="myCanvas" width="200" height="100"></canvas>
```

### 新增API
```javascript
// 本地存储
localStorage.setItem('key', 'value');
sessionStorage.setItem('key', 'value');

// 地理位置
navigator.geolocation.getCurrentPosition(success, error);

// 拖拽API
element.addEventListener('dragstart', handleDragStart);

// Web Workers
const worker = new Worker('worker.js');

// WebSocket
const socket = new WebSocket('ws://localhost:8080');
```

## 5. meta标签

### 基本meta标签
```html
<!-- 字符编码 -->
<meta charset="UTF-8">

<!-- 视口设置 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- 页面描述 -->
<meta name="description" content="页面描述，用于SEO">

<!-- 关键词 -->
<meta name="keywords" content="关键词1,关键词2,关键词3">

<!-- 作者 -->
<meta name="author" content="作者姓名">

<!-- 版权信息 -->
<meta name="copyright" content="版权信息">
```

### SEO相关meta标签
```html
<!-- 搜索引擎索引控制 -->
<meta name="robots" content="index,follow">
<meta name="robots" content="noindex,nofollow">

<!-- 页面刷新和重定向 -->
<meta http-equiv="refresh" content="30">
<meta http-equiv="refresh" content="0;url=https://example.com">

<!-- 缓存控制 -->
<meta http-equiv="cache-control" content="no-cache">
<meta http-equiv="expires" content="Wed, 26 Feb 1997 08:21:57 GMT">
```

### 移动端meta标签
```html
<!-- 视口设置 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

<!-- iOS Safari -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-mobile-web-app-title" content="应用标题">

<!-- Android Chrome -->
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#000000">
```

### 社交媒体meta标签
```html
<!-- Open Graph (Facebook) -->
<meta property="og:title" content="页面标题">
<meta property="og:description" content="页面描述">
<meta property="og:image" content="图片URL">
<meta property="og:url" content="页面URL">
<meta property="og:type" content="website">

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="页面标题">
<meta name="twitter:description" content="页面描述">
<meta name="twitter:image" content="图片URL">
```

## 6. 表单相关

### 表单基础结构
```html
<form action="/submit" method="post" enctype="multipart/form-data">
  <fieldset>
    <legend>个人信息</legend>
    
    <label for="name">姓名：</label>
    <input type="text" id="name" name="name" required>
    
    <label for="email">邮箱：</label>
    <input type="email" id="email" name="email" required>
    
    <label for="age">年龄：</label>
    <input type="number" id="age" name="age" min="18" max="100">
    
    <button type="submit">提交</button>
  </fieldset>
</form>
```

### 表单输入类型
```html
<!-- 文本输入 -->
<input type="text" placeholder="文本">
<input type="password" placeholder="密码">
<input type="email" placeholder="邮箱">
<input type="url" placeholder="网址">
<input type="tel" placeholder="电话">

<!-- 数字输入 -->
<input type="number" min="0" max="100" step="1">
<input type="range" min="0" max="100" value="50">

<!-- 日期时间 -->
<input type="date">
<input type="time">
<input type="datetime-local">
<input type="month">
<input type="week">

<!-- 选择输入 -->
<input type="radio" name="gender" value="male" id="male">
<label for="male">男</label>
<input type="radio" name="gender" value="female" id="female">
<label for="female">女</label>

<input type="checkbox" name="hobby" value="reading" id="reading">
<label for="reading">阅读</label>

<!-- 文件上传 -->
<input type="file" accept="image/*" multiple>

<!-- 其他 -->
<input type="color">
<input type="search">
<input type="hidden" value="hidden_value">
```

### 表单验证
```html
<!-- HTML5内置验证 -->
<input type="email" required>
<input type="url" required>
<input type="number" min="18" max="65" required>
<input type="text" pattern="[A-Za-z]{3,}" title="至少3个字母">
<input type="text" minlength="6" maxlength="12">

<!-- 自定义验证消息 -->
<input type="email" required oninvalid="this.setCustomValidity('请输入有效的邮箱地址')" oninput="this.setCustomValidity('')">
```

### 表单元素
```html
<!-- 下拉选择 -->
<select name="city" required>
  <option value="">请选择城市</option>
  <option value="beijing">北京</option>
  <option value="shanghai">上海</option>
  <optgroup label="广东省">
    <option value="guangzhou">广州</option>
    <option value="shenzhen">深圳</option>
  </optgroup>
</select>

<!-- 多行文本 -->
<textarea name="message" rows="4" cols="50" placeholder="请输入留言"></textarea>

<!-- 按钮 -->
<button type="submit">提交</button>
<button type="reset">重置</button>
<button type="button">普通按钮</button>
<input type="submit" value="提交">
<input type="reset" value="重置">
<input type="button" value="按钮">
```

## 7. 页面性能优化

### 资源优化
```html
<!-- 预加载关键资源 -->
<link rel="preload" href="critical.css" as="style">
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>

<!-- 预连接外部域名 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://cdn.example.com">

<!-- 延迟加载非关键资源 -->
<script src="script.js" defer></script>
<script src="script.js" async></script>

<!-- 图片懒加载 -->
<img src="placeholder.jpg" data-src="actual.jpg" loading="lazy" alt="图片描述">
```

### 图片优化
```html
<!-- 响应式图片 -->
<picture>
  <source media="(min-width: 800px)" srcset="large.jpg">
  <source media="(min-width: 400px)" srcset="medium.jpg">
  <img src="small.jpg" alt="响应式图片">
</picture>

<!-- 高密度屏幕适配 -->
<img src="image.jpg" srcset="image.jpg 1x, image@2x.jpg 2x" alt="高清图片">

<!-- WebP格式支持 -->
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="WebP图片">
</picture>
```

### 缓存策略
```html
<!-- 设置缓存 -->
<meta http-equiv="cache-control" content="max-age=3600">
<meta http-equiv="expires" content="Wed, 26 Feb 2025 08:21:57 GMT">

<!-- 版本控制 -->
<link rel="stylesheet" href="style.css?v=1.2.3">
<script src="script.js?v=1.2.3"></script>
```

## 8. SEO优化

### 基础SEO标签
```html
<!-- 页面标题 -->
<title>页面标题 - 网站名称</title>

<!-- 页面描述 -->
<meta name="description" content="页面描述，控制在150-160字符内">

<!-- 关键词（现在不太重要） -->
<meta name="keywords" content="关键词1,关键词2,关键词3">

<!-- 规范链接 -->
<link rel="canonical" href="https://example.com/page">

<!-- 语言声明 -->
<html lang="zh-CN">
```

### 结构化数据
```html
<!-- JSON-LD结构化数据 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "文章标题",
  "author": {
    "@type": "Person",
    "name": "作者姓名"
  },
  "datePublished": "2023-01-01",
  "description": "文章描述"
}
</script>

<!-- 微数据 -->
<div itemscope itemtype="https://schema.org/Person">
  <span itemprop="name">姓名</span>
  <span itemprop="jobTitle">职位</span>
</div>
```

### 链接优化
```html
<!-- 内部链接 -->
<a href="/about" title="关于我们">关于我们</a>

<!-- 外部链接 -->
<a href="https://example.com" rel="nofollow" target="_blank">外部链接</a>

<!-- 面包屑导航 -->
<nav aria-label="breadcrumb">
  <ol>
    <li><a href="/">首页</a></li>
    <li><a href="/category">分类</a></li>
    <li aria-current="page">当前页面</li>
  </ol>
</nav>
```

## 9. 无障碍访问（Accessibility）

### ARIA属性
```html
<!-- 角色定义 -->
<div role="button" tabindex="0">自定义按钮</div>
<nav role="navigation">导航区域</nav>
<main role="main">主要内容</main>

<!-- 状态属性 -->
<button aria-expanded="false">展开菜单</button>
<input type="checkbox" aria-checked="false">
<div aria-hidden="true">装饰性内容</div>

<!-- 标签关联 -->
<label for="search">搜索</label>
<input id="search" type="text" aria-describedby="search-help">
<div id="search-help">输入关键词进行搜索</div>
```

### 语义化和可访问性
```html
<!-- 标题层次 -->
<h1>页面主标题</h1>
<h2>章节标题</h2>
<h3>子章节标题</h3>

<!-- 跳转链接 -->
<a href="#main-content" class="skip-link">跳转到主要内容</a>

<!-- 表单标签 -->
<label for="email">邮箱地址</label>
<input type="email" id="email" required aria-describedby="email-error">
<div id="email-error" role="alert">请输入有效的邮箱地址</div>

<!-- 图片替代文本 -->
<img src="chart.jpg" alt="2023年销售数据图表显示增长20%">
<img src="decoration.jpg" alt="" role="presentation">
```

### 键盘导航
```html
<!-- 焦点管理 -->
<div tabindex="0">可聚焦的div</div>
<div tabindex="-1">程序控制聚焦</div>

<!-- 按键处理 -->
<div role="button" tabindex="0" 
     onkeydown="if(event.key==='Enter'||event.key===' ') handleClick()">
  自定义按钮
</div>
```

## 10. 浏览器兼容性

### 条件注释（IE）
```html
<!--[if IE]>
  <link rel="stylesheet" href="ie.css">
<![endif]-->

<!--[if lt IE 9]>
  <script src="html5shiv.js"></script>
  <script src="respond.min.js"></script>
<![endif]-->
```

### 功能检测
```html
<!-- Modernizr -->
<script src="modernizr.js"></script>
<div class="no-js">
  <p>请启用JavaScript</p>
</div>

<!-- 原生功能检测 -->
<script>
if ('serviceWorker' in navigator) {
  // 支持Service Worker
}

if (typeof Storage !== 'undefined') {
  // 支持本地存储
}
</script>
```

### 渐进增强
```html
<!-- 基础功能 -->
<form action="/submit" method="post">
  <input type="text" name="query" placeholder="搜索">
  <button type="submit">搜索</button>
</form>

<!-- 增强功能 -->
<script>
document.addEventListener('DOMContentLoaded', function() {
  // 添加AJAX提交
  const form = document.querySelector('form');
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    // AJAX提交逻辑
  });
});
</script>
```

## 11. 常见面试题

### 1. HTML5有哪些新特性？
**答案要点：**
- 新增语义化标签（header、nav、main、section、article、aside、footer）
- 新增表单输入类型（email、url、date、number、range等）
- 多媒体元素（audio、video、canvas）
- 本地存储（localStorage、sessionStorage）
- 新增API（地理位置、拖拽、Web Workers、WebSocket）
- 移除了一些过时的标签（font、center等）

### 2. 什么是语义化HTML？为什么要语义化？
**答案要点：**
- 使用恰当的HTML标签来描述内容的含义
- 好处：提高代码可读性、SEO优化、无障碍访问、设备兼容性
- 举例：使用h1-h6表示标题层次，使用p表示段落，使用nav表示导航

### 3. 块级元素和内联元素的区别？
**答案要点：**
- 块级元素：独占一行，可设置宽高，默认宽度100%
- 内联元素：不独占一行，不可设置宽高，宽度由内容决定
- 可以通过CSS的display属性转换

### 4. HTML5的离线存储是什么？
**答案要点：**
- Application Cache（已废弃）
- Service Worker + Cache API（现代方案）
- 本地存储：localStorage、sessionStorage
- IndexedDB用于大量数据存储

### 5. 如何优化HTML页面性能？
**答案要点：**
- 减少HTTP请求：合并文件、使用CSS Sprites
- 压缩资源：HTML、CSS、JavaScript压缩
- 使用CDN加速
- 图片优化：选择合适格式、懒加载、响应式图片
- 预加载关键资源：preload、prefetch

### 6. DOCTYPE的作用是什么？
**答案要点：**
- 声明文档类型，告诉浏览器使用哪种HTML规范
- 触发标准模式渲染
- HTML5使用简化的`<!DOCTYPE html>`

### 7. meta标签的作用？
**答案要点：**
- 提供页面元信息
- 常用：charset、viewport、description、keywords
- SEO优化：robots、canonical
- 移动端适配：viewport设置

### 8. 如何实现SEO优化？
**答案要点：**
- 语义化HTML结构
- 合理的标题层次（h1-h6）
- meta标签优化（title、description）
- 结构化数据标记
- 图片alt属性
- 内部链接优化

### 9. 什么是无障碍访问？
**答案要点：**
- 让残障人士也能正常使用网站
- 使用语义化标签
- 添加ARIA属性
- 图片alt文本
- 键盘导航支持
- 颜色对比度

### 10. HTML5表单新特性有哪些？
**答案要点：**
- 新输入类型：email、url、date、number等
- 新属性：placeholder、required、pattern、autofocus
- 内置验证功能
- 新元素：datalist、output、progress、meter

## 总结

HTML面试中的关键点：

1. **基础扎实**：掌握HTML基本概念和语法
2. **语义化思维**：理解语义化的重要性和实践
3. **现代特性**：了解HTML5的新特性和API
4. **性能优化**：掌握页面优化的基本方法
5. **用户体验**：考虑SEO和无障碍访问
6. **实践经验**：结合具体项目经验回答

在面试中，不仅要知道"是什么"，更要理解"为什么"和"怎么用"，并能结合实际项目经验来回答问题。 