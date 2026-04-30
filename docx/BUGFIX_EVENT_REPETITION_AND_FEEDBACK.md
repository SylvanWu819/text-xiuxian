# 修复事件重复和缺少反馈问题

## 问题描述

### 问题1：事件重复触发
- **现象**：游戏中触发的事件总是重复的几个
- **根本原因**：`EventGenerator` 只在内存中硬编码了5个示例事件，完全没有加载 `data/events.json` 中的42个事件

### 问题2：缺少反馈
- **现象**：事件选项执行后没有任何反馈
- **根本原因**：
  1. 选项执行后没有显示结果文本
  2. 没有正反馈（成功提示、收益展示）
  3. 没有负反馈（失败提示、损失展示）

## 解决方案

### 1. 修复事件加载系统

#### EventGenerator.ts 修改
```typescript
// 添加异步加载方法
async loadEventsFromData(eventsData: { events: GameEvent[] }): Promise<void> {
  this.eventPool.clear();
  this.eventWeights.clear();
  
  for (const event of eventsData.events) {
    const weight = this.calculateEventWeight(event);
    this.registerEvent(event, weight);
  }
  
  console.log(`[EventGenerator] 加载了 ${this.eventPool.size} 个事件`);
}

// 添加权重计算
private calculateEventWeight(event: GameEvent): number {
  let weight = 10;
  
  switch (event.type) {
    case EventType.Fortune: weight = 12; break;
    case EventType.Crisis: weight = 8; break;
    case EventType.NPC: weight = 10; break;
    case EventType.Quest: weight = 15; break;
    case EventType.Story: weight = 5; break;
  }
  
  if (event.triggerConditions.probability) {
    weight *= event.triggerConditions.probability * 2;
  }
  
  return Math.max(1, Math.floor(weight));
}
```

#### 添加事件去重机制
```typescript
private triggeredEvents: Set<string> = new Set();

tryTriggerEvent(state: PlayerState, triggerProbability: number = 0.3): GameEvent | null {
  // ... 原有逻辑 ...
  
  // 过滤掉最近触发过的事件
  const freshEvents = eligibleEvents.filter(event => {
    if (this.triggeredEvents.has(event.id)) {
      return Math.random() > 0.7; // 70%概率跳过已触发事件
    }
    return true;
  });
  
  const selectedEvent = this.weightedRandomSelect(eventsToChoose);
  
  // 记录触发的事件
  this.triggeredEvents.add(selectedEvent.id);
  
  // 保持记录集合大小
  if (this.triggeredEvents.size > 20) {
    const firstEvent = this.triggeredEvents.values().next().value;
    this.triggeredEvents.delete(firstEvent);
  }
  
  return selectedEvent;
}
```

#### GameEngine.ts 修改
```typescript
// 修改为异步初始化
async initializeGame(playerName: string, cultivationPath: CultivationPath): Promise<void> {
  this.gameState = GameState.Initializing;
  this.playerState = this.createInitialPlayerState(playerName, cultivationPath);
  await this.initializeSubsystems(); // 异步加载
  this.gameState = GameState.Running;
  this.turnCount = 0;
}

// 添加数据加载方法
private async loadGameData(): Promise<void> {
  try {
    const eventsModule = await import('../../data/events.json');
    await this.eventGenerator.loadEventsFromData(eventsModule);
    console.log('[GameEngine] 游戏数据加载完成');
  } catch (error) {
    console.error('[GameEngine] 加载游戏数据失败:', error);
  }
}
```

### 2. 添加反馈系统

#### 修改 applyOptionEffects 返回反馈信息
```typescript
private applyOptionEffects(option: GameOption): {
  feedbackMessages: string[];
  positiveEffects: string[];
  negativeEffects: string[];
} {
  const feedbackMessages: string[] = [];
  const positiveEffects: string[] = [];
  const negativeEffects: string[] = [];

  // 修为变化
  if (effects.cultivationChange) {
    if (effects.cultivationChange > 0) {
      positiveEffects.push(`✨ 修为增加 ${effects.cultivationChange} 点`);
      feedbackMessages.push(`你感到体内真气增长，修为提升了 ${effects.cultivationChange} 点。`);
    } else {
      negativeEffects.push(`⚠️ 修为减少 ${Math.abs(effects.cultivationChange)} 点`);
      feedbackMessages.push(`你的修为受损，减少了 ${Math.abs(effects.cultivationChange)} 点。`);
    }
  }

  // 寿命变化
  if (effects.lifespanChange) {
    if (effects.lifespanChange > 0) {
      positiveEffects.push(`💚 寿命增加 ${effects.lifespanChange} 年`);
      feedbackMessages.push(`你感到生机勃勃，寿命延长了 ${effects.lifespanChange} 年！`);
    } else {
      negativeEffects.push(`💔 寿命减少 ${Math.abs(effects.lifespanChange)} 年`);
      feedbackMessages.push(`你感到生机流失，寿命减少了 ${Math.abs(effects.lifespanChange)} 年。`);
    }
  }

  // 资源变化
  if (effects.resourceChanges?.spiritStones) {
    const change = effects.resourceChanges.spiritStones;
    if (change > 0) {
      positiveEffects.push(`💎 获得 ${change} 灵石`);
      feedbackMessages.push(`你获得了 ${change} 块灵石。`);
    } else {
      negativeEffects.push(`💸 消耗 ${Math.abs(change)} 灵石`);
      feedbackMessages.push(`你消耗了 ${Math.abs(change)} 块灵石。`);
    }
  }

  // ... 其他效果的反馈 ...

  return { feedbackMessages, positiveEffects, negativeEffects };
}
```

#### 修改 executeTurn 返回反馈
```typescript
executeTurn(optionId: string): {
  success: boolean;
  message?: string;
  feedback?: {
    messages: string[];
    positiveEffects: string[];
    negativeEffects: string[];
  };
  // ... 其他字段
} {
  // ... 原有逻辑 ...
  
  const feedback = this.applyOptionEffects(option);
  
  return {
    success: true,
    feedback,
    breakthroughOccurred,
    endingReached: false
  };
}
```

#### extension.ts 显示反馈
```typescript
const result = this.gameEngine.executeTurn(payload.actionId);

if (result.feedback) {
  if (result.feedback.messages.length > 0) {
    const mainMessage = result.feedback.messages.join('\n');
    this.messageBridge.sendToWebview({
      type: 'actionFeedback',
      payload: {
        message: mainMessage,
        positiveEffects: result.feedback.positiveEffects,
        negativeEffects: result.feedback.negativeEffects
      }
    });
  }
}
```

## 效果

### 修复前
- ❌ 只有5个事件循环出现
- ❌ 选项执行后没有任何反馈
- ❌ 玩家不知道选择的结果

### 修复后
- ✅ 加载全部42个事件
- ✅ 事件去重机制，减少重复
- ✅ 完整的反馈系统：
  - 文字描述反馈
  - 正面效果列表（绿色图标）
  - 负面效果列表（红色图标）
- ✅ 玩家清楚知道每个选择的结果

## 测试建议

1. **事件多样性测试**
   - 连续玩10个回合，记录触发的事件
   - 应该看到多种不同的事件
   - 同一事件不应频繁重复

2. **反馈显示测试**
   - 选择修炼选项，应显示修为增加反馈
   - 选择消耗灵石的选项，应显示灵石减少反馈
   - 选择有多个效果的选项，应显示所有效果

3. **正负反馈测试**
   - 正面效果应有绿色图标和鼓励性文字
   - 负面效果应有红色图标和警示性文字

## 版本信息

- 修复版本：2.1.1
- 修复日期：2026-04-30
- 影响文件：
  - src/game/EventGenerator.ts
  - src/game/GameEngine.ts
  - src/extension.ts
