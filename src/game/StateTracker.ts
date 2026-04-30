/**
 * StateTracker - 状态追踪器
 * 负责追踪玩家状态、记录历史事件和通知状态变化
 * Validates: Requirements 14.1, 14.2, 14.4, 14.5, 26.3, 26.4
 */

import { PlayerState, HistoryEntry, GameTime, StateUpdate, CultivationLevel, Season } from '../types';

export class StateTracker {
  private state: PlayerState;
  private stateChangeListeners: Array<(state: PlayerState) => void> = [];
  private maxHistoryEntries = 50;

  constructor(initialState: PlayerState) {
    this.state = initialState;
  }

  /**
   * 获取当前玩家状态
   * Validates: Requirements 14.1
   */
  getState(): PlayerState {
    return this.state;
  }

  /**
   * 更新玩家状态
   * Validates: Requirements 14.1, 14.2
   */
  setState(newState: PlayerState): void {
    this.state = newState;
    this.notifyStateChange();
  }

  /**
   * 部分更新玩家状态
   * Validates: Requirements 14.2
   */
  updateState(updates: Partial<PlayerState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyStateChange();
  }

  /**
   * 记录历史事件
   * Validates: Requirements 14.5, 26.3, 26.4
   */
  recordEvent(description: string, isKeyChoice: boolean = false): void {
    const entry: HistoryEntry = {
      time: { ...this.state.time },
      description,
      isKeyChoice
    };

    this.state.history.push(entry);

    // 限制历史记录数量
    if (this.state.history.length > this.maxHistoryEntries) {
      this.state.history = this.state.history.slice(-this.maxHistoryEntries);
    }

    this.notifyStateChange();
  }

  /**
   * 获取历史记录
   * Validates: Requirements 26.3
   */
  getHistory(): HistoryEntry[] {
    // 返回倒序的历史记录（最新在前）
    return [...this.state.history].reverse();
  }

  /**
   * 获取最近N条历史记录
   * Validates: Requirements 26.3
   */
  getRecentHistory(count: number): HistoryEntry[] {
    const history = this.getHistory();
    return history.slice(0, Math.min(count, history.length));
  }

  /**
   * 注册状态变化监听器
   * Validates: Requirements 14.4
   */
  onStateChange(listener: (state: PlayerState) => void): void {
    this.stateChangeListeners.push(listener);
  }

  /**
   * 移除状态变化监听器
   */
  removeStateChangeListener(listener: (state: PlayerState) => void): void {
    const index = this.stateChangeListeners.indexOf(listener);
    if (index > -1) {
      this.stateChangeListeners.splice(index, 1);
    }
  }

  /**
   * 通知所有监听器状态已变化
   * Validates: Requirements 14.4
   */
  private notifyStateChange(): void {
    for (const listener of this.stateChangeListeners) {
      listener(this.state);
    }
  }

  /**
   * 更新修为
   * Validates: Requirements 14.2
   */
  updateCultivation(experienceChange: number): void {
    this.state.cultivation.experience += experienceChange;

    // 检查是否达到突破阈值
    if (this.state.cultivation.experience >= this.state.cultivation.maxExperience) {
      // 不在这里处理突破，只记录修为变化
      this.recordEvent(`修为增加 ${experienceChange}，已达突破阈值`, false);
    } else {
      this.recordEvent(`修为增加 ${experienceChange}`, false);
    }

    this.notifyStateChange();
  }

  /**
   * 更新时间
   * Validates: Requirements 14.2
   */
  updateTime(months: number): void {
    this.state.time.month += months;

    // 处理年份和季节
    while (this.state.time.month > 12) {
      this.state.time.month -= 12;
      this.state.time.year += 1;
    }

    // 更新季节
    if (this.state.time.month >= 1 && this.state.time.month <= 3) {
      this.state.time.season = Season.Spring;
    } else if (this.state.time.month >= 4 && this.state.time.month <= 6) {
      this.state.time.season = Season.Summer;
    } else if (this.state.time.month >= 7 && this.state.time.month <= 9) {
      this.state.time.season = Season.Autumn;
    } else {
      this.state.time.season = Season.Winter;
    }

    this.notifyStateChange();
  }

  /**
   * 更新关系值
   * Validates: Requirements 14.2
   */
  updateRelationship(npcId: string, change: number): void {
    const currentValue = this.state.relationships.get(npcId) || 0;
    const newValue = Math.max(-100, Math.min(100, currentValue + change));
    this.state.relationships.set(npcId, newValue);

    const changeText = change > 0 ? `增加 ${change}` : `减少 ${Math.abs(change)}`;
    this.recordEvent(`与 ${npcId} 的关系${changeText}`, false);

    this.notifyStateChange();
  }

  /**
   * 更新声望
   * Validates: Requirements 14.2
   */
  updateReputation(righteousChange: number = 0, demonicChange: number = 0): void {
    this.state.reputation.righteous = Math.max(0, Math.min(100, this.state.reputation.righteous + righteousChange));
    this.state.reputation.demonic = Math.max(0, Math.min(100, this.state.reputation.demonic + demonicChange));

    if (righteousChange !== 0 || demonicChange !== 0) {
      const changes: string[] = [];
      if (righteousChange > 0) changes.push(`正道声望+${righteousChange}`);
      if (righteousChange < 0) changes.push(`正道声望${righteousChange}`);
      if (demonicChange > 0) changes.push(`魔道声望+${demonicChange}`);
      if (demonicChange < 0) changes.push(`魔道声望${demonicChange}`);
      
      this.recordEvent(changes.join(', '), false);
    }

    this.notifyStateChange();
  }

  /**
   * 更新因果
   * Validates: Requirements 14.2
   */
  updateKarma(goodDeedsChange: number = 0, karmicDebtChange: number = 0): void {
    this.state.karma.goodDeeds = Math.max(0, this.state.karma.goodDeeds + goodDeedsChange);
    this.state.karma.karmicDebt = Math.max(0, this.state.karma.karmicDebt + karmicDebtChange);

    if (goodDeedsChange !== 0 || karmicDebtChange !== 0) {
      const changes: string[] = [];
      if (goodDeedsChange > 0) changes.push(`善缘+${goodDeedsChange}`);
      if (karmicDebtChange > 0) changes.push(`因果债+${karmicDebtChange}`);
      
      this.recordEvent(changes.join(', '), false);
    }

    this.notifyStateChange();
  }

  /**
   * 设置剧情标记
   * Validates: Requirements 14.2
   */
  setStoryFlag(flag: string, value: any = true): void {
    this.state.storyProgress.storyFlags.set(flag, value);
    this.notifyStateChange();
  }

  /**
   * 获取剧情标记
   */
  getStoryFlag(flag: string): any {
    return this.state.storyProgress.storyFlags.get(flag);
  }

  /**
   * 检查剧情标记是否存在
   */
  hasStoryFlag(flag: string): boolean {
    return this.state.storyProgress.storyFlags.has(flag);
  }

  /**
   * 解锁事件
   * Validates: Requirements 14.2
   */
  unlockEvent(eventId: string): void {
    this.state.storyProgress.unlockedEvents.add(eventId);
    this.notifyStateChange();
  }

  /**
   * 检查事件是否已解锁
   */
  isEventUnlocked(eventId: string): boolean {
    return this.state.storyProgress.unlockedEvents.has(eventId);
  }

  /**
   * 添加任务
   */
  addQuest(questId: string): void {
    this.state.storyProgress.activeQuests.add(questId);
    this.recordEvent(`接取任务: ${questId}`, true);
    this.notifyStateChange();
  }

  /**
   * 完成任务
   */
  completeQuest(questId: string): void {
    this.state.storyProgress.activeQuests.delete(questId);
    this.state.storyProgress.completedQuests.add(questId);
    this.recordEvent(`完成任务: ${questId}`, true);
    this.notifyStateChange();
  }

  /**
   * 格式化时间显示
   */
  formatTime(time?: GameTime): string {
    const t = time || this.state.time;
    const seasons = ['春季', '夏季', '秋季', '冬季'];
    return `第${t.year}年 ${seasons[t.season]}`;
  }

  /**
   * 序列化状态（用于存档）
   * Validates: Requirements 14.6
   */
  serialize(): string {
    // 将 Map 和 Set 转换为可序列化的格式
    const serializableState = {
      ...this.state,
      resources: {
        spiritStones: this.state.resources.spiritStones,
        pills: Array.from(this.state.resources.pills.entries()),
        artifacts: Array.from(this.state.resources.artifacts.entries())
      },
      relationships: Array.from(this.state.relationships.entries()),
      faction: {
        current: this.state.faction.current,
        reputation: Array.from(this.state.faction.reputation.entries())
      },
      storyProgress: {
        completedQuests: Array.from(this.state.storyProgress.completedQuests),
        activeQuests: Array.from(this.state.storyProgress.activeQuests),
        unlockedEvents: Array.from(this.state.storyProgress.unlockedEvents),
        storyFlags: Array.from(this.state.storyProgress.storyFlags.entries())
      }
    };

    return JSON.stringify(serializableState);
  }

  /**
   * 反序列化状态（用于读档）
   * Validates: Requirements 14.6
   */
  static deserialize(data: string): PlayerState {
    const parsed = JSON.parse(data);

    // 将数组转换回 Map 和 Set
    return {
      ...parsed,
      resources: {
        spiritStones: parsed.resources.spiritStones,
        pills: new Map(parsed.resources.pills),
        artifacts: new Map(parsed.resources.artifacts)
      },
      relationships: new Map(parsed.relationships),
      faction: {
        current: parsed.faction.current,
        reputation: new Map(parsed.faction.reputation)
      },
      storyProgress: {
        completedQuests: new Set(parsed.storyProgress.completedQuests),
        activeQuests: new Set(parsed.storyProgress.activeQuests),
        unlockedEvents: new Set(parsed.storyProgress.unlockedEvents),
        storyFlags: new Map(parsed.storyProgress.storyFlags)
      }
    };
  }
}
