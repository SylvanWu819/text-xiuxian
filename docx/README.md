# 修仙模拟器 (Cultivation Simulator)

一个运行在 VSCode 中的修仙文字游戏插件。

## 功能特性

- 🎮 选项驱动的文字游戏体验
- 🌟 丰富的修仙剧情和随机事件
- 💾 完整的存档系统
- 🎨 黑底白字的现代界面设计
- ⚙️ 可自定义的字体设置
- 📜 历史记录查看功能

## 项目结构

```
cultivation-simulator/
├── src/
│   ├── extension.ts              # 插件入口
│   ├── game/                     # 游戏逻辑目录（待实现）
│   ├── types/                    # 类型定义目录
│   └── utils/                    # 工具类目录（待实现）
├── media/                        # 前端资源
│   ├── style.css                 # 样式文件
│   ├── main.js                   # 前端脚本
│   └── icon.svg                  # 图标
├── data/                         # 配置文件目录（待实现）
├── package.json                  # 插件配置
└── tsconfig.json                 # TypeScript配置
```

## 开发进度

### ✅ 已完成

- [x] Task 1: VSCode 插件基础架构
  - Extension 入口和 Webview Provider
  - 前后端消息通信机制
  - 基础 UI 界面和样式
  - 功能按键工具栏

### 🚧 待实现

- [ ] Task 2: 游戏引擎核心系统
- [ ] Task 3: 事件生成和选项系统
- [ ] Task 4: 时间管理和状态追踪
- [ ] Task 5: 存档系统
- [ ] Task 6: JSON 配置加载
- [ ] Task 7: 修行方向和剧情分支
- [ ] Task 8: 因果和渡劫系统
- [ ] Task 9: 人脉和势力系统
- [ ] Task 10: 结局系统

## 安装和运行

### 前置要求

- Node.js >= 18.0.0
- VSCode >= 1.80.0

### 安装依赖

```bash
npm install
```

### 编译

```bash
npm run compile
```

### 开发模式

```bash
npm run watch
```

### 调试

1. 在 VSCode 中打开项目
2. 按 F5 启动调试
3. 在新窗口中查看侧边栏的"修仙模拟器"视图

## 技术栈

- **后端**: TypeScript + VSCode Extension API
- **前端**: HTML + CSS + Vanilla JavaScript
- **存储**: VSCode globalState API
- **通信**: postMessage API

## 需求实现

本项目实现了以下需求：

- **需求 21.1**: 使用 VSCode Extension API 创建侧边栏 Webview ✅
- **需求 21.2**: 在 extension.ts 中注册激活命令和视图 ✅
- **需求 21.3**: 使用 postMessage API 实现双向通信 ✅
- **需求 21.6**: Webview 按钮点击发送消息到 Extension ✅
- **需求 21.7**: Extension 状态更新发送消息到 Webview ✅
- **需求 21.9**: package.json 正确配置插件元数据 ✅

## 许可证

MIT License

## 作者

Cultivation Simulator Team
