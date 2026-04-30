#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
内容验证脚本
检查JSON文件的格式和数据完整性
"""

import json
from pathlib import Path

DATA_DIR = Path("data")
NEW_CONTENT_DIR = DATA_DIR / "new_content"

def validate_json(file_path):
    """验证JSON格式"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return True, data, None
    except json.JSONDecodeError as e:
        return False, None, str(e)

def validate_events(events):
    """验证事件数据"""
    errors = []
    for i, event in enumerate(events):
        # 必需字段
        required = ['id', 'type', 'title', 'description', 'triggerConditions', 'options']
        for field in required:
            if field not in event:
                errors.append(f"事件 #{i+1} ({event.get('id', '未知')}): 缺少字段 '{field}'")
        
        # 验证options
        if 'options' in event:
            for j, option in enumerate(event['options']):
                if 'id' not in option or 'text' not in option:
                    errors.append(f"事件 {event.get('id', '未知')} 的选项 #{j+1}: 缺少 'id' 或 'text'")
    
    return errors

def validate_npcs(npcs):
    """验证NPC数据"""
    errors = []
    for i, npc in enumerate(npcs):
        required = ['id', 'name', 'faction', 'personality', 'initialRelationship', 'dialogues']
        for field in required:
            if field not in npc:
                errors.append(f"NPC #{i+1} ({npc.get('id', '未知')}): 缺少字段 '{field}'")
    
    return errors

def validate_quests(quests):
    """验证任务数据"""
    errors = []
    for i, quest in enumerate(quests):
        required = ['id', 'title', 'description', 'type', 'triggerConditions', 'rewards']
        for field in required:
            if field not in quest:
                errors.append(f"任务 #{i+1} ({quest.get('id', '未知')}): 缺少字段 '{field}'")
    
    return errors

def check_duplicate_ids(items, item_type):
    """检查重复ID"""
    ids = [item['id'] for item in items if 'id' in item]
    duplicates = [id for id in ids if ids.count(id) > 1]
    
    if duplicates:
        return [f"{item_type}: 发现重复ID: {', '.join(set(duplicates))}"]
    return []

def validate_file(file_path, key, validator_func):
    """验证单个文件"""
    print(f"\n检查 {file_path.name}...")
    
    valid, data, error = validate_json(file_path)
    if not valid:
        print(f"  ✗ JSON格式错误: {error}")
        return False
    
    if key not in data:
        print(f"  ✗ 缺少根键 '{key}'")
        return False
    
    items = data[key]
    print(f"  → 找到 {len(items)} 个项目")
    
    # 检查重复ID
    errors = check_duplicate_ids(items, key)
    
    # 验证数据结构
    errors.extend(validator_func(items))
    
    if errors:
        print(f"  ✗ 发现 {len(errors)} 个错误:")
        for error in errors[:10]:  # 只显示前10个
            print(f"    - {error}")
        if len(errors) > 10:
            print(f"    ... 还有 {len(errors) - 10} 个错误")
        return False
    else:
        print(f"  ✓ 验证通过")
        return True

def main():
    """主函数"""
    print("=" * 60)
    print("内容验证脚本")
    print("=" * 60)
    
    all_valid = True
    
    # 验证主数据文件
    print("\n【主数据文件】")
    if (DATA_DIR / "events.json").exists():
        all_valid &= validate_file(DATA_DIR / "events.json", "events", validate_events)
    
    if (DATA_DIR / "npcs.json").exists():
        all_valid &= validate_file(DATA_DIR / "npcs.json", "npcs", validate_npcs)
    
    if (DATA_DIR / "quests.json").exists():
        all_valid &= validate_file(DATA_DIR / "quests.json", "quests", validate_quests)
    
    # 验证新内容文件
    if NEW_CONTENT_DIR.exists():
        print("\n【新内容文件】")
        
        if (NEW_CONTENT_DIR / "events_new.json").exists():
            all_valid &= validate_file(NEW_CONTENT_DIR / "events_new.json", "events", validate_events)
        
        if (NEW_CONTENT_DIR / "npcs_new.json").exists():
            all_valid &= validate_file(NEW_CONTENT_DIR / "npcs_new.json", "npcs", validate_npcs)
        
        if (NEW_CONTENT_DIR / "quests_new.json").exists():
            all_valid &= validate_file(NEW_CONTENT_DIR / "quests_new.json", "quests", validate_quests)
    
    print("\n" + "=" * 60)
    if all_valid:
        print("✓ 所有文件验证通过！")
    else:
        print("✗ 发现错误，请修复后再合并")
    print("=" * 60)

if __name__ == "__main__":
    main()
