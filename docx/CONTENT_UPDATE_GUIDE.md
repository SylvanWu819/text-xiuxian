# 游戏内容更新指南

本指南说明如何管理游戏文本、打包插件以及发布更新。

## 📝 第一部分：游戏文本管理

### 文本存储位置

游戏文本存储在 `data/` 目录下的 JSON 文件中：

```
data/
├── events.json           # 游戏事件（机缘、危机、NPC遭遇等）
├── cultivation_paths.json # 修行方向（剑修、体修、丹修等）
├── npcs.json             # NPC 角色
└── quests.json           # 任务
```

### 如何修改游戏文本

#### 1. 修改事件文本

编辑 `data/events.json`：

```json
{
  "events": [
    {
      "id": "ancient_cave",
      "type": "fortune",
      "title": "上古洞府",                    // ← 事件标题
      "description": "你在山谷中发现...",      // ← 事件描述
      "options": [
        {
          "id": "enter",
          "text": "进入探索",                  // ← 选项文本
          "description": "高风险高回报",       // ← 选项说明
          "outcomes": [
            {
              "description": "你获得了上古功法！"  // ← 结果描述
            }
          ]
        }
      ]
    }
  ]
}
```

#### 2. 添加新事件

在 `events.json` 的 `events` 数组中添加：

```json
{
  "id": "new_event_001",              // 唯一ID
  "type": "fortune",                  // 类型：fortune/crisis/npc/quest/story
  "title": "神秘商人",
  "description": "一位神秘商人出现在你面前...",
  "triggerConditions": {
    "minCultivationLevel": "foundation",  // 最低修为要求
    "probability": 0.2                     // 触发概率
  },
  "options": [
    {
      "id": "buy",
      "text": "购买物品",
      "requirements": {
        "minResources": { "spiritStones": 100 }  // 需要100灵石
      },
      "effects": {
        "resourceChanges": { "spiritStones": -100 },
        "cultivationChange": 50
      }
    },
    {
      "id": "refuse",
      "text": "拒绝",
      "effects": {}
    }
  ]
}
```

#### 3. 修改修行方向文本

编辑 `data/cultivation_paths.json`：

```json
{
  "paths": [
    {
      "id": "sword",
      "name": "剑修",                    // ← 修行方向名称
      "description": "以剑入道，攻击力强",  // ← 描述
      "initialStats": {
        "spiritStones": 10
      }
    }
  ]
}
```

#### 4. 修改 NPC 对话

编辑 `data/npcs.json`：

```json
{
  "npcs": [
    {
      "id": "elder_chen",
      "name": "陈长老",                  // ← NPC 名称
      "dialogues": {
        "greeting": "年轻人，修行需要持之以恒。",     // ← 问候语
        "high_relationship": "你很有天赋，我看好你。",  // ← 高好感度对话
        "low_relationship": "哼，不思进取。"          // ← 低好感度对话
      }
    }
  ]
}
```

### 文本更新最佳实践

1. **保持 JSON 格式正确**
   - 使用 JSON 验证工具检查语法
   - 注意逗号、引号、括号的配对

2. **使用唯一 ID**
   - 每个事件、NPC、任务都要有唯一的 ID
   - ID 使用英文和下划线，如 `ancient_cave_001`

3. **测试新内容**
   - 修改后运行 `npm run compile` 确保没有错误
   - 在游戏中测试新内容是否正常显示

4. **备份原文件**
   - 修改前先备份 JSON 文件
   - 使用 Git 版本控制

## 📦 第二部分：打包插件

### 打包前准备

#### 1. 创建 PNG 图标（首次打包必需）

```bash
# 运行图标转换指南
npm run convert-icon
```

然后按照提示将 `media/icon.svg` 转换为 `media/icon.png` (128x128像素)

**转换方法：**
- 在线工具：https://cloudconvert.com/svg-to-png
- 或使用图像编辑软件（GIMP、Photoshop等）

#### 2. 更新版本号

编辑 `package.json`：

```json
{
  "version": "1.0.1"  // ← 更新版本号
}
```

版本号规则：
- **主版本号.次版本号.修订号** (如 1.2.3)
- 修订号：小改动、bug修复 (1.0.0 → 1.0.1)
- 次版本号：新功能 (1.0.1 → 1.1.0)
- 主版本号：重大变更 (1.1.0 → 2.0.0)

#### 3. 更新 CHANGELOG

编辑 `CHANGELOG.md`，添加新版本信息：

```markdown
## [1.0.1] - 2026-05-01

### 新增
- 添加了 10 个新的随机事件
- 新增神秘商人 NPC

### 修复
- 修复了存档加载的问题

### 变更
- 优化了事件触发概率
```

### 打包步骤

#### 方法 1：使用 npx（推荐）

```bash
# 1. 编译 TypeScript
npm run compile

# 2. 运行测试（可选）
npm test

# 3. 打包
npx @vscode/vsce package
```

#### 方法 2：使用 npm script

```bash
# 1. 编译
npm run compile

# 2. 打包
npm run package
```

#### 打包成功后

会生成文件：`cultivation-simulator-1.0.1.vsix`

### 验证打包文件

```bash
# 查看文件大小（应该 < 5MB）
dir cultivation-simulator-*.vsix

# 本地安装测试
code --install-extension cultivation-simulator-1.0.1.vsix
```

## 🔄 第三部分：更新已发布的插件

### 更新流程

#### 1. 修改内容

```bash
# 修改游戏文本
# 编辑 data/*.json 文件

# 或修改代码
# 编辑 src/*.ts 文件
```

#### 2. 更新版本信息

```bash
# 更新版本号
# 编辑 package.json 中的 version 字段

# 更新更新日志
# 编辑 CHANGELOG.md
```

#### 3. 测试

```bash
# 编译
npm run compile

# 测试
npm test

# 本地测试
code --install-extension cultivation-simulator-x.y.z.vsix
```

#### 4. 打包新版本

```bash
npx @vscode/vsce package
```

#### 5. 发布更新

```bash
# 发布到 VSCode Marketplace
npx @vscode/vsce publish

# 或手动上传
# 访问 https://marketplace.visualstudio.com/manage
# 上传新的 .vsix 文件
```

### 用户如何获取更新

用户会通过以下方式自动获取更新：

1. **自动更新**（默认）
   - VSCode 会自动检测插件更新
   - 用户会收到更新通知
   - 点击"更新"按钮即可

2. **手动更新**
   - 打开 VSCode 扩展面板
   - 找到"修仙模拟器"
   - 点击"更新"按钮

## 🎯 常见更新场景

### 场景 1：只更新游戏文本

```bash
# 1. 修改 data/*.json 文件
# 2. 更新版本号（修订号 +1）
#    1.0.0 → 1.0.1
# 3. 编译和打包
npm run compile
npx @vscode/vsce package
# 4. 发布
npx @vscode/vsce publish
```

### 场景 2：添加新功能

```bash
# 1. 修改代码和文本
# 2. 更新版本号（次版本号 +1）
#    1.0.1 → 1.1.0
# 3. 更新 CHANGELOG
# 4. 测试
npm test
# 5. 打包和发布
npm run compile
npx @vscode/vsce package
npx @vscode/vsce publish
```

### 场景 3：修复 Bug

```bash
# 1. 修复代码
# 2. 更新版本号（修订号 +1）
#    1.1.0 → 1.1.1
# 3. 在 CHANGELOG 中记录修复
# 4. 测试确认修复
npm test
# 5. 打包和发布
npm run compile
npx @vscode/vsce package
npx @vscode/vsce publish
```

## 📋 更新检查清单

发布更新前，确保完成：

- [ ] 修改了游戏内容或代码
- [ ] 更新了 package.json 中的版本号
- [ ] 更新了 CHANGELOG.md
- [ ] 运行了 `npm run compile`（无错误）
- [ ] 运行了 `npm test`（测试通过）
- [ ] 本地测试了新版本功能
- [ ] 打包生成了新的 .vsix 文件
- [ ] 验证了 .vsix 文件大小合理
- [ ] 准备好发布到 Marketplace

## 🔧 快速命令参考

```bash
# 编译
npm run compile

# 测试
npm test

# 打包
npx @vscode/vsce package

# 发布
npx @vscode/vsce publish

# 本地安装测试
code --install-extension cultivation-simulator-x.y.z.vsix

# 查看将要打包的文件
npx @vscode/vsce ls
```

## 💡 提示

1. **频繁更新文本**
   - 只修改 JSON 文件不需要重新编译 TypeScript
   - 但仍需要重新打包和发布

2. **版本号管理**
   - 使用 `npm version patch/minor/major` 自动更新版本号
   - 会自动创建 Git 标签

3. **测试环境**
   - 在干净的 VSCode 环境中测试
   - 避免其他插件干扰

4. **用户数据**
   - 更新不会影响用户的存档数据
   - 存档保存在 VSCode 的 globalState 中

5. **回滚**
   - 如果新版本有问题，可以发布修复版本
   - 用户会自动更新到最新版本

## 📞 需要帮助？

- 查看 `PACKAGING_GUIDE.md` 了解详细打包流程
- 查看 `PUBLISHING.md` 了解发布流程
- 查看 `.vscode/RELEASE_CHECKLIST.md` 了解发布检查清单

---

**记住**：每次更新游戏内容后，都需要：
1. 更新版本号
2. 更新 CHANGELOG
3. 重新打包
4. 发布新版本

用户会自动收到更新通知！
