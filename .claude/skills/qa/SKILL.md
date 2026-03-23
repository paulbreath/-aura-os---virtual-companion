# /qa - 自动化测试

在真实浏览器中测试应用功能。

## 触发条件
- `/qa` 命令
- "测试一下"、"帮我测试"、"QA"

## 测试流程

### 1. 启动应用
```bash
# 检查是否已经在运行
curl -s http://localhost:3000/api/health || npm run dev &
```

### 2. 功能测试清单

#### 核心功能
- [ ] 页面加载正常
- [ ] Live2D 角色显示
- [ ] 聊天输入框可用
- [ ] 发送消息功能
- [ ] AI 回复功能

#### 视觉功能
- [ ] 自拍生成 (`/selfie` 命令)
- [ ] 视频生成 (`/video` 命令)
- [ ] 角色创建流程

#### 交互功能
- [ ] 语音聊天按钮
- [ ] 设置面板
- [ ] 相册功能

### 3. 测试步骤

```
1. 打开浏览器访问 http://localhost:3000
2. 检查页面标题和主要元素
3. 测试聊天功能
4. 测试命令功能
5. 检查控制台错误
6. 测试移动端响应式
```

### 4. Bug 报告格式

```markdown
## 🐛 Bug 报告

### 环境
- 浏览器: Chrome 120
- 分辨率: 1920x1080
- 时间: 2024-03-23 10:30

### 问题描述
[清晰描述问题]

### 复现步骤
1. 打开应用
2. 点击...
3. 输入...
4. 出现错误

### 预期行为
[应该发生什么]

### 实际行为
[实际发生了什么]

### 控制台日志
```
[错误信息]
```

### 截图
[如果有的话]
```

### 5. 测试脚本示例

```javascript
// 自动化测试脚本
const puppeteer = require('puppeteer');

async function runTests() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // 1. 访问应用
  await page.goto('http://localhost:3000');
  
  // 2. 检查页面标题
  const title = await page.title();
  console.log('页面标题:', title);
  
  // 3. 测试聊天功能
  await page.type('input[placeholder*="输入"]', 'Hello');
  await page.click('button[type="submit"]');
  
  // 4. 等待 AI 回复
  await page.waitForSelector('.message-model', { timeout: 10000 });
  
  // 5. 检查回复内容
  const reply = await page.textContent('.message-model');
  console.log('AI 回复:', reply);
  
  await browser.close();
}
```
