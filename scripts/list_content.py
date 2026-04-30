#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json

# 列出所有NPC
with open('data/npcs.json', 'r', encoding='utf-8') as f:
    npcs = json.load(f)['npcs']
    print(f"NPC总数: {len(npcs)}\n")
    for i, npc in enumerate(npcs, 1):
        print(f"{i}. {npc['id']} - {npc['name']} ({npc['faction']}, {npc['personality']})")

print("\n" + "="*60 + "\n")

# 列出所有任务
with open('data/quests.json', 'r', encoding='utf-8') as f:
    quests = json.load(f)['quests']
    print(f"任务总数: {len(quests)}\n")
    for i, quest in enumerate(quests, 1):
        flags = quest.get('triggerConditions', {}).get('requiredFlags', [])
        print(f"{i}. {quest['id']} - {quest['title']} (需要: {', '.join(flags) if flags else '无'})")
