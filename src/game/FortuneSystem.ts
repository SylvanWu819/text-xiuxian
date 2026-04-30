/**
 * FortuneSystem - 机缘系统
 * 负责管理机缘类型（洞府、奇遇、传承、宝物）、触发概率计算和风险收益系统
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { PlayerState, CultivationLevel } from '../types';

/**
 * 机缘类型
 */
export enum FortuneType {
  Cave = 'cave',           // 洞府
  Adventure = 'adventure', // 奇遇
  Legacy = 'legacy',       // 传承
  Treasure = 'treasure'    // 宝物
}

/**
 * 机缘风险等级
 */
export enum RiskLevel {
  Low = 'low',       // 低风险
  Medium = 'medium', // 中风险
  High = 'high',     // 高风险
  Extreme = 'extreme' // 极高风险
}

/**
 * 机缘定义
 */
export interface Fortune {
  id: string;
  name: string;
  type: FortuneType;
  description: string;
  riskLevel: RiskLevel;
  
  // 触发条件
  minCultivationLevel: CultivationLevel;
  baseProbability: number; // 基础触发概率 (0-1)
  
  // 风险和收益
  risks: FortuneRisk[];
  rewards: FortuneReward[];
}

/**
 * 机缘风险
 */
export interface FortuneRisk {
  description: string;
  probability: number; // 风险发生概率 (0-1)
  effects: {
    lifespanLoss?: number;
    cultivationLoss?: number;
    resourceLoss?: { spiritStones?: number };
    karmaDebt?: number;
  };
}

/**
 * 机缘收益
 */
export interface FortuneReward {
  description: string;
  probability: number; // 收益获得概率 (0-1)
  effects: {
    cultivationGain?: number;
    lifespanGain?: number;
    resourceGain?: { spiritStones?: number };
    itemGain?: string[]; // 物品ID列表
    unlockAbility?: string;
  };
}

/**
 * 机缘结果
 */
export interface FortuneResult {
  success: boolean;
  description: string;
  effects: {
    cultivationChange?: number;
    lifespanChange?: number;
    resourceChanges?: { spiritStones?: number };
    itemsGained?: string[];
    abilitiesUnlocked?: string[];
  };
}

export class FortuneSystem {
  private state: PlayerState;
  private fortunePool: Map<string, Fortune> = new Map();
  private discoveredFortunes: Set<string> = new Set();

  constructor(state: PlayerState) {
    this.state = state;
    this.initializeFortunePool();
  }

  /**
   * 初始化机缘池
   * Validates: Requirements 5.1
   */
  private initializeFortunePool(): void {
    // 洞府类机缘
    this.registerFortune({
      id: 'ancient_cave_1',
      name: '上古洞府',
      type: FortuneType.Cave,
      description: '一座隐藏在山谷深处的上古洞府',
      riskLevel: RiskLevel.Medium,
      minCultivationLevel: CultivationLevel.QiRefining,
      baseProbability: 0.1,
      risks: [
        {
          description: '触发禁制，受到重伤',
          probability: 0.3,
          effects: {
            lifespanLoss: 5,
            cultivationLoss: 20
          }
        }
      ],
      rewards: [
        {
          description: '获得上古功法',
          probability: 0.4,
          effects: {
            cultivationGain: 100,
            unlockAbility: 'ancient_technique'
          }
        },
        {
          description: '获得灵石和丹药',
          probability: 0.3,
          effects: {
            resourceGain: { spiritStones: 200 },
            itemGain: ['foundation_pill']
          }
        }
      ]
    });

    // 奇遇类机缘
    this.registerFortune({
      id: 'immortal_encounter',
      name: '仙人指点',
      type: FortuneType.Adventure,
      description: '偶遇隐世仙人，获得指点',
      riskLevel: RiskLevel.Low,
      minCultivationLevel: CultivationLevel.QiRefining,
      baseProbability: 0.08,
      risks: [],
      rewards: [
        {
          description: '修为大增',
          probability: 0.8,
          effects: {
            cultivationGain: 50
          }
        }
      ]
    });

    // 传承类机缘
    this.registerFortune({
      id: 'sword_legacy',
      name: '剑道传承',
      type: FortuneType.Legacy,
      description: '获得剑道前辈的传承',
      riskLevel: RiskLevel.High,
      minCultivationLevel: CultivationLevel.FoundationEstablishment,
      baseProbability: 0.05,
      risks: [
        {
          description: '传承反噬，走火入魔',
          probability: 0.4,
          effects: {
            lifespanLoss: 10,
            cultivationLoss: 50,
            karmaDebt: 10
          }
        }
      ],
      rewards: [
        {
          description: '完全继承剑道传承',
          probability: 0.6,
          effects: {
            cultivationGain: 200,
            unlockAbility: 'sword_dao_mastery'
          }
        }
      ]
    });

    // 宝物类机缘
    this.registerFortune({
      id: 'spirit_treasure',
      name: '灵宝出世',
      type: FortuneType.Treasure,
      description: '发现一件威力强大的灵宝',
      riskLevel: RiskLevel.Medium,
      minCultivationLevel: CultivationLevel.GoldenCore,
      baseProbability: 0.06,
      risks: [
        {
          description: '引来强敌争夺',
          probability: 0.5,
          effects: {
            lifespanLoss: 3,
            resourceLoss: { spiritStones: 100 }
          }
        }
      ],
      rewards: [
        {
          description: '成功获得灵宝',
          probability: 0.5,
          effects: {
            itemGain: ['spirit_sword', 'spirit_armor']
          }
        }
      ]
    });
  }

  /**
   * 注册机缘
   * Validates: Requirements 5.1
   */
  registerFortune(fortune: Fortune): void {
    this.fortunePool.set(fortune.id, fortune);
  }

  /**
   * 尝试触发机缘
   * Validates: Requirements 5.2, 5.3
   */
  tryTriggerFortune(): Fortune | null {
    // 获取符合条件的机缘
    const eligibleFortunes = this.getEligibleFortunes();

    if (eligibleFortunes.length === 0) {
      return null;
    }

    // 根据概率选择机缘
    for (const fortune of eligibleFortunes) {
      const probability = this.calculateTriggerProbability(fortune);
      
      if (Math.random() < probability) {
        this.discoveredFortunes.add(fortune.id);
        return fortune;
      }
    }

    return null;
  }

  /**
   * 获取符合条件的机缘
   * Validates: Requirements 5.2
   */
  private getEligibleFortunes(): Fortune[] {
    const eligible: Fortune[] = [];

    for (const fortune of this.fortunePool.values()) {
      // 检查修为等级
      const currentLevelIndex = Object.values(CultivationLevel).indexOf(this.state.cultivation.level);
      const minLevelIndex = Object.values(CultivationLevel).indexOf(fortune.minCultivationLevel);

      if (currentLevelIndex >= minLevelIndex) {
        eligible.push(fortune);
      }
    }

    return eligible;
  }

  /**
   * 计算机缘触发概率
   * Validates: Requirements 5.3
   */
  calculateTriggerProbability(fortune: Fortune): number {
    let probability = fortune.baseProbability;

    // 根据修为调整概率（修为越高，触发高级机缘概率越大）
    const currentLevelIndex = Object.values(CultivationLevel).indexOf(this.state.cultivation.level);
    const minLevelIndex = Object.values(CultivationLevel).indexOf(fortune.minCultivationLevel);
    const levelDifference = currentLevelIndex - minLevelIndex;

    if (levelDifference > 0) {
      probability *= (1 + levelDifference * 0.1); // 每高一个境界，概率增加10%
    }

    // 根据运气属性调整（如果有善缘，增加概率）
    if (this.state.karma.goodDeeds > 0) {
      probability *= (1 + this.state.karma.goodDeeds * 0.01); // 每点善缘增加1%
    }

    // 根据因果债调整（因果债越高，概率降低）
    if (this.state.karma.karmicDebt > 0) {
      probability *= (1 - this.state.karma.karmicDebt * 0.005); // 每点因果债降低0.5%
    }

    // 确保概率在合理范围内
    return Math.max(0, Math.min(1, probability));
  }

  /**
   * 探索机缘并获得结果
   * Validates: Requirements 5.4, 5.5, 5.6
   */
  exploreFortune(fortuneId: string): FortuneResult {
    const fortune = this.fortunePool.get(fortuneId);

    if (!fortune) {
      throw new Error(`Fortune ${fortuneId} not found`);
    }

    const result: FortuneResult = {
      success: false,
      description: '',
      effects: {}
    };

    // 先检查风险
    for (const risk of fortune.risks) {
      if (Math.random() < risk.probability) {
        // 风险发生
        result.success = false;
        result.description = risk.description;
        result.effects = {
          cultivationChange: -(risk.effects.cultivationLoss || 0),
          lifespanChange: -(risk.effects.lifespanLoss || 0),
          resourceChanges: risk.effects.resourceLoss
        };
        return result;
      }
    }

    // 没有风险发生，检查收益
    for (const reward of fortune.rewards) {
      if (Math.random() < reward.probability) {
        // 获得收益
        result.success = true;
        result.description = reward.description;
        result.effects = {
          cultivationChange: reward.effects.cultivationGain,
          lifespanChange: reward.effects.lifespanGain,
          resourceChanges: reward.effects.resourceGain,
          itemsGained: reward.effects.itemGain,
          abilitiesUnlocked: reward.effects.unlockAbility ? [reward.effects.unlockAbility] : undefined
        };
        return result;
      }
    }

    // 既没有风险也没有收益
    result.success = true;
    result.description = '洞府已空，只剩残破的痕迹';
    result.effects = {};

    return result;
  }

  /**
   * 获取机缘风险等级描述
   * Validates: Requirements 5.5
   */
  getRiskLevelDescription(riskLevel: RiskLevel): string {
    switch (riskLevel) {
      case RiskLevel.Low:
        return '低风险 - 相对安全';
      case RiskLevel.Medium:
        return '中风险 - 需要谨慎';
      case RiskLevel.High:
        return '高风险 - 危险重重';
      case RiskLevel.Extreme:
        return '极高风险 - 九死一生';
      default:
        return '未知风险';
    }
  }

  /**
   * 获取机缘类型描述
   */
  getFortuneTypeDescription(type: FortuneType): string {
    switch (type) {
      case FortuneType.Cave:
        return '洞府 - 上古修士的遗迹';
      case FortuneType.Adventure:
        return '奇遇 - 偶然的际遇';
      case FortuneType.Legacy:
        return '传承 - 前辈的传承';
      case FortuneType.Treasure:
        return '宝物 - 珍贵的灵宝';
      default:
        return '未知类型';
    }
  }

  /**
   * 计算机缘的期望收益
   * Validates: Requirements 5.6
   */
  calculateExpectedValue(fortuneId: string): number {
    const fortune = this.fortunePool.get(fortuneId);

    if (!fortune) {
      return 0;
    }

    let expectedValue = 0;

    // 计算风险的期望损失
    for (const risk of fortune.risks) {
      const riskValue = 
        (risk.effects.cultivationLoss || 0) * 1 +
        (risk.effects.lifespanLoss || 0) * 10 +
        (risk.effects.resourceLoss?.spiritStones || 0) * 0.1;
      
      expectedValue -= riskValue * risk.probability;
    }

    // 计算收益的期望获得
    for (const reward of fortune.rewards) {
      const rewardValue = 
        (reward.effects.cultivationGain || 0) * 1 +
        (reward.effects.lifespanGain || 0) * 10 +
        (reward.effects.resourceGain?.spiritStones || 0) * 0.1 +
        (reward.effects.itemGain?.length || 0) * 50 +
        (reward.effects.unlockAbility ? 100 : 0);
      
      expectedValue += rewardValue * reward.probability;
    }

    return expectedValue;
  }

  /**
   * 检查机缘是否已发现
   */
  isFortuneDiscovered(fortuneId: string): boolean {
    return this.discoveredFortunes.has(fortuneId);
  }

  /**
   * 获取所有已发现的机缘
   */
  getDiscoveredFortunes(): Fortune[] {
    const discovered: Fortune[] = [];

    for (const fortuneId of this.discoveredFortunes) {
      const fortune = this.fortunePool.get(fortuneId);
      if (fortune) {
        discovered.push(fortune);
      }
    }

    return discovered;
  }

  /**
   * 根据类型获取机缘
   */
  getFortunesByType(type: FortuneType): Fortune[] {
    return Array.from(this.fortunePool.values()).filter(f => f.type === type);
  }

  /**
   * 根据风险等级获取机缘
   */
  getFortunesByRiskLevel(riskLevel: RiskLevel): Fortune[] {
    return Array.from(this.fortunePool.values()).filter(f => f.riskLevel === riskLevel);
  }

  /**
   * 获取机缘详情
   */
  getFortuneDetails(fortuneId: string): Fortune | undefined {
    return this.fortunePool.get(fortuneId);
  }

  /**
   * 获取所有机缘
   */
  getAllFortunes(): Fortune[] {
    return Array.from(this.fortunePool.values());
  }

  /**
   * 清空机缘池
   */
  clearFortunePool(): void {
    this.fortunePool.clear();
    this.discoveredFortunes.clear();
  }

  /**
   * 重置已发现的机缘
   */
  resetDiscoveredFortunes(): void {
    this.discoveredFortunes.clear();
  }
}
