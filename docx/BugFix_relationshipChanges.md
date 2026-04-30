# Bug修复：relationshipChanges.entries is not a function

## 问题描述

**错误信息**：
```
发生未知错误：effects.relationshipChanges.entries is not a function or its return value is not iterable
```

**触发场景**：
- 当游戏事件包含 `relationshipChanges` 效果时
- 特别是从 JSON 数据文件加载的事件

## 问题原因

### 类型不匹配

1. **TypeScript 类型定义**：
   ```typescript
   relationshipChanges?: Map<string, number>
   ```

2. **JSON 数据格式**：
   ```json
   "relationshipChanges": {
     "npc_id": 10
   }
   ```

3. **问题**：
   - JSON 中的 `relationshipChanges` 是普通对象 `{}`
   - TypeScript 期望的是 `Map<string, number>`
   - 普通对象没有 `.entries()` 方法

### 为什么会发生

- JSON 格式不支持 Map 类型
- 从 JSON 加载数据时，对象保持为普通对象
- 代码直接调用 `.entries()` 导致错误

## 修复方案

### 1. 更新类型定义 (`src/types/index.ts`)

```typescript
export interface EffectSet {
  // 支持 Map 或普通对象两种格式
  relationshipChanges?: Map<string, number> | Record<string, number>;
  // ... 其他字段
}
```

### 2. 更新后端处理逻辑 (`src/game/GameEngine.ts`)

```typescript
// 应用关系变化
if (effects.relationshipChanges) {
  // 处理 Map 或普通对象两种格式
  const relationshipMap = effects.relationshipChanges instanceof Map 
    ? effects.relationshipChanges 
    : new Map(Object.entries(effects.relationshipChanges));
  
  for (const [npcId, change] of relationshipMap.entries()) {
    // ... 处理逻辑
  }
}
```

### 3. 更新前端处理逻辑 (`media/main.js`)

```javascript
// Relationship changes
if (changes.relationshipChanges) {
  // 处理 Map 或普通对象两种格式
  const relationshipMap = changes.relationshipChanges instanceof Map 
    ? changes.relationshipChanges 
    : new Map(Object.entries(changes.relationshipChanges));
  
  if (relationshipMap.size > 0) {
    relationshipMap.forEach((value, npcId) => {
      // ... 处理逻辑
    });
  }
}
```

## 修复效果

### 修复前
- ❌ 触发包含 `relationshipChanges` 的事件时游戏崩溃
- ❌ 显示错误提示："effects.relationshipChanges.entries is not a function"

### 修复后
- ✅ 正确处理 JSON 中的普通对象格式
- ✅ 兼容 Map 格式（代码中创建的效果）
- ✅ 游戏正常运行，关系变化正确应用

## 影响范围

### 受影响的文件
1. `src/types/index.ts` - 类型定义
2. `src/game/GameEngine.ts` - 后端逻辑
3. `media/main.js` - 前端显示

### 受影响的功能
- ✅ 事件系统中的关系变化
- ✅ 任务奖励中的关系变化
- ✅ 选项效果中的关系变化

## 测试建议

### 测试场景1：触发包含关系变化的事件
1. 开始新游戏
2. 选择"外出探索"
3. 触发包含 NPC 关系变化的事件
4. 验证关系正确变化，无错误提示

### 测试场景2：完成任务
1. 触发并完成任务
2. 验证任务奖励中的关系变化正确应用
3. 检查关系面板显示正确

### 测试场景3：多个关系同时变化
1. 触发包含多个 NPC 关系变化的事件
2. 验证所有关系都正确更新
3. 检查提示信息正确显示

## 版本信息

- **修复版本**：v2.2.0
- **修复日期**：2026-04-30
- **Bug 严重程度**：高（导致游戏崩溃）
- **修复状态**：✅ 已完成

## 技术说明

### 为什么使用联合类型

```typescript
relationshipChanges?: Map<string, number> | Record<string, number>
```

**优点**：
1. 兼容 JSON 数据格式（普通对象）
2. 兼容代码中创建的 Map 对象
3. 类型安全，TypeScript 编译时检查

**处理方式**：
```typescript
const relationshipMap = effects.relationshipChanges instanceof Map 
  ? effects.relationshipChanges 
  : new Map(Object.entries(effects.relationshipChanges));
```

- 使用 `instanceof` 检查类型
- 如果是 Map，直接使用
- 如果是对象，转换为 Map
- 统一使用 Map 的 API 处理

### 其他可能的解决方案

#### 方案1：在加载时转换（未采用）
```typescript
// 在 EventGenerator 加载事件时转换
if (event.effects.relationshipChanges) {
  event.effects.relationshipChanges = new Map(
    Object.entries(event.effects.relationshipChanges)
  );
}
```

**缺点**：需要在多个加载点都添加转换逻辑

#### 方案2：修改 JSON 格式（未采用）
```json
"relationshipChanges": [
  ["npc_id", 10]
]
```

**缺点**：JSON 可读性差，不直观

#### 方案3：当前方案（已采用）
在使用时动态转换

**优点**：
- 集中处理，只需修改一处
- JSON 格式保持直观
- 兼容性最好

## 相关问题

### 是否有其他类似问题？

检查了其他可能使用 Map 的字段：
- ✅ `relationships` - 已正确处理
- ✅ `storyFlags` - 已正确处理
- ✅ `unlockedEvents` - 使用 Set，已正确处理

目前只有 `relationshipChanges` 存在此问题。

## 预防措施

### 未来开发建议

1. **类型定义**：
   - 对于可能从 JSON 加载的数据，使用联合类型
   - 明确标注哪些字段需要转换

2. **数据加载**：
   - 在数据加载层统一处理类型转换
   - 添加数据验证和转换工具函数

3. **测试**：
   - 添加单元测试覆盖 JSON 数据加载
   - 测试不同数据格式的兼容性

4. **文档**：
   - 在类型定义中添加注释说明格式要求
   - 在 JSON 数据文件中添加格式说明
