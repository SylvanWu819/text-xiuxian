# 🎮 如何启动修仙模拟器

## 方法 1：开发模式启动（推荐用于测试）

### 步骤：

1. **确保代码已编译**
   ```bash
   npm run compile
   ```

2. **在 VSCode 中按 F5**
   - 或者点击菜单：运行 → 启动调试
   - 或者使用命令面板（Ctrl+Shift+P）输入 "Debug: Start Debugging"

3. **会打开一个新的 VSCode 窗口**
   - 这是"扩展开发主机"窗口
   - 插件已在这个窗口中激活

4. **打开游戏界面**
   - 点击左侧活动栏的"修仙模拟器"图标
   - 或使用命令面板（Ctrl+Shift+P）输入 "修仙模拟器: 新游戏"

## 方法 2：打包后安装（推荐用于正式使用）

### 步骤：

1. **打包插件**
   ```bash
   npm run compile
   npx @vscode/vsce package
   ```

2. **安装 .vsix 文件**
   ```bash
   code --install-extension cultivation-simulator-1.0.0.vsix
   ```
   
   或在 VSCode 中：
   - 打开扩展面板（Ctrl+Shift+X）
   - 点击右上角的 "..." 菜单
   - 选择"从 VSIX 安装..."
   - 选择生成的 .vsix 文件

3. **重启 VSCode**

4. **打开游戏**
   - 点击左侧活动栏的"修仙模拟器"图标

## 方法 3：快速启动脚本

### Windows 用户：

创建 `start.bat` 文件：

```batch
@echo off
echo 正在编译...
call npm run compile
if errorlevel 1 (
    echo 编译失败！
    pause
    exit /b 1
)

echo 正在启动 VSCode 调试...
code .
echo.
echo 请在打开的 VSCode 窗口中按 F5 启动插件
pause
```

双击运行 `start.bat`

### 或者使用 npm script：

```bash
npm run compile && code .
```

然后在 VSCode 中按 F5

## 🎯 启动后如何使用

### 1. 首次启动

在新的 VSCode 窗口中：

1. **找到游戏入口**
   - 左侧活动栏会出现"修仙模拟器"图标（太极图案）
   - 点击图标打开侧边栏

2. **开始新游戏**
   - 侧边栏会显示欢迎界面
   - 输入角色名称
   - 选择修行方向（剑修/体修/丹修/阵修）

3. **开始游玩**
   - 阅读开局剧情
   - 选择行动选项（点击按钮或输入数字）
   - 体验修仙之旅！

### 2. 游戏界面说明

```
┌─────────────────────────────────────┐
│  [字体] [存档] [重开] [历史]  ← 工具栏
├─────────────────────────────────────┤
│  === 第1年 春季 ===          ← 时间
│                                     │
│  修为: 炼气期 3层            ← 状态
│  灵石: 50  寿命: 78年              │
│                                     │
│  你在宗门修炼...             ← 事件描述
│                                     │
│  [1] 闭关修炼               ← 选项
│  [2] 外出探索                      │
│  [3] 接取宗门任务                  │
│                                     │
└─────────────────────────────────────┘
```

### 3. 工具栏功能

- **字体**：调整字体大小和类型
- **存档**：快速保存游戏进度
- **重开**：开始新游戏
- **历史**：查看历史记录

## 🐛 启动问题排查

### 问题 1：按 F5 没反应

**解决方案：**
1. 确保在项目根目录打开 VSCode
2. 检查是否已编译：`npm run compile`
3. 查看 `.vscode/launch.json` 是否存在

### 问题 2：编译失败

**解决方案：**
```bash
# 清理并重新安装依赖
rm -rf node_modules
rm package-lock.json
npm install

# 重新编译
npm run compile
```

### 问题 3：插件没有显示

**解决方案：**
1. 检查 `package.json` 中的 `contributes` 配置
2. 确保 `out/extension.js` 文件存在
3. 查看 VSCode 开发者工具的控制台（帮助 → 切换开发人员工具）

### 问题 4：游戏界面空白

**解决方案：**
1. 检查 `media/` 目录下的文件是否完整
2. 查看浏览器控制台错误（在 Webview 中右键 → 检查）
3. 确保 `data/` 目录下的 JSON 文件格式正确

## 📝 开发模式 vs 安装模式

### 开发模式（F5 启动）

**优点：**
- 可以调试代码
- 修改代码后可以重新加载
- 可以查看控制台日志

**缺点：**
- 需要打开两个 VSCode 窗口
- 性能可能稍慢

**适用于：**
- 开发和测试
- 调试问题
- 修改代码

### 安装模式（.vsix 安装）

**优点：**
- 像正常插件一样使用
- 性能更好
- 只需一个 VSCode 窗口

**缺点：**
- 无法调试
- 修改代码需要重新打包安装

**适用于：**
- 正式使用
- 分享给他人
- 发布到市场

## 🎮 快速开始命令

```bash
# 一键启动开发模式
npm run compile && code . 
# 然后按 F5

# 一键打包安装
npm run compile && npx @vscode/vsce package && code --install-extension cultivation-simulator-1.0.0.vsix
```

## 📚 相关文档

- **开发指南**：README.md
- **打包指南**：PACKAGING_GUIDE.md
- **内容更新**：CONTENT_UPDATE_GUIDE.md
- **快速更新**：QUICK_UPDATE_GUIDE.md

---

**现在就开始你的修仙之旅吧！** 🚀

按 F5 启动插件，点击左侧的太极图标，开始游戏！
