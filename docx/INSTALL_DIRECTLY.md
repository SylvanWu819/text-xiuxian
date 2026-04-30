# 🎮 直接在当前 VSCode 中启动游戏

## 方法 1：使用命令面板（最简单）

1. **按 Ctrl+Shift+P** 打开命令面板
2. 输入：**Developer: Reload Window**（开发人员：重新加载窗口）
3. 回车执行
4. 窗口重新加载后，左侧活动栏应该会出现"修仙模拟器"图标

## 方法 2：重启 VSCode

1. 关闭 VSCode
2. 重新打开项目文件夹
3. 左侧活动栏应该会出现图标

## 方法 3：手动触发插件激活

1. **按 Ctrl+Shift+P** 打开命令面板
2. 输入：**Developer: Show Running Extensions**
3. 查看插件是否在运行列表中

## 为什么现在看不到图标？

当前你在**开发环境**中，插件还没有被激活。有两种方式激活：

### A. 开发模式（F5）
- 会打开新的 VSCode 窗口
- 插件在新窗口中运行
- 适合开发和调试

### B. 安装模式（推荐）
- 在当前 VSCode 中运行
- 像正常插件一样使用
- 需要先打包成 .vsix 文件

## 🚀 推荐方案：打包后安装

由于 npm 环境刚修复，现在可以打包了：

```bash
# 1. 打包插件
npx @vscode/vsce package --allow-missing-repository --allow-star-activation

# 2. 安装到当前 VSCode
# 方法 A：命令行
code --install-extension cultivation-simulator-1.0.0.vsix

# 方法 B：VSCode 界面
# - 打开扩展面板（Ctrl+Shift+X）
# - 点击右上角 "..." 菜单
# - 选择"从 VSIX 安装..."
# - 选择生成的 .vsix 文件
```

## 🎯 最快的方法

**按 F5** 是最快的！因为：
- 不需要打包
- 不需要安装
- 直接运行
- 只是会打开新窗口而已

新窗口打开后：
1. 左侧活动栏会有太极图标
2. 点击图标就能玩游戏
3. 两个窗口可以同时开着

## 🔧 如果还是看不到图标

检查 package.json 中的配置：

```json
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "cultivation-simulator",
          "title": "修仙模拟器",
          "icon": "media/icon.svg"
        }
      ]
    }
  }
}
```

确保：
- ✅ icon 路径正确
- ✅ media/icon.svg 文件存在
- ✅ 代码已编译（npm run compile）

## 💡 总结

**最简单的方法：**
1. 按 F5
2. 等新窗口打开
3. 点击左侧太极图标
4. 开始游戏！

**不想开新窗口？**
1. 先打包：`npx @vscode/vsce package --allow-missing-repository --allow-star-activation`
2. 再安装：在扩展面板中"从 VSIX 安装"
3. 重启 VSCode
4. 图标就会出现在当前窗口

---

**建议：先用 F5 试试游戏，觉得好玩再打包安装到当前窗口！** 🎮
