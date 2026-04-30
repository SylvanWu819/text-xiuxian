/**
 * EventGenerator - 事件生成器
 * 负责事件池加载、事件触发条件检查、权重随机选择和事件链支持
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import { PlayerState, GameEvent, CultivationLevel, EventType } from '../types';

/**
 * 事件权重配置
 */
export interface EventWeight {
  eventId: string;
  weight: number;
}

export class EventGenerator {
  private eventPool: Map<string, GameEvent> = new Map();
  private eventWeights: Map<string, number> = new Map();
  private triggeredEventChains: Set<string> = new Set();

  constructor() {
    this.initializeEventPool();
  }

  /**
   * 初始化事件池
   * Validates: Requirements 4.1
   */
  private initializeEventPool(): void {
    // 示例事件：上古洞府
    this.registerEvent({
      id: 'ancient_cave',
      type: EventType.Fortune,
      title: '上古洞府',
      description: '你在山谷中发现一个隐蔽的洞府入口，散发着古老的气息...',
      triggerConditions: {
        minCultivationLevel: CultivationLevel.QiRefining,
        probability: 0.15
      },
      options: [
        {
          id: 'enter',
          text: '进入探索',
          description: '高风险高回报',
          effects: {
            cultivationChange: 50
          }
        },
        {
          id: 'leave',
          text: '离开',
          description: '安全但无收益',
          effects: {}
        }
      ]
    }, 10);

    // 示例事件：遇到强敌
    this.registerEvent({
      id: 'powerful_enemy',
      type: EventType.Crisis,
      title: '遇到强敌',
      description: '一名修为高深的修士拦住了你的去路，眼神不善...',
      triggerConditions: {
        minCultivationLevel: CultivationLevel.QiRefining,
        probability: 0.1
      },
      options: [
        {
          id: 'fight',
          text: '迎战',
          description: '以战养战',
          effects: {
            cultivationChange: 20
          }
        },
        {
          id: 'flee',
          text: '逃跑',
          description: '保命要紧',
          effects: {
            lifespanChange: -1
          }
        }
      ]
    }, 8);

    // 示例事件：奇遇NPC
    this.registerEvent({
      id: 'meet_elder',
      type: EventType.NPC,
      title: '遇到前辈',
      description: '你遇到了一位隐居的前辈高人...',
      triggerConditions: {
        minCultivationLevel: CultivationLevel.QiRefining,
        probability: 0.12
      },
      options: [
        {
          id: 'greet',
          text: '上前拜见',
          description: '可能获得指点',
          effects: {
            cultivationChange: 30
          }
        },
        {
          id: 'ignore',
          text: '绕道而行',
          description: '不打扰前辈',
          effects: {}
        }
      ]
    }, 12);

    // 示例事件链：宗门任务
    this.registerEvent({
      id: 'sect_quest_1',
      type: EventType.Quest,
      title: '宗门任务：采集灵草',
      description: '宗门发布了采集灵草的任务...',
      triggerConditions: {
        minCultivationLevel: CultivationLevel.QiRefining,
        probability: 0.2
      },
      options: [
        {
          id: 'accept',
          text: '接受任务',
          description: '完成后获得奖励',
          effects: {
            resourceChanges: { spiritStones: 50 },
            triggerEvent: 'sect_quest_2'
          }
        },
        {
          id: 'decline',
          text: '拒绝任务',
          effects: {}
        }
      ],
      nextEvent: 'sect_quest_2'
    }, 15);

    // 事件链的后续事件
    this.registerEvent({
      id: 'sect_quest_2',
      type: EventType.Quest,
      title: '宗门任务：护送物资',
      description: '完成采集任务后，宗门又委派你护送物资...',
      triggerConditions: {
        requiredFlags: ['sect_quest_1_completed']
      },
      options: [
        {
          id: 'accept',
          text: '接受护送',
          effects: {
            resourceChanges: { spiritStones: 100 },
            reputationChange: { righteous: 10 }
          }
        }
      ]
    }, 0); // 事件链中的事件不参与随机选择
  }

  /**
   * 注册事件到事件池
   * Validates: Requirements 4.1
   */
  registerEvent(event: GameEvent, weight: number = 10): void {
    this.eventPool.set(event.id, event);
    this.eventWeights.set(event.id, weight);
  }

  /**
   * 从事件池中移除事件
   */
  unregisterEvent(eventId: string): void {
    this.eventPool.delete(eventId);
    this.eventWeights.delete(eventId);
  }

  /**
   * 尝试触发随机事件
   * Validates: Requirements 4.1, 4.2, 4.3
   */
  tryTriggerEvent(state: PlayerState, triggerProbability: number = 0.3): GameEvent | null {
    // 检查是否触发事件
    if (Math.random() > triggerProbability) {
      return null;
    }

    // 过滤符合条件的事件
    const eligibleEvents = this.filterEligibleEvents(state);

    if (eligibleEvents.length === 0) {
      return null;
    }

    // 根据权重随机选择
    return this.weightedRandomSelect(eligibleEvents);
  }

  /**
   * 过滤符合触发条件的事件
   * Validates: Requirements 4.2
   */
  private filterEligibleEvents(state: PlayerState): GameEvent[] {
    const eligible: GameEvent[] = [];

    for (const event of this.eventPool.values()) {
      if (this.checkTriggerConditions(event, state)) {
        eligible.push(event);
      }
    }

    return eligible;
  }

  /**
   * 检查事件触发条件
   * Validates: Requirements 4.2
   */
  checkTriggerConditions(event: GameEvent, state: PlayerState): boolean {
    const cond = event.triggerConditions;

    // 检查最低修为等级
    if (cond.minCultivationLevel !== undefined) {
      const currentLevelIndex = Object.values(CultivationLevel).indexOf(state.cultivation.level);
      const minLevelIndex = Object.values(CultivationLevel).indexOf(cond.minCultivationLevel);
      
      if (currentLevelIndex < minLevelIndex) {
        return false;
      }
    }

    // 检查最高修为等级
    if (cond.maxCultivationLevel !== undefined) {
      const currentLevelIndex = Object.values(CultivationLevel).indexOf(state.cultivation.level);
      const maxLevelIndex = Object.values(CultivationLevel).indexOf(cond.maxCultivationLevel);
      
      if (currentLevelIndex > maxLevelIndex) {
        return false;
      }
    }

    // 检查修行方向
    if (cond.requiredPath !== undefined) {
      if (state.cultivationPath.id !== cond.requiredPath) {
        return false;
      }
    }

    // 检查最低声望
    if (cond.minReputation) {
      if (cond.minReputation.righteous !== undefined) {
        if (state.reputation.righteous < cond.minReputation.righteous) {
          return false;
        }
      }
      if (cond.minReputation.demonic !== undefined) {
        if (state.reputation.demonic < cond.minReputation.demonic) {
          return false;
        }
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

    // 检查事件概率
    if (cond.probability !== undefined) {
      if (Math.random() > cond.probability) {
        return false;
      }
    }

    return true;
  }

  /**
   * 权重随机选择算法
   * Validates: Requirements 4.3
   */
  weightedRandomSelect(events: GameEvent[]): GameEvent {
    // 计算总权重
    let totalWeight = 0;
    const weights: number[] = [];

    for (const event of events) {
      const weight = this.eventWeights.get(event.id) || 10;
      weights.push(weight);
      totalWeight += weight;
    }

    // 随机选择
    let random = Math.random() * totalWeight;

    for (let i = 0; i < events.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return events[i];
      }
    }

    // 兜底返回最后一个
    return events[events.length - 1];
  }

  /**
   * 触发事件链中的下一个事件
   * Validates: Requirements 4.7
   */
  triggerNextEvent(currentEventId: string, state: PlayerState): GameEvent | null {
    const currentEvent = this.eventPool.get(currentEventId);
    
    if (!currentEvent || !currentEvent.nextEvent) {
      return null;
    }

    const nextEvent = this.eventPool.get(currentEvent.nextEvent);
    
    if (!nextEvent) {
      return null;
    }

    // 检查下一个事件的触发条件
    if (!this.checkTriggerConditions(nextEvent, state)) {
      return null;
    }

    // 标记事件链已触发
    this.triggeredEventChains.add(currentEventId);

    return nextEvent;
  }

  /**
   * 检查事件链是否已触发
   */
  isEventChainTriggered(eventId: string): boolean {
    return this.triggeredEventChains.has(eventId);
  }

  /**
   * 重置事件链状态
   */
  resetEventChain(eventId: string): void {
    this.triggeredEventChains.delete(eventId);
  }

  /**
   * 获取事件池中的所有事件
   */
  getAllEvents(): GameEvent[] {
    return Array.from(this.eventPool.values());
  }

  /**
   * 根据ID获取事件
   */
  getEventById(eventId: string): GameEvent | undefined {
    return this.eventPool.get(eventId);
  }

  /**
   * 根据类型获取事件
   */
  getEventsByType(type: EventType): GameEvent[] {
    return Array.from(this.eventPool.values()).filter(event => event.type === type);
  }

  /**
   * 获取事件权重
   */
  getEventWeight(eventId: string): number {
    return this.eventWeights.get(eventId) || 10;
  }

  /**
   * 设置事件权重
   */
  setEventWeight(eventId: string, weight: number): void {
    if (weight < 0) {
      throw new Error('Weight must be non-negative');
    }
    this.eventWeights.set(eventId, weight);
  }

  /**
   * 获取符合条件的事件数量
   */
  getEligibleEventCount(state: PlayerState): number {
    return this.filterEligibleEvents(state).length;
  }

  /**
   * 清空事件池
   */
  clearEventPool(): void {
    this.eventPool.clear();
    this.eventWeights.clear();
    this.triggeredEventChains.clear();
  }

  /**
   * 批量注册事件
   */
  registerEvents(events: Array<{ event: GameEvent; weight?: number }>): void {
    for (const { event, weight } of events) {
      this.registerEvent(event, weight);
    }
  }

  /**
   * 从JSON配置加载事件
   */
  loadEventsFromConfig(config: { events: GameEvent[] }): void {
    for (const event of config.events) {
      this.registerEvent(event);
    }
  }
}
