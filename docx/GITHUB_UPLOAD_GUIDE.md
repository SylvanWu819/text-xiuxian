# GitHub 上传指南

## ✅ 需要上传的文件

### 核心代码
- `src/` - 所有源代码
- `media/` - 前端资源（JS, CSS, HTML, SVG）
- `data/` - 游戏数据文件
- `scripts/` - 构建脚本

### 配置文件
- `package.json` - 项目配置
- `package-lock.json` - 依赖锁定
- `tsconfig.json` - TypeScript 配置
- `jest.config.js` - 测试配置
- `.vscodeignore` - VSCode 打包忽略文件

### 文档
- `README.md` - 项目说明
- `LICENSE` - 许可证
- `CHANGELOG.md` - 更新日志
- `CONTRIBUTING.md` - 贡献指南

### 开发文档（可选）
- `BUGFIX_*.md` - Bug 修复文档
- `FEATURE_*.md` - 功能实现文档
- `docx/` - 开发过程文档（可选择性上传）

### Git 配置
- `.gitignore` - Git 忽略文件
- `.gitattributes` - Git 属性配置

### GitHub 配置
- `.github/` - GitHub 相关配置
  - `ISSUE_TEMPLATE/` - Issue 模板
  - `pull_request_template.md` - PR 模板

### VSCode 配置（可选）
- `.vscode/` - VSCode 工作区配置
  - `launch.json` - 调试配置
  - `tasks.json` - 任务配置
  - `settings.json` - 设置

### Kiro 配置（可选）
- `.kiro/` - Kiro AI 配置（如果需要）

## ❌ 不需要上传的文件（已在 .gitignore 中）

### 编译输出
- `out/` - TypeScript 编译输出
- `dist/` - 打包输出
- `build/` - 构建输出

### 依赖
- `node_modules/` - npm 依赖包

### 测试相关
- `coverage/` - 测试覆盖率报告
- `.nyc_output/` - 测试输出

### 临时文件
- `*.log` - 日志文件
- `*.tmp` - 临时文件
- `.cache/` - 缓存文件

### 打包文件
- `*.vsix` - VSCode 扩展包
- `*.tgz` - 压缩包

### 操作系统文件
- `.DS_Store` - macOS
- `Thumbs.db` - Windows

### IDE 文件
- `.idea/` - JetBrains IDE
- `*.swp`, `*.swo` - Vim

### 环境变量
- `.env` - 环境变量文件
- `.env.local` - 本地环境变量

## 📋 上传前检查清单

### 1. 清理项目
```bash
# 删除编译输出
rm -rf out/

# 删除测试覆盖率
rm -rf coverage/

# 删除 node_modules（会被 .gitignore 忽略）
# 不需要手动删除，git 会自动忽略
```

### 2. 更新文档
- [ ] 更新 README.md 中的仓库地址
- [ ] 更新 package.json 中的 repository URL
- [ ] 检查 CHANGELOG.md 是否最新
- [ ] 确认 LICENSE 文件正确

### 3. 检查配置
- [ ] 确认 .gitignore 包含所有不需要的文件
- [ ] 确认 .vscodeignore 配置正确
- [ ] 检查 package.json 中的版本号

### 4. 测试
```bash
# 运行测试
npm test

# 检查编译
npm run compile

# 尝试打包
npm run package
```

### 5. Git 操作
```bash
# 查看状态
git status

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: 修仙模拟器 v1.0.0"

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/yourusername/cultivation-simulator.git

# 推送到 GitHub
git push -u origin main
```

## 🔧 需要修改的地方

### package.json
```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/cultivation-simulator.git"
  },
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/cultivation-simulator/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/cultivation-simulator#readme"
}
```

### README.md
- 替换所有 `yourusername` 为你的 GitHub 用户名
- 更新联系方式
- 添加实际的截图（如果有）

## 📦 可选：创建 Release

上传后，可以创建一个 Release：

1. 在 GitHub 仓库页面点击 "Releases"
2. 点击 "Create a new release"
3. 标签版本：`v1.0.0`
4. 发布标题：`修仙模拟器 v1.0.0 - 首次发布`
5. 描述：从 CHANGELOG.md 复制内容
6. 上传 `.vsix` 文件（如果已打包）
7. 点击 "Publish release"

## 🎯 推荐的文件夹结构（上传后）

```
cultivation-simulator/
├── .github/              # GitHub 配置
├── .vscode/              # VSCode 配置（可选）
├── data/                 # 游戏数据
├── media/                # 前端资源
├── scripts/              # 脚本
├── src/                  # 源代码
│   ├── game/            # 游戏逻辑
│   ├── types/           # 类型定义
│   └── utils/           # 工具函数
├── .gitattributes       # Git 属性
├── .gitignore           # Git 忽略
├── .vscodeignore        # VSCode 打包忽略
├── CHANGELOG.md         # 更新日志
├── CONTRIBUTING.md      # 贡献指南
├── LICENSE              # 许可证
├── README.md            # 项目说明
├── jest.config.js       # Jest 配置
├── package.json         # 项目配置
├── package-lock.json    # 依赖锁定
└── tsconfig.json        # TypeScript 配置
```

## ⚠️ 注意事项

1. **不要上传敏感信息**
   - API 密钥
   - 密码
   - 个人信息

2. **检查文件大小**
   - GitHub 单个文件限制 100MB
   - 仓库建议不超过 1GB

3. **保持 .gitignore 更新**
   - 确保不上传不必要的文件
   - 定期检查和更新

4. **使用有意义的提交信息**
   - 遵循语义化提交规范
   - 清晰描述更改内容

## 📝 提交信息示例

```bash
# 首次提交
git commit -m "Initial commit: 修仙模拟器 v1.0.0

- 完整的游戏核心系统
- 四大修行方向
- 9种结局类型
- 成就收集系统
- 完整的文档"

# 后续提交
git commit -m "feat: 添加新的修行方向"
git commit -m "fix: 修复寿命计算错误"
git commit -m "docs: 更新 README"
```

## ✅ 准备完成

所有文件已准备就绪，可以开始上传到 GitHub！

记得先修改 package.json 和 README.md 中的仓库地址。
