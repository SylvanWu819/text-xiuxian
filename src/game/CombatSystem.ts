/**
 * CombatSystem - 战斗系统
 * 负责计算战斗力、评估胜负概率、处理战斗结果
 */

import { PlayerState, CultivationLevel } from '../types';

/**
 * 战斗难度等级
 */
export enum CombatDifficulty {
  VeryEasy = 'very_easy',    // 碾压级别
  Easy = 'easy',              // 轻松
  Normal = 'normal',          // 势均力敌
  Hard = 'hard',              // 困难
  VeryHard = 'very_hard',     // 极度危险
  Impossible = 'impossible'   // 必死无疑
}

/**
 * 战斗结果
 */
export interface CombatResult {
  victory: boolean;           // 是否胜利
  difficulty: CombatDifficulty;
  playerPower: number;        // 玩家战力
  enemyPower: number;         // 敌人战力
  powerRatio: number;         // 战力比值
  winProbability: number;     // 胜率
  effects: {
    cultivationChange: number;
    lifespanChange: number;
    resourceChanges?: { spiritStones: number };
  };
}

/**
 * 敌人配置
 */
export interface EnemyConfig {
  name: string;
  basePower: number;          // 基础战力
  cultivationLevel?: CultivationLevel;  // 修为等级
  powerMultiplier?: number;   // 战力倍数
}

export class CombatSystem {
  private playerState: PlayerState;

  constructor(playerState: PlayerState) {
    this.playerState = playerState;
  }

  /**
   * 计算玩家战斗力
   */
  calculatePlayerPower(): number {
    let power = 0;

    // 1. 基础修为战力
    power += this.getCultivationPower(this.playerState.cultivation.level);
    
    // 2. 修为进度加成 (0-20%)
    const progressBonus = (this.playerState.cultivation.experience / this.playerState.cultivation.maxExperience) * 0.2;
    power *= (1 + progressBonus);

    // 3. 寿命状态影响 (-30% 到 +10%)
    const lifespanRatio = this.playerState.lifespan.current / this.playerState.lifespan.max;
    if (lifespanRatio < 0.2) {
      power *= 0.7;  // 寿命不足20%，战力-30%
    } else if (lifespanRatio < 0.5) {
      power *= 0.85; // 寿命不足50%，战力-15%
    } else if (lifespanRatio > 0.9) {
      power *= 1.1;  // 寿命充沛，战力+10%
    }

    // 4. 因果业力影响 (-20% 到 +20%)
    const karmaBalance = this.playerState.karma.goodDeeds - this.playerState.karma.karmicDebt;
    const karmaModifier = Math.max(-0.2, Math.min(0.2, karmaBalance / 200));
    power *= (1 + karmaModifier);

    // 5. 特殊标记加成（改为加法，避免指数增长）
    const flags = this.playerState.storyProgress.storyFlags;
    let bonusMultiplier = 0;
    
    // 法器加成
    if (flags.has('obtained_artifact')) bonusMultiplier += 0.15;
    if (flags.has('superior_treasure')) bonusMultiplier += 0.25;
    if (flags.has('broken_immortal_artifact')) bonusMultiplier += 0.30;
    
    // 体质加成
    if (flags.has('thunder_body')) bonusMultiplier += 0.20;
    if (flags.has('five_elements_body')) bonusMultiplier += 0.25;
    if (flags.has('phoenix_reborn')) bonusMultiplier += 0.30;
    
    // 传承加成
    if (flags.has('sword_intent_awakened')) bonusMultiplier += 0.20;
    if (flags.has('immortal_heir')) bonusMultiplier += 0.40;
    if (flags.has('ancient_legacy_unlocked')) bonusMultiplier += 0.30;
    
    // 灵兽加成
    if (flags.has('has_spirit_beast')) bonusMultiplier += 0.15;
    if (flags.has('divine_beast_blessed')) bonusMultiplier += 0.25;

    // 负面状态
    if (flags.has('dao_heart_cracked')) bonusMultiplier -= 0.20;
    if (flags.has('cursed_artifact_user')) bonusMultiplier -= 0.10;

    // 限制总加成在 -50% 到 +200% 之间
    bonusMultiplier = Math.max(-0.5, Math.min(2.0, bonusMultiplier));
    power *= (1 + bonusMultiplier);

    return Math.floor(power);
  }

  /**
   * 获取修为等级对应的基础战力
   */
  private getCultivationPower(level: CultivationLevel): number {
    const powerMap: Record<CultivationLevel, number> = {
      [CultivationLevel.QiRefining]: 100,
      [CultivationLevel.FoundationEstablishment]: 300,
      [CultivationLevel.GoldenCore]: 800,
      [CultivationLevel.NascentSoul]: 2000,
      [CultivationLevel.SoulFormation]: 5000,
      [CultivationLevel.Void]: 10000,
      [CultivationLevel.Integration]: 20000,
      [CultivationLevel.Mahayana]: 50000,
      [CultivationLevel.Tribulation]: 100000,
      [CultivationLevel.Ascension]: 500000
    };
    return powerMap[level] || 100;
  }

  /**
   * 计算敌人战斗力
   */
  calculateEnemyPower(enemy: EnemyConfig): number {
    let power = enemy.basePower;

    // 如果指定了修为等级，使用修为等级计算
    if (enemy.cultivationLevel) {
      power = this.getCultivationPower(enemy.cultivationLevel);
    }

    // 应用战力倍数
    if (enemy.powerMultiplier) {
      power *= enemy.powerMultiplier;
    }

    return Math.floor(power);
  }

  /**
   * 评估战斗难度
   */
  evaluateDifficulty(playerPower: number, enemyPower: number): CombatDifficulty {
    const ratio = playerPower / enemyPower;

    if (ratio >= 2.0) return CombatDifficulty.VeryEasy;
    if (ratio >= 1.3) return CombatDifficulty.Easy;
    if (ratio >= 0.8) return CombatDifficulty.Normal;
    if (ratio >= 0.5) return CombatDifficulty.Hard;
    if (ratio >= 0.3) return CombatDifficulty.VeryHard;
    return CombatDifficulty.Impossible;
  }

  /**
   * 计算胜率
   */
  calculateWinProbability(playerPower: number, enemyPower: number): number {
    const ratio = playerPower / enemyPower;
    
    // 使用逻辑函数计算胜率，确保在0-1之间
    // 当战力相等时胜率50%，战力差距越大胜率变化越明显
    const winRate = 1 / (1 + Math.exp(-3 * (ratio - 1)));
    
    // 最低5%胜率，最高95%胜率（保留一定随机性）
    return Math.max(0.05, Math.min(0.95, winRate));
  }

  /**
   * 执行战斗
   */
  executeCombat(enemy: EnemyConfig): CombatResult {
    const playerPower = this.calculatePlayerPower();
    const enemyPower = this.calculateEnemyPower(enemy);
    const difficulty = this.evaluateDifficulty(playerPower, enemyPower);
    const winProbability = this.calculateWinProbability(playerPower, enemyPower);
    
    // 判断胜负
    const victory = Math.random() < winProbability;
    
    // 计算战斗效果
    const effects = this.calculateCombatEffects(victory, difficulty, playerPower, enemyPower);

    return {
      victory,
      difficulty,
      playerPower,
      enemyPower,
      powerRatio: playerPower / enemyPower,
      winProbability,
      effects
    };
  }

  /**
   * 计算战斗效果
   */
  private calculateCombatEffects(
    victory: boolean,
    difficulty: CombatDifficulty,
    playerPower: number,
    enemyPower: number
  ): {
    cultivationChange: number;
    lifespanChange: number;
    resourceChanges?: { spiritStones: number };
  } {
    const powerRatio = playerPower / enemyPower;

    if (victory) {
      // 胜利奖励
      let cultivationGain = 0;
      let spiritStones = 0;
      let lifespanChange = 0;

      switch (difficulty) {
        case CombatDifficulty.VeryEasy:
          cultivationGain = 20;  // 碾压敌人，收获很少
          spiritStones = 30;
          lifespanChange = 0;    // 轻松胜利，不消耗寿命
          break;
        case CombatDifficulty.Easy:
          cultivationGain = 50;
          spiritStones = 80;
          lifespanChange = 0;    // 轻松胜利，不消耗寿命
          break;
        case CombatDifficulty.Normal:
          cultivationGain = 100; // 势均力敌，收获正常
          spiritStones = 150;
          lifespanChange = -1;   // 轻微消耗
          break;
        case CombatDifficulty.Hard:
          cultivationGain = 150; // 艰难战斗，收获丰厚
          spiritStones = 220;
          lifespanChange = -2;   // 中等消耗
          break;
        case CombatDifficulty.VeryHard:
          cultivationGain = 220; // 险胜强敌，收获巨大
          spiritStones = 300;
          lifespanChange = -3;   // 较大消耗
          break;
        case CombatDifficulty.Impossible:
          cultivationGain = 300; // 奇迹般的胜利
          spiritStones = 500;
          lifespanChange = -5;   // 巨大消耗
          break;
      }

      return {
        cultivationChange: cultivationGain,
        lifespanChange,
        resourceChanges: { spiritStones }
      };
    } else {
      // 失败惩罚
      let cultivationLoss = 0;
      let lifespanLoss = 0;
      let spiritStonesLoss = 0;

      switch (difficulty) {
        case CombatDifficulty.VeryEasy:
          // 不应该输给弱者，但如果输了...
          cultivationLoss = -30;
          lifespanLoss = -3;
          spiritStonesLoss = -50;
          break;
        case CombatDifficulty.Easy:
          cultivationLoss = -20;
          lifespanLoss = -4;
          spiritStonesLoss = -40;
          break;
        case CombatDifficulty.Normal:
          cultivationLoss = -10;
          lifespanLoss = -5;
          spiritStonesLoss = -30;
          break;
        case CombatDifficulty.Hard:
          cultivationLoss = -5;  // 输给强者，损失较小
          lifespanLoss = -8;
          spiritStonesLoss = -20;
          break;
        case CombatDifficulty.VeryHard:
          cultivationLoss = 0;   // 能活下来就不错了
          lifespanLoss = -12;
          spiritStonesLoss = -10;
          break;
        case CombatDifficulty.Impossible:
          cultivationLoss = 0;
          lifespanLoss = -20;    // 重伤垂死
          spiritStonesLoss = 0;
          break;
      }

      return {
        cultivationChange: cultivationLoss,
        lifespanChange: lifespanLoss,
        resourceChanges: { spiritStones: spiritStonesLoss }
      };
    }
  }

  /**
   * 获取战斗难度描述
   */
  getDifficultyDescription(difficulty: CombatDifficulty): string {
    const descriptions: Record<CombatDifficulty, string> = {
      [CombatDifficulty.VeryEasy]: '轻而易举',
      [CombatDifficulty.Easy]: '胜券在握',
      [CombatDifficulty.Normal]: '势均力敌',
      [CombatDifficulty.Hard]: '凶险万分',
      [CombatDifficulty.VeryHard]: '九死一生',
      [CombatDifficulty.Impossible]: '必死无疑'
    };
    return descriptions[difficulty];
  }

  /**
   * 获取战斗力评估文本
   */
  getPowerAssessment(playerPower: number, enemyPower: number): string {
    const ratio = playerPower / enemyPower;
    
    if (ratio >= 2.0) return '你的实力远超对手';
    if (ratio >= 1.5) return '你明显占据优势';
    if (ratio >= 1.2) return '你略占上风';
    if (ratio >= 0.9) return '双方实力相当';
    if (ratio >= 0.7) return '对手略强于你';
    if (ratio >= 0.5) return '对手明显强于你';
    if (ratio >= 0.3) return '对手远强于你';
    return '对手的实力深不可测';
  }
}
