#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
内容合并脚本
将 data/new_content/ 中的新内容合并到主数据文件
"""

import json
import os
from datetime import datetime
from pathlib import Path

# 配置
DATA_DIR = Path("data")
NEW_CONTENT_DIR = DATA_DIR / "new_content"
BACKUP_DIR = DATA_DIR / "backups"

# 文件映射
FILE_MAPPING = {
    "events_new.json": "events.json",
    "npcs_new.json": "npcs.json",
    "quests_new.json": "quests.json",
    "cultivation_paths_new.json": "cultivation_paths.json"
}

def backup_file(file_path):
    """备份文件"""
    if not file_path.exists():
        return
    
    BACKUP_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = BACKUP_DIR / f"{file_path.stem}_{timestamp}.json"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ 已备份: {backup_path}")

def load_json(file_path):
    """加载JSON文件"""
    if not file_path.exists():
        return None
    
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(file_path, data):
    """保存JSON文件"""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def merge_content(main_file, new_file, key):
    """合并内容"""
    main_path = DATA_DIR / main_file
    new_path = NEW_CONTENT_DIR / new_file
    
    # 检查新内容文件是否存在
    if not new_path.exists():
        print(f"⊘ 跳过 {new_file}: 文件不存在")
        return
    
    # 加载数据
    new_data = load_json(new_path)
    if not new_data or key not in new_data or not new_data[key]:
        print(f"⊘ 跳过 {new_file}: 没有新内容")
        return
    
    # 备份主文件
    backup_file(main_path)
    
    # 加载主文件
    main_data = load_json(main_path)
    if not main_data:
        main_data = {key: []}
    
    # 检查ID冲突
    existing_ids = {item['id'] for item in main_data[key]}
    new_items = []
    skipped_items = []
    
    for item in new_data[key]:
        if item['id'] in existing_ids:
            skipped_items.append(item['id'])
        else:
            new_items.append(item)
            existing_ids.add(item['id'])
    
    # 合并
    if new_items:
        main_data[key].extend(new_items)
        save_json(main_path, main_data)
        print(f"✓ {main_file}: 添加了 {len(new_items)} 个新项目")
        
        if skipped_items:
            print(f"  ⚠ 跳过了 {len(skipped_items)} 个重复ID: {', '.join(skipped_items[:5])}")
    else:
        print(f"⊘ {main_file}: 没有可添加的新项目（全部重复）")
    
    # 归档新内容文件
    archive_dir = NEW_CONTENT_DIR / "archived"
    archive_dir.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_path = archive_dir / f"{new_file.replace('.json', '')}_{timestamp}.json"
    
    os.rename(new_path, archive_path)
    print(f"  → 已归档到: {archive_path}")

def main():
    """主函数"""
    print("=" * 60)
    print("内容合并脚本")
    print("=" * 60)
    print()
    
    # 确保目录存在
    NEW_CONTENT_DIR.mkdir(exist_ok=True)
    
    # 合并各类内容
    merge_content("events.json", "events_new.json", "events")
    merge_content("npcs.json", "npcs_new.json", "npcs")
    merge_content("quests.json", "quests_new.json", "quests")
    merge_content("cultivation_paths.json", "cultivation_paths_new.json", "paths")
    
    print()
    print("=" * 60)
    print("合并完成！")
    print("=" * 60)

if __name__ == "__main__":
    main()
