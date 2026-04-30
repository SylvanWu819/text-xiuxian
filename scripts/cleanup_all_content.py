#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
清理游戏内容中的重复和不符合主题的内容
"""

import json
from datetime import datetime

def cleanup_npcs():
    """清理重复和不符合主题的NPC"""
    
    with open('data/npcs.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 需要删除的NPC ID
    npcs_to_remove = [
        'space_wanderer',      # 与void_walker重复
        'star_gazer',          # 与star_prophet重复
        'puppet_master',       # 与puppet_queen重复
        'time_keeper',         # 时间主题过多
        'time_thief',          # 时间主题过多
        'thunder_sovereign',   # 与thunder_god重复
        'fallen_angel',        # 不符合修仙世界观
        'death_reaper',        # 与underworld_judge重复
        'luck_goddess',        # 太游戏化
    ]
    
    original_count = len(data['npcs'])
    data['npcs'] = [npc for npc in data['npcs'] if npc['id'] not in npcs_to_remove]
    removed_count = original_count - len(data['npcs'])
    
    with open('data/npcs.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"NPC清理完成:")
    print(f"  删除: {removed_count} 个")
    print(f"  剩余: {len(data['npcs'])} 个")
    
    for npc_id in npcs_to_remove:
        print(f"  ✗ {npc_id}")
    
    return removed_count

def cleanup_quests():
    """清理重复和缺乏特色的任务"""
    
    with open('data/quests.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 需要删除的任务ID
    quests_to_remove = [
        'escort_caravan',      # 太普通
        'herb_gathering',      # 与sect_quest_1重复
        'pill_delivery',       # 太简单
        'luck_gamble',         # 不符合修仙主题
    ]
    
    original_count = len(data['quests'])
    data['quests'] = [quest for quest in data['quests'] if quest['id'] not in quests_to_remove]
    removed_count = original_count - len(data['quests'])
    
    with open('data/quests.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n任务清理完成:")
    print(f"  删除: {removed_count} 个")
    print(f"  剩余: {len(data['quests'])} 个")
    
    for quest_id in quests_to_remove:
        print(f"  ✗ {quest_id}")
    
    return removed_count

def main():
    print("="*60)
    print("开始清理游戏内容...")
    print("="*60 + "\n")
    
    # 备份
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    import shutil
    shutil.copy('data/npcs.json', f'data/backups/npcs_before_cleanup_{timestamp}.json')
    shutil.copy('data/quests.json', f'data/backups/quests_before_cleanup_{timestamp}.json')
    print("✓ 已备份原文件\n")
    
    # 清理
    npc_removed = cleanup_npcs()
    quest_removed = cleanup_quests()
    
    print("\n" + "="*60)
    print(f"清理完成！共删除 {npc_removed + quest_removed} 项内容")
    print("="*60)

if __name__ == '__main__':
    main()
