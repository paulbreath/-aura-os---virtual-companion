# /ship - 发布流程

自动构建、测试、提交并推送到远程仓库。

## 触发条件
- `/ship` 命令
- "发布"、"部署"、"push"

## 发布流程

### 1. 预检查
```bash
# 检查 git 状态
git status
git diff --stat

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
  echo "有未提交的更改"
fi
```

### 2. 构建测试
```bash
# 运行类型检查
npm run lint

# 构建生产版本
npm run build

# 检查构建是否成功
if [ $? -ne 0 ]; then
  echo "构建失败，请修复错误"
  exit 1
fi
```

### 3. 本地测试
```bash
# 启动生产服务器测试
npm run start &
SERVER_PID=$!

# 等待服务器启动
sleep 3

# 健康检查
curl -f http://localhost:5174/api/health

# 停止测试服务器
kill $SERVER_PID
```

### 4. Git 提交
```bash
# 添加所有更改
git add .

# 提交 (需要用户提供 commit message)
# 格式: feat: 描述 或 fix: 描述
git commit -m "feat: [描述]"

# 推送到远程
git push origin main
```

### 5. 部署验证
```bash
# 等待 Zeabur 自动部署
echo "等待部署..."
sleep 30

# 检查部署状态
curl -f https://aurabot.zeabur.app/api/health
```

## 输出格式

```markdown
## 🚀 发布报告

### 构建状态
- TypeScript 检查: ✅ 通过
- 构建: ✅ 成功 (1.5MB)
- 本地测试: ✅ 通过

### Git 提交
- 文件更改: 5 files
- 新增行数: +150
- 删除行数: -20
- Commit: feat: 添加视频生成功能

### 部署状态
- 远程推送: ✅ 成功
- Zeabur 部署: ⏳ 等待中...
- 健康检查: ✅ 通过

### 发布信息
- 版本: v1.x.x
- 时间: 2024-03-23 10:30
- 分支: main
```

## 常见问题

### Q: 构建失败怎么办？
运行 `npm run lint` 查看具体错误，修复后重试。

### Q: 推送被拒绝？
可能有远程更改，先 `git pull` 拉取最新代码。

### Q: 部署后 API 404？
检查 Zeabur 环境变量是否配置正确。
