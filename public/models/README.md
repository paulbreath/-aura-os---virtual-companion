# Live2D 模型目录

## 概述
此目录用于存放 Live2D 模型文件。

## 模型格式
- `.model3.json` - Cubism 4.0+ 模型文件
- `.moc3` - 模型核心文件
- `.physics3.json` - 物理配置文件
- `.cdi3.json` - 显示信息文件

## 获取模型

### 1. 官方示例模型
- Live2D 官方提供免费示例模型
- 下载地址: https://www.live2d.com/en/learn/sample/

### 2. 社区模型
- GitHub 上有许多开源 Live2D 模型
- 搜索 "live2d-model" 或 "live2d-sample"

### 3. 自定义模型
- 使用 Live2D Cubism Editor 创建
- 官网: https://www.live2d.com/en/

## 模型结构示例
```
models/
├── character.model3.json
├── character.moc3
├── character.physics3.json
├── character.cdi3.json
├── motions/
│   ├── idle.mtn
│   ├── tap_body.mtn
│   └── ...
├── expressions/
│   ├── happy.exp3.json
│   ├── sad.exp3.json
│   └── ...
└── textures/
    ├── texture_00.png
    └── ...
```

## 使用方法
1. 将模型文件放入此目录
2. 在 App 中选择模型路径
3. Live2D 组件会自动加载模型

## 注意事项
- 模型文件需要放在 public 目录下
- 确保模型文件路径正确
- 模型需要支持 Cubism 4.0+ 格式
