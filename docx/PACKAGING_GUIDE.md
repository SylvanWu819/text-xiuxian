# 打包指南

本文档说明如何打包修仙模拟器 VSCode 插件，无需全局安装 vsce。

## 当前状态

✅ TypeScript 编译成功  
⚠️ 测试有 11 个失败（仅消息语言不匹配，不影响功能）  
❌ vsce 未安装

## 打包方法

### 方法 1：使用 npx（推荐，无需全局安装）

```bash
# 直接使用 npx 运行 vsce
npx @vscode/vsce package
```

这将创建 `cultivation-simulator-1.0.0.vsix` 文件。

### 方法 2：全局安装 vsce

```bash
# 全局安装 vsce
npm install -g @vscode/vsce

# 打包插件
vsce package
```

### 方法 3：本地安装并使用 npm script

```bash
# 本地安装 vsce（已在 package.json 中配置）
npm install --save-dev @vscode/vsce

# 使用 npm script 打包
npm run package
```

## 打包前准备

### 必需步骤

1. **创建 PNG 图标**（当前缺失）
   ```bash
   # 运行图标转换指南
   npm run convert-icon
   
   # 按照指南将 media/icon.svg 转换为 media/icon.png (128x128)
   ```

2. **编译 TypeScript**
   ```bash
   npm run compile
   ```

### 可选步骤

3. **运行测试**（可选，因为已知有消息不匹配问题）
   ```bash
   npm test
   ```

4. **清理旧的构建产物**
   ```bash
   # Windows
   Remove-Item -Recurse -Force out
   
   # 然后重新编译
   npm run compile
   ```

## 打包命令

### 完整打包流程

```bash
# 1. 清理并编译
npm run compile

# 2. 打包（使用 npx，无需全局安装）
npx @vscode/vsce package

# 或者使用 npm script
npm run package
```

### 打包选项

```bash
# 指定版本号打包
npx @vscode/vsce package 1.0.0

# 打包为预发布版本
npx @vscode/vsce package --pre-release

# 不包含 yarn.lock
npx @vscode/vsce package --no-yarn

# 查看将要打包的文件列表（不实际打包）
npx @vscode/vsce ls
```

## 验证打包文件

### 检查文件大小

```bash
# Windows PowerShell
Get-Item cultivation-simulator-*.vsix | Select-Object Name, Length

# 期望大小：< 5MB
```

### 查看打包内容

```bash
# 列出 .vsix 文件中的内容
npx @vscode/vsce ls
```

### 本地安装测试

```bash
# 在 VSCode 中安装 .vsix 文件
code --install-extension cultivation-simulator-1.0.0.vsix

# 或者在 VSCode 中：
# 1. 打开命令面板 (Ctrl+Shift+P)
# 2. 输入 "Extensions: Install from VSIX..."
# 3. 选择 .vsix 文件
```

## 常见问题

### Q: 打包时提示缺少 README

**A**: 确保项目根目录有 README.md 文件。

### Q: 打包时提示缺少图标

**A**: 
1. 确保 media/icon.png 存在
2. 或者临时从 package.json 中移除 icon 字段
3. 运行 `npm run convert-icon` 获取转换指南

### Q: 打包文件过大

**A**: 检查 .vscodeignore 文件，确保排除了：
- src/ 目录（源代码）
- **/__tests__/ 目录（测试文件）
- coverage/ 目录（覆盖率报告）
- node_modules/ 目录（会被重新安装）
- TASK*.md 文件（任务验证文件）

### Q: 打包时提示 "command not found: vsce"

**A**: 使用 npx 代替：
```bash
npx @vscode/vsce package
```

### Q: 打包时提示版本号不匹配

**A**: 确保 package.json 中的 version 字段正确。

## 打包后的文件

成功打包后，将生成：

```
cultivation-simulator-1.0.0.vsix
```

这个文件包含：
- ✅ 编译后的 JavaScript 代码（out/）
- ✅ 前端资源文件（media/）
- ✅ 游戏配置文件（data/）
- ✅ package.json
- ✅ README.md
- ✅ CHANGELOG.md
- ✅ LICENSE

## 下一步

打包成功后：

1. **本地测试**
   ```bash
   code --install-extension cultivation-simulator-1.0.0.vsix
   ```

2. **功能验证**
   - 测试新游戏创建
   - 测试游戏保存和加载
   - 测试所有工具栏功能
   - 测试游戏主循环

3. **准备发布**
   - 查看 PUBLISHING.md 了解发布流程
   - 查看 .vscode/RELEASE_CHECKLIST.md 完成发布前检查

## 快速参考

```bash
# 最简单的打包命令（推荐）
npx @vscode/vsce package

# 查看将要打包的文件
npx @vscode/vsce ls

# 本地安装测试
code --install-extension cultivation-simulator-1.0.0.vsix
```

---

**注意**: 由于当前缺少 icon.png 文件，打包可能会失败或警告。请先运行 `npm run convert-icon` 创建图标，或临时从 package.json 中移除 icon 字段。
