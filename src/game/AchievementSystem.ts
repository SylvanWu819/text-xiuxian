/**
 * AchievementSystem - 成就系统
 * 负责记录玩家达成的结局、成就和统计数据
 */

import { EndingType } from './EndingSystem';

/**
 * 成就稀有度
 */
export enum AchievementRarity {
  Common = 'common',
  Rare = 'rare',
  Epic = 'epic',
  Legendary = 'legendary'
}

/**
 * 成就定义
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  category: string;
}

/**
 * 成就类别
 */
export interface AchievementCategory {
  name: string;
  description: string;
  achievements: Achievement[];
}

/**
 * 结局记录
 */
export interface EndingRecord {
  endingType: EndingType;
  title: string;
  achievedAt: number;  // 时间戳
  playTime: number;    // 游戏时长（年）
  cultivationLevel: string;
  achievements: string[];
  finalStats: {
    age: number;
    spiritStones: number;
    righteousReputation: number;
    demonicReputation: number;
    relationshipsCount: number;
  };
}

/**
 * 成就数据
 */
export interface AchievementData {
  unlockedEndings: Set<EndingType>;  // 已解锁的结局
  endingRecords: EndingRecord[];     // 结局记录（按时间排序）
  unlockedAchievements: Set<string>; // 已解锁的成就ID
  achievementUnlockTimes: Map<string, number>; // 成就解锁时间
  totalPlayCount: number;            // 总游戏次数
  totalPlayTime: number;             // 总游戏时长（年）
  firstPlayDate: number;             // 首次游戏时间戳
  lastPlayDate: number;              // 最后游戏时间戳
}

/**
 * 成就系统
 */
export class AchievementSystem {
  private achievementData: AchievementData;

  constructor(savedData?: any) {
    if (savedData) {
      this.achievementData = this.deserialize(savedData);
    } else {
      this.achievementData = this.createEmptyData();
    }
  }

  /**
   * 创建空的成就数据
   */
  private createEmptyData(): AchievementData {
    return {
      unlockedEndings: new Set<EndingType>(),
      endingRecords: [],
      unlockedAchievements: new Set<string>(),
      achievementUnlockTimes: new Map<string, number>(),
      totalPlayCount: 0,
      totalPlayTime: 0,
      firstPlayDate: Date.now(),
      lastPlayDate: Date.now()
    };
  }

  /**
   * 解锁成就
   */
  unlockAchievement(achievementId: string): boolean {
    if (this.achievementData.unlockedAchievements.has(achievementId)) {
      return false; // 已经解锁
    }
    
    this.achievementData.unlockedAchievements.add(achievementId);
    this.achievementData.achievementUnlockTimes.set(achievementId, Date.now());
    return true;
  }

  /**
   * 批量解锁成就（从flags）
   */
  unlockAchievementsFromFlags(flags: string[]): string[] {
    const newlyUnlocked: string[] = [];
    
    for (const flag of flags) {
      if (this.unlockAchievement(flag)) {
        newlyUnlocked.push(flag);
      }
    }
    
    return newlyUnlocked;
  }

  /**
   * 检查成就是否已解锁
   */
  isAchievementUnlocked(achievementId: string): boolean {
    return this.achievementData.unlockedAchievements.has(achievementId);
  }

  /**
   * 获取成就解锁进度
   */
  getAchievementProgress(totalAchievements: number): {
    unlockedCount: number;
    totalCount: number;
    percentage: number;
    points: number;
  } {
    const unlockedCount = this.achievementData.unlockedAchievements.size;
    const percentage = totalAchievements > 0 
      ? Math.round((unlockedCount / totalAchievements) * 100) 
      : 0;
    
    // 计算成就点数（需要从achievements.json加载稀有度信息）
    const points = unlockedCount * 25; // 简化计算，实际应根据稀有度
    
    return {
      unlockedCount,
      totalCount: totalAchievements,
      percentage,
      points
    };
  }

  /**
   * 获取最近解锁的成就
   */
  getRecentAchievements(limit: number = 10): Array<{id: string; unlockedAt: number}> {
    const achievements = Array.from(this.achievementData.achievementUnlockTimes.entries())
      .map(([id, unlockedAt]) => ({ id, unlockedAt }))
      .sort((a, b) => b.unlockedAt - a.unlockedAt);
    
    return achievements.slice(0, limit);
  }

  /**
   * 记录结局达成
   */
  recordEnding(
    endingType: EndingType,
    title: string,
    playTime: number,
    cultivationLevel: string,
    achievements: string[],
    finalStats: {
      age: number;
      spiritStones: number;
      righteousReputation: number;
      demonicReputation: number;
      relationshipsCount: number;
    }
  ): void {
    // 添加到已解锁结局
    this.achievementData.unlockedEndings.add(endingType);

    // 创建结局记录
    const record: EndingRecord = {
      endingType,
      title,
      achievedAt: Date.now(),
      playTime,
      cultivationLevel,
      achievements,
      finalStats
    };

    // 添加到记录列表（最新的在前面）
    this.achievementData.endingRecords.unshift(record);

    // 限制记录数量（保留最近100条）
    if (this.achievementData.endingRecords.length > 100) {
      this.achievementData.endingRecords = this.achievementData.endingRecords.slice(0, 100);
    }

    // 更新统计
    this.achievementData.totalPlayCount++;
    this.achievementData.totalPlayTime += playTime;
    this.achievementData.lastPlayDate = Date.now();
  }

  /**
   * 获取结局达成度
   */
  getEndingProgress(): {
    unlockedCount: number;
    totalCount: number;
    percentage: number;
    unlockedEndings: EndingType[];
    lockedEndings: EndingType[];
  } {
    const allEndings = Object.values(EndingType);
    const totalCount = allEndings.length;
    const unlockedCount = this.achievementData.unlockedEndings.size;
    const percentage = Math.round((unlockedCount / totalCount) * 100);

    const unlockedEndings = Array.from(this.achievementData.unlockedEndings);
    const lockedEndings = allEndings.filter(e => !this.achievementData.unlockedEndings.has(e));

    return {
      unlockedCount,
      totalCount,
      percentage,
      unlockedEndings,
      lockedEndings
    };
  }

  /**
   * 获取结局记录
   */
  getEndingRecords(limit?: number): EndingRecord[] {
    if (limit) {
      return this.achievementData.endingRecords.slice(0, limit);
    }
    return this.achievementData.endingRecords;
  }

  /**
   * 检查结局是否已解锁
   */
  isEndingUnlocked(endingType: EndingType): boolean {
    return this.achievementData.unlockedEndings.has(endingType);
  }

  /**
   * 获取统计数据
   */
  getStatistics(): {
    totalPlayCount: number;
    totalPlayTime: number;
    averagePlayTime: number;
    unlockedEndingsCount: number;
    totalEndingsCount: number;
    firstPlayDate: number;
    lastPlayDate: number;
    favoriteEnding?: { type: EndingType; count: number };
  } {
    const progress = this.getEndingProgress();
    const averagePlayTime = this.achievementData.totalPlayCount > 0
      ? Math.round(this.achievementData.totalPlayTime / this.achievementData.totalPlayCount)
      : 0;

    // 统计最常达成的结局
    const endingCounts = new Map<EndingType, number>();
    for (const record of this.achievementData.endingRecords) {
      const count = endingCounts.get(record.endingType) || 0;
      endingCounts.set(record.endingType, count + 1);
    }

    let favoriteEnding: { type: EndingType; count: number } | undefined;
    let maxCount = 0;
    for (const [type, count] of endingCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        favoriteEnding = { type, count };
      }
    }

    return {
      totalPlayCount: this.achievementData.totalPlayCount,
      totalPlayTime: this.achievementData.totalPlayTime,
      averagePlayTime,
      unlockedEndingsCount: progress.unlockedCount,
      totalEndingsCount: progress.totalCount,
      firstPlayDate: this.achievementData.firstPlayDate,
      lastPlayDate: this.achievementData.lastPlayDate,
      favoriteEnding
    };
  }

  /**
   * 序列化为可存储的格式
   */
  serialize(): any {
    return {
      unlockedEndings: Array.from(this.achievementData.unlockedEndings),
      endingRecords: this.achievementData.endingRecords,
      unlockedAchievements: Array.from(this.achievementData.unlockedAchievements),
      achievementUnlockTimes: Array.from(this.achievementData.achievementUnlockTimes.entries()),
      totalPlayCount: this.achievementData.totalPlayCount,
      totalPlayTime: this.achievementData.totalPlayTime,
      firstPlayDate: this.achievementData.firstPlayDate,
      lastPlayDate: this.achievementData.lastPlayDate
    };
  }

  /**
   * 从存储格式反序列化
   */
  private deserialize(data: any): AchievementData {
    return {
      unlockedEndings: new Set<EndingType>(data.unlockedEndings || []),
      endingRecords: data.endingRecords || [],
      unlockedAchievements: new Set<string>(data.unlockedAchievements || []),
      achievementUnlockTimes: new Map<string, number>(data.achievementUnlockTimes || []),
      totalPlayCount: data.totalPlayCount || 0,
      totalPlayTime: data.totalPlayTime || 0,
      firstPlayDate: data.firstPlayDate || Date.now(),
      lastPlayDate: data.lastPlayDate || Date.now()
    };
  }

  /**
   * 重置所有成就数据（用于测试或重置）
   */
  reset(): void {
    this.achievementData = this.createEmptyData();
  }

  /**
   * 获取结局名称映射
   */
  static getEndingName(endingType: EndingType): string {
    const endingNames: Record<EndingType, string> = {
      [EndingType.Ascension]: '飞升成仙',
      [EndingType.DemonicAscension]: '魔道飞升',
      [EndingType.SittingInMeditation]: '寿元耗尽',
      [EndingType.BecomeDemonLord]: '成就魔尊',
      [EndingType.FoundSect]: '开宗立派',
      [EndingType.Hermit]: '归隐山林',
      [EndingType.DeathByTribulation]: '渡劫失败',
      [EndingType.DeathByEnemy]: '被仇敌击杀',
      [EndingType.DeathByKarma]: '因果反噬'
    };
    return endingNames[endingType] || '未知结局';
  }

  /**
   * 获取结局描述
   */
  static getEndingDescription(endingType: EndingType): string {
    const descriptions: Record<EndingType, string> = {
      [EndingType.Ascension]: '突破天道束缚，飞升仙界',
      [EndingType.DemonicAscension]: '以魔入道，飞升魔界',
      [EndingType.SittingInMeditation]: '寿元耗尽，坐化而终',
      [EndingType.BecomeDemonLord]: '成为一代魔尊，威震天下',
      [EndingType.FoundSect]: '创立宗门，传承后世',
      [EndingType.Hermit]: '归隐山林，过上清静生活',
      [EndingType.DeathByTribulation]: '渡劫失败，身死道消',
      [EndingType.DeathByEnemy]: '被仇敌击杀，含恨而终',
      [EndingType.DeathByKarma]: '因果反噬，魂飞魄散'
    };
    return descriptions[endingType] || '未知结局';
  }
}
