# Bug 修复：事件选项无法执行

## 问题描述
点击事件选项（如"上前拜见"）后显示："无效的选项，请输入有效的选项编号"

## 根本原因

游戏有两种类型的选项：

### 1. 日常选项（由 OptionSystem 生成）
- `cultivate` - 闭关修炼
- `explore` - 外出探索
- `view_status` - 查看详细状态
- `breakthrough` - 尝试突破
- 等等...

### 2. 事件选项（由 EventGenerator 生成）
- `greet` - 上前拜见（遇到前辈事件）
- `ignore` - 绕道而行
- `accept` - 接受任务
- `decline` - 拒绝任务
- 等等...

**问题：** `executeTurn` 方法只能处理日常选项，无法处理事件选项。

## 解决方案

### 1. 添加当前事件跟踪
在 `GameEngine` 类中添加 `currentEvent` 字段：

```typescript
private currentEvent: any = null;
```

### 2. 保存触发的事件
在 `tryTriggerRandomEvent` 方法中保存当前事件：

```typescript
tryTriggerRandomEvent() {
  const event = this.eventGenerator.tryTriggerEvent(...);
  
  if (event) {
    this.currentEvent = event;  // 保存当前事件
  }
  
  return event;
}
```

### 3. 在 executeTurn 中处理事件选项
在 `executeTurn` 方法开始时，先检查是否是事件选项：

```typescript
executeTurn(optionId: string) {
  // 1. 首先检查是否是当前事件的选项
  if (this.currentEvent && this.currentEvent.options) {
    const eventOption = this.currentEvent.options.find(opt => opt.id === optionId);
    if (eventOption) {
      // 应用事件选项效果
      this.applyOptionEffects(eventOption);
      
      // 清除当前事件
      this.currentEvent = null;
      
      return { success: true };
    }
  }
  
  // 2. 如果不是事件选项，处理日常选项
  let option = this.optionSystem.getCachedOption(optionId);
  // ...
}
```

## 修改的文件

1. **src/game/GameEngine.ts**
   - 添加 `currentEvent` 字段
   - 修改 `tryTriggerRandomEvent` 方法保存事件
   - 修改 `executeTurn` 方法处理事件选项

## 执行流程

### 正常流程（日常选项）
1. 用户点击"闭关修炼"
2. 前端发送 `{ actionId: 'cultivate' }`
3. 后端在 `OptionSystem` 缓存中找到选项
4. 执行选项效果

### 事件流程（事件选项）
1. 游戏触发随机事件"遇到前辈"
2. 后端保存 `currentEvent`
3. 前端显示事件选项："上前拜见"、"绕道而行"
4. 用户点击"上前拜见"
5. 前端发送 `{ actionId: 'greet' }`
6. 后端在 `currentEvent.options` 中找到选项
7. 执行选项效果
8. 清除 `currentEvent`

## 测试验证

```bash
# 编译代码
npm run compile

# 运行测试
npm test -- --testNamePattern="GameEngine"
```

## 调试日志

修复后，控制台会显示：

```
[GameEngine] executeTurn: 收到选项ID = "greet"
[GameEngine] 找到事件选项: 上前拜见
```

而不是：

```
[GameEngine] executeTurn: 收到选项ID = "greet"
[GameEngine] 找不到选项: "greet"
```

## 后续优化

1. **类型安全**：为 `currentEvent` 添加明确的类型定义
2. **事件栈**：支持嵌套事件（事件触发事件）
3. **事件历史**：记录已触发的事件
4. **事件冷却**：防止同一事件频繁触发
5. **事件优先级**：某些重要事件应该优先触发

## 相关文件

- `src/game/GameEngine.ts` - 游戏引擎主逻辑
- `src/game/EventGenerator.ts` - 事件生成器
- `src/game/OptionSystem.ts` - 选项系统
- `data/events.json` - 事件配置文件
