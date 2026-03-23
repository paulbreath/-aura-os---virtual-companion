# /security - 安全审计

OWASP Top 10 安全检查和代码安全审计。

## 触发条件
- `/security` 命令
- "安全检查"、"安全审计"、"security audit"

## OWASP Top 10 检查清单

### 1. A01:2021 – 访问控制失效
- [ ] 没有越权访问 API
- [ ] 敏感操作需要验证
- [ ] CORS 配置正确

### 2. A02:2021 – 加密机制失效
- [ ] API 密钥不硬编码
- [ ] 敏感数据加密存储
- [ ] 使用 HTTPS

### 3. A03:2021 – 注入
- [ ] 用户输入已验证
- [ ] SQL 查询参数化 (如果用数据库)
- [ ] 无命令注入风险

### 4. A04:2021 – 不安全设计
- [ ] 速率限制已实现
- [ ] 输入长度限制
- [ ] 错误信息不泄露敏感信息

### 5. A05:2021 – 安全配置错误
- [ ] 调试模式已关闭
- [ ] 默认密码已更改
- [ ] 不必要的功能已禁用

### 6. A06:2021 – 易受攻击组件
- [ ] 依赖项已更新
- [ ] 无已知漏洞

### 7. A07:2021 – 身份认证失效
- [ ] 会话管理安全
- [ ] 密码策略合理

### 8. A08:2021 – 数据完整性失效
- [ ] 无反序列化漏洞
- [ ] CI/CD 安全

### 9. A09:2021 – 日志监控失效
- [ ] 关键操作有日志
- [ ] 错误日志不包含敏感信息

### 10. A10:2021 – SSRF
- [ ] URL 验证
- [ ] 只允许白名单域名

## 审查流程

### 1. 代码扫描
```bash
# 检查硬编码密钥
grep -r "API_KEY\|SECRET\|PASSWORD" src/ server.js

# 检查 console.log (可能泄露敏感信息)
grep -r "console.log" src/ server.js

# 检查 eval 使用 (代码注入风险)
grep -r "eval(" src/ server.js
```

### 2. 依赖审计
```bash
npm audit
```

### 3. 环境变量检查
```bash
# 检查 .env 文件是否被 git 忽略
cat .gitignore | grep .env

# 检查是否有 .env 文件提交到 git
git ls-files | grep .env
```

## 输出格式

```markdown
## 🔒 安全审计报告

### 总体评级: B+

### 通过项目 ✅
- A01 访问控制: CORS 配置正确
- A02 加密: API 密钥使用环境变量
- A03 注入: 输入验证完整
- A10 SSRF: URL 白名单已配置

### 需要修复 ❌
1. **A09 日志监控**
   - 问题: console.log 可能泄露敏感数据
   - 位置: server.js:75
   - 建议: 使用结构化日志，移除敏感信息

2. **A06 易受攻击组件**
   - 问题: express-rate-limit 版本较旧
   - 建议: 运行 npm update

### 建议改进 💡
- 添加请求速率限制 (已有，但可优化)
- 添加 CSP 头
- 添加安全相关的 HTTP 头

### 修复命令
```bash
npm audit fix  # 修复依赖漏洞
```
```

## 安全最佳实践

### API 密钥管理
```javascript
// ❌ 错误
const apiKey = "sk-1234567890";

// ✅ 正确
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY not configured");
}
```

### 用户输入验证
```javascript
// ❌ 错误
const prompt = req.body.prompt;

// ✅ 正确
const { prompt } = req.body;
if (!prompt || typeof prompt !== 'string' || prompt.length > 1000) {
  return res.status(400).json({ error: 'Invalid prompt' });
}
```

### CORS 配置
```javascript
// ✅ 正确 - 白名单模式
app.use(cors({
  origin: ['http://localhost:3000', 'https://aurabot.zeabur.app'],
  credentials: true
}));
```
