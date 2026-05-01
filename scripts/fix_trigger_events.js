const fs = require('fs');

console.log('=== 修复triggerEvent引用错误 ===\n');

// 读取events.json
const eventsData = JSON.parse(fs.readFileSync('data/events.json', 'utf-8'));
const events = eventsData.events;

// 不存在的事件列表
const nonExistentEvents = [
    'secret_realm_exploration',
    'mature_herb_harvest',
    'tribulation_event',
    'time_loop_exploitation',
    'guardian_enraged',
    'forced_wounded_combat'
];

let fixCount = 0;

// 修复每个事件
events.forEach((event) => {
    event.options?.forEach(option => {
        // 检查effects中的triggerEvent
        if (option.effects?.triggerEvent && nonExistentEvents.includes(option.effects.triggerEvent)) {
            console.log(`修复: 事件 ${event.id} 的选项 ${option.id}`);
            console.log(`  删除引用: ${option.effects.triggerEvent}`);
            delete option.effects.triggerEvent;
            fixCount++;
        }
        
        // 检查outcomes中的triggerEvent
        option.outcomes?.forEach((outcome, idx) => {
            if (outcome.effects?.triggerEvent && nonExistentEvents.includes(outcome.effects.triggerEvent)) {
                console.log(`修复: 事件 ${event.id} 的选项 ${option.id} 的结果 ${idx + 1}`);
                console.log(`  删除引用: ${outcome.effects.triggerEvent}`);
                delete outcome.effects.triggerEvent;
                fixCount++;
            }
        });
    });
});

if (fixCount > 0) {
    // 备份原文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupPath = `data/backups/events_before_fix_${timestamp}.json`;
    fs.writeFileSync(backupPath, JSON.stringify(eventsData, null, 2), 'utf-8');
    console.log(`\n✅ 已备份原文件到: ${backupPath}`);
    
    // 保存修复后的文件
    fs.writeFileSync('data/events.json', JSON.stringify(eventsData, null, 2), 'utf-8');
    console.log(`✅ 已修复 ${fixCount} 个引用错误`);
    console.log('✅ 已保存到 data/events.json');
} else {
    console.log('✅ 没有发现需要修复的问题');
}
