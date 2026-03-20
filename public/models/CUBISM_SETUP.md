# Live2D Cubism Core 配置说明

## 问题
错误：`Could not find Cubism 2 runtime. This plugin requires live2d.min.js to be loaded.`

## 解决方案

### 方法 1: 下载 Cubism Core (推荐)

1. **下载 Cubism Core**
   - 访问: https://www.live2d.com/en/sdk/download/web/
   - 下载 Cubism SDK for Web

2. **提取文件**
   - 解压下载的文件
   - 找到 `Core/live2dcubismcore.min.js`

3. **放置文件**
   ```
   public/
   └── Core/
       └── live2dcubismcore.min.js
   ```

4. **在 index.html 中加载**
   ```html
   <script src="/Core/live2dcubismcore.min.js"></script>
   ```

### 方法 2: 使用 CDN (简单)

在 `index.html` 的 `<head>` 中添加:

```html
<script src="https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js"></script>
```

### 方法 3: 使用 unpkg

```html
<script src="https://unpkg.com/live2dcubismcore@4/build/live2dcubismcore.min.js"></script>
```

## 验证

配置完成后:
1. 刷新页面
2. 打开浏览器控制台
3. 应该看到 `✅ Live2D model loaded: /models/mao/Mao.model3.json`

## 注意事项

- Cubism Core 是 Live2D 的核心渲染引擎
- 模型文件 (.moc3) 需要 Cubism 4.0+ 版本
- 确保模型路径正确
