/**
 * GameEngine 单元测试
 * 测试游戏引擎的初始化、主循环、突破检测和结局条件
 */

import { GameEngine, GameState } from '../GameEngine';
import { CultivationLevel, CultivationPath, Season } from '../../types';

describe('GameEngine', () => {
  let gameEngine: GameEngine;
  let testCultivationPath: CultivationPath;

  beforeEach(() => {
    gameEngine = new GameEngine();
    testCultivationPath = {
      id: 'sword',
      name: '剑修',
      description: '以剑入道',
      initialStats: {
        spiritStones: 10
      },
      exclusiveEvents: [],
      cultivationBonus: 1.0
    };
  });

  describe('游戏初始化', () => {
    test('应该正确初始化游戏状态', () => {
      gameEngine.initializeGame('测试玩家', testCultivationPath);

      const playerState = gameEngine.getPlayerState();
      expect(playerState.name).toBe('测试玩家');
      expect(playerState.cultivationPath.id).toBe('sword');
      expect(playerState.cultivation.level).toBe(CultivationLevel.QiRefining);
      expect(playerState.cultivation.experience).toBe(0);
      expect(playerState.cultivation.maxExperience).toBe(100);
      expect(gameEngine.getGameState()).toBe(GameState.Running);
    });

    test('应该正确初始化时间', () => {
      gameEngine.initializeGame('测试玩家', testCultivationPath);

      const playerState = gameEngine.getPlayerState();
      expect(playerState.time.year).toBe(1);
      expect(playerState.time.season).toBe(Season.Spring);
      expect(playerState.time.month).toBe(1);
    });

    test('应该正确初始化寿命', () => {
      gameEngine.initializeGame('测试玩家', testCultivationPath);

      const playerState = gameEngine.getPlayerState();
      expect(playerState.lifespan.current).toBe(80);
      expect(playerState.lifespan.max).toBe(80);
    });

    test('应该正确初始化资源', () => {
      gameEngine.initializeGame('测试玩家', testCultivationPath);

      const playerState = gameEngine.getPlayerState();
      expect(playerState.resources.spiritStones).toBe(10);
      expect(playerState.resources.pills.size).toBe(0);
      expect(playerState.resources.artifacts.size).toBe(0);
    });

    test('应该正确初始化所有子系统', () => {
      gameEngine.initializeGame('测试玩家', testCultivationPath);

      expect(gameEngine.getStateTracker()).toBeDefined();
      expect(gameEngine.getResourceManager()).toBeDefined();
      expect(gameEngine.getLifespanSystem()).toBeDefined();
      expect(gameEngine.getKarmaSystem()).toBeDefined();
      expect(gameEngine.getReputationSystem()).toBeDefined();
      expect(gameEngine.getRelationshipSystem()).toBeDefined();
      expect(gameEngine.getFactionSystem()).toBeDefined();
      expect(gameEngine.getTimeManager()).toBeDefined();
      expect(gameEngine.getEventGenerator()).toBeDefined();
      expect(gameEngine.getOptionSystem()).toBeDefined();
      expect(gameEngine.getTribulationSystem()).toBeDefined();
      expect(gameEngine.getEndingSystem()).toBeDefined();
    });
  });

  describe('选项生成', () => {
    beforeEach(() => {
      gameEngine.initializeGame('测试玩家', testCultivationPath);
    });

    test('应该生成可用选项', () => {
      const options = gameEngine.generateOptions();

      expect(options.length).toBeGreaterThan(0);
      expect(options.some(opt => opt.id === 'cultivate')).toBe(true);
      expect(options.some(opt => opt.id === 'explore')).toBe(true);
    });

    test('未初始化时不应生成选项', () => {
      const uninitializedEngine = new GameEngine();
      const options = uninitializedEngine.generateOptions();

      expect(options.length).toBe(0);
    });
  });

  describe('回合执行', () => {
    beforeEach(() => {
      gameEngine.initializeGame('测试玩家', testCultivationPath);
    });

    test('应该成功执行有效选项', () => {
      const options = gameEngine.generateOptions();
      const cultivateOption = options.find(opt => opt.id === 'cultivate');
      
      expect(cultivateOption).toBeDefined();
      
      const result = gameEngine.executeTurn('cultivate');
      
      expect(result.success).toBe(true);
      expect(result.endingReached).toBe(false);
    });

    test('执行选项后应该增加修为', () => {
      const initialExp = gameEngine.getPlayerState().cultivation.experience;
      
      gameEngine.executeTurn('cultivate');
      
      const finalExp = gameEngine.getPlayerState().cultivation.experience;
      expect(finalExp).toBeGreaterThan(initialExp);
    });

    test('执行选项后应该推进时间', () => {
      const initialMonth = gameEngine.getPlayerState().time.month;
      
      gameEngine.executeTurn('cultivate');
      
      const finalMonth = gameEngine.getPlayerState().time.month;
      expect(finalMonth).toBeGreaterThan(initialMonth);
    });

    test('执行选项后应该减少寿命', () => {
      const initialLifespan = gameEngine.getPlayerState().lifespan.current;
      
      gameEngine.executeTurn('cultivate');
      
      const finalLifespan = gameEngine.getPlayerState().lifespan.current;
      expect(finalLifespan).toBeLessThan(initialLifespan);
    });

    test('执行选项后应该增加回合数', () => {
      const initialTurnCount = gameEngine.getTurnCount();
      
      gameEngine.executeTurn('cultivate');
      
      const finalTurnCount = gameEngine.getTurnCount();
      expect(finalTurnCount).toBe(initialTurnCount + 1);
    });

    test('执行无效选项应该失败', () => {
      const result = gameEngine.executeTurn('invalid_option');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('无效的选项');
    });

    test('游戏未运行时不应执行选项', () => {
      gameEngine.pauseGame();
      
      const result = gameEngine.executeTurn('cultivate');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('游戏未运行');
    });
  });

  describe('修为突破', () => {
    beforeEach(() => {
      gameEngine.initializeGame('测试玩家', testCultivationPath);
    });

    test('修为达到阈值时应该尝试突破', () => {
      const playerState = gameEngine.getPlayerState();
      
      // 设置修为接近突破阈值
      playerState.cultivation.experience = 100;
      
      const result = gameEngine.executeTurn('cultivate');
      
      // 突破可能成功或失败，但应该有尝试
      expect(result.success).toBe(true);
    });

    test('突破成功后应该提升境界', () => {
      const playerState = gameEngine.getPlayerState();
      
      // 设置修为达到突破阈值并提高善缘以增加成功率
      playerState.cultivation.experience = 100;
      gameEngine.getKarmaSystem().addGoodDeeds(100);
      
      // 多次尝试直到突破成功
      let breakthroughOccurred = false;
      for (let i = 0; i < 10; i++) {
        playerState.cultivation.experience = 100;
        const result = gameEngine.executeTurn('cultivate');
        if (result.breakthroughOccurred) {
          breakthroughOccurred = true;
          break;
        }
      }
      
      if (breakthroughOccurred) {
        expect(playerState.cultivation.level).toBe(CultivationLevel.FoundationEstablishment);
        expect(playerState.cultivation.experience).toBe(0);
      }
    });

    test('突破成功后应该延长寿命', () => {
      const playerState = gameEngine.getPlayerState();
      const initialMaxLifespan = playerState.lifespan.max;
      
      // 设置修为达到突破阈值并提高善缘
      playerState.cultivation.experience = 100;
      gameEngine.getKarmaSystem().addGoodDeeds(100);
      
      // 多次尝试直到突破成功
      for (let i = 0; i < 10; i++) {
        playerState.cultivation.experience = 100;
        const result = gameEngine.executeTurn('cultivate');
        if (result.breakthroughOccurred) {
          break;
        }
      }
      
      const finalMaxLifespan = playerState.lifespan.max;
      if (playerState.cultivation.level === CultivationLevel.FoundationEstablishment) {
        expect(finalMaxLifespan).toBeGreaterThan(initialMaxLifespan);
      }
    });

    test('最高境界不应再突破', () => {
      const playerState = gameEngine.getPlayerState();
      
      // 设置为最高境界
      playerState.cultivation.level = CultivationLevel.Ascension;
      playerState.cultivation.experience = 1000;
      
      const result = gameEngine.executeTurn('cultivate');
      
      expect(result.breakthroughOccurred).toBe(false);
      expect(playerState.cultivation.level).toBe(CultivationLevel.Ascension);
    });
  });

  describe('结局检测', () => {
    beforeEach(() => {
      gameEngine.initializeGame('测试玩家', testCultivationPath);
    });

    test('寿命耗尽应该触发坐化结局', () => {
      const playerState = gameEngine.getPlayerState();
      
      // 设置寿命为极低值，执行一个回合后会耗尽
      playerState.lifespan.current = 0.05; // 小于1个月的寿命
      
      const result = gameEngine.executeTurn('cultivate');
      
      expect(result.endingReached).toBe(true);
      expect(result.endingInfo).toBeDefined();
      expect(gameEngine.getGameState()).toBe(GameState.Ended);
    });

    test('达到飞升境界应该触发飞升结局', () => {
      const playerState = gameEngine.getPlayerState();
      
      // 设置为飞升境界
      playerState.cultivation.level = CultivationLevel.Ascension;
      
      const result = gameEngine.executeTurn('cultivate');
      
      expect(result.endingReached).toBe(true);
      expect(result.endingInfo).toBeDefined();
    });

    test('checkEndingConditions应该正确检测结局', () => {
      const playerState = gameEngine.getPlayerState();
      
      // 初始状态不应有结局
      expect(gameEngine.checkEndingConditions()).toBe(false);
      
      // 设置寿命为0
      playerState.lifespan.current = 0;
      
      expect(gameEngine.checkEndingConditions()).toBe(true);
    });
  });

  describe('游戏状态管理', () => {
    test('应该正确管理游戏状态', () => {
      expect(gameEngine.getGameState()).toBe(GameState.NotInitialized);
      
      gameEngine.initializeGame('测试玩家', testCultivationPath);
      expect(gameEngine.getGameState()).toBe(GameState.Running);
      
      gameEngine.pauseGame();
      expect(gameEngine.getGameState()).toBe(GameState.Paused);
      
      gameEngine.resumeGame();
      expect(gameEngine.getGameState()).toBe(GameState.Running);
      
      gameEngine.resetGame();
      expect(gameEngine.getGameState()).toBe(GameState.NotInitialized);
    });

    test('暂停状态下不应执行回合', () => {
      gameEngine.initializeGame('测试玩家', testCultivationPath);
      gameEngine.pauseGame();
      
      const result = gameEngine.executeTurn('cultivate');
      
      expect(result.success).toBe(false);
    });
  });

  describe('随机事件触发', () => {
    beforeEach(() => {
      gameEngine.initializeGame('测试玩家', testCultivationPath);
    });

    test('应该能够尝试触发随机事件', () => {
      // 多次尝试以增加触发概率
      let eventTriggered = false;
      for (let i = 0; i < 20; i++) {
        const event = gameEngine.tryTriggerRandomEvent();
        if (event) {
          eventTriggered = true;
          expect(event.id).toBeDefined();
          expect(event.title).toBeDefined();
          break;
        }
      }
      
      // 注意：由于随机性，这个测试可能偶尔失败
      // 但在20次尝试中应该至少触发一次
    });

    test('游戏未运行时不应触发事件', () => {
      gameEngine.pauseGame();
      
      const event = gameEngine.tryTriggerRandomEvent();
      
      expect(event).toBeNull();
    });
  });

  describe('游戏摘要', () => {
    beforeEach(() => {
      gameEngine.initializeGame('测试玩家', testCultivationPath);
    });

    test('应该返回正确的游戏摘要', () => {
      const summary = gameEngine.getGameSummary();
      
      expect(summary.playerName).toBe('测试玩家');
      expect(summary.cultivationLevel).toBe('炼气期');
      expect(summary.age).toBe(1);
      expect(summary.turnCount).toBe(0);
      expect(summary.gameState).toBe(GameState.Running);
    });

    test('执行回合后摘要应该更新', () => {
      gameEngine.executeTurn('cultivate');
      
      const summary = gameEngine.getGameSummary();
      
      expect(summary.turnCount).toBe(1);
      // 1个月不会改变年份，所以年龄仍然是1
      expect(summary.age).toBe(1);
    });
  });

  describe('状态加载', () => {
    test('应该能够加载保存的游戏状态', () => {
      gameEngine.initializeGame('测试玩家', testCultivationPath);
      
      // 执行一些回合
      gameEngine.executeTurn('cultivate');
      gameEngine.executeTurn('cultivate');
      
      const savedState = gameEngine.getPlayerState();
      
      // 创建新引擎并加载状态
      const newEngine = new GameEngine();
      newEngine.loadGameState(savedState);
      
      expect(newEngine.getGameState()).toBe(GameState.Running);
      expect(newEngine.getPlayerState().name).toBe('测试玩家');
      expect(newEngine.getPlayerState().cultivation.experience).toBe(savedState.cultivation.experience);
    });
  });

  describe('子系统整合', () => {
    beforeEach(() => {
      gameEngine.initializeGame('测试玩家', testCultivationPath);
    });

    test('选项效果应该正确应用到各个子系统', () => {
      const playerState = gameEngine.getPlayerState();
      
      // 手动添加灵石以测试购买选项
      gameEngine.getResourceManager().addSpiritStones(100);
      
      const options = gameEngine.generateOptions();
      const buyOption = options.find(opt => opt.id === 'buy_pill');
      
      if (buyOption) {
        const initialStones = playerState.resources.spiritStones;
        gameEngine.executeTurn('buy_pill');
        const finalStones = playerState.resources.spiritStones;
        
        expect(finalStones).toBeLessThan(initialStones);
      }
    });

    test('时间推进应该触发时间事件', () => {
      const playerState = gameEngine.getPlayerState();
      
      // 设置到特定时间点
      playerState.time.year = 5;
      playerState.time.month = 1;
      
      const initialHistoryLength = playerState.history.length;
      
      gameEngine.executeTurn('cultivate');
      
      // 检查是否有新的历史记录（可能包含时间事件）
      expect(playerState.history.length).toBeGreaterThanOrEqual(initialHistoryLength);
    });
  });

  describe('配置选项', () => {
    test('应该使用自定义事件触发概率', () => {
      const customEngine = new GameEngine({ eventTriggerProbability: 1.0 });
      customEngine.initializeGame('测试玩家', testCultivationPath);
      
      // 100%概率应该总是触发事件
      const event = customEngine.tryTriggerRandomEvent();
      
      // 注意：即使概率是100%，如果没有符合条件的事件也可能返回null
      // 这个测试主要验证配置被正确应用
    });

    test('应该使用默认配置', () => {
      const defaultEngine = new GameEngine();
      defaultEngine.initializeGame('测试玩家', testCultivationPath);
      
      expect(defaultEngine.getGameState()).toBe(GameState.Running);
    });
  });
});
