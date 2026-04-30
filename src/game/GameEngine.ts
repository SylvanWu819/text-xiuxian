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
  initializeGame(playerName: string, cultivationPath: CultivationPath): void {
    this.gameState = GameState.Initializing;

    // 初始化玩家状态
    this.playerState = this.createInitialPlayerState(playerName, cultivationPath);

    // 初始化所有子系统
    this.initializeSubsystems();

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
  private initializeSubsystems(): void {
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

    // 初始化寿命
    this.lifespanSystem.initializeLifespan(this.playerState.cultivation.level);
  }

  /**
   * 游戏主循环 - 单回合执行
   * Validates: Requirements 19.2, 1.5, 20.1, 20.2
   */
  executeTurn(optionId: string): {
    success: boolean;
    message?: string;
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
        
        // 应用事件选项效果
        this.applyOptionEffects(eventOption);
        
        // 清除当前事件
        this.currentEvent = null;
        
        // 增加回合计数
        this.turnCount++;
        
        return {
          success: true,
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

    // 应用选项效果
    this.applyOptionEffects(option);

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
        breakthroughOccurred,
        endingReached: true,
        endingInfo
      };
    }

    return {
      success: true,
      breakthroughOccurred,
      endingReached: false
    };
  }

  /**
   * 应用选项效果
   */
  private applyOptionEffects(option: GameOption): void {
    const effects = option.effects;

    // 应用修为变化
    if (effects.cultivationChange) {
      this.playerState.cultivation.experience += effects.cultivationChange;
      this.stateTracker.recordEvent(`修为增加 ${effects.cultivationChange}`, false);
    }

    // 应用寿命变化
    if (effects.lifespanChange) {
      if (effects.lifespanChange > 0) {
        this.lifespanSystem.increaseLifespan(effects.lifespanChange);
      } else {
        this.lifespanSystem.decreaseLifespan(Math.abs(effects.lifespanChange));
      }
      this.stateTracker.recordEvent(`寿命变化 ${effects.lifespanChange > 0 ? '+' : ''}${effects.lifespanChange}年`, false);
    }

    // 应用资源变化
    if (effects.resourceChanges) {
      this.optionSystem.applyEffects(effects);
    }

    // 应用关系变化
    if (effects.relationshipChanges) {
      for (const [npcId, change] of effects.relationshipChanges.entries()) {
        this.relationshipSystem.changeRelationship(npcId, change);
      }
    }

    // 应用声望变化
    if (effects.reputationChange) {
      if (effects.reputationChange.righteous) {
        this.reputationSystem.increaseRighteousReputation(effects.reputationChange.righteous);
      }
      if (effects.reputationChange.demonic) {
        this.reputationSystem.increaseDemonicReputation(effects.reputationChange.demonic);
      }
    }

    // 应用因果变化
    if (effects.karmaChange) {
      if (effects.karmaChange.goodDeeds) {
        this.karmaSystem.addGoodDeeds(effects.karmaChange.goodDeeds);
      }
      if (effects.karmaChange.karmicDebt) {
        this.karmaSystem.addKarmicDebt(effects.karmaChange.karmicDebt);
      }
    }

    // 应用剧情标记和事件解锁
    this.optionSystem.applyEffects(effects);
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
  tryTriggerRandomEvent() {
    if (this.gameState !== GameState.Running) {
      return null;
    }

    const event = this.eventGenerator.tryTriggerEvent(
      this.playerState,
      this.config.eventTriggerProbability
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
  loadGameState(savedState: PlayerState): void {
    this.playerState = savedState;
    this.initializeSubsystems();
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
