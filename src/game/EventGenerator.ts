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
  private triggeredEvents: Set<string> = new Set(); // 记录已触发的事件，避免重复

  constructor() {
    // 不再在构造函数中初始化，改为异步加载
  }

  /**
   * 从外部加载事件数据
   * 应该在游戏初始化时调用
   */
  async loadEventsFromData(eventsData: { events: GameEvent[] }): Promise<void> {
    this.eventPool.clear();
    this.eventWeights.clear();
    
    for (const event of eventsData.events) {
      // 为每个事件分配权重
      const weight = this.calculateEventWeight(event);
      this.registerEvent(event, weight);
    }
    
    console.log(`[EventGenerator] 加载了 ${this.eventPool.size} 个事件`);
  }

  /**
   * 计算事件权重（基于类型和概率）
   */
  private calculateEventWeight(event: GameEvent): number {
    let weight = 10; // 基础权重
    
    // 根据事件类型调整权重
    switch (event.type) {
      case EventType.Fortune:
        weight = 10; // 机缘事件
        break;
      case EventType.Crisis:
        weight = 8; // 危机事件稍微少见
        break;
      case EventType.NPC:
        weight = 18; // NPC事件权重大幅提升，让玩家更容易遇到NPC
        break;
      case EventType.Quest:
        weight = 12; // 任务事件降低权重
        break;
      case EventType.Story:
        weight = 5; // 剧情事件较少
        break;
    }
    
    // 根据触发概率调整权重
    if (event.triggerConditions.probability) {
      weight *= event.triggerConditions.probability * 2;
    }
    
    return Math.max(1, Math.floor(weight));
  }

  /**
   * 初始化事件池（保留作为后备）
   * Validates: Requirements 4.1
   */
  private initializeEventPool(): void {
    // 保留一些基础事件作为后备
    console.log('[EventGenerator] 使用默认事件池（应该加载外部数据）');
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

    // 过滤掉最近触发过的事件（避免重复）
    const freshEvents = eligibleEvents.filter(event => {
      // 如果事件在最近5次内触发过，降低其被选中的概率
      if (this.triggeredEvents.has(event.id)) {
        return Math.random() > 0.7; // 70%概率跳过
      }
      return true;
    });

    const eventsToChoose = freshEvents.length > 0 ? freshEvents : eligibleEvents;

    // 根据权重随机选择
    const selectedEvent = this.weightedRandomSelect(eventsToChoose);
    
    // 记录触发的事件
    this.triggeredEvents.add(selectedEvent.id);
    
    // 保持记录集合大小，避免内存泄漏
    if (this.triggeredEvents.size > 20) {
      const eventsArray = Array.from(this.triggeredEvents);
      this.triggeredEvents.delete(eventsArray[0]);
    }
    
    return selectedEvent;
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
