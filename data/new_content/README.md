# 新内容暂存区

这个目录用于存放待合并的新内容。

## 使用流程

1. AI在这里创建新的JSON文件（events_new.json, npcs_new.json等）
2. 运行合并脚本：`python scripts/merge_content.py`
3. 脚本会自动将新内容合并到主数据文件
4. 合并后会自动清空或归档新内容文件

## 文件格式

### events_new.json
```json
{
  "events": [
    {
      "id": "unique_event_id",
      "type": "fortune",
      ...
    }
  ]
}
```

### npcs_new.json
```json
{
  "npcs": [
    {
      "id": "unique_npc_id",
      "name": "NPC名称",
      ...
    }
  ]
}
```

### quests_new.json
```json
{
  "quests": [
    {
      "id": "unique_quest_id",
      "title": "任务标题",
      ...
    }
  ]
}
```
