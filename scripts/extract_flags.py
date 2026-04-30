#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
提取游戏中所有的成就标记
"""

import json

def extract_flags():
    """提取所有setFlags"""
    
    flags = set()
    
    # 从events.json提取
    with open('data/events.json', 'r', encoding='utf-8') as f:
        events = json.load(f)['events']
        
        for event in events:
            for option in event.get('options', []):
                # 直接效果中的flags
                if 'setFlags' in option.get('effects', {}):
                    flags.update(option['effects']['setFlags'])
                
                # outcomes中的flags
                for outcome in option.get('outcomes', []):
                    if 'setFlags' in outcome.get('effects', {}):
                        flags.update(outcome['effects']['setFlags'])
    
    # 从quests.json提取
    with open('data/quests.json', 'r', encoding='utf-8') as f:
        quests = json.load(f)['quests']
        
        for quest in quests:
            if 'setFlags' in quest.get('rewards', {}):
                flags.update(quest['rewards']['setFlags'])
    
    print(f"总计 {len(flags)} 个成就标记:\n")
    for i, flag in enumerate(sorted(flags), 1):
        print(f"{i}. {flag}")
    
    return sorted(flags)

if __name__ == '__main__':
    extract_flags()
