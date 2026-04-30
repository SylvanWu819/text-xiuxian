/**
 * ReputationSystem - 声望系统
 * 负责管理正道和魔道声望及其对游戏的影响
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

import { PlayerState } from '../types';

/**
 * 声望等级
 */
export enum ReputationLevel {
  Unknown = 'unknown',           // 无名 (0-10)
  KnownLocally = 'known_locally', // 小有名气 (10-30)
  Famous = 'famous',             // 名声在外 (30-60)
  Renowned = 'renowned',         // 声名远扬 (60-85)
  Legendary = 'legendary'        // 传奇 (85-100)
}

/**
 * 声望类型
 */
export enum ReputationType {
  Righteous = 'righteous', // 正道
  Demonic = 'demonic'      // 魔道
}

/**
 * NPC态度修正
 */
export interface AttitudeModifier {
  righteousNPCs: number;  // 对正道NPC的态度修正
  demonicNPCs: number;    // 对魔道NPC的态度修正
}

export class ReputationSystem {
  private state: PlayerState;
  private readonly MIN_REPUTATION = 0;
  private readonly MAX_REPUTATION = 100;

  constructor(state: PlayerState) {
    this.state = state;
  }

  /**
   * 获取正道声望
   * Validates: Requirements 12.1
   */
  getRighteousReputation(): number {
    return this.state.reputation.righteous;
  }

  /**
   * 获取魔道声望
   * Validates: Requirements 12.1
   */
  getDemonicReputation(): number {
    return this.state.reputation.demonic;
  }

  /**
   * 设置正道声望
   * Validates: Requirements 12.1
   */
  setRighteousReputation(value: number): void {
    this.state.reputation.righteous = this.clampReputation(value);
  }

  /**
   * 设置魔道声望
   * Validates: Requirements 12.1
   */
  setDemonicReputation(value: number): void {
    this.state.reputation.demonic = this.clampReputation(value);
  }

  /**
   * 增加正道声望
   * Validates: Requirements 12.2
   */
  increaseRighteousReputation(amount: number): number {
    const newValue = this.clampReputation(this.state.reputation.righteous + amount);
    this.state.reputation.righteous = newValue;
    return newValue;
  }

  /**
   * 增加魔道声望
   * Validates: Requirements 12.3
   */
  increaseDemonicReputation(amount: number): number {
    const newValue = this.clampReputation(this.state.reputation.demonic + amount);
    this.state.reputation.demonic = newValue;
    return newValue;
  }

  /**
   * 限制声望值在有效范围内
   */
  private clampReputation(value: number): number {
    return Math.max(this.MIN_REPUTATION, Math.min(this.MAX_REPUTATION, value));
  }

  /**
   * 获取声望等级
   */
  getReputationLevel(reputation: number): ReputationLevel {
    if (reputation < 10) {
      return ReputationLevel.Unknown;
    } else if (reputation < 30) {
      return ReputationLevel.KnownLocally;
    } else if (reputation < 60) {
      return ReputationLevel.Famous;
    } else if (reputation < 85) {
      return ReputationLevel.Renowned;
    } else {
      return ReputationLevel.Legendary;
    }
  }

  /**
   * 获取正道声望等级
   */
  getRighteousReputationLevel(): ReputationLevel {
    return this.getReputationLevel(this.state.reputation.righteous);
  }

  /**
   * 获取魔道声望等级
   */
  getDemonicReputationLevel(): ReputationLevel {
    return this.getReputationLevel(this.state.reputation.demonic);
  }

  /**
   * 获取主导声望类型
   */
  getDominantReputationType(): ReputationType | null {
    const righteous = this.state.reputation.righteous;
    const demonic = this.state.reputation.demonic;

    if (righteous > demonic && righteous >= 30) {
      return ReputationType.Righteous;
    } else if (demonic > righteous && demonic >= 30) {
      return ReputationType.Demonic;
    }

    return null; // 无明显倾向
  }

  /**
   * 获取NPC初始态度修正
   * Validates: Requirements 12.4
   */
  getNPCAttitudeModifier(npcType: 'righteous' | 'demonic' | 'neutral'): number {
    const righteous = this.state.reputation.righteous;
    const demonic = this.state.reputation.demonic;

    if (npcType === 'righteous') {
      // 正道NPC：正道声望提升态度，魔道声望降低态度
      return Math.floor((righteous - demonic) / 10);
    } else if (npcType === 'demonic') {
      // 魔道NPC：魔道声望提升态度，正道声望降低态度
      return Math.floor((demonic - righteous) / 10);
    } else {
      // 中立NPC：不受声望影响
      return 0;
    }
  }

  /**
   * 检查是否可以触发正道选项
   * Validates: Requirements 12.5
   */
  canAccessRighteousOption(requiredReputation: number): boolean {
    return this.state.reputation.righteous >= requiredReputation;
  }

  /**
   * 检查是否可以触发魔道选项
   * Validates: Requirements 12.5
   */
  canAccessDemonicOption(requiredReputation: number): boolean {
    return this.state.reputation.demonic >= requiredReputation;
  }

  /**
   * 检查是否会被正道NPC敌视
   * Validates: Requirements 12.4
   */
  isHostileToRighteousNPCs(): boolean {
    // 魔道声望高于正道声望且魔道声望较高时，正道NPC敌视
    return this.state.reputation.demonic > this.state.reputation.righteous &&
           this.state.reputation.demonic >= 50;
  }

  /**
   * 检查是否会被魔道NPC敌视
   * Validates: Requirements 12.4
   */
  isHostileToDemonicNPCs(): boolean {
    // 正道声望高于魔道声望且正道声望较高时，魔道NPC敌视
    return this.state.reputation.righteous > this.state.reputation.demonic &&
           this.state.reputation.righteous >= 50;
  }

  /**
   * 获取结局倾向
   * Validates: Requirements 12.6
   */
  getEndingTendency(): 'righteous' | 'demonic' | 'neutral' {
    const righteous = this.state.reputation.righteous;
    const demonic = this.state.reputation.demonic;

    if (righteous >= 70 && righteous > demonic) {
      return 'righteous'; // 正道结局倾向
    } else if (demonic >= 70 && demonic > righteous) {
      return 'demonic'; // 魔道结局倾向
    } else {
      return 'neutral'; // 中立结局倾向
    }
  }

  /**
   * 检查是否满足飞升条件（声望方面）
   * Validates: Requirements 12.6
   */
  meetsAscensionReputationRequirement(): boolean {
    // 飞升需要正道声望足够高，或魔道声望足够高（魔界飞升）
    return this.state.reputation.righteous >= 80 || this.state.reputation.demonic >= 80;
  }

  /**
   * 检查是否满足成魔条件
   * Validates: Requirements 12.6
   */
  meetsDemonLordRequirement(): boolean {
    // 成魔需要魔道声望很高且正道声望很低
    return this.state.reputation.demonic >= 70 && this.state.reputation.righteous < 30;
  }

  /**
   * 获取声望摘要（用于显示）
   */
  getReputationSummary(): {
    righteous: {
      value: number;
      level: ReputationLevel;
    };
    demonic: {
      value: number;
      level: ReputationLevel;
    };
    dominantType: ReputationType | null;
    endingTendency: 'righteous' | 'demonic' | 'neutral';
  } {
    return {
      righteous: {
        value: this.state.reputation.righteous,
        level: this.getRighteousReputationLevel()
      },
      demonic: {
        value: this.state.reputation.demonic,
        level: this.getDemonicReputationLevel()
      },
      dominantType: this.getDominantReputationType(),
      endingTendency: this.getEndingTendency()
    };
  }

  /**
   * 执行正道行为
   * Validates: Requirements 12.2
   */
  performRighteousAction(reputationGain: number): void {
    this.increaseRighteousReputation(reputationGain);
    
    // 正道行为可能轻微降低魔道声望
    if (this.state.reputation.demonic > 0) {
      const demonicLoss = Math.floor(reputationGain * 0.2);
      this.state.reputation.demonic = this.clampReputation(
        this.state.reputation.demonic - demonicLoss
      );
    }
  }

  /**
   * 执行魔道行为
   * Validates: Requirements 12.3
   */
  performDemonicAction(reputationGain: number): void {
    this.increaseDemonicReputation(reputationGain);
    
    // 魔道行为可能轻微降低正道声望
    if (this.state.reputation.righteous > 0) {
      const righteousLoss = Math.floor(reputationGain * 0.2);
      this.state.reputation.righteous = this.clampReputation(
        this.state.reputation.righteous - righteousLoss
      );
    }
  }

  /**
   * 获取声望等级描述
   */
  getReputationLevelDescription(level: ReputationLevel): string {
    switch (level) {
      case ReputationLevel.Unknown:
        return '无名之辈';
      case ReputationLevel.KnownLocally:
        return '小有名气';
      case ReputationLevel.Famous:
        return '名声在外';
      case ReputationLevel.Renowned:
        return '声名远扬';
      case ReputationLevel.Legendary:
        return '传奇人物';
      default:
        return '未知';
    }
  }

  /**
   * 获取声望影响描述
   */
  getReputationImpactDescription(): string[] {
    const impacts: string[] = [];
    const righteous = this.state.reputation.righteous;
    const demonic = this.state.reputation.demonic;

    if (righteous >= 50) {
      impacts.push('正道NPC对你友好');
    }
    if (righteous >= 70) {
      impacts.push('可以接取高级正道任务');
    }
    if (demonic >= 50) {
      impacts.push('魔道NPC对你友好');
    }
    if (demonic >= 70) {
      impacts.push('可以接取高级魔道任务');
    }
    if (this.isHostileToRighteousNPCs()) {
      impacts.push('正道NPC敌视你');
    }
    if (this.isHostileToDemonicNPCs()) {
      impacts.push('魔道NPC敌视你');
    }

    return impacts;
  }
}
