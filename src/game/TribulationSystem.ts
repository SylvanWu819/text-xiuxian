/**
 * TribulationSystem - 渡劫系统
 * 负责渡劫触发、劫难类型判定、心魔生成和渡劫结果处理
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 */

import { PlayerState, TribulationType, Demon, CultivationLevel, HistoryEntry } from '../types';

/**
 * 渡劫结果
 */
export interface TribulationResult {
  success: boolean;
  description: string;
  effects: {
    cultivationLevelUp?: boolean;
    newLevel?: CultivationLevel;
    lifespanChange?: number;
    cultivationChange?: number;
    karmaDebtChange?: number;
    demonification?: boolean; // 是否走火入魔
  };
}

/**
 * 渡劫选项
 */
export interface TribulationOption {
  id: string;
  text: string;
  description: string;
  successRate: number; // 成功率 (0-1)
  effects: {
    onSuccess: TribulationResult;
    onFailure: TribulationResult;
  };
}

export class TribulationSystem {
  private state: PlayerState;

  constructor(state: PlayerState) {
    this.state = state;
  }

  /**
   * 检查是否应该触发渡劫
   * Validates: Requirements 8.1
   */
  shouldTriggerTribulation(): boolean {
    // 当修为达到当前境界的最大值时触发渡劫
    return this.state.cultivation.experience >= this.state.cultivation.maxExperience;
  }

  /**
   * 确定劫难类型
   * Validates: Requirements 8.2
   */
  determineTribulationType(): TribulationType {
    const karmicDebt = this.state.karma.karmicDebt;
    const demonicReputation = this.state.reputation.demonic;

    // 高因果债（>50）触发心魔劫
    if (karmicDebt > 50) {
      return TribulationType.InnerDemon;
    }

    // 高魔道声望（>60）触发因果劫
    if (demonicReputation > 60) {
      return TribulationType.KarmicTribulation;
    }

    // 正常情况触发天劫
    return TribulationType.HeavenlyTribulation;
  }

  /**
   * 计算渡劫难度
   * Validates: Requirements 8.2
   */
  calculateDifficulty(): number {
    let difficulty = 1.0;

    // 因果债增加难度
    difficulty += this.state.karma.karmicDebt / 100;

    // 魔道声望增加难度
    difficulty += this.state.reputation.demonic / 200;

    // 修为等级越高，难度越大
    const levelIndex = Object.values(CultivationLevel).indexOf(this.state.cultivation.level);
    difficulty += levelIndex * 0.2;

    return difficulty;
  }

  /**
   * 生成心魔
   * Validates: Requirements 8.3
   */
  generateDemons(): Demon[] {
    const demons: Demon[] = [];

    // 从历史记录中找出关键选择（特别是负面行为）
    for (const entry of this.state.history) {
      if (entry.isKeyChoice) {
        // 检查是否包含杀人、背叛等关键词
        if (this.isNegativeAction(entry.description)) {
          demons.push({
            name: this.extractDemonName(entry.description),
            description: `${entry.description}的怨念化作心魔...`,
            power: this.calculateDemonPower(entry)
          });
        }
      }
    }

    // 如果没有历史心魔，根据因果债生成通用心魔
    if (demons.length === 0 && this.state.karma.karmicDebt > 0) {
      demons.push({
        name: '因果心魔',
        description: '你的恶行凝聚成的心魔',
        power: this.state.karma.karmicDebt
      });
    }

    return demons;
  }

  /**
   * 判断是否为负面行为
   */
  private isNegativeAction(description: string): boolean {
    const negativeKeywords = ['杀', '背叛', '抢夺', '欺骗', '陷害', '因果债'];
    return negativeKeywords.some(keyword => description.includes(keyword));
  }

  /**
   * 从描述中提取心魔名称
   */
  private extractDemonName(description: string): string {
    // 简单提取：取描述的前10个字符作为心魔名称
    const name = description.substring(0, Math.min(10, description.length));
    return `${name}之魔`;
  }

  /**
   * 计算心魔力量
   */
  private calculateDemonPower(entry: HistoryEntry): number {
    // 基础力量
    let power = 50;

    // 根据时间久远程度调整（越久远的事件，心魔越强）
    const yearsPassed = this.state.time.year - entry.time.year;
    power += yearsPassed * 5;

    return Math.min(power, 200); // 最大200
  }

  /**
   * 生成渡劫选项
   * Validates: Requirements 8.4
   */
  generateTribulationOptions(tribulationType: TribulationType, demons: Demon[]): TribulationOption[] {
    const options: TribulationOption[] = [];
    const difficulty = this.calculateDifficulty();
    const nextLevel = this.getNextCultivationLevel();

    if (tribulationType === TribulationType.InnerDemon) {
      // 心魔劫选项
      options.push({
        id: 'face_demons',
        text: '直面心魔',
        description: '正视自己的过错，直面心魔',
        successRate: Math.max(0.3, 0.7 - difficulty * 0.2),
        effects: {
          onSuccess: {
            success: true,
            description: '你战胜了心魔，道心更加坚定',
            effects: {
              cultivationLevelUp: true,
              newLevel: nextLevel || undefined,
              lifespanChange: this.getLifespanIncrease(),
              karmaDebtChange: -20 // 减少因果债
            }
          },
          onFailure: {
            success: false,
            description: '心魔反噬，修为受损',
            effects: {
              cultivationLevelUp: false,
              cultivationChange: -50,
              lifespanChange: -10
            }
          }
        }
      });

      options.push({
        id: 'suppress_demons',
        text: '压制心魔',
        description: '用修为强行压制心魔',
        successRate: Math.max(0.2, 0.5 - difficulty * 0.15),
        effects: {
          onSuccess: {
            success: true,
            description: '你暂时压制了心魔，但隐患仍在',
            effects: {
              cultivationLevelUp: true,
              newLevel: nextLevel || undefined,
              lifespanChange: this.getLifespanIncrease(),
              karmaDebtChange: 10 // 增加因果债
            }
          },
          onFailure: {
            success: false,
            description: '压制失败，走火入魔',
            effects: {
              cultivationLevelUp: false,
              demonification: true,
              lifespanChange: -20
            }
          }
        }
      });

      options.push({
        id: 'seek_help',
        text: '借助外力',
        description: '请求师长或好友帮助渡劫',
        successRate: Math.max(0.4, 0.8 - difficulty * 0.1),
        effects: {
          onSuccess: {
            success: true,
            description: '在他人帮助下渡过心魔劫',
            effects: {
              cultivationLevelUp: true,
              newLevel: nextLevel || undefined,
              lifespanChange: this.getLifespanIncrease() * 0.8, // 借助外力，寿命增加较少
              karmaDebtChange: 5 // 欠下人情
            }
          },
          onFailure: {
            success: false,
            description: '外力无法帮助，心魔更加强大',
            effects: {
              cultivationLevelUp: false,
              cultivationChange: -30,
              lifespanChange: -5
            }
          }
        }
      });
    } else if (tribulationType === TribulationType.HeavenlyTribulation) {
      // 天劫选项
      options.push({
        id: 'resist_tribulation',
        text: '硬抗天劫',
        description: '凭借自身修为抵抗天劫',
        successRate: Math.max(0.4, 0.7 - difficulty * 0.15),
        effects: {
          onSuccess: {
            success: true,
            description: '你成功渡过天劫，修为大增',
            effects: {
              cultivationLevelUp: true,
              newLevel: nextLevel || undefined,
              lifespanChange: this.getLifespanIncrease(),
              cultivationChange: 50
            }
          },
          onFailure: {
            success: false,
            description: '天劫之力过于强大，身受重伤',
            effects: {
              cultivationLevelUp: false,
              lifespanChange: -15,
              cultivationChange: -40
            }
          }
        }
      });

      options.push({
        id: 'use_treasure',
        text: '使用法宝',
        description: '使用法宝辅助渡劫',
        successRate: Math.max(0.5, 0.8 - difficulty * 0.1),
        effects: {
          onSuccess: {
            success: true,
            description: '借助法宝之力，顺利渡劫',
            effects: {
              cultivationLevelUp: true,
              newLevel: nextLevel || undefined,
              lifespanChange: this.getLifespanIncrease()
            }
          },
          onFailure: {
            success: false,
            description: '法宝被天劫摧毁，自身也受到波及',
            effects: {
              cultivationLevelUp: false,
              lifespanChange: -10,
              cultivationChange: -20
            }
          }
        }
      });

      options.push({
        id: 'formation_protection',
        text: '阵法护持',
        description: '在阵法保护下渡劫',
        successRate: Math.max(0.6, 0.85 - difficulty * 0.1),
        effects: {
          onSuccess: {
            success: true,
            description: '阵法削弱了天劫之力，成功突破',
            effects: {
              cultivationLevelUp: true,
              newLevel: nextLevel || undefined,
              lifespanChange: this.getLifespanIncrease() * 0.9
            }
          },
          onFailure: {
            success: false,
            description: '阵法被破，遭受天劫反噬',
            effects: {
              cultivationLevelUp: false,
              lifespanChange: -8,
              cultivationChange: -15
            }
          }
        }
      });
    } else {
      // 因果劫选项
      options.push({
        id: 'repent',
        text: '忏悔赎罪',
        description: '真心忏悔过往罪孽',
        successRate: Math.max(0.3, 0.6 - difficulty * 0.2),
        effects: {
          onSuccess: {
            success: true,
            description: '你的忏悔感动天地，因果消散',
            effects: {
              cultivationLevelUp: true,
              newLevel: nextLevel || undefined,
              lifespanChange: this.getLifespanIncrease(),
              karmaDebtChange: -50
            }
          },
          onFailure: {
            success: false,
            description: '因果业力过重，忏悔无用',
            effects: {
              cultivationLevelUp: false,
              lifespanChange: -12,
              karmaDebtChange: 10
            }
          }
        }
      });

      options.push({
        id: 'accept_karma',
        text: '承受因果',
        description: '接受因果报应，以身偿还',
        successRate: Math.max(0.5, 0.8 - difficulty * 0.1),
        effects: {
          onSuccess: {
            success: true,
            description: '你承受了因果之力，虽然痛苦但成功突破',
            effects: {
              cultivationLevelUp: true,
              newLevel: nextLevel || undefined,
              lifespanChange: this.getLifespanIncrease() * 0.5,
              karmaDebtChange: -30
            }
          },
          onFailure: {
            success: false,
            description: '因果之力过于沉重，无法承受',
            effects: {
              cultivationLevelUp: false,
              lifespanChange: -20,
              demonification: true
            }
          }
        }
      });
    }

    return options;
  }

  /**
   * 执行渡劫
   * Validates: Requirements 8.5, 8.6, 8.7
   */
  performTribulation(optionId: string, tribulationType: TribulationType, demons: Demon[]): TribulationResult {
    const options = this.generateTribulationOptions(tribulationType, demons);
    const selectedOption = options.find(opt => opt.id === optionId);

    if (!selectedOption) {
      throw new Error(`Tribulation option ${optionId} not found`);
    }

    // 根据成功率判定结果
    const success = Math.random() < selectedOption.successRate;

    if (success) {
      return selectedOption.effects.onSuccess;
    } else {
      return selectedOption.effects.onFailure;
    }
  }

  /**
   * 获取突破后的寿命增加
   */
  private getLifespanIncrease(): number {
    const currentLevel = this.state.cultivation.level;
    
    // 根据当前境界返回寿命增加值
    switch (currentLevel) {
      case CultivationLevel.QiRefining:
        return 70; // 炼气期 -> 筑基期: 80 -> 150
      case CultivationLevel.FoundationEstablishment:
        return 150; // 筑基期 -> 金丹期: 150 -> 300
      case CultivationLevel.GoldenCore:
        return 200; // 金丹期 -> 元婴期: 300 -> 500
      case CultivationLevel.NascentSoul:
        return 500; // 元婴期 -> 化神期: 500 -> 1000
      case CultivationLevel.SoulFormation:
        return 1000; // 化神期 -> 返虚期: 1000 -> 2000
      case CultivationLevel.Void:
        return 2000; // 返虚期 -> 合体期: 2000 -> 4000
      case CultivationLevel.Integration:
        return 4000; // 合体期 -> 大乘期: 4000 -> 8000
      case CultivationLevel.Mahayana:
        return 8000; // 大乘期 -> 渡劫期: 8000 -> 16000
      case CultivationLevel.Tribulation:
        return 0; // 渡劫期 -> 飞升: 不增加寿命
      default:
        return 0;
    }
  }

  /**
   * 获取下一个修为等级
   */
  getNextCultivationLevel(): CultivationLevel | null {
    const levels = Object.values(CultivationLevel);
    const currentIndex = levels.indexOf(this.state.cultivation.level);

    if (currentIndex === -1 || currentIndex === levels.length - 1) {
      return null; // 已经是最高境界
    }

    return levels[currentIndex + 1];
  }

  /**
   * 获取渡劫类型描述
   */
  getTribulationTypeDescription(type: TribulationType): string {
    switch (type) {
      case TribulationType.HeavenlyTribulation:
        return '天劫 - 天道考验，雷霆万钧';
      case TribulationType.InnerDemon:
        return '心魔劫 - 过往罪孽化作心魔';
      case TribulationType.KarmicTribulation:
        return '因果劫 - 因果业力的清算';
      default:
        return '未知劫难';
    }
  }

  /**
   * 获取心魔详情
   */
  getDemonDetails(demons: Demon[]): string {
    if (demons.length === 0) {
      return '无心魔';
    }

    return demons.map(demon => 
      `${demon.name}（力量: ${demon.power}）- ${demon.description}`
    ).join('\n');
  }

  /**
   * 计算渡劫成功率
   * Validates: Requirements 8.5
   */
  calculateSuccessRate(optionId: string, tribulationType: TribulationType, demons: Demon[]): number {
    const options = this.generateTribulationOptions(tribulationType, demons);
    const option = options.find(opt => opt.id === optionId);

    if (!option) {
      return 0;
    }

    let successRate = option.successRate;

    // 善缘可以提高成功率
    if (this.state.karma.goodDeeds > 0) {
      successRate += this.state.karma.goodDeeds * 0.001; // 每点善缘增加0.1%
    }

    // 正道声望可以提高成功率
    if (this.state.reputation.righteous > 0) {
      successRate += this.state.reputation.righteous * 0.001; // 每点正道声望增加0.1%
    }

    // 确保成功率在合理范围内
    return Math.max(0, Math.min(1, successRate));
  }

  /**
   * 检查是否有好友可以帮助渡劫
   */
  canSeekHelp(): boolean {
    // 检查是否有关系值 >= 50 的NPC
    for (const [npcId, relationship] of this.state.relationships.entries()) {
      if (relationship >= 50) {
        return true;
      }
    }
    return false;
  }

  /**
   * 检查是否有法宝可用
   */
  hasTreasure(): boolean {
    // 检查是否有法器
    return this.state.resources.artifacts.size > 0;
  }

  /**
   * 获取渡劫建议
   */
  getTribulationAdvice(tribulationType: TribulationType, demons: Demon[]): string {
    const difficulty = this.calculateDifficulty();
    const options = this.generateTribulationOptions(tribulationType, demons);

    // 找出成功率最高的选项
    let bestOption = options[0];
    let bestRate = this.calculateSuccessRate(bestOption.id, tribulationType, demons);

    for (const option of options) {
      const rate = this.calculateSuccessRate(option.id, tribulationType, demons);
      if (rate > bestRate) {
        bestOption = option;
        bestRate = rate;
      }
    }

    let advice = `当前劫难难度: ${difficulty.toFixed(2)}\n`;
    advice += `建议选择: ${bestOption.text}\n`;
    advice += `成功率: ${(bestRate * 100).toFixed(1)}%\n`;
    advice += `理由: ${bestOption.description}`;

    return advice;
  }
}
