#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
清理游戏事件中的问题内容
"""

import json
import sys
from datetime import datetime

def cleanup_events():
    """清理events.json中的问题事件和选项"""
    
    # 读取events.json
    with open('data/events.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    events = data['events']
    cleaned_events = []
    removed_count = 0
    fixed_count = 0
    
    # 需要完全删除的事件ID
    events_to_remove = [
        'powerful_enemy',  # 太简单，没有深度
    ]
    
    for event in events:
        event_id = event['id']
        
        # 跳过需要删除的事件
        if event_id in events_to_remove:
            print(f"✗ 删除事件: {event_id} - {event.get('title', '')}")
            removed_count += 1
            continue
        
        # 修复空效果选项
        if 'options' in event:
            fixed_options = []
            for option in event['options']:
                option_id = option['id']
                effects = option.get('effects', {})
                
                # 检查是否为空效果（没有任何实际效果）
                is_empty = (
                    not effects or
                    (len(effects) == 0) or
                    (len(effects) == 1 and 'cultivationChange' in effects and effects['cultivationChange'] == 0)
                )
                
                if is_empty and option_id in ['leave', 'leave_merchant', 'wait_outside', 'leave_game', 
                                                'leave_void_merchant', 'discard_artifact', 'leave_chess',
                                                'leave_auction', 'refuse_inheritance', 'ignore_cultivator',
                                                'ignore_pendant']:
                    # 给这些"离开"选项添加最小收益
                    option['effects'] = {'cultivationChange': 5}
                    print(f"  ✓ 修复空效果: {event_id}.{option_id}")
                    fixed_count += 1
                
                fixed_options.append(option)
            
            event['options'] = fixed_options
        
        cleaned_events.append(event)
    
    # 保存清理后的数据
    data['events'] = cleaned_events
    
    with open('data/events.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"清理完成！")
    print(f"删除事件: {removed_count} 个")
    print(f"修复选项: {fixed_count} 个")
    print(f"剩余事件: {len(cleaned_events)} 个")
    print(f"{'='*60}")
    
    return removed_count, fixed_count

if __name__ == '__main__':
    try:
        cleanup_events()
    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(1)
