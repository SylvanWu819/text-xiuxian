#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文本检查脚本 - 检查游戏数据文件中的英文文本
用于确保游戏完全中文化
"""

import json
import re
import os
from pathlib import Path

# 需要检查的文本字段
TEXT_FIELDS = ['title', 'description', 'text', 'name', 'greeting', 'high_relationship', 'low_relationship']

# 排除的ID模式（这些是合法的英文ID）
EXCLUDED_PATTERNS = [
    r'^[a-z_]+$',  # 纯小写字母和下划线（ID）
    r'^[a-z_]+_[a-z_]+$',  # 下划线分隔的ID
    r'^\d+$',  # 纯数字
]

# 允许的英文单词（专有名词、缩写等）
ALLOWED_WORDS = {
    'NPC', 'ID', 'HP', 'MP', 'EXP', 'LV', 'Lv',
    'vs', 'VS',
}

def is_excluded_text(text):
    """检查文本是否应该被排除（如ID）"""
    if not text or not isinstance(text, str):
        return True
    
    for pattern in EXCLUDED_PATTERNS:
        if re.match(pattern, text):
            return True
    
    return False

def check_english_text(text):
    """检查文本中是否包含不应该出现的英文单词"""
    if is_excluded_text(text):
        return []
    
    # 查找所有英文单词（2个或更多字母）
    english_words = re.findall(r'\b[A-Za-z]{2,}\b', text)
    
    # 过滤掉允许的单词
    problematic_words = [word for word in english_words if word not in ALLOWED_WORDS]
    
    return problematic_words

def check_dict(obj, path='', issues=None):
    """递归检查字典中的所有文本字段"""
    if issues is None:
        issues = []
    
    if isinstance(obj, dict):
        for key, value in obj.items():
            new_path = f"{path}.{key}" if path else key
            
            # 检查文本字段
            if key in TEXT_FIELDS and isinstance(value, str):
                words = check_english_text(value)
                if words:
                    issues.append({
                        'path': new_path,
                        'text': value,
                        'words': words,
                        'severity': 'high' if key in ['title', 'name'] else 'medium'
                    })
            
            # 递归检查嵌套对象
            if isinstance(value, (dict, list)):
                check_dict(value, new_path, issues)
    
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            new_path = f"{path}[{i}]"
            check_dict(item, new_path, issues)
    
    return issues

def check_file(filepath):
    """检查单个JSON文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        issues = check_dict(data)
        return issues
    
    except FileNotFoundError:
        print(f"  ⚠️  文件不存在: {filepath}")
        return []
    
    except json.JSONDecodeError as e:
        print(f"  ❌ JSON解析错误: {e}")
        return []
    
    except Exception as e:
        print(f"  ❌ 未知错误: {e}")
        return []

def format_issue(issue):
    """格式化问题输出"""
    severity_icon = {
        'high': '🔴',
        'medium': '🟡',
        'low': '🟢'
    }
    
    icon = severity_icon.get(issue['severity'], '⚪')
    words_str = ', '.join(issue['words'])
    text_preview = issue['text'][:60] + '...' if len(issue['text']) > 60 else issue['text']
    
    return f"{icon} {issue['path']}\n   文本: {text_preview}\n   英文: {words_str}"

def main():
    """主函数"""
    print("=" * 60)
    print("修仙模拟器 - 文本检查工具 v2.6.0")
    print("=" * 60)
    print()
    
    # 获取项目根目录
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    data_dir = project_root / 'data'
    
    # 要检查的文件列表
    files_to_check = [
        data_dir / 'events.json',
        data_dir / 'npcs.json',
        data_dir / 'quests.json',
        data_dir / 'achievements.json',
        data_dir / 'cultivation_paths.json',
    ]
    
    total_issues = 0
    high_severity_count = 0
    
    for filepath in files_to_check:
        rel_path = filepath.relative_to(project_root)
        print(f"📄 检查文件: {rel_path}")
        
        if not filepath.exists():
            print(f"  ⚠️  文件不存在，跳过")
            print()
            continue
        
        issues = check_file(filepath)
        
        if not issues:
            print(f"  ✅ 没有发现问题")
        else:
            print(f"  ⚠️  发现 {len(issues)} 个问题:")
            
            # 按严重程度排序
            issues.sort(key=lambda x: {'high': 0, 'medium': 1, 'low': 2}.get(x['severity'], 3))
            
            # 显示前10个问题
            for issue in issues[:10]:
                print()
                print(f"  {format_issue(issue)}")
                if issue['severity'] == 'high':
                    high_severity_count += 1
            
            if len(issues) > 10:
                print()
                print(f"  ... 还有 {len(issues) - 10} 个问题未显示")
            
            total_issues += len(issues)
        
        print()
    
    # 总结
    print("=" * 60)
    print("检查完成")
    print("=" * 60)
    print(f"总问题数: {total_issues}")
    print(f"高优先级: {high_severity_count}")
    print()
    
    if total_issues == 0:
        print("✅ 所有文件都已完全中文化！")
        return 0
    else:
        print("⚠️  发现需要修复的文本，请查看上方详情")
        print()
        print("修复建议:")
        print("1. 优先修复高优先级问题（标题、名称）")
        print("2. 检查是否为专有名词，如是则添加到允许列表")
        print("3. 将英文文本翻译为中文")
        print("4. 重新运行此脚本验证修复结果")
        return 1

if __name__ == '__main__':
    exit(main())
