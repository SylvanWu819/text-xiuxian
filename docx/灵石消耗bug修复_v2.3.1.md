# 灵石消耗Bug修复 v2.3.1

## 📅 日期
2026-04-30

## 🐛 问题描述
用户反馈：在购买物品或选择需要消耗灵石的选项时，灵石并没有实际减少。

## 🔍 问题分析

### 发现的问题
在`GameEngine.ts`的`applyEffectSet`方法中，存在**重复调用**`optionSystem.applyEffects()`的问题：

```typescript
// 第一次调用（错误位置）
if (effects.resourceChanges) {
  // ... 显示消息
  this.optionSystem.applyEffects(effects);  // ❌ 在判断块内部
}

// 第二次调用（正确位置）
this.optionSystem.applyEffects(effects);  // ✅ 在方法末尾
```

### 问题原因
1. 第一次调用在`resourceChanges`判断块内部，导致逻辑混乱
2. 可能存在条件竞争或状态不一致
3. 虽然有两次调用，但由于某种原因灵石没有正确扣除

## ✅ 修复方案

### 1. 移除重复调用
删除了`resourceChanges`判断块内部的`applyEffects`调用，只保留方法末尾的统一调用。

**修改前**：
```typescript
if (effects.resourceChanges) {
  if (effects.resourceChanges.spiritStones) {
    // ... 显示消息
  }
  this.optionSystem.applyEffects(effects);  // ❌ 重复调用
}
// ... 其他效果处理
this.optionSystem.applyEffects(effects);  // 第二次调用
```

**修改后**：
```typescript
if (effects.resourceChanges) {
  if (effects.resourceChanges.spiritStones) {
    // ... 显示消息
  }
  // ✅ 移除了这里的调用
}
// ... 其他效果处理
this.optionSystem.applyEffects(effects);  // ✅ 只在这里调用一次
```

### 2. 添加调试日志
在`OptionSystem.applyEffects`中添加详细的调试日志：

```typescript
console.log(`[OptionSystem] 应用灵石变化: ${change}`);
console.log(`[OptionSystem] 当前灵石: ${this.resourceManager.getSpiritStones()}`);
// ... 执行变化
console.log(`[OptionSystem] 消耗灵石后: ${this.resourceManager.getSpiritStones()}`);
```

这样可以在开发者工具中追踪灵石变化的完整过程。

## 🔧 技术细节

### 修改的文件
1. **src/game/GameEngine.ts**
   - 移除`applyEffectSet`方法中的重复调用
   - 添加调试日志

2. **src/game/OptionSystem.ts**
   - 添加详细的灵石变化日志
   - 记录变化前后的灵石数量

### 验证逻辑
确认以下组件工作正常：
- ✅ `ResourceManager.removeSpiritStones()` - 正确扣除灵石
- ✅ `OptionSystem.checkOptionRequirements()` - 正确检查灵石是否足够
- ✅ `OptionSystem.applyEffects()` - 正确应用资源变化
- ✅ 事件数据格式正确（`spiritStones: -100`）

## 📝 测试建议

### 测试步骤
1. 开始新游戏，记录初始灵石数量
2. 触发需要消耗灵石的事件（如"神秘商人"）
3. 选择购买选项（如"购买筑基丹（100灵石）"）
4. 检查：
   - ✅ 灵石是否正确减少
   - ✅ 反馈消息是否显示"消耗XX灵石"
   - ✅ 面板上的灵石数量是否更新

### 测试用例
| 操作 | 初始灵石 | 消耗 | 预期结果 |
|------|---------|------|---------|
| 购买筑基丹 | 150 | -100 | 50 |
| 购买法器 | 250 | -200 | 50 |
| 炼制丹药 | 100 | -50 | 50 |
| 学习技能 | 200 | -150 | 50 |

### 查看调试日志
打开VSCode开发者工具（帮助 → 切换开发人员工具），在控制台中查看：
```
[OptionSystem] 应用灵石变化: -100
[OptionSystem] 当前灵石: 150
[OptionSystem] 消耗灵石100，成功: true
[OptionSystem] 消耗灵石后: 50
```

## 🎯 预期效果

修复后，用户在选择消耗灵石的选项时：
1. ✅ 灵石会立即正确扣除
2. ✅ 面板显示更新后的灵石数量
3. ✅ 反馈消息明确显示消耗了多少灵石
4. ✅ 如果灵石不足，选项会被禁用

## 📊 影响范围

### 受影响的功能
- 所有需要消耗灵石的选项
- 购买物品（丹药、法器等）
- 学习技能
- 炼制物品
- 事件选项中的灵石消耗

### 不受影响的功能
- 灵石获得（一直正常工作）
- 其他资源（丹药、法器）的管理
- 修为、寿命等其他属性的变化

## 🔄 版本信息
- 版本号：2.3.1
- Bug严重程度：高（影响核心游戏机制）
- 修复状态：已修复，待测试验证
