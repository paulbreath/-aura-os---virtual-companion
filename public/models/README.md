# Live2D 模型目录

## 概述
此目录用于存放 Live2D 模型文件。

## 当前状态
已创建示例配置文件 `sample.model3.json`，但需要完整的模型文件才能运行。

## 获取完整模型

### 1. 官方示例模型（推荐）
Live2D 官方提供免费示例模型，下载地址：
- 英文: https://www.live2d.com/en/learn/sample/
- 中文: https://www.live2d.com/zh-CHS/learn/sample/
- 日文: https://www.live2d.com/learn/sample/

### 2. 社区免费模型
- BOOTH: https://booth.pm/en/search/live2d
- GitHub: 搜索 "live2d-model" 或 "live2d-sample"
- nizima: https://nizima.com/

### 3. 商业模型
- nizima 市场: https://nizima.com/
- Live2D 官方商店

## 模型文件结构
```
models/
├── sample.model3.json    # 模型配置文件（已创建）
├── sample.moc3           # 模型核心文件（需要下载）
├── sample.physics3.json  # 物理配置（需要下载）
├── sample.cdi3.json      # 显示信息（需要下载）
├── textures/
│   └── texture_00.png    # 纹理文件（需要下载）
├── motions/
│   ├── idle.mtn          # 待机动作
│   ├── tap_body.mtn      # 点击动作
│   ├── happy.mtn         # 开心动作
│   └── shy.mtn           # 害羞动作
└── expressions/
    ├── happy.exp3.json   # 开心表情
    ├── shy.exp3.json     # 害羞表情
    └── flirty.exp3.json  # 调情表情
```

## 使用步骤

1. **下载模型**
   - 从上述资源下载 Live2D 模型
   - 解压到此目录

2. **重命名文件**
   - 将模型文件重命名为 `sample.*`
   - 或修改 `sample.model3.json` 中的文件路径

3. **在 App 中使用**
   - 打开 App
   - 点击 "Live2D" 按钮
   - 模型会自动加载

## 注意事项

- 模型需要支持 Cubism 4.0+ 格式
- 确保所有文件路径正确
- 纹理文件需要放在 `textures` 子目录
- 动作和表情文件需要放在相应子目录

## 推荐模型

对于成人社交平台，推荐使用：
1. 风格：写实或半写实风格
2. 类型：全身模型
3. 动作：丰富的表情和动作
4. 服装：支持多套服装切换

## 技术支持

如有问题，请参考：
- Live2D 官方文档: https://docs.live2d.com/
- Cubism SDK: https://www.live2d.com/en/sdk/download/web/
