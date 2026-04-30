/**
 * OptionSystem - 选项系统
 * 负责生成日常选项、条件选项过滤、选项描述和效果预览、选项执行和结果应用
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
 */

import { PlayerState, GameOption, TimeCost, EffectSet, CultivationLevel } from '../types';
import { ResourceManager } from './ResourceManager';

/**
 * 选项生成配置
 */
export interface OptionGenerationConfig {
  includeBasicOptions: boolean;
  includeConditionalOptions: boolean;
  includeFactionOptions: boolean;
  includeResourceOptions: boolean;
}

export class OptionSystem {
  private state: PlayerState;
  private resourceManager: ResourceManager;
  private generatedOptions: Map<string, GameOption> = new Map();

  constructor(state: PlayerState, resourceManager: ResourceManager) {
    this.state = state;
    this.resourceManager = resourceManager;
  }

  /**
   * 生成日常选项
   * Validates: Requirements 1.1, 1.6
   */
  generateOptions(config?: Partial<OptionGenerationConfig>): GameOption[] {
    const options: GameOption[] = [];

    // 只保留基础选项：闭关修炼和外出探索
    options.push(...this.generateBasicOptions());

    // 过滤不可用的选项
    const filteredOptions = this.filterOptions(options);

    // 缓存生成的选项
    this.cacheOptions(filteredOptions);

    return filteredOptions;
  }

  /**
   * 生成基础选项（始终可用）
   * Validates: Requirements 1.1
   */
  private generateBasicOptions(): GameOption[] {
    const options: GameOption[] = [];

    // 闭关修炼
    options.push({
      id: 'cultivate',
      text: '闭关修炼',
      description: this.generateCultivationDescription(),
      timeCost: { months: 1 },
      effects: {
        cultivationChange: this.calculateCultivationGain()
      }
    });

    // 外出探索
    options.push({
      id: 'explore',
      text: '外出探索',
      description: '可能遇到机缘或危险，消耗1个月',
      timeCost: { months: 1 },
      effects: {}
    });

    return options;
  }

  /**
   * 生成条件选项（需要满足特定条件）
   * Validates: Requirements 1.6
   */
  private generateConditionalOptions(): GameOption[] {
    const options: GameOption[] = [];

    // 突破境界（修为达到阈值）
    if (this.state.cultivation.experience >= this.state.cultivation.maxExperience) {
      options.push({
        id: 'breakthrough',
        text: '尝试突破',
        description: `突破至下一境界，成功率取决于修为和因果，消耗3个月`,
        timeCost: { months: 3 },
        effects: {
          cultivationChange: 0 // 突破逻辑由GameEngine处理
        }
      });
    }

    // 修炼方向专属选项
    options.push(...this.generatePathSpecificOptions());

    return options;
  }

  /**
   * 生成修炼方向专属选项
   * Validates: Requirements 1.6
   */
  private generatePathSpecificOptions(): GameOption[] {
    const options: GameOption[] = [];
    const pathId = this.state.cultivationPath.id;

    switch (pathId) {
      case 'sword':
        // 剑修专属：剑道修炼
        options.push({
          id: 'sword_practice',
          text: '剑道修炼',
          description: '专注剑道修炼，修为增长更快，消耗1个月',
          timeCost: { months: 1 },
          effects: {
            cultivationChange: Math.floor(this.calculateCultivationGain() * 1.2)
          }
        });
        break;

      case 'body':
        // 体修专属：炼体
        options.push({
          id: 'body_tempering',
          text: '炼体修炼',
          description: '淬炼肉身，提升防御，消耗1个月',
          timeCost: { months: 1 },
          effects: {
            cultivationChange: Math.floor(this.calculateCultivationGain() * 0.9),
            lifespanChange: 0.5 // 体修延寿
          }
        });
        break;

      case 'alchemy':
        // 丹修专属：炼丹
        if (this.resourceManager.hasSpiritStones(50)) {
          options.push({
            id: 'alchemy_practice',
            text: '炼制丹药',
            description: '消耗50灵石炼制丹药，消耗1个月',
            timeCost: { months: 1 },
            requirements: {
              minResources: { spiritStones: 50 }
            },
            effects: {
              resourceChanges: { spiritStones: -50 },
              cultivationChange: 5
            }
          });
        }
        break;

      case 'formation':
        // 阵修专属：研究阵法
        options.push({
          id: 'formation_study',
          text: '研究阵法',
          description: '研究阵法之道，消耗1个月',
          timeCost: { months: 1 },
          effects: {
            cultivationChange: Math.floor(this.calculateCultivationGain() * 1.1)
          }
        });
        break;
    }

    return options;
  }

  /**
   * 生成势力相关选项
   * Validates: Requirements 1.6
   */
  private generateFactionOptions(): GameOption[] {
    const options: GameOption[] = [];

    // 已加入势力：宗门任务
    if (this.state.faction.current) {
      options.push({
        id: 'sect_quest',
        text: '接取宗门任务',
        description: '完成宗门任务获得灵石和声望，消耗1个月',
        timeCost: { months: 1 },
        effects: {
          resourceChanges: { spiritStones: 50 },
          reputationChange: { righteous: 5 }
        }
      });

      // 高声望：宗门秘传
      const factionReputation = this.state.faction.reputation.get(this.state.faction.current) || 0;
      if (factionReputation >= 50) {
        options.push({
          id: 'sect_secret',
          text: '学习宗门秘传',
          description: '学习宗门秘传功法，大幅提升修为，消耗2个月',
          timeCost: { months: 2 },
          effects: {
            cultivationChange: 50
          }
        });
      }
    } else {
      // 未加入势力：加入宗门
      if (this.state.cultivation.level >= CultivationLevel.QiRefining) {
        options.push({
          id: 'join_sect',
          text: '加入宗门',
          description: '加入正道宗门，获得资源和保护',
          timeCost: { months: 1 },
          effects: {
            resourceChanges: { spiritStones: 100 },
            reputationChange: { righteous: 10 }
          }
        });
      }
    }

    return options;
  }

  /**
   * 生成资源相关选项
   * Validates: Requirements 1.6
   */
  private generateResourceOptions(): GameOption[] {
    const options: GameOption[] = [];

    // 购买丹药
    if (this.resourceManager.hasSpiritStones(100)) {
      options.push({
        id: 'buy_pill',
        text: '购买筑基丹',
        description: '消耗100灵石购买筑基丹',
        timeCost: { months: 0 },
        requirements: {
          minResources: { spiritStones: 100 }
        },
        effects: {
          resourceChanges: { spiritStones: -100 }
        }
      });
    }

    // 使用丹药
    const pills = this.resourceManager.getAllPills();
    for (const [pillId, count] of pills.entries()) {
      if (count > 0) {
        const definition = this.resourceManager.getResourceDefinition(pillId);
        if (definition) {
          options.push({
            id: `use_pill_${pillId}`,
            text: `使用${definition.name}`,
            description: `${definition.effect.description}，剩余${count}个`,
            timeCost: { months: 0 },
            effects: {
              cultivationChange: definition.effect.cultivationBonus || 0,
              lifespanChange: definition.effect.lifespanBonus || 0
            }
          });
        }
      }
    }

    // 打工赚灵石
    options.push({
      id: 'work',
      text: '打工赚取灵石',
      description: '通过打工赚取灵石，消耗1个月',
      timeCost: { months: 1 },
      effects: {
        resourceChanges: { spiritStones: 30 }
      }
    });

    return options;
  }

  /**
   * 过滤选项（检查条件）
   * Validates: Requirements 1.6
   */
  private filterOptions(options: GameOption[]): GameOption[] {
    return options.filter(option => this.checkOptionRequirements(option));
  }

  /**
   * 检查选项要求
   * Validates: Requirements 1.6
   */
  checkOptionRequirements(option: GameOption): boolean {
    if (!option.requirements) {
      return true;
    }

    // 检查资源要求
    if (option.requirements.minResources) {
      if (option.requirements.minResources.spiritStones !== undefined) {
        if (!this.resourceManager.hasSpiritStones(option.requirements.minResources.spiritStones)) {
          return false;
        }
      }
    }

    // 检查关系要求
    if (option.requirements.minRelationship) {
      const { npcId, value } = option.requirements.minRelationship;
      const currentRelationship = this.state.relationships.get(npcId) || 0;
      if (currentRelationship < value) {
        return false;
      }
    }

    // 检查物品要求
    if (option.requirements.requiredItems) {
      for (const itemId of option.requirements.requiredItems) {
        if (!this.resourceManager.hasPill(itemId) && !this.resourceManager.hasArtifact(itemId)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 检查选项要求并返回详细错误信息
   * Validates: Requirements 1.5, 20.2
   */
  checkOptionRequirementsWithError(option: GameOption): {
    valid: boolean;
    error?: string;
  } {
    if (!option.requirements) {
      return { valid: true };
    }

    // 检查资源要求
    if (option.requirements.minResources) {
      if (option.requirements.minResources.spiritStones !== undefined) {
        const required = option.requirements.minResources.spiritStones;
        const available = this.resourceManager.getSpiritStones();
        if (available < required) {
          return {
            valid: false,
            error: `灵石不足，需要${required}，当前只有${available}`
          };
        }
      }
    }

    // 检查关系要求
    if (option.requirements.minRelationship) {
      const { npcId, value } = option.requirements.minRelationship;
      const currentRelationship = this.state.relationships.get(npcId) || 0;
      if (currentRelationship < value) {
        return {
          valid: false,
          error: `与${npcId}的关系不足，需要${value}，当前为${currentRelationship}`
        };
      }
    }

    // 检查物品要求
    if (option.requirements.requiredItems) {
      for (const itemId of option.requirements.requiredItems) {
        if (!this.resourceManager.hasPill(itemId) && !this.resourceManager.hasArtifact(itemId)) {
          return {
            valid: false,
            error: `缺少必需物品：${itemId}`
          };
        }
      }
    }

    // 检查剧情标记要求
    if (option.requirements.requiredFlags) {
      for (const flag of option.requirements.requiredFlags) {
        if (!this.state.storyProgress.storyFlags.has(flag)) {
          return {
            valid: false,
            error: `未满足剧情条件：${flag}`
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * 生成选项描述（包含效果预览）
   * Validates: Requirements 1.7, 1.8
   */
  generateOptionDescription(option: GameOption): string {
    const parts: string[] = [];

    // 基础描述
    if (option.description) {
      parts.push(option.description);
    }

    // 时间消耗
    const timeCost = this.formatTimeCost(option.timeCost);
    if (timeCost) {
      parts.push(`消耗${timeCost}`);
    }

    // 效果预览
    const effectPreview = this.generateEffectPreview(option.effects);
    if (effectPreview) {
      parts.push(effectPreview);
    }

    return parts.join('，');
  }

  /**
   * 生成效果预览
   * Validates: Requirements 1.7, 1.8
   */
  private generateEffectPreview(effects: EffectSet): string {
    const previews: string[] = [];

    // 修为变化
    if (effects.cultivationChange) {
      const sign = effects.cultivationChange > 0 ? '+' : '';
      previews.push(`修为${sign}${effects.cultivationChange}`);
    }

    // 寿命变化
    if (effects.lifespanChange) {
      const sign = effects.lifespanChange > 0 ? '+' : '';
      previews.push(`寿命${sign}${effects.lifespanChange}年`);
    }

    // 资源变化
    if (effects.resourceChanges) {
      if (effects.resourceChanges.spiritStones) {
        const sign = effects.resourceChanges.spiritStones > 0 ? '+' : '';
        previews.push(`灵石${sign}${effects.resourceChanges.spiritStones}`);
      }
    }

    // 声望变化
    if (effects.reputationChange) {
      if (effects.reputationChange.righteous) {
        previews.push(`正道声望+${effects.reputationChange.righteous}`);
      }
      if (effects.reputationChange.demonic) {
        previews.push(`魔道声望+${effects.reputationChange.demonic}`);
      }
    }

    // 因果变化
    if (effects.karmaChange) {
      if (effects.karmaChange.goodDeeds) {
        previews.push(`善缘+${effects.karmaChange.goodDeeds}`);
      }
      if (effects.karmaChange.karmicDebt) {
        previews.push(`因果债+${effects.karmaChange.karmicDebt}`);
      }
    }

    return previews.join('，');
  }

  /**
   * 格式化时间消耗
   */
  private formatTimeCost(timeCost: TimeCost): string {
    const parts: string[] = [];

    if (timeCost.years) {
      parts.push(`${timeCost.years}年`);
    }
    if (timeCost.months) {
      parts.push(`${timeCost.months}个月`);
    }
    if (timeCost.days) {
      parts.push(`${timeCost.days}天`);
    }

    return parts.join('');
  }

  /**
   * 执行选项
   * Validates: Requirements 1.4, 1.7
   */
  executeOption(optionId: string): EffectSet | null {
    const option = this.generatedOptions.get(optionId);

    if (!option) {
      return null;
    }

    // 检查要求
    if (!this.checkOptionRequirements(option)) {
      return null;
    }

    // 返回效果供调用者应用
    return option.effects;
  }

  /**
   * 应用选项效果
   * Validates: Requirements 1.7
   */
  applyEffects(effects: EffectSet): void {
    // 资源变化
    if (effects.resourceChanges) {
      if (effects.resourceChanges.spiritStones) {
        const change = effects.resourceChanges.spiritStones;
        console.log(`[OptionSystem] 应用灵石变化: ${change}`);
        console.log(`[OptionSystem] 当前灵石: ${this.resourceManager.getSpiritStones()}`);
        
        if (change > 0) {
          this.resourceManager.addSpiritStones(change);
          console.log(`[OptionSystem] 增加灵石后: ${this.resourceManager.getSpiritStones()}`);
        } else {
          const success = this.resourceManager.removeSpiritStones(Math.abs(change));
          console.log(`[OptionSystem] 消耗灵石${Math.abs(change)}，成功: ${success}`);
          console.log(`[OptionSystem] 消耗灵石后: ${this.resourceManager.getSpiritStones()}`);
        }
      }
    }

    // 修为变化由调用者处理（StateTracker）
    // 寿命变化由调用者处理（LifespanSystem）
    // 关系变化由调用者处理（RelationshipSystem）
    // 声望变化由调用者处理（ReputationSystem）
    // 因果变化由调用者处理（KarmaSystem）

    // 设置剧情标记
    if (effects.setFlags) {
      for (const flag of effects.setFlags) {
        this.state.storyProgress.storyFlags.set(flag, true);
      }
    }

    // 解锁事件
    if (effects.unlockEvents) {
      for (const eventId of effects.unlockEvents) {
        this.state.storyProgress.unlockedEvents.add(eventId);
      }
    }
  }

  /**
   * 缓存生成的选项
   */
  private cacheOptions(options: GameOption[]): void {
    this.generatedOptions.clear();
    for (const option of options) {
      this.generatedOptions.set(option.id, option);
    }
  }

  /**
   * 获取缓存的选项
   */
  getCachedOption(optionId: string): GameOption | undefined {
    return this.generatedOptions.get(optionId);
  }

  /**
   * 计算修炼收益
   */
  private calculateCultivationGain(): number {
    // 基础收益
    let gain = 10;

    // 修炼方向加成
    gain *= this.state.cultivationPath.cultivationBonus;

    // 境界影响（高境界修炼更慢）
    const levelIndex = Object.values(CultivationLevel).indexOf(this.state.cultivation.level);
    gain *= Math.max(0.5, 1 - levelIndex * 0.1);

    return Math.floor(gain);
  }

  /**
   * 生成修炼描述
   */
  private generateCultivationDescription(): string {
    const gain = this.calculateCultivationGain();
    return `闭关修炼，预计获得${gain}点修为，消耗1个月`;
  }

  /**
   * 验证选项ID
   * Validates: Requirements 1.5
   */
  validateOptionId(optionId: string): boolean {
    return this.generatedOptions.has(optionId);
  }

  /**
   * 获取所有可用选项ID
   */
  getAvailableOptionIds(): string[] {
    return Array.from(this.generatedOptions.keys());
  }

  /**
   * 获取选项数量
   */
  getOptionCount(): number {
    return this.generatedOptions.size;
  }

  /**
   * 清空缓存的选项
   */
  clearCache(): void {
    this.generatedOptions.clear();
  }

  /**
   * 为选项分配数字编号
   * Validates: Requirements 1.2
   */
  assignNumbersToOptions(options: GameOption[]): Array<{ number: number; option: GameOption }> {
    return options.map((option, index) => ({
      number: index + 1,
      option
    }));
  }

  /**
   * 根据数字编号获取选项
   * Validates: Requirements 1.2, 1.4
   */
  getOptionByNumber(number: number, options: GameOption[]): GameOption | null {
    if (number < 1 || number > options.length) {
      return null;
    }
    return options[number - 1];
  }

  /**
   * 格式化选项显示
   * Validates: Requirements 1.2, 1.3, 1.8
   */
  formatOptionDisplay(number: number, option: GameOption): string {
    const description = this.generateOptionDescription(option);
    return `[${number}] ${option.text}\n    ${description}`;
  }

  /**
   * 格式化所有选项显示
   * Validates: Requirements 1.1, 1.2, 1.3, 1.8
   */
  formatAllOptionsDisplay(options: GameOption[]): string {
    const numberedOptions = this.assignNumbersToOptions(options);
    return numberedOptions
      .map(({ number, option }) => this.formatOptionDisplay(number, option))
      .join('\n\n');
  }
}
