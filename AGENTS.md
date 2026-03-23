# Aura OS - AI Agent Workflow

> 基于 gstack 方法论定制的 AI 辅助开发工作流

## 工作流：Sprint 流程

```
Think → Plan → Build → Review → Test → Ship → Reflect
   │        │       │        │       │       │        │
   │        │       │        │       │       │        └─ /retro
   │        │       │        │       │       └─ /ship
   │        │       │        │       └─ /qa
   │        │       │        └─ /review
   │        │       └─ 实现代码
   │        └─ /plan
   └─ /office-hours
```

## 可用命令

### 规划阶段
| 命令 | 功能 | 使用场景 |
|------|------|----------|
| `/office-hours` | YC风格产品诊断 | 新功能开始前，重新思考问题 |
| `/plan` | 技术方案设计 | 确定实现方案和架构 |

### 开发阶段
| 命令 | 功能 | 使用场景 |
|------|------|----------|
| `/video` | 生成角色视频 | 创建角色的动态视频 |
| `/selfie` | 生成自拍 | 角色发送自拍照 |

### 质量阶段
| 命令 | 功能 | 使用场景 |
|------|------|----------|
| `/review` | 代码审查 | 检查代码质量、bug、安全问题 |
| `/qa` | 自动化测试 | 在真实浏览器中测试应用 |
| `/security` | 安全审计 | OWASP 安全检查 |

### 发布阶段
| 命令 | 功能 | 使用场景 |
|------|------|----------|
| `/ship` | 准备发布 | 构建、测试、提交、推送 |
| `/deploy` | 部署到生产 | 部署到 Zeabur |

### 维护阶段
| 命令 | 功能 | 使用场景 |
|------|------|----------|
| `/retro` | 回顾总结 | 每周回顾开发进度 |
| `/investigate` | 问题调查 | 系统性调试 |

## 项目配置

### 技术栈
- **前端**: React 19 + TypeScript + Tailwind CSS 4
- **后端**: Express.js (server.js)
- **AI**: X.AI Grok 4.1 Fast, ModelsLab
- **部署**: Zeabur (Docker)
- **实时**: Live2D 角色显示

### 常用命令
```bash
npm run dev          # 启动开发服务器 (port 3000)
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # TypeScript 类型检查
```

### 项目结构
```
aura-os/
├── src/
│   ├── App.tsx           # 主应用组件
│   ├── components/       # React 组件
│   │   ├── AvatarCreator.tsx    # 角色创建
│   │   ├── Live2DCharacter.tsx  # Live2D 显示
│   │   ├── VoiceChat.tsx        # 语音聊天
│   │   └── CharacterAlbum.tsx   # 角色相册
│   ├── services/         # 业务逻辑
│   │   ├── aiService.ts        # AI 服务 (Grok, ModelsLab)
│   │   ├── memoryService.ts    # 用户记忆
│   │   └── live2dService.ts    # Live2D 控制
│   └── types/            # TypeScript 类型
├── server.js             # Express 服务器 + API 代理
├── live2d/               # Live2D 模型文件
└── dist/                 # 构建输出
```

### API 端点
| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/modelslab` | POST | ModelsLab 图片生成代理 |
| `/api/modelslab/video` | POST | ModelsLab 视频生成代理 |
| `/api/xai/image` | POST | X.AI 图片生成代理 |

## 开发原则

### 1. 搜索优先 (Search Before Building)
在实现任何功能前，先搜索是否有现成的解决方案：
- 搜索 React 组件库
- 搜索 API 文档
- 搜索最佳实践

### 2. 完整性原则 (Completeness Principle)
不要走捷径，当完整实现是可行的时候：
- 完整的错误处理
- 完整的类型定义
- 完整的测试覆盖

### 3. 安全第一
- 永远不要在代码中硬编码 API 密钥
- 使用环境变量或代理
- 验证所有用户输入

## 代码风格

### Commit 规范
```
feat: 新功能
fix: 修复 bug
refactor: 重构
docs: 文档更新
style: 样式调整
test: 测试相关
chore: 构建/工具链
```

### Pull Request 规范
- 标题：简洁描述变更
- 描述：为什么做这个变更，如何测试
- 关联 Issue（如果有）

## AI Effort 压缩

| 任务类型 | 人工团队 | AI辅助 | 压缩比 |
|----------|----------|--------|--------|
| 样板代码 | 2天 | 15分钟 | ~100x |
| 新功能实现 | 1周 | 30分钟 | ~30x |
| Bug修复 | 4小时 | 15分钟 | ~20x |
| 架构设计 | 2天 | 4小时 | ~5x |

## 部署流程

```bash
# 1. 本地测试
npm run build && npm run start

# 2. 提交代码
git add . && git commit -m "feat: 描述" && git push

# 3. Zeabur 自动部署
# 推送到 main 分支后自动触发部署
```

## 常见问题

### Q: 视频生成失败？
检查 ModelsLab API 是否可用，查看控制台日志。

### Q: Live2D 不显示？
检查模型文件路径是否正确，确保 `live2d/` 目录存在。

### Q: 部署后 API 404？
检查 Zeabur 环境变量是否配置正确。
