/**
 * LifespanSystem - 寿命系统
 * 负责管理玩家寿命的初始化、减少和延寿机制
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

import { PlayerState, CultivationLevel } from '../types';

/**
 * 境界对应的基础寿命
 */
const CULTIVATION_LIFESPAN: Record<CultivationLevel, number> = {
  [CultivationLevel.QiRefining]: 80,              // 炼气期: 80年
  [CultivationLevel.FoundationEstablishment]: 150, // 筑基期: 150年
  [CultivationLevel.GoldenCore]: 300,             // 金丹期: 300年
  [CultivationLevel.NascentSoul]: 500,            // 元婴期: 500年
  [CultivationLevel.SoulFormation]: 800,          // 化神期: 800年
  [CultivationLevel.Void]: 1200,                  // 返虚期: 1200年
  [CultivationLevel.Integration]: 1800,           // 合体期: 1800年
  [CultivationLevel.Mahayana]: 3000,              // 大乘期: 3000年
  [CultivationLevel.Tribulation]: 5000,           // 渡劫期: 5000年
  [CultivationLevel.Ascension]: Infinity          // 飞升: 无限
};

export class LifespanSystem {
  private state: PlayerState;

  constructor(state: PlayerState) {
    this.state = state;
  }

  /**
   * 初始化寿命
   * Validates: Requirements 11.1
   */
  initializeLifespan(cultivationLevel: CultivationLevel): void {
    const maxLifespan = CULTIVATION_LIFESPAN[cultivationLevel];
    this.state.lifespan = {
      current: maxLifespan,
      max: maxLifespan
    };
  }

  /**
   * 减少寿命
   * Validates: Requirements 11.2, 11.3
   */
  decreaseLifespan(years: number): void {
    if (years < 0) {
      throw new Error('Years must be positive');
    }

    this.state.lifespan.current = Math.max(0, this.state.lifespan.current - years);
  }

  /**
   * 增加寿命
   * Validates: Requirements 11.6
   */
  increaseLifespan(years: number): void {
    if (years < 0) {
      throw new Error('Years must be positive');
    }

    this.state.lifespan.current = Math.min(
      this.state.lifespan.max,
      this.state.lifespan.current + years
    );
  }

  /**
   * 突破延寿
   * Validates: Requirements 11.4
   */
  breakthroughLifespanExtension(newCultivationLevel: CultivationLevel): void {
    const newMaxLifespan = CULTIVATION_LIFESPAN[newCultivationLevel];
    const oldMaxLifespan = this.state.lifespan.max;

    // 更新最大寿命
    this.state.lifespan.max = newMaxLifespan;

    // 计算延寿量
    const lifespanExtension = newMaxLifespan - oldMaxLifespan;

    // 增加当前寿命
    this.state.lifespan.current += lifespanExtension;

    // 确保当前寿命不超过最大寿命
    this.state.lifespan.current = Math.min(
      this.state.lifespan.current,
      this.state.lifespan.max
    );
  }

  /**
   * 检查寿命是否耗尽
   * Validates: Requirements 11.5
   */
  isLifespanDepleted(): boolean {
    return this.state.lifespan.current <= 0;
  }

  /**
   * 获取剩余寿命
   * Validates: Requirements 11.3
   */
  getRemainingLifespan(): number {
    return this.state.lifespan.current;
  }

  /**
   * 获取最大寿命
   */
  getMaxLifespan(): number {
    return this.state.lifespan.max;
  }

  /**
   * 获取寿命百分比
   */
  getLifespanPercentage(): number {
    if (this.state.lifespan.max === 0) {
      return 0;
    }
    return (this.state.lifespan.current / this.state.lifespan.max) * 100;
  }

  /**
   * 检查寿命是否危急（低于20%）
   */
  isLifespanCritical(): boolean {
    return this.getLifespanPercentage() < 20;
  }

  /**
   * 检查寿命是否充足（高于50%）
   */
  isLifespanHealthy(): boolean {
    return this.getLifespanPercentage() >= 50;
  }

  /**
   * 根据时间消耗减少寿命
   * Validates: Requirements 11.2
   */
  consumeLifespanByTime(months: number): void {
    const years = months / 12;
    this.decreaseLifespan(years);
  }

  /**
   * 使用延寿丹药
   * Validates: Requirements 11.6
   */
  useLifeExtensionItem(years: number): boolean {
    if (years <= 0) {
      return false;
    }

    // 检查是否已达最大寿命
    if (this.state.lifespan.current >= this.state.lifespan.max) {
      return false;
    }

    this.increaseLifespan(years);
    return true;
  }

  /**
   * 获取境界对应的基础寿命
   */
  static getBasicLifespan(cultivationLevel: CultivationLevel): number {
    return CULTIVATION_LIFESPAN[cultivationLevel];
  }

  /**
   * 获取寿命状态描述
   */
  getLifespanStatus(): string {
    const percentage = this.getLifespanPercentage();
    const remaining = this.getRemainingLifespan();

    if (remaining <= 0) {
      return '寿命已尽';
    } else if (percentage < 10) {
      return '寿命垂危';
    } else if (percentage < 20) {
      return '寿命危急';
    } else if (percentage < 50) {
      return '寿命不足';
    } else if (percentage < 80) {
      return '寿命充足';
    } else {
      return '寿命充沛';
    }
  }

  /**
   * 获取寿命详细信息
   */
  getLifespanInfo(): {
    current: number;
    max: number;
    percentage: number;
    status: string;
    isCritical: boolean;
    isDepleted: boolean;
  } {
    return {
      current: this.getRemainingLifespan(),
      max: this.getMaxLifespan(),
      percentage: this.getLifespanPercentage(),
      status: this.getLifespanStatus(),
      isCritical: this.isLifespanCritical(),
      isDepleted: this.isLifespanDepleted()
    };
  }

  /**
   * 计算突破后的寿命增长
   */
  calculateBreakthroughLifespanGain(currentLevel: CultivationLevel, nextLevel: CultivationLevel): number {
    const currentMaxLifespan = CULTIVATION_LIFESPAN[currentLevel];
    const nextMaxLifespan = CULTIVATION_LIFESPAN[nextLevel];
    return nextMaxLifespan - currentMaxLifespan;
  }

  /**
   * 预测寿命耗尽时间（按当前修为计算）
   */
  predictLifespanDepletionTime(): number {
    // 返回剩余寿命（年）
    return this.getRemainingLifespan();
  }

  /**
   * 检查是否需要突破以延寿
   */
  needsBreakthroughForLifespan(): boolean {
    // 如果寿命低于30%且不是最高境界，建议突破
    return this.getLifespanPercentage() < 30 && 
           this.state.cultivation.level !== CultivationLevel.Ascension;
  }

  /**
   * 获取下一境界的寿命信息
   */
  getNextLevelLifespanInfo(): {
    nextLevel: CultivationLevel | null;
    nextMaxLifespan: number;
    lifespanGain: number;
  } | null {
    const currentLevel = this.state.cultivation.level;
    
    // 获取所有境界
    const levels = Object.values(CultivationLevel);
    const currentIndex = levels.indexOf(currentLevel);
    
    if (currentIndex === -1 || currentIndex === levels.length - 1) {
      return null;
    }

    const nextLevel = levels[currentIndex + 1];
    const nextMaxLifespan = CULTIVATION_LIFESPAN[nextLevel];
    const lifespanGain = this.calculateBreakthroughLifespanGain(currentLevel, nextLevel);

    return {
      nextLevel,
      nextMaxLifespan,
      lifespanGain
    };
  }
}
