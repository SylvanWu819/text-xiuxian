# 发布指南

本文档说明如何发布修仙模拟器 VSCode 插件。

## 前置要求

1. **安装 vsce**（VSCode Extension Manager）
   ```bash
   npm install -g @vscode/vsce
   ```

2. **注册 Azure DevOps 账号**
   - 访问 https://dev.azure.com
   - 创建个人访问令牌（Personal Access Token）
   - 权限范围选择 "Marketplace (Manage)"

3. **创建发布者账号**
   - 访问 https://marketplace.visualstudio.com/manage
   - 创建发布者 ID（需要与 package.json 中的 publisher 字段一致）

## 发布前检查清单

- [ ] 所有测试通过 (`npm test`)
- [ ] 代码编译成功 (`npm run compile`)
- [ ] 更新版本号（package.json）
- [ ] 更新 CHANGELOG.md
- [ ] 更新 README.md（如有必要）
- [ ] 检查 .vscodeignore 文件
- [ ] 本地测试插件功能

## 发布步骤

### 1. 更新版本号

根据语义化版本规范更新 package.json 中的版本号：

```bash
# 修订号（bug 修复）
npm version patch

# 次版本号（新功能）
npm version minor

# 主版本号（破坏性变更）
npm version major
```

### 2. 更新 CHANGELOG

在 CHANGELOG.md 中添加新版本的更新内容：

```markdown
## [x.y.z] - YYYY-MM-DD

### 新增功能
- 功能描述

### 修复
- 问题描述

### 变更
- 变更描述
```

### 3. 提交变更

```bash
git add .
git commit -m "chore: release v1.0.0"
git tag v1.0.0
git push origin main --tags
```

### 4. 打包插件

```bash
# 清理旧的构建产物
npm run clean  # 如果有此脚本

# 编译 TypeScript
npm run compile

# 运行测试
npm test

# 打包插件
vsce package
```

这将生成 `cultivation-simulator-x.y.z.vsix` 文件。

### 5. 本地测试打包文件

```bash
# 在 VSCode 中安装 .vsix 文件进行测试
code --install-extension cultivation-simulator-x.y.z.vsix
```

测试所有核心功能：
- 新游戏创建
- 游戏保存和加载
- 各种游戏选项
- 工具栏功能
- 界面显示

### 6. 发布到 Marketplace

```bash
# 首次发布需要登录
vsce login <publisher-name>

# 发布插件
vsce publish
```

或者手动上传：
1. 访问 https://marketplace.visualstudio.com/manage
2. 点击 "New Extension" -> "Visual Studio Code"
3. 上传 .vsix 文件

### 7. 验证发布

- 访问插件页面：https://marketplace.visualstudio.com/items?itemName=<publisher>.<extension-name>
- 在 VSCode 中搜索并安装插件
- 验证功能正常

## 版本号规范

遵循语义化版本（Semantic Versioning）：

- **主版本号（Major）**：不兼容的 API 修改
  - 例如：重大架构变更、删除功能
  
- **次版本号（Minor）**：向下兼容的功能性新增
  - 例如：新增修行方向、新增事件类型
  
- **修订号（Patch）**：向下兼容的问题修正
  - 例如：bug 修复、性能优化

## 发布频率建议

- **主版本**：重大更新，每年 1-2 次
- **次版本**：功能更新，每月 1-2 次
- **修订版**：问题修复，按需发布

## 回滚发布

如果发现严重问题需要回滚：

```bash
# 取消发布（仅在发布后短时间内有效）
vsce unpublish <publisher>.<extension-name>@<version>

# 发布修复版本
npm version patch
vsce publish
```

## 常见问题

### Q: 发布失败，提示权限不足
A: 检查 Personal Access Token 是否有 "Marketplace (Manage)" 权限

### Q: 打包文件过大
A: 检查 .vscodeignore 文件，确保排除了不必要的文件（测试文件、源代码等）

### Q: 插件在 Marketplace 上不显示
A: 发布后可能需要等待几分钟才能在搜索中显示

### Q: 如何更新插件图标
A: 更新 media/icon.svg 文件，确保 package.json 中的 icon 字段指向正确路径

## 相关链接

- [VSCode 插件发布文档](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce 工具文档](https://github.com/microsoft/vscode-vsce)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [Marketplace 管理页面](https://marketplace.visualstudio.com/manage)

## 联系方式

如有问题，请通过以下方式联系：
- GitHub Issues: https://github.com/yourusername/cultivation-simulator/issues
- Email: your-email@example.com
