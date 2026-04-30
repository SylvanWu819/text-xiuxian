# 游戏内容更新工作流

## 📋 概述

为了解决AI难以直接创建大型JSON文件的问题，我们采用了**分离式内容管理**方案：

1. AI在 `data/new_content/` 添加新内容（小文件）
2. 本地运行Python脚本合并到主数据文件
3. 自动备份和归档

## 🚀 快速开始

### 1. AI添加新内容

AI在 `data/new_content/` 目录创建以下文件之一：

- `events_new.json` - 新事件
- `npcs_new.json` - 新NPC
- `quests_new.json` - 新任务
- `cultivation_paths_new.json` - 新修炼路径

### 2. 验证内容（可选）

```bash
python scripts/validate_content.py
```

### 3. 合并到主文件

```bash
python scripts/merge_content.py
```

## 📁 目录结构

```
data/
├── events.json              # 主事件文件
├── npcs.json                # 主NPC文件
├── quests.json              # 主任务文件
├── cultivation_paths.json   # 主修炼路径文件
├── new_content/             # 新内容暂存区
│   ├── events_new.json      # 待合并的新事件
│   ├── npcs_new.json        # 待合并的新NPC
│   ├── quests_new.json      # 待合并的新任务
│   └── archived/            # 已合并的内容归档
└── backups/                 # 自动备份
    ├── events_20260430_120000.json
    └── ...
```

## 🔧 脚本说明

### merge_content.py

**功能**：
- 自动备份主文件（带时间戳）
- 检测ID冲突（跳过重复项）
- 合并新内容到主文件
- 归档已处理的新内容文件

**使用**：
```bash
python scripts/merge_content.py
```

### validate_content.py

**功能**：
- 验证JSON格式
- 检查必需字段
- 检测重复ID
- 验证数据结构完整性

**使用**：
```bash
python scripts/validate_content.py
```

## 📝 示例：添加新事件

### 步骤1：创建 `data/new_content/events_new.json`

```json
{
  "events": [
    {
      "id": "mountain_treasure",
      "type": "fortune",
      "title": "山中宝藏",
      "description": "你在山中发现了一个隐藏的宝藏...",
      "triggerConditions": {
        "minCultivationLevel": "qi_refining",
        "probability": 0.12
      },
      "options": [
        {
          "id": "take_treasure",
          "text": "取走宝藏",
          "description": "获得资源",
          "effects": {
            "resourceChanges": {
              "spiritStones": 100
            }
          }
        },
        {
          "id": "leave_treasure",
          "text": "离开",
          "description": "不取宝藏",
          "effects": {}
        }
      ]
    }
  ]
}
```

### 步骤2：运行合并脚本

```bash
python scripts/merge_content.py
```

输出示例：
```
============================================================
内容合并脚本
============================================================

✓ 已备份: data/backups/events_20260430_120530.json
✓ events.json: 添加了 1 个新项目
  → 已归档到: data/new_content/archived/events_new_20260430_120530.json

============================================================
合并完成！
============================================================
```

## ⚠️ 注意事项

1. **ID唯一性**：确保新内容的ID不与现有内容冲突
2. **格式一致**：遵循现有数据的JSON结构
3. **备份保留**：备份文件保留30天（可手动清理）
4. **小批量添加**：建议每次添加1-10个项目

## 🎯 优势

- ✅ AI只需处理小文件（几KB而非几百KB）
- ✅ 自动备份，安全可靠
- ✅ ID冲突检测，避免覆盖
- ✅ 内容归档，可追溯历史
- ✅ 验证脚本，确保数据完整性

## 🔄 工作流程图

```
AI创建新内容
    ↓
data/new_content/events_new.json
    ↓
[可选] python scripts/validate_content.py
    ↓
python scripts/merge_content.py
    ↓
自动备份主文件 → data/backups/
    ↓
合并新内容 → data/events.json
    ↓
归档新内容 → data/new_content/archived/
```

## 📚 相关文档

- `.kiro/steering/2-game-content-guide.md` - AI内容更新指南
- `data/new_content/README.md` - 新内容目录说明
