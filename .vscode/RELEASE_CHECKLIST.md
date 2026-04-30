# 发布前检查清单

在发布新版本之前，请确保完成以下所有检查项。

## 📋 代码质量检查

- [ ] 所有 TypeScript 代码编译成功
  ```bash
  npm run compile
  ```

- [ ] 所有单元测试通过
  ```bash
  npm test
  ```

- [ ] 测试覆盖率达标（建议 > 80%）
  ```bash
  npm run test:coverage
  ```

- [ ] 没有 TypeScript 编译错误或警告

- [ ] 代码格式化一致

## 📝 文档检查

- [ ] README.md 已更新
  - [ ] 版本号正确
  - [ ] 功能描述完整
  - [ ] 安装说明清晰
  - [ ] 使用示例准确

- [ ] CHANGELOG.md 已更新
  - [ ] 新版本号和日期
  - [ ] 所有新功能已列出
  - [ ] 所有 bug 修复已列出
  - [ ] 所有破坏性变更已标注

- [ ] package.json 信息完整
  - [ ] 版本号已更新
  - [ ] description 准确
  - [ ] keywords 完整
  - [ ] repository URL 正确
  - [ ] bugs URL 正确
  - [ ] homepage URL 正确

## 🎨 资源检查

- [ ] 图标文件存在且正确
  - [ ] media/icon.png 存在
  - [ ] 尺寸为 128x128 像素
  - [ ] 文件大小 < 1MB
  - [ ] 在浅色和深色主题下都清晰

- [ ] 所有必需的数据文件存在
  - [ ] data/events.json
  - [ ] data/cultivation_paths.json
  - [ ] data/npcs.json
  - [ ] data/quests.json

- [ ] 前端资源文件完整
  - [ ] media/main.js
  - [ ] media/style.css

## 🔧 配置检查

- [ ] .vscodeignore 文件正确
  - [ ] 排除了源代码文件
  - [ ] 排除了测试文件
  - [ ] 排除了开发配置文件
  - [ ] 保留了必需的运行时文件

- [ ] package.json 的 activationEvents 正确
  - [ ] 已移除不必要的 onView 事件（VSCode 会自动生成）

- [ ] package.json 的 contributes 配置正确
  - [ ] viewsContainers 配置正确
  - [ ] views 配置正确
  - [ ] commands 配置正确

## 🧪 功能测试

- [ ] 本地安装测试
  ```bash
  npm run package
  code --install-extension cultivation-simulator-*.vsix
  ```

- [ ] 核心功能测试
  - [ ] 新游戏创建流程
  - [ ] 角色创建和修行方向选择
  - [ ] 游戏主循环运行正常
  - [ ] 选项选择和执行
  - [ ] 随机事件触发
  - [ ] 时间推进系统
  - [ ] 修为突破系统
  - [ ] 渡劫系统

- [ ] 工具栏功能测试
  - [ ] 字体设置功能
  - [ ] 快速存档功能
  - [ ] 快速重开功能
  - [ ] 历史记录功能

- [ ] 存档系统测试
  - [ ] 保存游戏
  - [ ] 加载游戏
  - [ ] 多槽位存档
  - [ ] 存档版本兼容性

- [ ] 界面测试
  - [ ] 黑底白字显示正常
  - [ ] 布局适配侧边栏
  - [ ] 按钮交互正常
  - [ ] 悬停效果正常
  - [ ] 滚动功能正常

- [ ] 错误处理测试
  - [ ] 无效输入处理
  - [ ] 配置文件错误处理
  - [ ] 存档错误处理
  - [ ] 通信错误处理

## 🚀 发布准备

- [ ] Git 仓库状态干净
  ```bash
  git status
  ```

- [ ] 所有变更已提交
  ```bash
  git add .
  git commit -m "chore: release vX.Y.Z"
  ```

- [ ] 创建版本标签
  ```bash
  git tag vX.Y.Z
  ```

- [ ] 推送到远程仓库
  ```bash
  git push origin main --tags
  ```

- [ ] 打包插件
  ```bash
  npm run package
  ```

- [ ] 检查打包文件大小（建议 < 10MB）

## 📦 发布检查

- [ ] 已安装 vsce 工具
  ```bash
  npm install -g @vscode/vsce
  ```

- [ ] 已登录发布者账号
  ```bash
  vsce login <publisher-name>
  ```

- [ ] 准备好发布
  ```bash
  vsce publish
  ```

## ✅ 发布后验证

- [ ] 在 Marketplace 上找到插件
  - 访问: https://marketplace.visualstudio.com/items?itemName=<publisher>.<extension-name>

- [ ] 插件信息显示正确
  - [ ] 名称和描述
  - [ ] 图标显示
  - [ ] 版本号正确
  - [ ] README 显示正常

- [ ] 在 VSCode 中搜索并安装
  - [ ] 能够搜索到插件
  - [ ] 安装成功
  - [ ] 功能正常运行

- [ ] 创建 GitHub Release
  - [ ] 上传 .vsix 文件
  - [ ] 添加 CHANGELOG 内容
  - [ ] 标记版本号

## 📢 发布公告

- [ ] 更新项目主页
- [ ] 发布社交媒体公告（如适用）
- [ ] 通知用户和贡献者

---

## 注意事项

1. **版本号规范**：遵循语义化版本（Semantic Versioning）
   - 主版本号：不兼容的 API 修改
   - 次版本号：向下兼容的功能性新增
   - 修订号：向下兼容的问题修正

2. **测试环境**：在干净的 VSCode 环境中测试，避免其他插件干扰

3. **回滚计划**：如发现严重问题，准备好回滚到上一个版本

4. **用户通知**：如有破坏性变更，提前通知用户

5. **文档同步**：确保所有文档与代码保持同步

---

完成所有检查项后，即可安全发布新版本！🎉
