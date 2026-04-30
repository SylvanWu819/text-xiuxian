/**
 * KarmaSystem - 因果系统
 * 负责追踪善缘和因果债，影响事件触发
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { PlayerState } from '../types';

/**
 * 因果事件类型
 */
export enum KarmaEventType {
  HelpfulEvent = 'helpful',      // 贵人相助
  EnemyPursuit = 'enemy_pursuit' // 仇敌追杀
}

/**
 * 因果触发事件
 */
export interface KarmaTriggeredEvent {
  type: KarmaEventType;
  description: string;
  probability: number;
}

export class KarmaSystem {
  private state: PlayerState;
  private karmaChangeListeners: Array<(goodDeeds: number, karmicDebt: number) => void> = [];

  constructor(state: PlayerState) {
    this.state = state;
  }

  /**
   * 增加善缘值
   * Validates: Requirements 7.2
   */
  addGoodDeeds(amount: number): void {
    if (amount < 0) {
      throw new Error('Good deeds amount must be non-negative');
    }

    this.state.karma.goodDeeds += amount;
    this.notifyKarmaChange();
  }

  /**
   * 增加因果债
   * Validates: Requirements 7.3
   */
  addKarmicDebt(amount: number): void {
    if (amount < 0) {
      throw new Error('Karmic debt amount must be non-negative');
    }

    this.state.karma.karmicDebt += amount;
    this.notifyKarmaChange();
  }

  /**
   * 减少善缘值
   */
  reduceGoodDeeds(amount: number): void {
    if (amount < 0) {
      throw new Error('Amount must be non-negative');
    }

    this.state.karma.goodDeeds = Math.max(0, this.state.karma.goodDeeds - amount);
    this.notifyKarmaChange();
  }

  /**
   * 减少因果债
   */
  reduceKarmicDebt(amount: number): void {
    if (amount < 0) {
      throw new Error('Amount must be non-negative');
    }

    this.state.karma.karmicDebt = Math.max(0, this.state.karma.karmicDebt - amount);
    this.notifyKarmaChange();
  }

  /**
   * 获取当前善缘值
   * Validates: Requirements 7.1
   */
  getGoodDeeds(): number {
    return this.state.karma.goodDeeds;
  }

  /**
   * 获取当前因果债
   * Validates: Requirements 7.1
   */
  getKarmicDebt(): number {
    return this.state.karma.karmicDebt;
  }

  /**
   * 检查是否应该触发因果事件
   * Validates: Requirements 7.4, 7.5
   */
  shouldTriggerKarmaEvent(): KarmaTriggeredEvent | null {
    const goodDeeds = this.state.karma.goodDeeds;
    const karmicDebt = this.state.karma.karmicDebt;

    // 高善缘触发贵人相助 (善缘 >= 50)
    if (goodDeeds >= 50) {
      const probability = Math.min(0.3 + (goodDeeds - 50) * 0.01, 0.8);
      if (Math.random() < probability) {
        return {
          type: KarmaEventType.HelpfulEvent,
          description: '你的善行感动了天地，有贵人前来相助',
          probability
        };
      }
    }

    // 高因果债触发仇敌追杀 (因果债 >= 50)
    if (karmicDebt >= 50) {
      const probability = Math.min(0.2 + (karmicDebt - 50) * 0.01, 0.7);
      if (Math.random() < probability) {
        return {
          type: KarmaEventType.EnemyPursuit,
          description: '你的恶行引来了仇敌的追杀',
          probability
        };
      }
    }

    return null;
  }

  /**
   * 计算因果对事件触发的影响权重
   * Validates: Requirements 7.4
   */
  getEventTriggerModifier(): number {
    const goodDeeds = this.state.karma.goodDeeds;
    const karmicDebt = this.state.karma.karmicDebt;

    // 善缘增加正面事件概率，因果债增加负面事件概率
    const modifier = (goodDeeds - karmicDebt) / 100;
    
    // 限制在 -0.5 到 +0.5 之间
    return Math.max(-0.5, Math.min(0.5, modifier));
  }

  /**
   * 处理善行
   * Validates: Requirements 7.2
   */
  recordGoodDeed(description: string, karmaValue: number): void {
    this.addGoodDeeds(karmaValue);
    
    // 记录到历史
    if (this.state.history) {
      this.state.history.push({
        time: { ...this.state.time },
        description: `${description} (善缘+${karmaValue})`,
        isKeyChoice: true
      });
    }
  }

  /**
   * 处理恶行
   * Validates: Requirements 7.3
   */
  recordEvilDeed(description: string, karmaValue: number): void {
    this.addKarmicDebt(karmaValue);
    
    // 记录到历史
    if (this.state.history) {
      this.state.history.push({
        time: { ...this.state.time },
        description: `${description} (因果债+${karmaValue})`,
        isKeyChoice: true
      });
    }
  }

  /**
   * 检查因果是否影响NPC态度
   * Validates: Requirements 7.5
   */
  getKarmaInfluenceOnNPC(npcId: string): number {
    const goodDeeds = this.state.karma.goodDeeds;
    const karmicDebt = this.state.karma.karmicDebt;

    // 善缘高的玩家更受NPC欢迎
    let influence = 0;

    if (goodDeeds >= 30) {
      influence += Math.floor(goodDeeds / 10);
    }

    if (karmicDebt >= 30) {
      influence -= Math.floor(karmicDebt / 10);
    }

    return influence;
  }

  /**
   * 获取因果状态描述
   */
  getKarmaStatus(): string {
    const goodDeeds = this.state.karma.goodDeeds;
    const karmicDebt = this.state.karma.karmicDebt;

    if (goodDeeds >= 80) {
      return '功德无量';
    } else if (goodDeeds >= 50) {
      return '善缘深厚';
    } else if (karmicDebt >= 80) {
      return '罪孽深重';
    } else if (karmicDebt >= 50) {
      return '因果缠身';
    } else if (goodDeeds > karmicDebt) {
      return '善多于恶';
    } else if (karmicDebt > goodDeeds) {
      return '恶多于善';
    } else {
      return '因果平衡';
    }
  }

  /**
   * 计算因果对渡劫的影响
   * Validates: Requirements 7.6
   */
  getTribulationInfluence(): {
    difficultyModifier: number;
    willTriggerInnerDemon: boolean;
  } {
    const karmicDebt = this.state.karma.karmicDebt;

    // 因果债增加渡劫难度
    const difficultyModifier = karmicDebt / 100;

    // 因果债超过50触发心魔劫
    const willTriggerInnerDemon = karmicDebt > 50;

    return {
      difficultyModifier,
      willTriggerInnerDemon
    };
  }

  /**
   * 注册因果变化监听器
   */
  onKarmaChange(listener: (goodDeeds: number, karmicDebt: number) => void): void {
    this.karmaChangeListeners.push(listener);
  }

  /**
   * 移除因果变化监听器
   */
  removeKarmaChangeListener(listener: (goodDeeds: number, karmicDebt: number) => void): void {
    const index = this.karmaChangeListeners.indexOf(listener);
    if (index > -1) {
      this.karmaChangeListeners.splice(index, 1);
    }
  }

  /**
   * 通知所有监听器因果已变化
   */
  private notifyKarmaChange(): void {
    const goodDeeds = this.state.karma.goodDeeds;
    const karmicDebt = this.state.karma.karmicDebt;

    for (const listener of this.karmaChangeListeners) {
      listener(goodDeeds, karmicDebt);
    }
  }

  /**
   * 重置因果值（用于特殊情况）
   */
  resetKarma(): void {
    this.state.karma.goodDeeds = 0;
    this.state.karma.karmicDebt = 0;
    this.notifyKarmaChange();
  }

  /**
   * 设置因果值（用于测试或特殊情况）
   */
  setKarma(goodDeeds: number, karmicDebt: number): void {
    if (goodDeeds < 0 || karmicDebt < 0) {
      throw new Error('Karma values must be non-negative');
    }

    this.state.karma.goodDeeds = goodDeeds;
    this.state.karma.karmicDebt = karmicDebt;
    this.notifyKarmaChange();
  }

  /**
   * 获取因果净值（善缘 - 因果债）
   */
  getKarmaBalance(): number {
    return this.state.karma.goodDeeds - this.state.karma.karmicDebt;
  }

  /**
   * 检查是否为善人
   */
  isGoodPerson(): boolean {
    return this.state.karma.goodDeeds >= 50 && this.state.karma.karmicDebt < 30;
  }

  /**
   * 检查是否为恶人
   */
  isEvilPerson(): boolean {
    return this.state.karma.karmicDebt >= 50 && this.state.karma.goodDeeds < 30;
  }
}
