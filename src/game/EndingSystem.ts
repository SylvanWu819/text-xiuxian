/**
 * EndingSystem - 结局系统
 * 负责判定和触发游戏结局
 * Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
 */

import { PlayerState, CultivationLevel } from '../types';

/**
 * 结局类型
 * Validates: Requirements 13.1
 */
export enum EndingType {
  Ascension = 'ascension',                    // 飞升
  DemonicAscension = 'demonic_ascension',     // 魔界飞升
  SittingInMeditation = 'sitting_meditation', // 坐化
  BecomeDemonLord = 'become_demon_lord',      // 成魔
  FoundSect = 'found_sect',                   // 建立宗门
  Hermit = 'hermit',                          // 隐居
  DeathByTribulation = 'death_tribulation',   // 渡劫失败
  DeathByEnemy = 'death_enemy',               // 被仇敌击杀
  DeathByKarma = 'death_karma'                // 因果反噬
}

/**
 * 结局信息
 */
export interface EndingInfo {
  type: EndingType;
  title: string;
  description: string;
  achievements: string[];  // 成就列表
  finalStats: {
    cultivationLevel: CultivationLevel;
    age: number;
    righteousReputation: number;
    demonicReputation: number;
    spiritStones: number;
    relationshipsCount: number;
  };
}

/**
 * 结局条件检查结果
 */
interface EndingCheckResult {
  hasEnding: boolean;
  endingType: EndingType | null;
  priority: number;  // 优先级，用于多个结局同时满足时的选择
}

export class EndingSystem {
  private state: PlayerState;
  private endingHistory: EndingInfo[] = [];  // 已达成的结局记录

  constructor(state: PlayerState) {
    this.state = state;
  }

  /**
   * 检查是否达成任何结局条件
   * Validates: Requirements 13.2
   */
  checkEndingConditions(): EndingCheckResult {
    // 按优先级检查各种结局条件
    // 优先级：死亡类 > 飞升类 > 成就类

    // 1. 检查死亡类结局（最高优先级）
    const deathEnding = this.checkDeathEndings();
    if (deathEnding.hasEnding) {
      return deathEnding;
    }

    // 2. 检查飞升类结局
    const ascensionEnding = this.checkAscensionEndings();
    if (ascensionEnding.hasEnding) {
      return ascensionEnding;
    }

    // 3. 检查成就类结局
    const achievementEnding = this.checkAchievementEndings();
    if (achievementEnding.hasEnding) {
      return achievementEnding;
    }

    return { hasEnding: false, endingType: null, priority: 0 };
  }

  /**
   * 检查死亡类结局
   */
  private checkDeathEndings(): EndingCheckResult {
    // 寿命耗尽 -> 坐化
    if (this.state.lifespan.current <= 0) {
      return {
        hasEnding: true,
        endingType: EndingType.SittingInMeditation,
        priority: 100
      };
    }

    // 因果债过高 -> 因果反噬
    if (this.state.karma.karmicDebt >= 100) {
      return {
        hasEnding: true,
        endingType: EndingType.DeathByKarma,
        priority: 100
      };
    }

    return { hasEnding: false, endingType: null, priority: 0 };
  }

  /**
   * 检查飞升类结局
   * Validates: Requirements 13.2
   */
  private checkAscensionEndings(): EndingCheckResult {
    // 修为达到飞升境界
    if (this.state.cultivation.level === CultivationLevel.Ascension) {
      // 根据声望判断飞升类型
      if (this.state.reputation.demonic >= 70 && 
          this.state.reputation.demonic > this.state.reputation.righteous) {
        // 魔道飞升
        return {
          hasEnding: true,
          endingType: EndingType.DemonicAscension,
          priority: 90
        };
      } else {
        // 正道飞升
        return {
          hasEnding: true,
          endingType: EndingType.Ascension,
          priority: 90
        };
      }
    }

    return { hasEnding: false, endingType: null, priority: 0 };
  }

  /**
   * 检查成就类结局
   */
  private checkAchievementEndings(): EndingCheckResult {
    const currentLevelIndex = this.getCultivationLevelIndex(this.state.cultivation.level);
    
    // 成魔结局：高魔道声望 + 高修为
    if (this.state.reputation.demonic >= 70 &&
        this.state.reputation.righteous < 30 &&
        currentLevelIndex >= this.getCultivationLevelIndex(CultivationLevel.NascentSoul)) {
      return {
        hasEnding: true,
        endingType: EndingType.BecomeDemonLord,
        priority: 80
      };
    }

    // 建立宗门结局：高声望 + 高修为 + 多人脉
    const relationshipsCount = this.state.relationships.size;
    if ((this.state.reputation.righteous >= 60 || this.state.reputation.demonic >= 60) &&
        currentLevelIndex >= this.getCultivationLevelIndex(CultivationLevel.NascentSoul) &&
        relationshipsCount >= 10) {
      return {
        hasEnding: true,
        endingType: EndingType.FoundSect,
        priority: 70
      };
    }

    // 隐居结局：高修为 + 低声望 + 高寿命 + 长时间修炼
    // v2.2.0: 提高触发条件，避免过早结束游戏
    if (currentLevelIndex >= this.getCultivationLevelIndex(CultivationLevel.SoulFormation) &&
        this.state.reputation.righteous < 20 &&
        this.state.reputation.demonic < 20 &&
        this.state.lifespan.current > this.state.lifespan.max * 0.6 &&
        this.state.time.year >= 300) {
      return {
        hasEnding: true,
        endingType: EndingType.Hermit,
        priority: 60
      };
    }

    return { hasEnding: false, endingType: null, priority: 0 };
  }

  /**
   * 获取修为等级的索引（用于比较）
   */
  private getCultivationLevelIndex(level: CultivationLevel): number {
    const levels = Object.values(CultivationLevel);
    return levels.indexOf(level);
  }

  /**
   * 触发结局
   * Validates: Requirements 13.3
   */
  triggerEnding(endingType: EndingType): EndingInfo {
    const endingInfo = this.generateEndingInfo(endingType);
    
    // 记录结局
    this.recordEnding(endingInfo);
    
    return endingInfo;
  }

  /**
   * 生成结局信息
   * Validates: Requirements 13.4
   */
  private generateEndingInfo(endingType: EndingType): EndingInfo {
    const achievements = this.calculateAchievements();
    const finalStats = this.getFinalStats();

    let title: string;
    let description: string;

    switch (endingType) {
      case EndingType.Ascension:
        title = '飞升成仙';
        description = this.generateAscensionDescription();
        break;

      case EndingType.DemonicAscension:
        title = '魔界飞升';
        description = this.generateDemonicAscensionDescription();
        break;

      case EndingType.SittingInMeditation:
        title = '寿元耗尽，坐化而终';
        description = this.generateSittingMeditationDescription();
        break;

      case EndingType.BecomeDemonLord:
        title = '成就魔尊';
        description = this.generateDemonLordDescription();
        break;

      case EndingType.FoundSect:
        title = '开宗立派';
        description = this.generateFoundSectDescription();
        break;

      case EndingType.Hermit:
        title = '归隐山林';
        description = this.generateHermitDescription();
        break;

      case EndingType.DeathByTribulation:
        title = '渡劫失败';
        description = '你在渡劫时未能抵挡天劫之威，形神俱灭。';
        break;

      case EndingType.DeathByEnemy:
        title = '死于仇敌之手';
        description = '你的仇敌找上门来，最终你不敌对手，陨落于此。';
        break;

      case EndingType.DeathByKarma:
        title = '因果反噬';
        description = '你积累的因果债过重，最终遭到天道反噬，魂飞魄散。';
        break;

      default:
        title = '未知结局';
        description = '你的修仙之路就此结束。';
    }

    return {
      type: endingType,
      title,
      description,
      achievements,
      finalStats
    };
  }

  /**
   * 生成飞升结局描述
   */
  private generateAscensionDescription(): string {
    const age = this.state.time.year;
    const level = this.getCultivationLevelName(this.state.cultivation.level);
    
    return `经过${age}年的苦修，你终于突破了${level}，渡过了最后的天劫。\n` +
           `在雷光闪耀中，你的身体逐渐虚化，化作一道流光冲向九天之上。\n` +
           `你成功飞升仙界，开启了新的修仙之路。`;
  }

  /**
   * 生成魔界飞升结局描述
   */
  private generateDemonicAscensionDescription(): string {
    const age = this.state.time.year;
    const demonicRep = this.state.reputation.demonic;
    
    return `经过${age}年的魔道修行，你的魔道声望达到了${demonicRep}点。\n` +
           `在最后的天劫中，你以魔道之力强行突破，引来了魔界的接引。\n` +
           `你选择了魔界飞升，成为魔界的一员，继续你的魔道之路。`;
  }

  /**
   * 生成坐化结局描述
   */
  private generateSittingMeditationDescription(): string {
    const age = this.state.time.year;
    const level = this.getCultivationLevelName(this.state.cultivation.level);
    
    return `你修炼了${age}年，最终达到了${level}。\n` +
           `然而寿元终有尽时，你感到生命之火即将熄灭。\n` +
           `你盘膝而坐，平静地接受了这一切，最终坐化而终。\n` +
           `你的一生虽未能飞升，但也算是修行有成。`;
  }

  /**
   * 生成成魔结局描述
   */
  private generateDemonLordDescription(): string {
    const demonicRep = this.state.reputation.demonic;
    
    return `你的魔道声望达到了${demonicRep}点，在修真界中恶名昭著。\n` +
           `你以强大的魔道修为，击败了无数正道修士，建立了自己的魔道势力。\n` +
           `最终，你成为了一代魔尊，威震修真界。`;
  }

  /**
   * 生成建立宗门结局描述
   */
  private generateFoundSectDescription(): string {
    const relationshipsCount = this.state.relationships.size;
    const reputation = Math.max(this.state.reputation.righteous, this.state.reputation.demonic);
    
    return `凭借你的修为和声望（${reputation}点），你吸引了${relationshipsCount}位志同道合的修士。\n` +
           `你们共同建立了一个新的宗门，传承你的修行之道。\n` +
           `你成为了宗门的开山祖师，你的名字将被后世传颂。`;
  }

  /**
   * 生成隐居结局描述
   */
  private generateHermitDescription(): string {
    const age = this.state.time.year;
    const level = this.getCultivationLevelName(this.state.cultivation.level);
    
    return `修炼${age}年后，你达到了${level}。\n` +
           `你厌倦了修真界的纷争，选择归隐山林，过上了清静的生活。\n` +
           `你在山中继续修炼，不问世事，享受着宁静的修行时光。`;
  }

  /**
   * 计算成就列表
   */
  private calculateAchievements(): string[] {
    const achievements: string[] = [];

    // 修为成就
    const level = this.state.cultivation.level;
    if (level === CultivationLevel.Ascension) {
      achievements.push('【修为巅峰】达到飞升境界');
    } else if (level >= CultivationLevel.Mahayana) {
      achievements.push('【修为高深】达到大乘期');
    } else if (level >= CultivationLevel.NascentSoul) {
      achievements.push('【修为有成】达到元婴期');
    }

    // 声望成就
    if (this.state.reputation.righteous >= 80) {
      achievements.push('【正道楷模】正道声望达到80+');
    }
    if (this.state.reputation.demonic >= 80) {
      achievements.push('【魔道巨擘】魔道声望达到80+');
    }

    // 财富成就
    if (this.state.resources.spiritStones >= 10000) {
      achievements.push('【富甲一方】灵石超过10000');
    }

    // 人脉成就
    const relationshipsCount = this.state.relationships.size;
    if (relationshipsCount >= 20) {
      achievements.push('【人脉广阔】建立了20+个人际关系');
    } else if (relationshipsCount >= 10) {
      achievements.push('【朋友众多】建立了10+个人际关系');
    }

    // 因果成就
    if (this.state.karma.goodDeeds >= 100) {
      achievements.push('【功德圆满】善缘值达到100+');
    }
    if (this.state.karma.karmicDebt === 0) {
      achievements.push('【清净无为】无因果债');
    }

    // 寿命成就
    if (this.state.time.year >= 1000) {
      achievements.push('【千年修行】修炼超过1000年');
    } else if (this.state.time.year >= 500) {
      achievements.push('【五百年道行】修炼超过500年');
    }

    return achievements;
  }

  /**
   * 获取最终统计数据
   */
  private getFinalStats() {
    return {
      cultivationLevel: this.state.cultivation.level,
      age: this.state.time.year,
      righteousReputation: this.state.reputation.righteous,
      demonicReputation: this.state.reputation.demonic,
      spiritStones: this.state.resources.spiritStones,
      relationshipsCount: this.state.relationships.size
    };
  }

  /**
   * 记录结局
   * Validates: Requirements 13.6
   */
  private recordEnding(endingInfo: EndingInfo): void {
    this.endingHistory.push(endingInfo);
  }

  /**
   * 获取已达成的结局列表
   * Validates: Requirements 13.6
   */
  getEndingHistory(): EndingInfo[] {
    return [...this.endingHistory];
  }

  /**
   * 检查是否达成过特定结局
   */
  hasAchievedEnding(endingType: EndingType): boolean {
    return this.endingHistory.some(ending => ending.type === endingType);
  }

  /**
   * 获取结局统计
   */
  getEndingStatistics(): {
    totalEndings: number;
    endingTypes: Map<EndingType, number>;
  } {
    const endingTypes = new Map<EndingType, number>();
    
    for (const ending of this.endingHistory) {
      const count = endingTypes.get(ending.type) || 0;
      endingTypes.set(ending.type, count + 1);
    }

    return {
      totalEndings: this.endingHistory.length,
      endingTypes
    };
  }

  /**
   * 获取修为等级名称
   */
  private getCultivationLevelName(level: CultivationLevel): string {
    const levelNames: Record<CultivationLevel, string> = {
      [CultivationLevel.QiRefining]: '炼气期',
      [CultivationLevel.FoundationEstablishment]: '筑基期',
      [CultivationLevel.GoldenCore]: '金丹期',
      [CultivationLevel.NascentSoul]: '元婴期',
      [CultivationLevel.SoulFormation]: '化神期',
      [CultivationLevel.Void]: '返虚期',
      [CultivationLevel.Integration]: '合体期',
      [CultivationLevel.Mahayana]: '大乘期',
      [CultivationLevel.Tribulation]: '渡劫期',
      [CultivationLevel.Ascension]: '飞升境界'
    };

    return levelNames[level] || '未知境界';
  }

  /**
   * 获取结局类型的显示名称
   */
  getEndingTypeName(endingType: EndingType): string {
    const typeNames: Record<EndingType, string> = {
      [EndingType.Ascension]: '飞升成仙',
      [EndingType.DemonicAscension]: '魔界飞升',
      [EndingType.SittingInMeditation]: '坐化而终',
      [EndingType.BecomeDemonLord]: '成就魔尊',
      [EndingType.FoundSect]: '开宗立派',
      [EndingType.Hermit]: '归隐山林',
      [EndingType.DeathByTribulation]: '渡劫失败',
      [EndingType.DeathByEnemy]: '死于仇敌',
      [EndingType.DeathByKarma]: '因果反噬'
    };

    return typeNames[endingType] || '未知结局';
  }

  /**
   * 清除结局历史（用于测试或重置）
   */
  clearEndingHistory(): void {
    this.endingHistory = [];
  }
}
