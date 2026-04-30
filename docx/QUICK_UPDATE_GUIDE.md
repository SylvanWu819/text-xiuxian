# 快速更新指南 ⚡

## 🎯 三步更新游戏内容

### 第一步：修改文本 📝

编辑 `data/` 目录下的 JSON 文件：

```bash
data/events.json           # 修改游戏事件
data/cultivation_paths.json # 修改修行方向
data/npcs.json             # 修改 NPC 对话
data/quests.json           # 修改任务
```

**示例：添加新事件**

打开 `data/events.json`，在 `events` 数组中添加：

```json
{
  "id": "my_new_event",
  "type": "fortune",
  "title": "奇遇",
  "description": "你遇到了一个奇怪的老人...",
  "triggerConditions": {
    "minCultivationLevel": "qi_refining",
    "probability": 0.2
  },
  "options": [
    {
      "id": "talk",
      "text": "与他交谈",
      "effects": {
        "cultivationChange": 10
      }
    },
    {
      "id": "leave",
      "text": "离开",
      "effects": {}
    }
  ]
}
```

### 第二步：打包 📦

```bash
# 1. 更新版本号（在 package.json 中）
#    1.0.0 → 1.0.1

# 2. 编译
npm run compile

# 3. 打包
npx @vscode/vsce package
```

生成文件：`cultivation-simulator-1.0.1.vsix`

### 第三步：发布 🚀

```bash
# 发布到 VSCode Marketplace
npx @vscode/vsce publish
```

或手动上传：
1. 访问 https://marketplace.visualstudio.com/manage
2. 点击你的插件
3. 上传新的 .vsix 文件

## 🔄 完整更新流程

```bash
# 1. 修改游戏文本
#    编辑 data/*.json

# 2. 更新版本号
#    编辑 package.json: "version": "1.0.1"

# 3. 更新日志
#    编辑 CHANGELOG.md

# 4. 编译
npm run compile

# 5. 测试（可选）
npm test

# 6. 打包
npx @vscode/vsce package

# 7. 本地测试（可选）
code --install-extension cultivation-simulator-1.0.1.vsix

# 8. 发布
npx @vscode/vsce publish
```

## 📝 常用文本修改

### 修改事件描述

```json
// data/events.json
{
  "id": "ancient_cave",
  "title": "上古洞府",           // ← 改这里
  "description": "你发现了..."   // ← 改这里
}
```

### 修改选项文本

```json
{
  "options": [
    {
      "text": "进入探索",         // ← 改这里
      "description": "高风险"     // ← 改这里
    }
  ]
}
```

### 修改 NPC 对话

```json
// data/npcs.json
{
  "id": "elder_chen",
  "name": "陈长老",              // ← 改这里
  "dialogues": {
    "greeting": "年轻人..."      // ← 改这里
  }
}
```

## 🎮 添加新内容

### 添加新事件

在 `data/events.json` 的 `events` 数组末尾添加（注意前一个事件后要加逗号）：

```json
{
  "events": [
    {
      "id": "existing_event",
      ...
    },  // ← 这里要有逗号
    {
      "id": "new_event",
      "type": "fortune",
      "title": "新事件",
      "description": "描述...",
      "options": [...]
    }
  ]
}
```

### 添加新 NPC

在 `data/npcs.json` 的 `npcs` 数组中添加：

```json
{
  "npcs": [
    ...,
    {
      "id": "new_npc",
      "name": "新NPC",
      "faction": "righteous_sect",
      "dialogues": {
        "greeting": "你好..."
      }
    }
  ]
}
```

## ⚠️ 注意事项

1. **JSON 格式**
   - 注意逗号、引号、括号
   - 使用 JSON 验证工具检查
   - 最后一个元素后不要加逗号

2. **唯一 ID**
   - 每个事件、NPC 要有唯一 ID
   - 使用英文和下划线：`my_event_001`

3. **版本号**
   - 小改动：1.0.0 → 1.0.1
   - 新功能：1.0.1 → 1.1.0
   - 大改动：1.1.0 → 2.0.0

4. **测试**
   - 修改后先本地测试
   - 确认游戏能正常运行

## 🐛 常见问题

### Q: 修改文本后需要重新编译吗？
A: 不需要！只修改 JSON 文件不需要编译，但需要重新打包。

### Q: 如何快速测试修改？
A: 
```bash
npm run compile
code --install-extension cultivation-simulator-x.y.z.vsix
```

### Q: 打包失败怎么办？
A: 检查：
- JSON 文件格式是否正确
- package.json 版本号是否更新
- icon.png 是否存在

### Q: 用户如何获取更新？
A: VSCode 会自动检测更新并通知用户。

### Q: 更新会影响用户存档吗？
A: 不会！用户的存档数据独立保存。

## 📋 更新检查清单

发布前确认：

- [ ] 修改了游戏内容
- [ ] 更新了版本号（package.json）
- [ ] 更新了 CHANGELOG.md
- [ ] 运行了 `npm run compile`
- [ ] 打包生成了 .vsix 文件
- [ ] 本地测试了新版本
- [ ] 准备发布

## 🚀 一键更新脚本

创建 `update.bat`（Windows）：

```batch
@echo off
echo 正在编译...
call npm run compile
if errorlevel 1 goto error

echo 正在打包...
call npx @vscode/vsce package
if errorlevel 1 goto error

echo 完成！
echo 生成文件：cultivation-simulator-x.y.z.vsix
goto end

:error
echo 出错了！请检查错误信息。

:end
pause
```

使用：双击 `update.bat` 即可自动编译和打包。

## 📞 需要详细说明？

查看 `CONTENT_UPDATE_GUIDE.md` 了解完整的更新流程和最佳实践。

---

**记住**：修改文本 → 更新版本号 → 打包 → 发布 ✨
