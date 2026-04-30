# 设计文档：修仙模拟器

## 概述

修仙模拟器是一个基于 VSCode 插件的选项驱动型文字游戏。采用前后端分离架构，Extension 后端负责游戏逻辑，Webview 前端负责界面渲染。游戏通过 JSON 配置文件实现数据驱动，支持丰富的随机事件和剧情分支。

### 设计目标

1. **前后端分离** - Extension 处理游戏逻辑，Webview 仅负责 UI
2. **数据驱动** - 事件、剧情、NPC 通过 JSON 配置
3. **简洁实现** - 最小化依赖，使用 TypeScript 标准库
4. **高随机性** - 权重系统 + 条件过滤实现丰富变化
5. **状态机驱动** - 所有操作都是 PlayerState 的状态转换

### 技术栈

- **后端**: TypeScript + VSCode Extension API
- **前端**: HTML + CSS + Vanilla JavaScript
- **存储**: VSCode globalState API (存档) + JSON 文件 (配置)
- **通信**: postMessage API

## 系统架构

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    VSCode Extension                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Extension.ts (入口)                    │ │
│  │  - activate()                                       │ │
│  │  - registerCommands()                               │ │
│  │  - createWebviewProvider()                          │ │
│  └────────────────────────────────────────────────────┘ │
│                          │                               │
│                          ▼                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │            GameEngine (游戏引擎)                    │ │
│  │  - gameLoop()                                       │ │
│  │  - processAction(action)                            │ │
│  │  - checkEndingConditions()                          │ │
│  └────────────────────────────────────────────────────┘ │
│         │          │          │          │               │
│         ▼          ▼          ▼          ▼               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │  Time   │ │  Event  │ │ Option  │ │  State  │       │
│  │ Manager │ │Generator│ │ System  │ │ Tracker │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│         │          │          │          │               │
│         └──────────┴──────────┴──────────┘               │
│                     │                                     │
│                     ▼                                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │              PlayerState (游戏状态)                 │ │
│  │  - cultivation, resources, relationships, etc.     │ │
│  └────────────────────────────────────────────────────┘ │
│                     │                                     │
│                     ▼                                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │           MessageBridge (消息桥接)                  │ │
│  │  - sendToWebview(message)                           │ │
│  │  - handleFromWebview(message)                       │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ postMessage
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Webview (前端)                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │              UIRenderer (界面渲染)                  │ │
│  │  - renderGameState(state)                           │ │
│  │  - renderOptions(options)                           │ │
│  │  - renderToolbar()                                  │ │
│  └────────────────────────────────────────────────────┘ │
│                          │                               │
│                          ▼                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │              HTML/CSS (界面)                        │ │
│  │  - 黑底白字                                         │ │
│  │  - 细长条布局                                       │ │
│  │  - 功能按键工具栏                                   │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 核心数据结构

### PlayerState (玩家状态)

```typescript
interface PlayerState {
  // 基础信息
  name: string;
  cultivationPath: CultivationPath;
  
  // 修为系统
  cultivation: {
    level: CultivationLevel;  // 炼气期、筑基期、金丹期等
    experience: number;        // 当前境界的修为值
    maxExperience: number;     // 突破所需修为值
  };
  
  // 时间系统
  time: {
    year: number;
    season: Season;  // 春夏秋冬
    month: number;
  };
  
  // 寿命系统
  lifespan: {
    current: number;  // 剩余寿命
    max: number;      // 最大寿命
  };
  
  // 资源系统
  resources: {
    spiritStones: number;  // 灵石
    pills: Map<string, number>;  // 丹药 {丹药ID: 数量}
    artifacts: Map<string, number>;  // 法器
  };
  
  // 关系系统
  relationships: Map<string, number>;  // {NPC_ID: 关系值(-100~100)}
  
  // 势力系统
  faction: {
    current: string | null;  // 当前所属势力
    reputation: Map<string, number>;  // {势力ID: 声望值}
  };
  
  // 因果系统
  karma: {
    goodDeeds: number;   // 善缘值
    karmicDebt: number;  // 因果债
  };
  
  // 声望系统
  reputation: {
    righteous: number;  // 正道声望 (0-100)
    demonic: number;    // 魔道声望 (0-100)
  };
  
  // 历史记录
  history: GameEvent[];  // 历史事件列表
  
  // 剧情进度
  storyProgress: {
    completedQuests: Set<string>;  // 已完成任务
    activeQuests: Set<string>;     // 进行中任务
    unlockedEvents: Set<string>;   // 已解锁事件
    storyFlags: Map<string, any>;  // 剧情标记
  };
}
```

### GameEvent (游戏事件)

```typescript
interface GameEvent {
  id: string;
  type: EventType;  // 'fortune' | 'crisis' | 'npc' | 'quest' | 'story'
  title: string;
  description: string;
  
  // 触发条件
  triggerConditions: {
    minCultivationLevel?: CultivationLevel;
    maxCultivationLevel?: CultivationLevel;
    requiredPath?: CultivationPath;
    minReputation?: { righteous?: number; demonic?: number };
    requiredFlags?: string[];  // 需要的剧情标记
    probability?: number;  // 触发概率 (0-1)
  };
  
  // 事件选项
  options: EventOption[];
  
  // 事件链
  nextEvent?: string;  // 下一个事件ID
}

interface EventOption {
  id: string;
  text: string;
  description?: string;  // 选项说明
  
  // 选项要求
  requirements?: {
    minResources?: { spiritStones?: number };
    minRelationship?: { npcId: string; value: number };
    requiredItems?: string[];
  };
  
  // 选项结果
  effects: {
    resourceChanges?: { spiritStones?: number };
    relationshipChanges?: Map<string, number>;
    karmaChange?: { goodDeeds?: number; karmicDebt?: number };
    reputationChange?: { righteous?: number; demonic?: number };
    cultivationChange?: number;
    lifespanChange?: number;
    setFlags?: string[];  // 设置剧情标记
    unlockEvents?: string[];  // 解锁事件
    triggerEvent?: string;  // 触发事件
  };
  
  // 随机结果
  outcomes?: {
    probability: number;
    description: string;
    effects: any;
  }[];
}
```

### CultivationPath (修行方向)

```typescript
interface CultivationPath {
  id: string;
  name: string;  // 剑修、体修、丹修、阵修
  description: string;
  
  // 初始属性
  initialStats: {
    spiritStones: number;
    specialAbility?: string;
  };
  
  // 专属事件池
  exclusiveEvents: string[];  // 事件ID列表
  
  // 修炼速度加成
  cultivationBonus: number;  // 1.0 = 正常, 1.2 = 快20%
}
```

## 核心系统设计

### 1. 游戏引擎 (GameEngine)

```typescript
class GameEngine {
  private state: PlayerState;
  private timeManager: TimeManager;
  private eventGenerator: EventGenerator;
  private optionSystem: OptionSystem;
  private stateTracker: StateTracker;
  private saveSystem: SaveSystem;
  
  // 游戏主循环
  async gameLoop(): Promise<void> {
    while (!this.checkEndingConditions()) {
      // 1. 更新状态
      this.stateTracker.update();
      
      // 2. 触发随机事件 (30%概率)
      const randomEvent = this.eventGenerator.tryTriggerEvent(this.state);
      if (randomEvent) {
        await this.handleEvent(randomEvent);
        continue;
      }
      
      // 3. 生成日常选项
      const options = this.optionSystem.generateOptions(this.state);
      
      // 4. 等待玩家选择
      const choice = await this.waitForPlayerChoice(options);
      
      // 5. 执行选择
      this.processAction(choice);
      
      // 6. 推进时间
      this.timeManager.advance(choice.timeCost);
    }
    
    // 触发结局
    this.triggerEnding();
  }
  
  // 处理玩家行动
  processAction(action: PlayerAction): void {
    // 应用资源变化
    this.applyResourceChanges(action.effects.resourceChanges);
    
    // 应用关系变化
    this.applyRelationshipChanges(action.effects.relationshipChanges);
    
    // 应用因果变化
    this.applyKarmaChanges(action.effects.karmaChange);
    
    // 应用修为变化
    this.applyCultivationChange(action.effects.cultivationChange);
    
    // 检查突破
    this.checkBreakthrough();
    
    // 记录历史
    this.stateTracker.recordEvent(action);
    
    // 通知前端更新
    this.notifyStateChange();
  }
  
  // 检查结局条件
  checkEndingConditions(): boolean {
    // 寿命耗尽 -> 坐化结局
    if (this.state.lifespan.current <= 0) {
      return true;
    }
    
    // 修为达到飞升境界 -> 飞升结局
    if (this.state.cultivation.level === CultivationLevel.Ascension) {
      return true;
    }
    
    // 其他结局条件...
    return false;
  }
}
```

### 2. 事件生成器 (EventGenerator)

```typescript
class EventGenerator {
  private eventPool: Map<string, GameEvent>;
  
  // 尝试触发随机事件
  tryTriggerEvent(state: PlayerState): GameEvent | null {
    // 30%概率触发事件
    if (Math.random() > 0.3) {
      return null;
    }
    
    // 过滤可触发的事件
    const eligibleEvents = this.filterEligibleEvents(state);
    
    if (eligibleEvents.length === 0) {
      return null;
    }
    
    // 根据权重随机选择
    return this.weightedRandomSelect(eligibleEvents);
  }
  
  // 过滤符合条件的事件
  private filterEligibleEvents(state: PlayerState): GameEvent[] {
    const eligible: GameEvent[] = [];
    
    for (const event of this.eventPool.values()) {
      if (this.checkTriggerConditions(event, state)) {
        eligible.push(event);
      }
    }
    
    return eligible;
  }
  
  // 检查触发条件
  private checkTriggerConditions(event: GameEvent, state: PlayerState): boolean {
    const cond = event.triggerConditions;
    
    // 检查修为等级
    if (cond.minCultivationLevel && 
        state.cultivation.level < cond.minCultivationLevel) {
      return false;
    }
    
    // 检查修行方向
    if (cond.requiredPath && 
        state.cultivationPath.id !== cond.requiredPath) {
      return false;
    }
    
    // 检查声望
    if (cond.minReputation) {
      if (cond.minReputation.righteous && 
          state.reputation.righteous < cond.minReputation.righteous) {
        return false;
      }
    }
    
    // 检查剧情标记
    if (cond.requiredFlags) {
      for (const flag of cond.requiredFlags) {
        if (!state.storyProgress.storyFlags.has(flag)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  // 权重随机选择
  private weightedRandomSelect(events: GameEvent[]): GameEvent {
    // 简化版：等权重随机
    const index = Math.floor(Math.random() * events.length);
    return events[index];
  }
}
```

### 3. 选项系统 (OptionSystem)

```typescript
class OptionSystem {
  // 生成日常选项
  generateOptions(state: PlayerState): GameOption[] {
    const options: GameOption[] = [];
    
    // 基础选项：修炼
    options.push({
      id: 'cultivate',
      text: '闭关修炼',
      description: '+10修为，消耗1个月',
      timeCost: { months: 1 },
      effects: {
        cultivationChange: 10
      }
    });
    
    // 基础选项：探索
    options.push({
      id: 'explore',
      text: '外出探索',
      description: '可能遇到机缘或危险',
      timeCost: { months: 1 },
      effects: {}
    });
    
    // 条件选项：宗门任务（需要加入宗门）
    if (state.faction.current) {
      options.push({
        id: 'sect_quest',
        text: '接取宗门任务',
        description: '+灵石+声望',
        timeCost: { months: 1 },
        effects: {
          resourceChanges: { spiritStones: 50 },
          reputationChange: { righteous: 5 }
        }
      });
    }
    
    // 条件选项：购买丹药（需要足够灵石）
    if (state.resources.spiritStones >= 100) {
      options.push({
        id: 'buy_pill',
        text: '购买筑基丹',
        description: '消耗100灵石，获得筑基丹',
        requirements: {
          minResources: { spiritStones: 100 }
        },
        effects: {
          resourceChanges: { spiritStones: -100 }
        }
      });
    }
    
    // 查看状态
    options.push({
      id: 'view_status',
      text: '查看详细状态',
      description: '查看修为、资源、关系等信息',
      timeCost: { months: 0 },
      effects: {}
    });
    
    return options;
  }
}
```

### 4. 时间管理器 (TimeManager)

```typescript
class TimeManager {
  // 推进时间
  advance(timeCost: TimeCost): void {
    // 推进月份
    this.state.time.month += timeCost.months || 0;
    
    // 处理季节和年份
    while (this.state.time.month > 12) {
      this.state.time.month -= 12;
      this.state.time.year += 1;
    }
    
    // 更新季节
    this.updateSeason();
    
    // 减少寿命
    this.state.lifespan.current -= (timeCost.months || 0) / 12;
    
    // 触发时间事件
    this.checkTimeEvents();
  }
  
  // 更新季节
  private updateSeason(): void {
    const month = this.state.time.month;
    if (month >= 1 && month <= 3) {
      this.state.time.season = Season.Spring;
    } else if (month >= 4 && month <= 6) {
      this.state.time.season = Season.Summer;
    } else if (month >= 7 && month <= 9) {
      this.state.time.season = Season.Autumn;
    } else {
      this.state.time.season = Season.Winter;
    }
  }
  
  // 检查时间触发事件
  private checkTimeEvents(): void {
    // 每年春季：宗门大比
    if (this.state.time.season === Season.Spring && 
        this.state.time.month === 1) {
      this.triggerEvent('sect_competition');
    }
    
    // 每5年：秘境开启
    if (this.state.time.year % 5 === 0 && 
        this.state.time.month === 1) {
      this.triggerEvent('secret_realm_opens');
    }
  }
}
```

### 5. 渡劫系统 (TribulationSystem)

```typescript
class TribulationSystem {
  // 触发渡劫
  triggerTribulation(state: PlayerState): TribulationEvent {
    const tribulation: TribulationEvent = {
      type: this.determineTribulationType(state),
      difficulty: this.calculateDifficulty(state),
      demons: this.generateDemons(state)
    };
    
    return tribulation;
  }
  
  // 确定劫难类型
  private determineTribulationType(state: PlayerState): TribulationType {
    // 高因果债 -> 心魔劫
    if (state.karma.karmicDebt > 50) {
      return TribulationType.InnerDemon;
    }
    
    // 正常 -> 天劫
    return TribulationType.HeavenlyTribulation;
  }
  
  // 计算难度
  private calculateDifficulty(state: PlayerState): number {
    let difficulty = 1.0;
    
    // 因果债增加难度
    difficulty += state.karma.karmicDebt / 100;
    
    // 魔道声望增加难度
    difficulty += state.reputation.demonic / 200;
    
    return difficulty;
  }
  
  // 生成心魔
  private generateDemons(state: PlayerState): Demon[] {
    const demons: Demon[] = [];
    
    // 从历史中找出杀人事件
    for (const event of state.history) {
      if (event.type === 'kill') {
        demons.push({
          name: event.victimName,
          description: `${event.victimName}的怨念化作心魔...`,
          power: event.victimPower
        });
      }
    }
    
    return demons;
  }
}
```

## JSON 配置格式

### 事件配置 (events.json)

```json
{
  "events": [
    {
      "id": "ancient_cave",
      "type": "fortune",
      "title": "上古洞府",
      "description": "你在山谷中发现一个隐蔽的洞府入口...",
      "triggerConditions": {
        "minCultivationLevel": "qi_refining",
        "probability": 0.15
      },
      "options": [
        {
          "id": "enter",
          "text": "进入探索",
          "description": "高风险高回报",
          "outcomes": [
            {
              "probability": 0.4,
              "description": "你获得了上古功法！",
              "effects": {
                "cultivationChange": 100,
                "setFlags": ["obtained_ancient_technique"]
              }
            },
            {
              "probability": 0.3,
              "description": "你触发了禁制，受了重伤",
              "effects": {
                "lifespanChange": -5
              }
            },
            {
              "probability": 0.3,
              "description": "洞府已空，只剩残破的石碑",
              "effects": {
                "cultivationChange": 5
              }
            }
          ]
        },
        {
          "id": "leave",
          "text": "离开",
          "effects": {}
        }
      ]
    }
  ]
}
```

### 修行方向配置 (cultivation_paths.json)

```json
{
  "paths": [
    {
      "id": "sword",
      "name": "剑修",
      "description": "以剑入道，攻击力强",
      "initialStats": {
        "spiritStones": 10,
        "specialAbility": "剑气"
      },
      "cultivationBonus": 1.0,
      "exclusiveEvents": ["sword_master_encounter", "sword_dao_enlightenment"]
    },
    {
      "id": "body",
      "name": "体修",
      "description": "炼体为主，防御力高",
      "initialStats": {
        "spiritStones": 10,
        "specialAbility": "金刚体"
      },
      "cultivationBonus": 0.9,
      "exclusiveEvents": ["body_tempering_trial"]
    }
  ]
}
```

### NPC配置 (npcs.json)

```json
{
  "npcs": [
    {
      "id": "elder_chen",
      "name": "陈长老",
      "faction": "righteous_sect",
      "personality": "strict",
      "initialRelationship": 0,
      "dialogues": {
        "greeting": "年轻人，修行需要持之以恒。",
        "high_relationship": "你很有天赋，我看好你。",
        "low_relationship": "哼，不思进取。"
      }
    }
  ]
}
```

## 前后端通信协议

### 消息类型

```typescript
// 前端 -> 后端
type WebviewMessage = 
  | { type: 'action', payload: { actionId: string } }
  | { type: 'save' }
  | { type: 'load', payload: { slotId: number } }
  | { type: 'restart' }
  | { type: 'fontSettings', payload: { size: string; family: string } };

// 后端 -> 前端
type ExtensionMessage =
  | { type: 'stateUpdate', payload: PlayerState }
  | { type: 'options', payload: GameOption[] }
  | { type: 'event', payload: GameEvent }
  | { type: 'notification', payload: { message: string; type: 'success' | 'error' } };
```

### 通信流程

```typescript
// Extension 端
class MessageBridge {
  sendToWebview(message: ExtensionMessage): void {
    this.webviewPanel.webview.postMessage(message);
  }
  
  handleFromWebview(message: WebviewMessage): void {
    switch (message.type) {
      case 'action':
        this.gameEngine.processAction(message.payload.actionId);
        break;
      case 'save':
        this.saveSystem.save();
        break;
      // ...
    }
  }
}

// Webview 端
window.addEventListener('message', event => {
  const message = event.data;
  switch (message.type) {
    case 'stateUpdate':
      uiRenderer.renderGameState(message.payload);
      break;
    case 'options':
      uiRenderer.renderOptions(message.payload);
      break;
    // ...
  }
});
```

## UI 设计

### 界面布局

```
┌─────────────────────────────────────┐
│  [字体] [存档] [重开] [历史]  工具栏 │
├─────────────────────────────────────┤
│                                     │
│  === 第1年 春季 ===                 │
│                                     │
│  修为: 炼气期 3层 (30/100)          │
│  灵石: 50  寿命: 78年               │
│  正道声望: 20  魔道声望: 0          │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  你在宗门修炼...                    │
│                                     │
│  本月可选行动：                     │
│                                     │
│  [1] 闭关修炼                       │
│      +10修为，消耗1个月             │
│                                     │
│  [2] 外出探索                       │
│      可能遇到机缘或危险             │
│                                     │
│  [3] 接取宗门任务                   │
│      +灵石+声望                     │
│                                     │
│  [4] 查看详细状态                   │
│                                     │
│  请选择（输入数字）：               │
│  > _                                │
│                                     │
└─────────────────────────────────────┘
```

### CSS 样式要点

```css
/* 黑底白字 */
body {
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Microsoft YaHei', sans-serif;
  padding: 0;
  margin: 0;
}

/* 工具栏 */
.toolbar {
  position: sticky;
  top: 0;
  background-color: #252526;
  padding: 8px;
  border-bottom: 1px solid #3e3e42;
  display: flex;
  gap: 8px;
}

/* 按钮 */
.button {
  background-color: #0e639c;
  color: #ffffff;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.button:hover {
  background-color: #1177bb;
}

.button:disabled {
  background-color: #3e3e42;
  color: #858585;
  cursor: not-allowed;
}

/* 选项按钮 */
.option-button {
  width: 100%;
  text-align: left;
  margin-bottom: 8px;
  padding: 12px;
  background-color: #2d2d30;
  border: 1px solid #3e3e42;
}

.option-button:hover:not(:disabled) {
  background-color: #37373d;
  border-color: #0e639c;
}
```

## 存档系统

### 存档数据结构

```typescript
interface SaveData {
  version: string;  // 存档版本
  timestamp: number;  // 保存时间戳
  slotId: number;  // 存档槽位
  playerState: PlayerState;  // 完整游戏状态
}
```

### 存档实现

```typescript
class SaveSystem {
  private context: vscode.ExtensionContext;
  
  // 保存游戏
  async save(slotId: number, state: PlayerState): Promise<void> {
    const saveData: SaveData = {
      version: '1.0.0',
      timestamp: Date.now(),
      slotId,
      playerState: state
    };
    
    const key = `save_slot_${slotId}`;
    await this.context.globalState.update(key, saveData);
  }
  
  // 加载游戏
  async load(slotId: number): Promise<PlayerState | null> {
    const key = `save_slot_${slotId}`;
    const saveData = this.context.globalState.get<SaveData>(key);
    
    if (!saveData) {
      return null;
    }
    
    // 版本兼容性检查
    if (saveData.version !== '1.0.0') {
      throw new Error('存档版本不兼容');
    }
    
    return saveData.playerState;
  }
  继续设计文档：

---

  // 列出所有存档
  async listSaves(): Promise<SaveData[]> {
    const saves: SaveData[] = [];
    
    for (let i = 1; i <= 3; i++) {
      const key = `save_slot_${i}`;
      const saveData = this.context.globalState.get<SaveData>(key);
      if (saveData) {
        saves.push(saveData);
      }
    }
    
    return saves;
  }
  
  // 删除存档
  async deleteSave(slotId: number): Promise<void> {
    const key = `save_slot_${slotId}`;
    await this.context.globalState.update(key, undefined);
  }
}
```

## 功能按键系统

### 工具栏管理器

```typescript
class ToolbarManager {
  private fontSettings: FontSettings;
  
  // 初始化工具栏
  initialize(): void {
    this.loadFontSettings();
    this.renderToolbar();
    this.attachEventListeners();
  }
  
  // 渲染工具栏
  private renderToolbar(): void {
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    toolbar.innerHTML = `
      <button id="btn-font" class="toolbar-button" title="字体设置">
        <span class="icon">🔤</span> 字体
      </button>
      <button id="btn-save" class="toolbar-button" title="快速存档">
        <span class="icon">💾</span> 存档
      </button>
      <button id="btn-restart" class="toolbar-button" title="重新开始">
        <span class="icon">🔄</span> 重开
      </button>
      <button id="btn-history" class="toolbar-button" title="历史记录">
        <span class="icon">📜</span> 历史
      </button>
    `;
    
    document.body.insertBefore(toolbar, document.body.firstChild);
  }
  
  // 绑定事件
  private attachEventListeners(): void {
    document.getElementById('btn-font')?.addEventListener('click', () => {
      this.showFontPanel();
    });
    
    document.getElementById('btn-save')?.addEventListener('click', () => {
      this.quickSave();
    });
    
    document.getElementById('btn-restart')?.addEventListener('click', () => {
      this.confirmRestart();
    });
    
    document.getElementById('btn-history')?.addEventListener('click', () => {
      this.showHistoryPanel();
    });
  }
  
  // 显示字体设置面板
  private showFontPanel(): void {
    const panel = document.createElement('div');
    panel.className = 'modal-overlay';
    panel.innerHTML = `
      <div class="modal-content">
        <h3>字体设置</h3>
        
        <div class="setting-group">
          <label>字体大小</label>
          <select id="font-size">
            <option value="small">小</option>
            <option value="medium" selected>中</option>
            <option value="large">大</option>
            <option value="xlarge">特大</option>
          </select>
        </div>
        
        <div class="setting-group">
          <label>字体类型</label>
          <select id="font-family">
            <option value="default">系统默认</option>
            <option value="songti">宋体</option>
            <option value="heiti">黑体</option>
            <option value="monospace">等宽字体</option>
          </select>
        </div>
        
        <div class="modal-buttons">
          <button id="btn-close-font" class="button">关闭</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // 应用当前设置
    this.applyFontSettings();
    
    // 绑定事件
    document.getElementById('font-size')?.addEventListener('change', (e) => {
      this.fontSettings.size = (e.target as HTMLSelectElement).value;
      this.applyFontSettings();
      this.saveFontSettings();
    });
    
    document.getElementById('font-family')?.addEventListener('change', (e) => {
      this.fontSettings.family = (e.target as HTMLSelectElement).value;
      this.applyFontSettings();
      this.saveFontSettings();
    });
    
    document.getElementById('btn-close-font')?.addEventListener('click', () => {
      panel.remove();
    });
  }
  
  // 应用字体设置
  private applyFontSettings(): void {
    const root = document.documentElement;
    
    // 字体大小
    const sizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px'
    };
    root.style.fontSize = sizeMap[this.fontSettings.size] || '16px';
    
    // 字体类型
    const familyMap = {
      default: "'Microsoft YaHei', sans-serif",
      songti: "'SimSun', serif",
      heiti: "'SimHei', sans-serif",
      monospace: "'Consolas', 'Courier New', monospace"
    };
    root.style.fontFamily = familyMap[this.fontSettings.family] || familyMap.default;
  }
  
  // 快速存档
  private quickSave(): void {
    // 发送消息到后端
    vscode.postMessage({ type: 'save', payload: { slotId: 1 } });
    
    // 显示提示
    this.showNotification('保存成功', 'success');
  }
  
  // 确认重开
  private confirmRestart(): void {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>确认重开</h3>
        <p>确定要开始新游戏吗？未保存的进度将丢失。</p>
        <div class="modal-buttons">
          <button id="btn-confirm-restart" class="button button-danger">确定</button>
          <button id="btn-cancel-restart" class="button">取消</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('btn-confirm-restart')?.addEventListener('click', () => {
      vscode.postMessage({ type: 'restart' });
      modal.remove();
    });
    
    document.getElementById('btn-cancel-restart')?.addEventListener('click', () => {
      modal.remove();
    });
  }
  
  // 显示历史记录
  private showHistoryPanel(): void {
    // 请求历史记录
    vscode.postMessage({ type: 'getHistory' });
  }
  
  // 显示通知
  private showNotification(message: string, type: 'success' | 'error'): void {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }
}
```

### 字体设置数据结构

```typescript
interface FontSettings {
  size: 'small' | 'medium' | 'large' | 'xlarge';
  family: 'default' | 'songti' | 'heiti' | 'monospace';
}
```

## 历史记录系统

### 历史记录管理器

```typescript
class HistoryManager {
  private history: HistoryEntry[] = [];
  private maxEntries = 50;
  
  // 记录事件
  recordEvent(event: HistoryEntry): void {
    this.history.unshift(event);  // 添加到开头
    
    // 限制数量
    if (this.history.length > this.maxEntries) {
      this.history = this.history.slice(0, this.maxEntries);
    }
  }
  
  // 获取历史记录
  getHistory(): HistoryEntry[] {
    return this.history;
  }
  
  // 渲染历史记录面板
  renderHistoryPanel(history: HistoryEntry[]): void {
    const panel = document.createElement('div');
    panel.className = 'modal-overlay';
    
    const historyHTML = history.map(entry => `
      <div class="history-entry ${entry.isKeyChoice ? 'key-choice' : ''}">
        <div class="history-time">${this.formatTime(entry.time)}</div>
        <div class="history-description">${entry.description}</div>
      </div>
    `).join('');
    
    panel.innerHTML = `
      <div class="modal-content history-panel">
        <h3>历史记录</h3>
        <div class="history-list">
          ${historyHTML || '<p class="empty-message">暂无历史记录</p>'}
        </div>
        <div class="modal-buttons">
          <button id="btn-close-history" class="button">关闭</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    document.getElementById('btn-close-history')?.addEventListener('click', () => {
      panel.remove();
    });
  }
  
  // 格式化时间
  private formatTime(time: GameTime): string {
    const seasons = ['春季', '夏季', '秋季', '冬季'];
    return `第${time.year}年 ${seasons[time.season]}`;
  }
}

interface HistoryEntry {
  time: GameTime;
  description: string;
  isKeyChoice: boolean;  // 是否为关键选择
}
```

## VSCode 插件配置

### package.json

```json
{
  "name": "cultivation-simulator",
  "displayName": "修仙模拟器",
  "description": "一个运行在VSCode中的修仙文字游戏",
  "version": "1.0.0",
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": ["Other"],
  "activationEvents": [
    "onView:cultivationSimulator"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "cultivation-simulator",
          "title": "修仙模拟器",
          "icon": "resources/icon.svg"
        }
      ]
    },
    "views": {
      "cultivation-simulator": [
        {
          "type": "webview",
          "id": "cultivationSimulator",
          "name": "游戏"
        }
      ]
    },
    "commands": [
      {
        "command": "cultivationSimulator.newGame",
        "title": "修仙模拟器: 新游戏"
      },
      {
        "command": "cultivationSimulator.loadGame",
        "title": "修仙模拟器: 加载游戏"
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./"
  },
  "devDependencies": {
    "@types/vscode": "^1.80.0",
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

### extension.ts (入口文件)

```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  // 注册 Webview Provider
  const provider = new CultivationSimulatorProvider(context);
  
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'cultivationSimulator',
      provider
    )
  );
  
  // 注册命令
  context.subscriptions.push(
    vscode.commands.registerCommand('cultivationSimulator.newGame', () => {
      provider.newGame();
    })
  );
  
  context.subscriptions.push(
    vscode.commands.registerCommand('cultivationSimulator.loadGame', () => {
      provider.loadGame();
    })
  );
}

export function deactivate() {}
```

### WebviewProvider

```typescript
class CultivationSimulatorProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private gameEngine: GameEngine;
  
  constructor(private context: vscode.ExtensionContext) {
    this.gameEngine = new GameEngine(context);
  }
  
  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ): void {
    this.view = webviewView;
    
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri]
    };
    
    webviewView.webview.html = this.getHtmlContent(webviewView.webview);
    
    // 处理来自 Webview 的消息
    webviewView.webview.onDidReceiveMessage(message => {
      this.handleMessage(message);
    });
    
    // 初始化游戏
    this.gameEngine.initialize();
  }
  
  private getHtmlContent(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'style.css')
    );
    
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'main.js')
    );
    
    return `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri}" rel="stylesheet">
        <title>修仙模拟器</title>
      </head>
      <body>
        <div id="app">
          <div id="loading">加载中...</div>
        </div>
        <script src="${scriptUri}"></script>
      </body>
      </html>
    `;
  }
  
  private handleMessage(message: any): void {
    switch (message.type) {
      case 'action':
        this.gameEngine.processAction(message.payload.actionId);
        break;
      case 'save':
        this.gameEngine.save(message.payload.slotId);
        break;
      case 'load':
        this.gameEngine.load(message.payload.slotId);
        break;
      case 'restart':
        this.gameEngine.restart();
        break;
      case 'getHistory':
        this.sendHistory();
        break;
      case 'fontSettings':
        this.saveFontSettings(message.payload);
        break;
    }
  }
  
  public sendToWebview(message: any): void {
    this.view?.webview.postMessage(message);
  }
  
  public newGame(): void {
    this.gameEngine.newGame();
  }
  
  public loadGame(): void {
    // 显示存档选择
    this.gameEngine.showLoadDialog();
  }
  
  private sendHistory(): void {
    const history = this.gameEngine.getHistory();
    this.sendToWebview({ type: 'history', payload: history });
  }
  
  private saveFontSettings(settings: FontSettings): void {
    this.context.globalState.update('fontSettings', settings);
  }
}
```

## 项目文件结构

```
cultivation-simulator/
├── src/
│   ├── extension.ts              # 插件入口
│   ├── game/
│   │   ├── GameEngine.ts         # 游戏引擎
│   │   ├── TimeManager.ts        # 时间管理器
│   │   ├── EventGenerator.ts     # 事件生成器
│   │   ├── OptionSystem.ts       # 选项系统
│   │   ├── StateTracker.ts       # 状态追踪器
│   │   ├── SaveSystem.ts         # 存档系统
│   │   ├── TribulationSystem.ts  # 渡劫系统
│   │   ├── KarmaSystem.ts        # 因果系统
│   │   ├── RelationshipSystem.ts # 人脉系统
│   │   ├── FactionSystem.ts      # 势力系统
│   │   ├── FortuneSystem.ts      # 机缘系统
│   │   ├── ResourceManager.ts    # 资源管理器
│   │   ├── LifespanSystem.ts     # 寿命系统
│   │   ├── ReputationSystem.ts   # 声望系统
│   │   ├── EndingSystem.ts       # 结局系统
│   │   └── StoryBranchManager.ts # 剧情分支管理器
│   ├── types/
│   │   ├── PlayerState.ts        # 玩家状态类型
│   │   ├── GameEvent.ts          # 游戏事件类型
│   │   ├── CultivationPath.ts    # 修行方向类型
│   │   └── index.ts              # 类型导出
│   └── utils/
│       ├── ConfigLoader.ts       # 配置加载器
│       └── MessageBridge.ts      # 消息桥接器
├── media/
│   ├── style.css                 # 样式文件
│   ├── main.js                   # 前端脚本
│   └── icon.svg                  # 图标
├── data/
│   ├── events.json               # 事件配置
│   ├── cultivation_paths.json    # 修行方向配置
│   ├── npcs.json                 # NPC配置
│   └── quests.json               # 任务配置
├── package.json                  # 插件配置
├── tsconfig.json                 # TypeScript配置
└── README.md                     # 说明文档
```

## 性能优化

### 1. 事件池优化

```typescript
class EventGenerator {
  private eventCache: Map<string, GameEvent[]> = new Map();
  
  // 缓存符合条件的事件
  private getCachedEligibleEvents(state: PlayerState): GameEvent[] {
    const cacheKey = this.generateCacheKey(state);
    
    if (this.eventCache.has(cacheKey)) {
      return this.eventCache.get(cacheKey)!;
    }
    
    const eligible = this.filterEligibleEvents(state);
    this.eventCache.set(cacheKey, eligible);
    
    // 限制缓存大小
    if (this.eventCache.size > 100) {
      const firstKey = this.eventCache.keys().next().value;
      this.eventCache.delete(firstKey);
    }
    
    return eligible;
  }
  
  private generateCacheKey(state: PlayerState): string {
    return `${state.cultivation.level}_${state.cultivationPath.id}_${state.reputation.righteous}`;
  }
}
```

### 2. 状态更新批处理

```typescript
class StateTracker {
  private pendingUpdates: StateUpdate[] = [];
  private updateTimer: NodeJS.Timeout | null = null;
  
  // 批量更新状态
  scheduleUpdate(update: StateUpdate): void {
    this.pendingUpdates.push(update);
    
    if (!this.updateTimer) {
      this.updateTimer = setTimeout(() => {
        this.flushUpdates();
      }, 100);  // 100ms后批量处理
    }
  }
  
  private flushUpdates(): void {
    // 合并所有更新
    const mergedUpdate = this.mergeUpdates(this.pendingUpdates);
    
    // 应用更新
    this.applyUpdate(mergedUpdate);
    
    // 通知前端
    this.notifyWebview(mergedUpdate);
    
    // 清空队列
    this.pendingUpdates = [];
    this.updateTimer = null;
  }
}
```

### 3. JSON配置懒加载

```typescript
class ConfigLoader {
  private loadedConfigs: Map<string, any> = new Map();
  
  // 懒加载配置
  async loadConfig(configName: string): Promise<any> {
    if (this.loadedConfigs.has(configName)) {
      return this.loadedConfigs.get(configName);
    }
    
    const config = await this.readConfigFile(configName);
    this.loadedConfigs.set(configName, config);
    
    return config;
  }
  
  // 预加载关键配置
  async preloadEssentialConfigs(): Promise<void> {
    await Promise.all([
      this.loadConfig('cultivation_paths'),
      this.loadConfig('events'),
      this.loadConfig('npcs')
    ]);
  }
}
```

## 测试策略

### 单元测试

```typescript
// GameEngine.test.ts
describe('GameEngine', () => {
  let engine: GameEngine;
  
  beforeEach(() => {
    engine = new GameEngine(mockContext);
  });
  
  test('should initialize player state correctly', () => {
    engine.newGame('测试玩家', 'sword');
    const state = engine.getState();
    
    expect(state.name).toBe('测试玩家');
    expect(state.cultivationPath.id).toBe('sword');
    expect(state.cultivation.level).toBe(CultivationLevel.QiRefining);
  });
  
  test('should advance time correctly', () => {
    engine.newGame('测试玩家', 'sword');
    engine.processAction({ id: 'cultivate', timeCost: { months: 1 } });
    
    const state = engine.getState();
    expect(state.time.month).toBe(2);
  });
  
  test('should trigger breakthrough at threshold', () => {
    engine.newGame('测试玩家', 'sword');
    const state = engine.getState();
    state.cultivation.experience = 100;
    
    engine.checkBreakthrough();
    
    expect(state.cultivation.level).toBe(CultivationLevel.FoundationEstablishment);
    expect(state.cultivation.experience).toBe(0);
  });
});
```

### 集成测试

```typescript
// Integration.test.ts
describe('Game Flow Integration', () => {
  test('complete game flow from start to ending', async () => {
    const engine = new GameEngine(mockContext);
    engine.newGame('测试玩家', 'sword');
    
    // 模拟100回合
    for (let i = 0; i < 100; i++) {
      const options = engine.getOptions();
      const choice = options[0];  // 选择第一个选项
      engine.processAction(choice);
      
      if (engine.checkEndingConditions()) {
        break;
      }
    }
    
    expect(engine.hasEnded()).toBe(true);
  });
});
```

## 部署和发布

### 构建流程

```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run compile

# 打包插件
vsce package

# 发布到 VSCode Marketplace
vsce publish
```

### 版本管理

- 使用语义化版本号：`major.minor.patch`
- 主版本号：不兼容的API修改
- 次版本号：向下兼容的功能性新增
- 修订号：向下兼容的问题修正

---

**设计文档完成！**

这个设计文档涵盖了：
1. 系统架构和组件设计
2. 核心数据结构
3. 各个子系统的详细设计
4. JSON配置格式
5. 前后端通信协议
6. UI设计和样式
7. 存档系统
8. 功能按键系统
9. VSCode插件配置
10. 性能优化策略
11. 测试策略
12. 部署流程