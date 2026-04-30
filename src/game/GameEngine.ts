/**
 * GameEngine - 游戏引擎
 * 负责游戏初始化、主循环、状态更新和子系统整合
 * Validates: Requirements 19.1, 19.2, 19.3, 19.4, 19.5
 */

import { PlayerState, CultivationLevel, Season, CultivationPath, GameOption, EffectSet, TimeCost } from '../types';
import { TimeManager } from './TimeManager';
import { EventGenerator } from './EventGenerator';
import { OptionSystem } from './OptionSystem';
import { StateTracker } from './StateTracker';
import { ResourceManager } from './ResourceManager';
import { LifespanSystem } from './LifespanSystem';
import { KarmaSystem } from './KarmaSystem';
import { ReputationSystem } from './ReputationSystem';
import { RelationshipSystem } from './RelationshipSystem';
import { FactionSystem } from './FactionSystem';
import { TribulationSystem } from './TribulationSystem';
import { EndingSystem, EndingInfo } from './EndingSystem';
import { CombatSystem } from './CombatSystem';

/**
 * 游戏状态
 */
export enum GameState {
  NotInitialized = 'not_initialized',
  Initializing = 'initializing',
  Running = 'running',
  Paused = 'paused',
  Ended = 'ended'
}

/**
 * 游戏引擎配置
 */
export interface GameEngineConfig {
  eventTriggerProbability?: number;  // 事件触发概率 (默认 0.3)
  autoSaveInterval?: number;         // 自动存档间隔（回合数，0表示禁用）
}

export class GameEngine {
  // 游戏状态
  private gameState: GameState = GameState.NotInitialized;
  private playerState!: PlayerState;
  
  // 子系统
  private timeManager!: TimeManager;
  private eventGenerator!: EventGenerator;
  private optionSystem!: OptionSystem;
  private stateTracker!: StateTracker;
  private resourceManager!: ResourceManager;
  private lifespanSystem!: LifespanSystem;
  private karmaSystem!: KarmaSystem;
  private reputationSystem!: ReputationSystem;
  private relationshipSystem!: RelationshipSystem;
  private factionSystem!: FactionSystem;
  private tribulationSystem!: TribulationSystem;
  private endingSystem!: EndingSystem;
  private combatSystem!: CombatSystem;
  
  // 配置
  private config: GameEngineConfig;
  
  // 回合计数
  private turnCount: number = 0;
  
  // 当前触发的事件（用于处理事件选项）
  private currentEvent: any = null;

  constructor(config: GameEngineConfig = {}) {
    this.config = {
      eventTriggerProbability: config.eventTriggerProbability || 0.3,
      autoSaveInterval: config.autoSaveInterval || 0
    };
  }

  /**
   * 初始化游戏
   * Validates: Requirements 19.1
   */
  async initializeGame(playerName: string, cultivationPath: CultivationPath): Promise<void> {
    this.gameState = GameState.Initializing;

    // 初始化玩家状态
    this.playerState = this.createInitialPlayerState(playerName, cultivationPath);

    // 初始化所有子系统（包括加载事件数据）
    await this.initializeSubsystems();

    this.gameState = GameState.Running;
    this.turnCount = 0;
  }

  /**
   * 创建初始玩家状态
   */
  private createInitialPlayerState(playerName: string, cultivationPath: CultivationPath): PlayerState {
    return {
      name: playerName,
      cultivationPath,
      cultivation: {
        level: CultivationLevel.QiRefining,
        experience: 0,
        maxExperience: 100
      },
      time: {
        year: 1,
        season: Season.Spring,
        month: 1
      },
      lifespan: {
        current: 80,
        max: 80
      },
      resources: {
        spiritStones: cultivationPath.initialStats.spiritStones,
        pills: new Map(),
        artifacts: new Map()
      },
      relationships: new Map(),
      faction: {
        current: null,
        reputation: new Map()
      },
      karma: {
        goodDeeds: 0,
        karmicDebt: 0
      },
      reputation: {
        righteous: 0,
        demonic: 0
      },
      history: [],
      storyProgress: {
        completedQuests: new Set(),
        activeQuests: new Set(),
        unlockedEvents: new Set(),
        storyFlags: new Map()
      }
    };
  }

  /**
   * 初始化所有子系统
   */
  private async initializeSubsystems(): Promise<void> {
    this.stateTracker = new StateTracker(this.playerState);
    this.resourceManager = new ResourceManager(this.playerState);
    this.lifespanSystem = new LifespanSystem(this.playerState);
    this.karmaSystem = new KarmaSystem(this.playerState);
    this.reputationSystem = new ReputationSystem(this.playerState);
    this.relationshipSystem = new RelationshipSystem(this.playerState);
    this.factionSystem = new FactionSystem(this.playerState);
    this.timeManager = new TimeManager(this.playerState);
    this.eventGenerator = new EventGenerator();
    this.optionSystem = new OptionSystem(this.playerState, this.resourceManager);
    this.tribulationSystem = new TribulationSystem(this.playerState);
    this.endingSystem = new EndingSystem(this.playerState);
    this.combatSystem = new CombatSystem(this.playerState);

    // 初始化寿命
    this.lifespanSystem.initializeLifespan(this.playerState.cultivation.level);
    
    // 加载事件数据
    await this.loadGameData();
  }

  private async loadGameData(): Promise<void> {
    try {
      // 动态导入事件数据
      const eventsModule = await import('../../data/events.json');
      // 类型转换
      const eventsData = eventsModule.default || eventsModule;
      await this.eventGenerator.loadEventsFromData(eventsData as any);
      console.log('[GameEngine] 游戏数据加载完成');
    } catch (error) {
      console.error('[GameEngine] 加载游戏数据失败:', error);
      // 如果加载失败，使用空事件池（游戏仍可运行，只是没有随机事件）
      console.warn('[GameEngine] 将使用空事件池继续运行');
    }
  }

  /**
   * 游戏主循环 - 单回合执行
   * Validates: Requirements 19.2, 1.5, 20.1, 20.2
   */
  executeTurn(optionId: string): {
    success: boolean;
    message?: string;
    feedback?: {
      messages: string[];
      positiveEffects: string[];
      negativeEffects: string[];
    };
    eventTriggered?: boolean;
    breakthroughOccurred?: boolean;
    endingReached?: boolean;
    endingInfo?: EndingInfo;
  } {
    if (this.gameState !== GameState.Running) {
      return { success: false, message: '游戏未运行' };
    }

    // 验证选项ID不为空
    if (!optionId || optionId.trim().length === 0) {
      return { success: false, message: '请选择一个选项' };
    }

    console.log(`[GameEngine] executeTurn: 收到选项ID = "${optionId}"`);

    // 1. 首先检查是否是当前事件的选项
    if (this.currentEvent && this.currentEvent.options) {
      const eventOption = this.currentEvent.options.find((opt: any) => opt.id === optionId);
      if (eventOption) {
        console.log(`[GameEngine] 找到事件选项: ${eventOption.text}`);
        
        // 事件选项转换为GameOption格式（添加默认timeCost）
        const gameOption: GameOption = {
          ...eventOption,
          timeCost: eventOption.timeCost || { months: 0 }, // 事件选项默认不消耗时间
          outcomes: eventOption.outcomes
        };
        
        // 应用事件选项效果并获取反馈
        const feedback = this.applyOptionEffects(gameOption);
        
        // 清除当前事件
        this.currentEvent = null;
        
        // 增加回合计数
        this.turnCount++;
        
        return {
          success: true,
          feedback,
          breakthroughOccurred: false,
          endingReached: false
        };
      }
    }

    // 2. 执行玩家选择的日常选项
    let option = this.optionSystem.getCachedOption(optionId);
    
    // 如果选项未缓存，先生成选项
    if (!option) {
      console.log(`[GameEngine] 选项未缓存，重新生成选项`);
      const generatedOptions = this.generateOptions();
      console.log(`[GameEngine] 生成了 ${generatedOptions.length} 个选项:`, generatedOptions.map(o => o.id));
      option = this.optionSystem.getCachedOption(optionId);
    }
    
    if (!option) {
      console.error(`[GameEngine] 找不到选项: "${optionId}"`);
      return { success: false, message: '无效的选项，请输入有效的选项编号' };
    }

    console.log(`[GameEngine] 找到选项: ${option.text}`);

    // 检查选项要求并获取详细错误信息
    const requirementCheck = this.optionSystem.checkOptionRequirementsWithError(option);
    if (!requirementCheck.valid) {
      return { success: false, message: requirementCheck.error || '不满足选项要求' };
    }

    // 应用选项效果并获取反馈
    const feedback = this.applyOptionEffects(option);

    // 2. 推进时间
    this.timeManager.advance(option.timeCost);
    
    // 时间推进导致寿命减少
    const monthsElapsed = (option.timeCost.years || 0) * 12 + (option.timeCost.months || 0);
    this.lifespanSystem.consumeLifespanByTime(monthsElapsed);

    // 3. 检查修为突破
    const breakthroughOccurred = this.checkAndProcessBreakthrough();

    // 4. 增加回合计数
    this.turnCount++;

    // 5. 检查时间触发事件
    const timeEvents = this.timeManager.checkTimeEvents();
    if (timeEvents.length > 0) {
      // 记录时间事件
      for (const event of timeEvents) {
        this.stateTracker.recordEvent(event.description, false);
      }
    }

    // 6. 检查结局条件（在执行选项后）
    const endingCheck = this.endingSystem.checkEndingConditions();
    if (endingCheck.hasEnding && endingCheck.endingType) {
      const endingInfo = this.endingSystem.triggerEnding(endingCheck.endingType);
      this.gameState = GameState.Ended;
      return {
        success: true,
        feedback,
        breakthroughOccurred,
        endingReached: true,
        endingInfo
      };
    }

    return {
      success: true,
      feedback,
      breakthroughOccurred,
      endingReached: false
    };
  }

  /**
   * 应用选项效果
   */
  private applyOptionEffects(option: GameOption): {
    messages: string[];
    positiveEffects: string[];
    negativeEffects: string[];
  } {
    const effects = option.effects;
    const messages: string[] = [];
    const positiveEffects: string[] = [];
    const negativeEffects: string[] = [];

    // 检查 effects 是否存在
    if (!effects) {
      console.warn('[GameEngine] applyOptionEffects: effects 为空');
      return { messages, positiveEffects, negativeEffects };
    }

    // 处理战斗选项
    if (option.combat) {
      const combatResult = this.combatSystem.executeCombat({
        name: option.combat.enemyName,
        basePower: option.combat.enemyPower || 100,
        cultivationLevel: option.combat.cultivationLevel,
        powerMultiplier: option.combat.powerMultiplier
      });

      // 添加战斗信息
      const difficultyDesc = this.combatSystem.getDifficultyDescription(combatResult.difficulty);
      const powerAssessment = this.combatSystem.getPowerAssessment(
        combatResult.playerPower,
        combatResult.enemyPower
      );
      
      messages.push(`【战力评估】${powerAssessment}`);
      messages.push(`【战斗难度】${difficultyDesc}（胜率：${Math.floor(combatResult.winProbability * 100)}%）`);
      messages.push(`你的战力：${combatResult.playerPower} | 敌人战力：${combatResult.enemyPower}`);
      messages.push('');

      if (combatResult.victory) {
        messages.push(`⚔️ 你战胜了${option.combat.enemyName}！`);
        
        // 应用战斗基础效果
        const combatFeedback = this.applyEffectSet(
          combatResult.effects,
          [],
          positiveEffects,
          negativeEffects
        );
        messages.push(...combatFeedback.messages);
        
        // 应用胜利额外效果
        if (option.victoryEffects) {
          const victoryFeedback = this.applyEffectSet(
            option.victoryEffects,
            [],
            positiveEffects,
            negativeEffects
          );
          messages.push(...victoryFeedback.messages);
        }
      } else {
        messages.push(`💀 你被${option.combat.enemyName}击败了...`);
        
        // 应用战斗基础效果（失败惩罚）
        const combatFeedback = this.applyEffectSet(
          combatResult.effects,
          [],
          positiveEffects,
          negativeEffects
        );
        messages.push(...combatFeedback.messages);
        
        // 应用失败额外效果
        if (option.defeatEffects) {
          const defeatFeedback = this.applyEffectSet(
            option.defeatEffects,
            [],
            positiveEffects,
            negativeEffects
          );
          messages.push(...defeatFeedback.messages);
        }
      }

      return { messages, positiveEffects, negativeEffects };
    }

    // 处理随机结果（如果有outcomes）
    if (option.outcomes && option.outcomes.length > 0) {
      const random = Math.random();
      let cumulativeProbability = 0;
      
      for (const outcome of option.outcomes) {
        cumulativeProbability += outcome.probability;
        if (random <= cumulativeProbability) {
          // 应用这个结果的效果
          messages.push(outcome.description);
          return this.applyEffectSet(outcome.effects, messages, positiveEffects, negativeEffects);
        }
      }
    }

    // 应用基础效果
    return this.applyEffectSet(effects, messages, positiveEffects, negativeEffects);
  }

  /**
   * 应用效果集合
   */
  private applyEffectSet(
    effects: EffectSet,
    messages: string[],
    positiveEffects: string[],
    negativeEffects: string[]
  ): {
    messages: string[];
    positiveEffects: string[];
    negativeEffects: string[];
  } {
    // 应用修为变化
    if (effects.cultivationChange) {
      this.playerState.cultivation.experience += effects.cultivationChange;
      
      if (effects.cultivationChange > 0) {
        positiveEffects.push(`✨ 修为增加 ${effects.cultivationChange} 点`);
        messages.push(`你感到体内真气增长，修为提升了 ${effects.cultivationChange} 点。`);
      } else {
        negativeEffects.push(`⚠️ 修为减少 ${Math.abs(effects.cultivationChange)} 点`);
        messages.push(`你的修为受损，减少了 ${Math.abs(effects.cultivationChange)} 点。`);
      }
    }

    // 应用寿命变化
    if (effects.lifespanChange) {
      if (effects.lifespanChange > 0) {
        this.lifespanSystem.increaseLifespan(effects.lifespanChange);
        positiveEffects.push(`💚 寿命增加 ${effects.lifespanChange} 年`);
        messages.push(`你感到生机勃勃，寿命延长了 ${effects.lifespanChange} 年！`);
      } else {
        this.lifespanSystem.decreaseLifespan(Math.abs(effects.lifespanChange));
        negativeEffects.push(`💔 寿命减少 ${Math.abs(effects.lifespanChange)} 年`);
        messages.push(`你感到生机流失，寿命减少了 ${Math.abs(effects.lifespanChange)} 年。`);
      }
    }

    // 应用资源变化
    if (effects.resourceChanges) {
      if (effects.resourceChanges.spiritStones) {
        const change = effects.resourceChanges.spiritStones;
        if (change > 0) {
          positiveEffects.push(`💎 获得 ${change} 灵石`);
          messages.push(`你获得了 ${change} 块灵石。`);
        } else {
          negativeEffects.push(`💸 消耗 ${Math.abs(change)} 灵石`);
          messages.push(`你消耗了 ${Math.abs(change)} 块灵石。`);
        }
      }
    }

    // 应用关系变化
    if (effects.relationshipChanges) {
      // 处理 Map 或普通对象两种格式
      const relationshipMap = effects.relationshipChanges instanceof Map 
        ? effects.relationshipChanges 
        : new Map(Object.entries(effects.relationshipChanges));
      
      for (const [npcId, change] of relationshipMap.entries()) {
        this.relationshipSystem.changeRelationship(npcId, change);
        if (change > 0) {
          positiveEffects.push(`🤝 与 ${npcId} 的关系提升 ${change}`);
          messages.push(`你与 ${npcId} 的关系变得更好了。`);
        } else {
          negativeEffects.push(`💔 与 ${npcId} 的关系下降 ${Math.abs(change)}`);
          messages.push(`你与 ${npcId} 的关系恶化了。`);
        }
      }
    }

    // 应用声望变化
    if (effects.reputationChange) {
      if (effects.reputationChange.righteous) {
        const change = effects.reputationChange.righteous;
        this.reputationSystem.increaseRighteousReputation(change);
        if (change > 0) {
          positiveEffects.push(`⚖️ 正道声望 +${change}`);
          messages.push(`你的正道声望提升了。`);
        }
      }
      if (effects.reputationChange.demonic) {
        const change = effects.reputationChange.demonic;
        this.reputationSystem.increaseDemonicReputation(change);
        if (change > 0) {
          positiveEffects.push(`😈 魔道声望 +${change}`);
          messages.push(`你的魔道声望提升了。`);
        }
      }
    }

    // 应用因果变化
    if (effects.karmaChange) {
      if (effects.karmaChange.goodDeeds) {
        const change = effects.karmaChange.goodDeeds;
        if (change > 0) {
          this.karmaSystem.addGoodDeeds(change);
          positiveEffects.push(`🙏 善缘 +${change}`);
          messages.push(`你积累了善缘。`);
        } else if (change < 0) {
          this.karmaSystem.reduceGoodDeeds(Math.abs(change));
          negativeEffects.push(`⚠️ 善缘 ${change}`);
          messages.push(`你的善缘减少了。`);
        }
      }
      if (effects.karmaChange.karmicDebt) {
        const change = effects.karmaChange.karmicDebt;
        if (change > 0) {
          this.karmaSystem.addKarmicDebt(change);
          negativeEffects.push(`⚠️ 因果债 +${change}`);
          messages.push(`你增加了因果业力。`);
        } else if (change < 0) {
          this.karmaSystem.reduceKarmicDebt(Math.abs(change));
          positiveEffects.push(`✨ 因果债 ${change}`);
          messages.push(`你化解了部分因果业力。`);
        }
      }
    }

    // 应用剧情标记和事件解锁
    console.log(`[GameEngine] 调用 optionSystem.applyEffects，effects:`, JSON.stringify(effects, null, 2));
    this.optionSystem.applyEffects(effects);

    return { messages, positiveEffects, negativeEffects };
  }

  /**
   * 检查并处理修为突破
   * Validates: Requirements 19.3
   */
  private checkAndProcessBreakthrough(): boolean {
    // 检查是否达到突破阈值
    if (this.playerState.cultivation.experience < this.playerState.cultivation.maxExperience) {
      return false;
    }

    // 获取当前境界
    const currentLevel = this.playerState.cultivation.level;
    
    // 检查是否已经是最高境界
    const levels = Object.values(CultivationLevel);
    const currentIndex = levels.indexOf(currentLevel);
    if (currentIndex === levels.length - 1) {
      return false;
    }

    // 计算突破成功率
    const baseSuccessRate = 0.7;
    const karmaModifier = this.karmaSystem.getKarmaBalance() / 200; // -0.5 到 +0.5
    const successRate = Math.max(0.1, Math.min(0.95, baseSuccessRate + karmaModifier));

    // 判断突破是否成功
    if (Math.random() > successRate) {
      // 突破失败
      this.playerState.cultivation.experience = Math.floor(this.playerState.cultivation.maxExperience * 0.8);
      this.stateTracker.recordEvent('突破失败，修为受损', true);
      return false;
    }

    // 突破成功
    const nextLevel = levels[currentIndex + 1];
    this.playerState.cultivation.level = nextLevel;
    this.playerState.cultivation.experience = 0;
    
    // 更新突破所需修为
    this.playerState.cultivation.maxExperience = this.calculateMaxExperience(nextLevel);

    // 延长寿命
    this.lifespanSystem.breakthroughLifespanExtension(nextLevel);

    // 记录突破事件
    this.stateTracker.recordEvent(`成功突破至${this.getCultivationLevelName(nextLevel)}`, true);

    return true;
  }

  /**
   * 计算境界所需最大修为
   */
  private calculateMaxExperience(level: CultivationLevel): number {
    const baseExperience: Record<CultivationLevel, number> = {
      [CultivationLevel.QiRefining]: 100,
      [CultivationLevel.FoundationEstablishment]: 300,
      [CultivationLevel.GoldenCore]: 800,
      [CultivationLevel.NascentSoul]: 2000,
      [CultivationLevel.SoulFormation]: 5000,
      [CultivationLevel.Void]: 10000,
      [CultivationLevel.Integration]: 20000,
      [CultivationLevel.Mahayana]: 50000,
      [CultivationLevel.Tribulation]: 100000,
      [CultivationLevel.Ascension]: Infinity
    };

    return baseExperience[level] || 100;
  }

  /**
   * 获取境界名称
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
   * 生成当前可用选项
   * Validates: Requirements 19.2
   */
  generateOptions(): GameOption[] {
    if (this.gameState !== GameState.Running) {
      return [];
    }

    return this.optionSystem.generateOptions();
  }

  /**
   * 尝试触发随机事件
   * Validates: Requirements 19.2
   */
  tryTriggerRandomEvent(customProbability?: number) {
    if (this.gameState !== GameState.Running) {
      return null;
    }

    const probability = customProbability !== undefined ? customProbability : this.config.eventTriggerProbability;
    
    const event = this.eventGenerator.tryTriggerEvent(
      this.playerState,
      probability
    );
    
    // 保存当前事件，以便处理事件选项
    if (event) {
      this.currentEvent = event;
      console.log(`[GameEngine] 触发事件: ${event.title}, 选项数: ${event.options?.length || 0}`);
    }
    
    return event;
  }

  /**
   * 检查结局条件
   * Validates: Requirements 19.4
   */
  checkEndingConditions(): boolean {
    const endingCheck = this.endingSystem.checkEndingConditions();
    return endingCheck.hasEnding;
  }

  /**
   * 获取当前游戏状态
   */
  getGameState(): GameState {
    return this.gameState;
  }

  /**
   * 获取玩家状态
   */
  getPlayerState(): PlayerState {
    return this.playerState;
  }

  /**
   * 获取状态追踪器
   */
  getStateTracker(): StateTracker {
    return this.stateTracker;
  }

  /**
   * 获取资源管理器
   */
  getResourceManager(): ResourceManager {
    return this.resourceManager;
  }

  /**
   * 获取寿命系统
   */
  getLifespanSystem(): LifespanSystem {
    return this.lifespanSystem;
  }

  /**
   * 获取因果系统
   */
  getKarmaSystem(): KarmaSystem {
    return this.karmaSystem;
  }

  /**
   * 获取声望系统
   */
  getReputationSystem(): ReputationSystem {
    return this.reputationSystem;
  }

  /**
   * 获取关系系统
   */
  getRelationshipSystem(): RelationshipSystem {
    return this.relationshipSystem;
  }

  /**
   * 获取势力系统
   */
  getFactionSystem(): FactionSystem {
    return this.factionSystem;
  }

  /**
   * 获取时间管理器
   */
  getTimeManager(): TimeManager {
    return this.timeManager;
  }

  /**
   * 获取事件生成器
   */
  getEventGenerator(): EventGenerator {
    return this.eventGenerator;
  }

  /**
   * 获取选项系统
   */
  getOptionSystem(): OptionSystem {
    return this.optionSystem;
  }

  /**
   * 获取渡劫系统
   */
  getTribulationSystem(): TribulationSystem {
    return this.tribulationSystem;
  }

  /**
   * 获取结局系统
   */
  getEndingSystem(): EndingSystem {
    return this.endingSystem;
  }

  /**
   * 获取战斗系统
   */
  getCombatSystem(): CombatSystem {
    return this.combatSystem;
  }

  /**
   * 获取回合数
   */
  getTurnCount(): number {
    return this.turnCount;
  }

  /**
   * 暂停游戏
   */
  pauseGame(): void {
    if (this.gameState === GameState.Running) {
      this.gameState = GameState.Paused;
    }
  }

  /**
   * 恢复游戏
   */
  resumeGame(): void {
    if (this.gameState === GameState.Paused) {
      this.gameState = GameState.Running;
    }
  }

  /**
   * 重置游戏
   */
  resetGame(): void {
    this.gameState = GameState.NotInitialized;
    this.turnCount = 0;
  }

  /**
   * 加载游戏状态
   */
  async loadGameState(savedState: PlayerState): Promise<void> {
    this.playerState = savedState;
    await this.initializeSubsystems();
    this.gameState = GameState.Running;
  }

  /**
   * 获取游戏摘要信息
   */
  getGameSummary(): {
    playerName: string;
    cultivationLevel: string;
    age: number;
    turnCount: number;
    gameState: GameState;
  } {
    return {
      playerName: this.playerState.name,
      cultivationLevel: this.getCultivationLevelName(this.playerState.cultivation.level),
      age: this.playerState.time.year,
      turnCount: this.turnCount,
      gameState: this.gameState
    };
  }
}
