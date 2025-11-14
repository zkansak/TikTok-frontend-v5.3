# HTML 面试八股文总结

## 1. HTML 语义化的理解

### 什么是 HTML 语义化？

HTML 语义化是指使用恰当的 HTML 标签来表达页面内容的含义，让 HTML 结构更加清晰、有意义，而不是仅仅用 `<div>` 和 `<span>` 来布局。

### 语义化标签的优势

1. **提升可访问性（Accessibility）**
   - 屏幕阅读器可以更好地理解页面结构
   - 帮助视障用户导航页面

2. **提升 SEO（搜索引擎优化）**
   - 搜索引擎更容易理解页面内容
   - 提高页面在搜索结果中的排名

3. **代码可维护性**
   - 代码结构更清晰，易于理解和维护
   - 团队协作更加高效

4. **样式和结构分离**
   - 即使没有 CSS，页面结构仍然清晰
   - 便于样式替换和重构

### 常用语义化标签

```html
<!-- 页面结构 -->
<header>     <!-- 页眉 -->
<nav>        <!-- 导航 -->
<main>       <!-- 主要内容 -->
<article>    <!-- 独立文章内容 -->
<section>    <!-- 文档中的节 -->
<aside>      <!-- 侧边栏 -->
<footer>     <!-- 页脚 -->

<!-- 文本内容 -->
<h1>-<h6>    <!-- 标题 -->
<p>          <!-- 段落 -->
<strong>     <!-- 强调（加粗）-->
<em>         <!-- 强调（斜体）-->
<blockquote> <!-- 块引用 -->
<code>       <!-- 代码 -->
<time>       <!-- 时间 -->
<address>    <!-- 地址 -->

<!-- 列表 -->
<ul>         <!-- 无序列表 -->
<ol>         <!-- 有序列表 -->
<li>         <!-- 列表项 -->
<dl>         <!-- 定义列表 -->
<dt>         <!-- 定义术语 -->
<dd>         <!-- 定义描述 -->

<!-- 表单 -->
<form>       <!-- 表单 -->
<fieldset>   <!-- 表单字段集 -->
<legend>     <!-- 字段集标题 -->
<label>      <!-- 标签 -->
<input>      <!-- 输入框 -->
<button>     <!-- 按钮 -->
<textarea>   <!-- 文本域 -->
<select>     <!-- 选择框 -->
```

### 语义化最佳实践

1. **合理使用标题标签**
   - 按照 h1 → h2 → h3 的层级使用
   - 一个页面通常只有一个 `<h1>`

2. **正确使用 `<article>` 和 `<section>`**
   - `<article>`：独立、完整的内容块（如博客文章、评论）
   - `<section>`：文档中的通用章节

3. **使用 `<nav>` 标识导航区域**
   - 主导航、面包屑导航、分页导航

4. **使用 `<header>` 和 `<footer>`**
   - 页面级别的页眉和页脚

---

## 2. script 标签中 defer 和 async 的区别

### 普通 script 标签（阻塞加载）

```html
<script src="script.js"></script>
```

- **执行时机**：立即下载并执行，阻塞 HTML 解析
- **执行顺序**：按照在文档中的顺序执行
- **DOM 就绪**：可能执行时 DOM 还未完全解析

### defer 属性（延迟执行）

```html
<script defer src="script.js"></script>
```

- **下载时机**：立即下载，但不阻塞 HTML 解析
- **执行时机**：等 HTML 解析完成后，在 `DOMContentLoaded` 之前执行
- **执行顺序**：按照在文档中的顺序执行
- **适用场景**：需要操作 DOM 的脚本，且不依赖其他脚本

**特点：**
- 多个 defer 脚本按顺序执行
- 不会阻塞页面渲染
- 保证执行顺序

### async 属性（异步执行）

```html
<script async src="script.js"></script>
```

- **下载时机**：立即下载，不阻塞 HTML 解析
- **执行时机**：下载完成后立即执行，可能在 HTML 解析完成之前
- **执行顺序**：不保证执行顺序（谁先下载完谁先执行）
- **适用场景**：独立的第三方脚本（如统计代码、广告脚本）

**特点：**
- 不阻塞页面渲染
- 不保证执行顺序
- 执行时机不确定

### 对比总结

| 特性 | 普通 script | defer | async |
|------|------------|-------|-------|
| 下载时机 | 立即下载并阻塞 | 立即下载不阻塞 | 立即下载不阻塞 |
| 执行时机 | 立即执行 | DOM 解析完成后 | 下载完成后立即执行 |
| 执行顺序 | 按顺序 | 按顺序 | 不保证顺序 |
| 阻塞渲染 | 是 | 否 | 否 |
| DOM 就绪 | 不确定 | 是 | 不确定 |

### 使用建议

1. **使用 defer**：当脚本需要操作 DOM，且需要保持执行顺序
2. **使用 async**：当脚本独立，不依赖 DOM，也不依赖其他脚本
3. **不使用属性**：当脚本必须立即执行，或者需要阻塞页面加载

---

## 3. HTML5 有哪些更新

### 3.1 语义化标签

新增了多个语义化标签，提升页面结构的可读性：

```html
<header>、<nav>、<main>、<article>、<section>、<aside>、<footer>
<figure>、<figcaption>、<mark>、<time>、<details>、<summary>
```

### 3.2 表单增强

#### 新的 input 类型

```html
<input type="email">      <!-- 邮箱 -->
<input type="url">        <!-- URL -->
<input type="number">     <!-- 数字 -->
<input type="range">      <!-- 范围滑块 -->
<input type="date">       <!-- 日期 -->
<input type="time">       <!-- 时间 -->
<input type="datetime-local"> <!-- 日期时间 -->
<input type="month">      <!-- 月份 -->
<input type="week">       <!-- 周 -->
<input type="color">      <!-- 颜色选择器 -->
<input type="search">     <!-- 搜索框 -->
<input type="tel">        <!-- 电话 -->
```

#### 新的表单属性

```html
<!-- 占位符 -->
<input placeholder="请输入内容">

<!-- 必填 -->
<input required>

<!-- 自动聚焦 -->
<input autofocus>

<!-- 自动完成 -->
<input autocomplete="on">

<!-- 模式验证 -->
<input pattern="[0-9]{4}">

<!-- 表单验证 -->
<form novalidate>  <!-- 禁用浏览器验证 -->
```

#### 新的表单元素

```html
<datalist>  <!-- 数据列表 -->
<output>    <!-- 输出结果 -->
<progress>  <!-- 进度条 -->
<meter>     <!-- 度量 -->
```

### 3.3 多媒体支持

```html
<!-- 视频 -->
<video controls>
  <source src="video.mp4" type="video/mp4">
  <source src="video.webm" type="video/webm">
  您的浏览器不支持视频播放
</video>

<!-- 音频 -->
<audio controls>
  <source src="audio.mp3" type="audio/mpeg">
  您的浏览器不支持音频播放
</audio>
```

### 3.4 Canvas 和 SVG

```html
<!-- Canvas 2D 绘图 -->
<canvas id="myCanvas" width="200" height="200"></canvas>

<!-- SVG 矢量图形 -->
<svg width="100" height="100">
  <circle cx="50" cy="50" r="40" stroke="black" fill="red" />
</svg>
```

### 3.5 Web Storage（本地存储）

- **localStorage**：永久存储，除非手动清除
- **sessionStorage**：会话存储，关闭标签页后清除

### 3.6 WebSocket

支持全双工通信，实现实时数据交互。

### 3.7 Geolocation API（地理位置）

```javascript
navigator.geolocation.getCurrentPosition(function(position) {
  console.log(position.coords.latitude, position.coords.longitude);
});
```

### 3.8 Web Worker（多线程）

允许在后台运行 JavaScript，不阻塞主线程。

### 3.9 History API

```javascript
// 添加历史记录
history.pushState(state, title, url);

// 替换当前历史记录
history.replaceState(state, title, url);

// 监听 popstate 事件
window.addEventListener('popstate', function(event) {
  console.log(event.state);
});
```

### 3.10 Drag and Drop API

支持拖拽功能：

```html
<div draggable="true" ondragstart="drag(event)">可拖拽元素</div>
<div ondrop="drop(event)" ondragover="allowDrop(event)">放置区域</div>
```

### 3.11 WebRTC

支持浏览器之间的实时通信。

### 3.12 其他更新

- **DOCTYPE 简化**：`<!DOCTYPE html>`
- **字符编码简化**：`<meta charset="UTF-8">`
- **新的全局属性**：`contenteditable`、`data-*`、`hidden`、`spellcheck`、`translate`

---

## 4. Web Worker

### 什么是 Web Worker？

Web Worker 是 HTML5 提供的多线程解决方案，允许在后台运行 JavaScript 代码，不阻塞主线程（UI 线程）。

### Web Worker 的特点

1. **独立的线程**：运行在独立的线程中，不会阻塞主线程
2. **无法访问 DOM**：不能直接操作 DOM 和 BOM
3. **通过消息通信**：使用 `postMessage()` 和 `onmessage` 进行通信
4. **有限的作用域**：只能访问部分全局对象（如 `navigator`、`location`）

### 使用方式

#### 创建 Worker

```javascript
// 主线程：main.js
const worker = new Worker('worker.js');

// 发送消息给 Worker
worker.postMessage('Hello Worker');

// 接收 Worker 的消息
worker.onmessage = function(event) {
  console.log('收到 Worker 消息：', event.data);
};

// 错误处理
worker.onerror = function(error) {
  console.error('Worker 错误：', error);
};

// 终止 Worker
worker.terminate();
```

#### Worker 脚本

```javascript
// worker.js
// 接收主线程消息
self.onmessage = function(event) {
  console.log('收到主线程消息：', event.data);
  
  // 执行耗时操作
  const result = heavyCalculation();
  
  // 发送结果回主线程
  self.postMessage(result);
};

// 关闭 Worker
self.close();
```

#### 内联 Worker（使用 Blob）

```javascript
// 创建内联 Worker
const blob = new Blob([`
  self.onmessage = function(event) {
    const result = event.data * 2;
    self.postMessage(result);
  };
`], { type: 'application/javascript' });

const worker = new Worker(URL.createObjectURL(blob));
worker.postMessage(10);
worker.onmessage = function(event) {
  console.log('结果：', event.data); // 20
};
```

### SharedWorker（共享 Worker）

多个页面可以共享同一个 Worker：

```javascript
// 创建 SharedWorker
const sharedWorker = new SharedWorker('shared-worker.js');

// 通过 port 通信
sharedWorker.port.postMessage('Hello');
sharedWorker.port.onmessage = function(event) {
  console.log(event.data);
};
```

### Worker 的应用场景

1. **大量数据计算**：图像处理、数据分析
2. **定时任务**：轮询、定时检查
3. **WebSocket 通信**：后台维持连接
4. **文件处理**：大文件解析、CSV 处理
5. **加密解密**：数据加密处理

### Worker 的限制

1. **无法访问 DOM**：不能操作页面元素
2. **无法访问 window 对象**：只能访问部分全局对象
3. **同源限制**：Worker 脚本必须与主页面同源
4. **无法使用某些 API**：如 `alert()`、`confirm()`、`localStorage`

---

## 5. HTML5 离线存储的使用和工作原理

### 5.1 Application Cache（已废弃）

**注意**：Application Cache 已经被废弃，不建议使用。

### 5.2 Service Worker + Cache API（推荐）

#### 使用方式

**1. 注册 Service Worker**

```javascript
// main.js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(function(registration) {
      console.log('Service Worker 注册成功');
    })
    .catch(function(error) {
      console.log('Service Worker 注册失败');
    });
}
```

**2. Service Worker 脚本**

```javascript
// sw.js
const CACHE_NAME = 'my-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/image.jpg'
];

// 安装 Service Worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // 如果缓存中有，返回缓存
        if (response) {
          return response;
        }
        // 否则从网络获取
        return fetch(event.request).then(function(response) {
          // 检查响应是否有效
          if (!response || response.status !== 200) {
            return response;
          }
          // 克隆响应
          const responseToCache = response.clone();
          // 存入缓存
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
  );
});

// 激活 Service Worker
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

#### 工作原理

1. **注册阶段**：浏览器注册 Service Worker
2. **安装阶段**：下载并缓存指定资源
3. **激活阶段**：激活 Service Worker，清理旧缓存
4. **拦截请求**：Service Worker 拦截网络请求
5. **缓存策略**：
   - **Cache First**：优先使用缓存
   - **Network First**：优先使用网络
   - **Stale While Revalidate**：使用缓存，同时在后台更新

### 5.3 IndexedDB（浏览器数据库）

#### 使用方式

```javascript
// 打开数据库
const request = indexedDB.open('myDatabase', 1);

request.onerror = function(event) {
  console.log('数据库打开失败');
};

request.onsuccess = function(event) {
  const db = event.target.result;
  console.log('数据库打开成功');
};

// 创建对象存储
request.onupgradeneeded = function(event) {
  const db = event.target.result;
  const objectStore = db.createObjectStore('users', { keyPath: 'id' });
  objectStore.createIndex('name', 'name', { unique: false });
};

// 添加数据
function addData(db, data) {
  const transaction = db.transaction(['users'], 'readwrite');
  const objectStore = transaction.objectStore('users');
  const request = objectStore.add(data);
  
  request.onsuccess = function() {
    console.log('数据添加成功');
  };
}

// 读取数据
function readData(db, id) {
  const transaction = db.transaction(['users'], 'readonly');
  const objectStore = transaction.objectStore('users');
  const request = objectStore.get(id);
  
  request.onsuccess = function() {
    console.log('数据：', request.result);
  };
}
```

### 5.4 LocalStorage 和 SessionStorage

```javascript
// localStorage（永久存储）
localStorage.setItem('key', 'value');
const value = localStorage.getItem('key');
localStorage.removeItem('key');
localStorage.clear();

// sessionStorage（会话存储）
sessionStorage.setItem('key', 'value');
const value = sessionStorage.getItem('key');
sessionStorage.removeItem('key');
sessionStorage.clear();
```

---

## 6. 浏览器对 HTML5 离线存储资源的管理和加载

### 6.1 Service Worker 缓存管理

#### 缓存策略

1. **Cache First（缓存优先）**
   ```javascript
   self.addEventListener('fetch', function(event) {
     event.respondWith(
       caches.match(event.request)
         .then(function(response) {
           return response || fetch(event.request);
         })
     );
   });
   ```

2. **Network First（网络优先）**
   ```javascript
   self.addEventListener('fetch', function(event) {
     event.respondWith(
       fetch(event.request)
         .catch(function() {
           return caches.match(event.request);
         })
     );
   });
   ```

3. **Stale While Revalidate（ stale-while-revalidate）**
   ```javascript
   self.addEventListener('fetch', function(event) {
     event.respondWith(
       caches.open(CACHE_NAME).then(function(cache) {
         return cache.match(event.request).then(function(response) {
           const fetchPromise = fetch(event.request).then(function(networkResponse) {
             cache.put(event.request, networkResponse.clone());
             return networkResponse;
           });
           return response || fetchPromise;
         });
       })
     );
   });
   ```

#### 缓存更新机制

```javascript
// 版本控制
const CACHE_NAME = 'my-cache-v2';

// 激活时清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

### 6.2 存储配额管理

#### 存储空间限制

- **LocalStorage**：通常 5-10MB
- **SessionStorage**：通常 5-10MB
- **IndexedDB**：通常为可用磁盘空间的 50%
- **Cache API**：通常为可用磁盘空间的 50%

#### 配额查询

```javascript
// 查询存储配额
navigator.storage.estimate().then(function(estimate) {
  console.log('配额：', estimate.quota);
  console.log('已用：', estimate.usage);
  console.log('可用：', estimate.quota - estimate.usage);
});
```

#### 存储清理

```javascript
// 监听存储压力
navigator.storage.persist().then(function(granted) {
  if (granted) {
    console.log('存储已持久化');
  }
});

// 清理存储
navigator.storage.estimate().then(function(estimate) {
  if (estimate.usage > estimate.quota * 0.9) {
    // 清理旧数据
    caches.keys().then(function(cacheNames) {
      cacheNames.forEach(function(cacheName) {
        caches.delete(cacheName);
      });
    });
  }
});
```

### 6.3 资源加载流程

1. **Service Worker 拦截请求**
   - 检查 Service Worker 是否已注册
   - 拦截所有网络请求

2. **检查缓存**
   - 根据缓存策略检查缓存
   - 如果缓存命中，返回缓存资源

3. **网络请求**
   - 如果缓存未命中，发起网络请求
   - 获取资源后，根据策略更新缓存

4. **返回资源**
   - 将资源返回给页面
   - 更新缓存

### 6.4 离线检测

```javascript
// 检测网络状态
window.addEventListener('online', function() {
  console.log('网络已连接');
});

window.addEventListener('offline', function() {
  console.log('网络已断开');
});

// 使用 navigator.onLine
if (navigator.onLine) {
  console.log('在线');
} else {
  console.log('离线');
}
```

---

## 7. 常用的 meta 标签和 SEO 优化

### 7.1 常用的 meta 标签

#### 字符编码

```html
<meta charset="UTF-8">
```

#### 视口设置

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

#### 页面描述

```html
<meta name="description" content="页面描述内容">
<meta name="keywords" content="关键词1, 关键词2, 关键词3">
<meta name="author" content="作者名称">
```

#### 搜索引擎控制

```html
<!-- 允许搜索引擎索引 -->
<meta name="robots" content="index, follow">

<!-- 禁止搜索引擎索引 -->
<meta name="robots" content="noindex, nofollow">

<!-- 不缓存页面 -->
<meta name="robots" content="noarchive">
```

#### 移动端优化

```html
<!-- 禁止自动识别电话号码 -->
<meta name="format-detection" content="telephone=no">

<!-- 禁止自动识别邮箱 -->
<meta name="format-detection" content="email=no">

<!-- 禁止自动识别地址 -->
<meta name="format-detection" content="address=no">
```

#### 浏览器兼容性

```html
<!-- IE 浏览器使用最新版本 -->
<meta http-equiv="X-UA-Compatible" content="IE=edge">

<!-- 禁止 Chrome 自动翻译 -->
<meta name="google" content="notranslate">
```

#### 社交媒体优化（Open Graph）

```html
<!-- Facebook、LinkedIn 等 -->
<meta property="og:title" content="页面标题">
<meta property="og:description" content="页面描述">
<meta property="og:image" content="图片URL">
<meta property="og:url" content="页面URL">
<meta property="og:type" content="website">
```

#### Twitter Card

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="页面标题">
<meta name="twitter:description" content="页面描述">
<meta name="twitter:image" content="图片URL">
```

#### 其他常用 meta 标签

```html
<!-- 页面刷新 -->
<meta http-equiv="refresh" content="30">

<!-- 页面重定向 -->
<meta http-equiv="refresh" content="0; url=https://example.com">

<!-- 禁止页面缩放 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

<!-- 主题颜色（移动端） -->
<meta name="theme-color" content="#000000">

<!-- 苹果设备 -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-mobile-web-app-title" content="应用名称">
```

### 7.2 SEO 优化策略

#### 1. 标题和描述优化

```html
<!-- 页面标题（重要） -->
<title>页面标题 - 网站名称</title>

<!-- 页面描述（重要） -->
<meta name="description" content="50-160字的页面描述，包含关键词">
```

**优化建议：**
- 标题长度：50-60 字符
- 描述长度：50-160 字符
- 包含主要关键词
- 每个页面使用独特的标题和描述

#### 2. 关键词优化

```html
<meta name="keywords" content="关键词1, 关键词2, 关键词3">
```

**注意**：现代搜索引擎对 keywords 的权重较低，但仍可使用。

#### 3. 语义化 HTML

使用语义化标签提升 SEO：

```html
<header>
  <h1>主标题</h1>
  <nav>导航</nav>
</header>
<main>
  <article>
    <h2>文章标题</h2>
    <p>文章内容</p>
  </article>
</main>
<footer>页脚</footer>
```

#### 4. 结构化数据（Schema.org）

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "文章标题",
  "author": {
    "@type": "Person",
    "name": "作者名称"
  },
  "datePublished": "2024-01-01",
  "description": "文章描述"
}
</script>
```

#### 5. 图片 SEO

```html
<img src="image.jpg" alt="描述性文本" title="图片标题">
```

**优化建议：**
- 使用描述性的 `alt` 属性
- 使用有意义的文件名
- 优化图片大小和格式

#### 6. 内部链接优化

```html
<!-- 使用有意义的锚文本 -->
<a href="/page.html">描述性链接文本</a>

<!-- 避免 -->
<a href="/page.html">点击这里</a>
```

#### 7. URL 结构优化

```
✅ 好的URL：/products/laptop/apple-macbook-pro
❌ 差的URL：/p/123?id=456
```

#### 8. 移动端优化

```html
<!-- 响应式设计 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- 移动友好测试 -->
<!-- 使用 Google Mobile-Friendly Test 工具测试 -->
```

#### 9. 页面加载速度

- 优化图片大小
- 使用 CDN
- 压缩 CSS 和 JavaScript
- 启用浏览器缓存
- 使用懒加载

#### 10. 外部链接优化

```html
<!-- 新窗口打开外部链接 -->
<a href="https://example.com" target="_blank" rel="noopener noreferrer">外部链接</a>

<!-- nofollow 属性 -->
<a href="https://example.com" rel="nofollow">不传递权重</a>
```

---

## 8. iframe 的缺点和微前端框架对比

### 8.1 iframe 的缺点

#### 1. 性能问题

- **加载开销**：每个 iframe 都需要加载完整的 HTML 文档
- **内存占用**：每个 iframe 都是独立的浏览器上下文，占用额外内存
- **渲染性能**：多个 iframe 会增加页面渲染负担

#### 2. 通信问题

- **跨域限制**：不同域的 iframe 无法直接通信
- **通信复杂**：需要使用 `postMessage` API，通信协议复杂
- **数据同步**：状态同步困难，容易出现数据不一致

#### 3. 样式隔离问题

- **样式污染**：虽然 iframe 有样式隔离，但无法共享全局样式
- **主题统一**：难以保持整体页面的主题一致性
- **响应式设计**：iframe 内容难以响应外层容器尺寸变化

#### 4. SEO 问题

- **搜索引擎索引**：iframe 内容可能不被搜索引擎正确索引
- **URL 管理**：iframe 的 URL 变化不会影响浏览器地址栏

#### 5. 用户体验问题

- **加载状态**：iframe 加载状态难以控制
- **错误处理**：iframe 内的错误难以捕获和处理
- **前进后退**：浏览器前进后退按钮的行为不一致

#### 6. 安全性问题

- **XSS 攻击**：iframe 可能成为 XSS 攻击的入口
- **点击劫持**：可能被用于点击劫持攻击

#### 7. 开发体验问题

- **调试困难**：iframe 内容调试不方便
- **开发工具**：需要单独打开 iframe 的开发者工具
- **热更新**：开发时的热更新可能不生效

### 8.2 微前端框架对比

#### qiankun（阿里）

**优点：**
- ✅ **技术栈无关**：支持 React、Vue、Angular 等
- ✅ **样式隔离**：支持 Shadow DOM 和 Scoped CSS
- ✅ **JS 沙箱**：支持 Proxy 和快照两种沙箱模式
- ✅ **应用通信**：提供 `initGlobalState` 全局状态管理
- ✅ **路由同步**：自动同步主应用和子应用的路由
- ✅ **生命周期**：完善的应用生命周期管理
- ✅ **社区活跃**：文档完善，社区支持好

**缺点：**
- ❌ **体积较大**：框架本身体积较大
- ❌ **学习成本**：需要了解微前端概念和配置
- ❌ **兼容性**：对旧浏览器支持有限（需要 Proxy）

**适用场景：**
- 大型企业级应用
- 多技术栈共存
- 需要完善的隔离和通信机制

#### 无界（腾讯）

**优点：**
- ✅ **零成本接入**：子应用无需修改代码
- ✅ **性能优秀**：基于 iframe + Proxy 实现，性能好
- ✅ **样式隔离**：完美的样式隔离，无需担心样式污染
- ✅ **JS 沙箱**：完善的 JS 沙箱机制
- ✅ **通信简单**：提供简单的通信 API
- ✅ **兼容性好**：兼容性较好

**缺点：**
- ❌ **基于 iframe**：仍然使用 iframe，部分 iframe 问题仍存在
- ❌ **路由同步**：路由同步需要手动配置
- ❌ **文档较少**：相对 qiankun 文档较少

**适用场景：**
- 需要零成本接入现有应用
- 对样式隔离要求高
- 需要较好的性能

#### micro-app（字节跳动）

**优点：**
- ✅ **基于 WebComponents**：使用 Custom Elements 实现
- ✅ **零框架依赖**：不依赖任何框架
- ✅ **使用简单**：API 简单易用
- ✅ **体积小**：框架体积较小
- ✅ **性能好**：基于 WebComponents，性能优秀

**缺点：**
- ❌ **浏览器兼容性**：需要支持 WebComponents 的浏览器
- ❌ **生态较新**：相比 qiankun 生态较新
- ❌ **文档较少**：文档相对较少

**适用场景：**
- 现代浏览器环境
- 需要轻量级解决方案
- 基于 WebComponents 技术栈

### 8.3 框架对比总结

| 特性 | iframe | qiankun | 无界 | micro-app |
|------|--------|---------|------|-----------|
| 技术栈支持 | 任意 | React/Vue/Angular | 任意 | 任意 |
| 样式隔离 | ✅ 完美 | ✅ 支持 | ✅ 完美 | ✅ 支持 |
| JS 沙箱 | ❌ 无 | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| 性能 | ❌ 较差 | ✅ 较好 | ✅ 较好 | ✅ 优秀 |
| 通信机制 | ❌ 复杂 | ✅ 完善 | ✅ 简单 | ✅ 简单 |
| 路由同步 | ❌ 不支持 | ✅ 支持 | ⚠️ 手动 | ✅ 支持 |
| 零成本接入 | ✅ 是 | ❌ 否 | ✅ 是 | ⚠️ 部分 |
| 体积 | - | ⚠️ 较大 | ✅ 中等 | ✅ 较小 |
| 兼容性 | ✅ 优秀 | ⚠️ 中等 | ✅ 较好 | ⚠️ 中等 |
| 社区支持 | - | ✅ 活跃 | ⚠️ 一般 | ⚠️ 一般 |

### 8.4 选择建议

1. **如果只需要简单的嵌入**：使用 iframe
2. **如果需要完善的微前端方案**：选择 qiankun
3. **如果需要零成本接入**：选择无界
4. **如果需要轻量级方案**：选择 micro-app

---

## 总结

HTML 作为前端开发的基础，掌握这些知识点对于前端开发至关重要：

1. **语义化**：提升代码可读性和 SEO
2. **script 标签**：理解 defer 和 async 的区别，优化页面加载
3. **HTML5 新特性**：了解现代 Web 开发的新能力
4. **Web Worker**：处理耗时任务，提升用户体验
5. **离线存储**：实现离线应用，提升用户体验
6. **SEO 优化**：提升网站在搜索引擎中的排名
7. **微前端**：了解现代前端架构方案

掌握这些知识点，可以在面试中展现出扎实的 HTML 基础和对现代 Web 开发的理解。






