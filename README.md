# 修仙模拟器 (Cultivation Simulator)

一个运行在 VSCode 中的修仙文字游戏 - 体验选项驱动的修仙之旅

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![VSCode](https://img.shields.io/badge/VSCode-%5E1.80.0-blue.svg)
![GitHub stars](https://img.shields.io/github/stars/SylvanWu819/文字修仙)
![GitHub forks](https://img.shields.io/github/forks/SylvanWu819/文字修仙)

## 📖 简介

修仙模拟器是一款运行在 Visual Studio Code 中的文字冒险游戏。从一个凡人开始，通过修炼、历练、机缘，最终突破境界，达成你的修仙结局。

### ✨ 特色功能

- 🎮 **选项驱动的游戏玩法** - 每个选择都会影响你的修仙之路
- 🗡️ **四大修行方向** - 剑修、体修、丹修、阵修，各具特色
- 📊 **丰富的属性系统** - 修为、灵石、寿命、声望、因果等
- 🎲 **随机事件系统** - 探索时可能触发各种机缘或危险
- 🏆 **成就收集系统** - 收集9种不同的结局，追踪游戏统计
- 💾 **存档系统** - 随时保存和加载游戏进度
- 🎨 **自定义字体** - 13种字号和多种字体类型可选
- 📜 **历史记录** - 回顾重要决策和事件

## 🚀 快速开始

### 安装

1. 在 VSCode 扩展市场搜索 "修仙模拟器"
2. 点击安装
3. 重启 VSCode

### 开始游戏

1. 点击左侧活动栏的修仙模拟器图标
2. 点击"新游戏"
3. 输入道号（2-20个字符）
4. 选择修行方向
5. 开始你的修仙之旅！

## 🎯 游戏玩法

### 修行方向

- **剑修** - 以剑入道，攻击力强，适合战斗流
- **体修** - 炼体为主，防御力高，生存能力强
- **丹修** - 精通炼丹，资源丰富，发展稳健
- **阵修** - 精通阵法，控制力强，策略性高

### 核心属性

- **修为** - 你的修炼境界，影响实力和寿命
- **灵石** - 修仙世界的货币，用于购买资源
- **寿命** - 你的剩余寿命，耗尽则游戏结束
- **声望** - 正道/魔道声望，影响事件和结局
- **因果** - 善缘和因果债，影响渡劫和结局

### 境界系统

炼气期 → 筑基期 → 金丹期 → 元婴期 → 化神期 → 返虚期 → 合体期 → 大乘期 → 渡劫期 → 飞升

### 结局类型

游戏包含9种不同的结局：
- 🌟 飞升成仙
- 😈 魔道飞升
- 🏔️ 归隐山林
- 👑 成就魔尊
- 🏛️ 开宗立派
- ⏳ 寿元耗尽
- ⚡ 渡劫失败
- ⚔️ 被仇敌击杀
- 🔮 因果反噬

## 🎮 游戏界面

### 工具栏功能

- 📖 **说明** - 查看游戏玩法说明
- 🔤 **字体** - 调整字体大小和类型
- 💾 **存档** - 快速保存当前进度
- 🔄 **重开** - 开始新的修仙之旅
- 📜 **历史** - 查看重要决策和事件记录
- 🏆 **成就** - 查看结局收集进度和统计数据

### 成就系统

- 结局收集进度追踪
- 游戏统计数据（总次数、总时长、平均时长）
- 最近结局记录查看
- 首次达成特殊标记

## 🛠️ 开发

### 环境要求

- Node.js >= 18.0.0
- VSCode >= 1.80.0
- TypeScript >= 5.0.0

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/SylvanWu819/文字修仙.git
cd 文字修仙

# 安装依赖
npm install

# 编译
npm run compile

# 运行测试
npm test

# 测试覆盖率
npm run test:coverage

# 监听模式（开发时使用）
npm run watch
```

### 调试

1. 在 VSCode 中打开项目
2. 按 F5 启动调试
3. 在新窗口中测试扩展

### 打包

```bash
# 打包为 .vsix 文件
npm run package
```

## 📁 项目结构

```
cultivation-simulator/
├── src/                    # 源代码
│   ├── extension.ts       # 扩展入口
│   ├── game/              # 游戏逻辑
│   │   ├── GameEngine.ts
│   │   ├── EventGenerator.ts
│   │   ├── OptionSystem.ts
│   │   ├── AchievementSystem.ts
│   │   └── ...
│   ├── types/             # 类型定义
│   └── utils/             # 工具函数
├── media/                 # 前端资源
│   ├── main.js           # 前端逻辑
│   ├── style.css         # 样式
│   └── icon.svg          # 图标
├── data/                  # 游戏数据
│   ├── events.json       # 事件配置
│   ├── cultivation_paths.json
│   └── ...
├── out/                   # 编译输出（不上传）
├── node_modules/          # 依赖（不上传）
├── coverage/              # 测试覆盖率（不上传）
└── package.json          # 项目配置
```

## 🧪 测试

项目使用 Jest 进行单元测试，测试覆盖率 > 80%。

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

## 📝 更新日志

### v1.0.0 (2024-01-XX)

#### 新增功能
- ✅ 完整的游戏核心系统
- ✅ 四大修行方向
- ✅ 9种结局类型
- ✅ 成就收集系统
- ✅ 存档/读档功能
- ✅ 历史记录系统
- ✅ 自定义字体设置
- ✅ 行动反馈系统

#### 优化改进
- ✅ 优化UI布局，更紧凑的界面
- ✅ 长文本自动折叠功能
- ✅ 修为境界中文显示
- ✅ 每次行动都有不同的反馈文本
- ✅ 默认字体调整为13px

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 使用 TypeScript
- 遵循现有代码风格
- 添加必要的注释
- 编写单元测试
- 确保测试通过

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- 感谢所有贡献者
- 感谢 VSCode 团队提供优秀的扩展 API
- 灵感来源于经典修仙小说和文字游戏

## 📮 联系方式

- 提交 Issue: [GitHub Issues](https://github.com/SylvanWu819/文字修仙/issues)
- GitHub: [@SylvanWu819](https://github.com/SylvanWu819)

## 🌟 Star History

如果这个项目对你有帮助，请给个 Star ⭐️

---

**开始你的修仙之旅吧！** 🚀
