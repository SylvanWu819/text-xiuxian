# 修仙模拟器 v2.3.2 更新日志

## 📅 发布日期
2026-04-30

## 🐛 Bug修复

### 灵石消耗逻辑实现
**问题**：之前版本中，虽然显示了灵石消耗的消息，但实际上灵石数量并没有减少。

**原因**：在 `GameEngine.applyEffectSet` 方法中，只显示了灵石变化的消息，但没有调用 `ResourceManager` 来实际扣除灵石。

**修复**：
- 在 `GameEngine.applyEffectSet` 中添加了实际的灵石增减逻辑
- 增加灵石时调用 `resourceManager.addSpiritStones()`
- 减少灵石时调用 `resourceManager.removeSpiritStones()`
- 添加了失败检查和错误日志

**影响范围**：
- ✅ 购买物品（丹药、法器等）现在会正确扣除灵石
- ✅ 炼制丹药会正确消耗灵石
- ✅ 所有需要消耗灵石的选项都能正常工作
- ✅ 获得灵石的功能保持正常

## 🔧 技术细节

### 修改的文件
- `src/game/GameEngine.ts` - 在 `applyEffectSet` 方法中添加实际的资源管理调用
- `package.json` - 版本号更新为 2.3.2
- `src/game/SaveSystem.ts` - 存档版本更新为 2.3.2
- `src/extension.ts` - 欢迎页面版本号更新为 v2.3.2

### 代码变更
```typescript
// 修改前（只显示消息）
if (change > 0) {
  positiveEffects.push(`💎 获得 ${change} 灵石`);
  messages.push(`你获得了 ${change} 块灵石。`);
} else {
  negativeEffects.push(`💸 消耗 ${Math.abs(change)} 灵石`);
  messages.push(`你消耗了 ${Math.abs(change)} 块灵石。`);
}

// 修改后（实际执行）
if (change > 0) {
  this.resourceManager.addSpiritStones(change);
  positiveEffects.push(`💎 获得 ${change} 灵石`);
  messages.push(`你获得了 ${change} 块灵石。`);
} else {
  const success = this.resourceManager.removeSpiritStones(Math.abs(change));
  if (success) {
    negativeEffects.push(`💸 消耗 ${Math.abs(change)} 灵石`);
    messages.push(`你消耗了 ${Math.abs(change)} 块灵石。`);
  } else {
    console.error(`[GameEngine] 灵石不足，无法消耗 ${Math.abs(change)} 灵石`);
  }
}
```

## 📝 升级说明

由于这是一个核心功能的修复，建议：
1. 更新到 v2.3.2 后开始新游戏
2. 旧存档可能包含不正确的灵石数量
3. 已清理编译缓存，确保使用最新代码

## ✅ 验证方法

测试灵石消耗是否正常：
1. 开始新游戏，记录初始灵石数量
2. 选择"炼制丹药"（消耗50灵石）
3. 检查灵石是否正确减少50
4. 选择"打工赚取灵石"（获得30灵石）
5. 检查灵石是否正确增加30
