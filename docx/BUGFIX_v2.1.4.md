# 修仙模拟器 v2.1.4 - 错误修复

## 修复的问题

### 1. 修复 cultivationChange 未定义错误
**问题描述：** 游戏运行时出现 "Cannot read properties of undefined (reading 'cultivationChange')" 错误

**原因：** `GameEngine.applyOptionEffects` 方法没有检查 `effects` 是否为 undefined

**解决方案：** 在访问 `effects` 属性前添加了防御性检查

### 2. 修复因果债负数错误
**问题描述：** 游戏运行时出现 "Karmic debt amount must be non-negative" 错误

**原因：** 事件数据中使用负数来减少因果债（如 `karmicDebt: -20`），但 `addKarmicDebt` 方法不接受负数

**解决方案：** 
- 当因果变化为正数时，调用 `add` 方法
- 当因果变化为负数时，调用 `reduce` 方法
- 同时修复了善缘（goodDeeds）的相同问题

## 技术细节

### 修改的文件
1. `src/game/GameEngine.ts`
   - 在 `applyOptionEffects` 方法中添加 effects 空值检查
   - 修复因果变化的处理逻辑，支持正负数值

2. `package.json`
   - 版本号更新至 2.1.4

## 测试建议
1. 测试各种选项，确保不再出现 cultivationChange 错误
2. 测试包含因果变化的事件（特别是减少因果债的事件）
3. 测试空 effects 的选项（如"离开"选项）

## 版本信息
- 版本号：2.1.4
- 更新日期：2026-04-30
