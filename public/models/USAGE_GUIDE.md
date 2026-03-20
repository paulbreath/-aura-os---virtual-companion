# Live2D 模型使用指南

## 📁 当前可用模型

### 1. Mao (Live2D 官方示例)
- **路径**: `/models/mao/Mao.model3.json`
- **特点**: 经典动漫风格，完整表情和动作
- **状态**: ✅ 可用

### 2. Sexy Cat Girl (基于 Mao)
- **路径**: `/models/sexy_cat_girl/model.model3.json`
- **特点**: 性感猫娘风格，多种表情
- **状态**: ✅ 可用

### 3. Sample (示例配置)
- **路径**: `/models/sample.model3.json`
- **特点**: 示例配置文件
- **状态**: ⚠️ 需要完整模型文件

## 🎮 在 App 中使用

### 切换模型
1. 打开 App
2. 点击 "Live2D" 按钮打开控制面板
3. 在模型选择器中选择模型
4. 模型会自动加载

### 控制表情
- **开心**: 愉悦的表情
- **害羞**: 害羞的表情
- **调情**: 挑逗的表情
- **诱惑**: 诱惑的表情
- **动情**: 情动的表情
- **享受**: 享受的表情
- **高潮**: 高潮的表情
- **喘息**: 喘息的表情

### 控制服装
- **穿着**: 完整服装
- **内衣**: 内衣状态
- **上身裸**: 上身裸露
- **全裸**: 完全裸露

### 控制动作
- **挥手**: 打招呼
- **点头**: 同意
- **摇头**: 拒绝
- **前倾**: 靠近
- **后仰**: 放松

## 🔧 添加新模型

### 步骤 1: 下载模型
从以下资源下载 Live2D 模型：
- **BOOTH.pm**: https://booth.pm/en/search/live2d
- **GitHub**: 搜索 "live2d-model"
- **nizima**: https://nizima.com/

### 步骤 2: 解压模型
```bash
cd public/models
unzip your_model.zip -d your_model_name
```

### 步骤 3: 检查文件结构
```
your_model_name/
├── model.model3.json    # 模型配置文件
├── model.moc3           # 模型核心文件
├── model.physics3.json  # 物理配置
├── model.cdi3.json      # 显示信息
├── textures/            # 纹理文件
│   └── texture_00.png
├── motions/             # 动作文件
│   ├── idle.mtn
│   └── tap_body.mtn
└── expressions/         # 表情文件
    ├── happy.exp3.json
    └── shy.exp3.json
```

### 步骤 4: 在 App 中使用
1. 修改 App.tsx 中的 `live2DModelPath` 状态
2. 或在控制面板中选择新模型

## 🎨 自定义模型

### 使用 Live2D Cubism Editor
1. 下载 Live2D Cubism Editor
   - https://www.live2d.com/en/sdk/download/
2. 创建或导入模型
3. 添加表情和动作
4. 导出为 Cubism 4.0 格式

### 使用 AI 生成角色
1. 使用 Stable Diffusion 生成角色图片
2. 使用 Live2D 绑定工具
3. 导出为 Live2D 模型

## ⚠️ 注意事项

1. **模型格式**
   - 必须支持 Cubism 4.0+ 格式
   - 文件扩展名必须是 `.model3.json`

2. **文件路径**
   - 所有文件必须在 `public/models/` 目录下
   - 相对路径必须正确

3. **版权问题**
   - 免费模型通常需要署名
   - 付费模型遵循购买协议

## 💡 推荐模型

### 性感风格
1. **Cat Girl** - 猫娘风格
2. **Succubus** - 魅魔风格
3. **Demon Girl** - 恶魔女孩

### 成人风格
1. **BDSM** - BDSM 风格
2. **Lingerie** - 内衣风格
3. **Nude** - 裸体风格

### 获取方式
1. 在 BOOTH.pm 搜索
2. 使用关键词: `sexy`, `adult`, `nsfw`, `cat girl`, `succubus`
3. 筛选免费或付费模型

## 📚 学习资源

1. **Live2D 官方文档**
   - https://docs.live2d.com/

2. **Cubism SDK**
   - https://www.live2d.com/en/sdk/download/web/

3. **社区论坛**
   - Reddit: r/Live2D
   - Discord: Live2D 社区
