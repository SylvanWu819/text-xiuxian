const fs = require('fs');

console.log('=== 数据一致性检查 ===\n');

// 读取events.json
const events = JSON.parse(fs.readFileSync('data/events.json', 'utf-8')).events;

let issues = [];

// 检查每个事件
events.forEach((event) => {
    // 检查triggerEvent引用
    event.options?.forEach(option => {
        if (option.effects?.triggerEvent) {
            const targetId = option.effects.triggerEvent;
            const exists = events.some(e => e.id === targetId);
            if (!exists) {
                issues.push(`事件 ${event.id} 的选项 ${option.id} 引用了不存在的事件: ${targetId}`);
            }
        }
        
        option.outcomes?.forEach(outcome => {
            if (outcome.effects?.triggerEvent) {
                const targetId = outcome.effects.triggerEvent;
                const exists = events.some(e => e.id === targetId);
                if (!exists) {
                    issues.push(`事件 ${event.id} 的结果引用了不存在的事件: ${targetId}`);
                }
            }
        });
    });
    
    // 检查概率总和
    event.options?.forEach(option => {
        if (option.outcomes && option.outcomes.length > 0) {
            const sum = option.outcomes.reduce((s, o) => s + o.probability, 0);
            if (Math.abs(sum - 1.0) > 0.01) {
                issues.push(`事件 ${event.id} 的选项 ${option.id} 概率总和不等于1: ${sum.toFixed(2)}`);
            }
        }
    });
    
    // 检查itemChanges中的道具ID
    event.options?.forEach(option => {
        if (option.effects?.itemChanges) {
            Object.keys(option.effects.itemChanges).forEach(itemId => {
                // 这里只记录，不判断是否存在
            });
        }
        
        option.outcomes?.forEach(outcome => {
            if (outcome.effects?.itemChanges) {
                Object.keys(outcome.effects.itemChanges).forEach(itemId => {
                    // 这里只记录，不判断是否存在
                });
            }
        });
    });
});

if (issues.length === 0) {
    console.log('✅ 数据一致性检查通过');
    console.log(`   - 检查了 ${events.length} 个事件`);
} else {
    console.log(`❌ 发现 ${issues.length} 个问题:\n`);
    issues.forEach(issue => console.log('  -', issue));
}

// 统计道具使用情况
console.log('\n=== 道具使用统计 ===\n');
const itemUsage = new Map();
const itemRequired = new Map();

events.forEach(event => {
    event.options?.forEach(option => {
        // 统计itemChanges
        if (option.effects?.itemChanges) {
            Object.entries(option.effects.itemChanges).forEach(([itemId, count]) => {
                if (!itemUsage.has(itemId)) {
                    itemUsage.set(itemId, { gain: 0, consume: 0, events: [] });
                }
                const usage = itemUsage.get(itemId);
                if (count > 0) {
                    usage.gain += count;
                } else {
                    usage.consume += Math.abs(count);
                }
                if (!usage.events.includes(event.id)) {
                    usage.events.push(event.id);
                }
            });
        }
        
        // 统计outcomes中的itemChanges
        option.outcomes?.forEach(outcome => {
            if (outcome.effects?.itemChanges) {
                Object.entries(outcome.effects.itemChanges).forEach(([itemId, count]) => {
                    if (!itemUsage.has(itemId)) {
                        itemUsage.set(itemId, { gain: 0, consume: 0, events: [] });
                    }
                    const usage = itemUsage.get(itemId);
                    if (count > 0) {
                        usage.gain += count;
                    } else {
                        usage.consume += Math.abs(count);
                    }
                    if (!usage.events.includes(event.id)) {
                        usage.events.push(event.id);
                    }
                });
            }
        });
        
        // 统计requiredItems
        if (option.requirements?.requiredItems) {
            option.requirements.requiredItems.forEach(itemId => {
                if (!itemRequired.has(itemId)) {
                    itemRequired.set(itemId, { count: 0, events: [] });
                }
                const req = itemRequired.get(itemId);
                req.count++;
                if (!req.events.includes(event.id)) {
                    req.events.push(event.id);
                }
            });
        }
    });
});

console.log('在itemChanges中使用的道具:');
[...itemUsage.entries()].sort().forEach(([itemId, usage]) => {
    console.log(`  - ${itemId}: 获得${usage.gain}次, 消耗${usage.consume}次, 出现在${usage.events.length}个事件`);
});

console.log('\n在requiredItems中使用的道具:');
if (itemRequired.size === 0) {
    console.log('  (无)');
} else {
    [...itemRequired.entries()].sort().forEach(([itemId, req]) => {
        console.log(`  - ${itemId}: 需求${req.count}次, 出现在${req.events.length}个事件`);
    });
}

// 列出未使用的道具
const allDefinedItems = [
    'healing_pill', 'qi_refining_pill', 'foundation_pill', 'golden_core_pill', 
    'breakthrough_pill', 'life_extension_pill', 'spirit_herb', 'spirit_stone_ore', 
    'rare_metal', 'ancient_jade', 'flying_sword', 'spirit_armor', 'talisman', 
    'formation_disk', 'ancient_scroll', 'treasure_map', 'spirit_beast_egg', 
    'immortal_token', 'spirit_water', 'jade_pendant', 'ancient_manual', 
    'mysterious_stone', 'broken_sword'
];

const usedItems = new Set([...itemUsage.keys(), ...itemRequired.keys()]);
const unusedItems = allDefinedItems.filter(id => !usedItems.has(id));

console.log(`\n未在events.json中使用的道具 (${unusedItems.length}/${allDefinedItems.length}):`);
unusedItems.forEach(id => console.log(`  - ${id}`));
