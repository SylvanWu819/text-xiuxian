/**
 * Opening Storyline Integration Tests
 * Task 17.2: 实现开局剧情和初始化 - Integration Testing
 * Validates: Requirements 18.6, 18.7, 2.4, 2.5
 */

import { GameEngine } from '../game/GameEngine';
import { CultivationPath, CultivationLevel, Season } from '../types';

describe('Opening Storyline Integration', () => {
  let gameEngine: GameEngine;

  beforeEach(() => {
    gameEngine = new GameEngine();
  });

  describe('Complete Initialization Flow', () => {
    test('should initialize game with sword path', () => {
      const playerName = '测试剑修';
      const cultivationPath: CultivationPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道，攻击力强',
        initialStats: {
          spiritStones: 10,
          specialAbility: '剑气'
        },
        exclusiveEvents: ['sword_master_encounter', 'sword_dao_enlightenment'],
        cultivationBonus: 1.0
      };

      // Initialize game
      gameEngine.initializeGame(playerName, cultivationPath);

      // Verify player state
      const playerState = gameEngine.getPlayerState();
      
      expect(playerState.name).toBe(playerName);
      expect(playerState.cultivationPath.id).toBe('sword');
      expect(playerState.cultivation.level).toBe(CultivationLevel.QiRefining);
      expect(playerState.cultivation.experience).toBe(0);
      expect(playerState.cultivation.maxExperience).toBe(100);
      expect(playerState.resources.spiritStones).toBe(10);
      expect(playerState.lifespan.current).toBe(80);
      expect(playerState.lifespan.max).toBe(80);
      expect(playerState.time.year).toBe(1);
      expect(playerState.time.season).toBe(Season.Spring);
      expect(playerState.time.month).toBe(1);
    });

    test('should initialize game with alchemy path (higher spirit stones)', () => {
      const playerName = '测试丹修';
      const cultivationPath: CultivationPath = {
        id: 'alchemy',
        name: '丹修',
        description: '精通炼丹，资源丰富',
        initialStats: {
          spiritStones: 20,
          specialAbility: '炼丹术'
        },
        exclusiveEvents: ['alchemy_master_encounter', 'rare_herb_discovery'],
        cultivationBonus: 0.8
      };

      gameEngine.initializeGame(playerName, cultivationPath);

      const playerState = gameEngine.getPlayerState();
      
      expect(playerState.name).toBe(playerName);
      expect(playerState.cultivationPath.id).toBe('alchemy');
      expect(playerState.resources.spiritStones).toBe(20); // Higher initial resources
      expect(playerState.cultivationPath.cultivationBonus).toBe(0.8);
    });

    test('should initialize game with formation path', () => {
      const playerName = '测试阵修';
      const cultivationPath: CultivationPath = {
        id: 'formation',
        name: '阵修',
        description: '精通阵法，控制力强',
        initialStats: {
          spiritStones: 15,
          specialAbility: '阵法'
        },
        exclusiveEvents: ['ancient_formation_discovery'],
        cultivationBonus: 0.85
      };

      gameEngine.initializeGame(playerName, cultivationPath);

      const playerState = gameEngine.getPlayerState();
      
      expect(playerState.name).toBe(playerName);
      expect(playerState.cultivationPath.id).toBe('formation');
      expect(playerState.resources.spiritStones).toBe(15);
    });

    test('should initialize game with body path', () => {
      const playerName = '测试体修';
      const cultivationPath: CultivationPath = {
        id: 'body',
        name: '体修',
        description: '炼体为主，防御力高',
        initialStats: {
          spiritStones: 10,
          specialAbility: '金刚体'
        },
        exclusiveEvents: ['body_tempering_trial'],
        cultivationBonus: 0.9
      };

      gameEngine.initializeGame(playerName, cultivationPath);

      const playerState = gameEngine.getPlayerState();
      
      expect(playerState.name).toBe(playerName);
      expect(playerState.cultivationPath.id).toBe('body');
      expect(playerState.resources.spiritStones).toBe(10);
    });
  });

  describe('Initial Game State', () => {
    test('should have correct initial cultivation state', () => {
      const cultivationPath: CultivationPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10, specialAbility: '剑气' },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      };

      gameEngine.initializeGame('测试玩家', cultivationPath);
      const playerState = gameEngine.getPlayerState();

      // Cultivation should start at Qi Refining level 0
      expect(playerState.cultivation.level).toBe(CultivationLevel.QiRefining);
      expect(playerState.cultivation.experience).toBe(0);
      expect(playerState.cultivation.maxExperience).toBe(100);
    });

    test('should have correct initial time state', () => {
      const cultivationPath: CultivationPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      };

      gameEngine.initializeGame('测试玩家', cultivationPath);
      const playerState = gameEngine.getPlayerState();

      // Time should start at year 1, spring, month 1
      expect(playerState.time.year).toBe(1);
      expect(playerState.time.season).toBe(Season.Spring);
      expect(playerState.time.month).toBe(1);
    });

    test('should have correct initial lifespan', () => {
      const cultivationPath: CultivationPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      };

      gameEngine.initializeGame('测试玩家', cultivationPath);
      const playerState = gameEngine.getPlayerState();

      // Lifespan should start at 80 years
      expect(playerState.lifespan.current).toBe(80);
      expect(playerState.lifespan.max).toBe(80);
    });

    test('should have correct initial reputation', () => {
      const cultivationPath: CultivationPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      };

      gameEngine.initializeGame('测试玩家', cultivationPath);
      const playerState = gameEngine.getPlayerState();

      // Reputation should start at 0
      expect(playerState.reputation.righteous).toBe(0);
      expect(playerState.reputation.demonic).toBe(0);
    });

    test('should have correct initial karma', () => {
      const cultivationPath: CultivationPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      };

      gameEngine.initializeGame('测试玩家', cultivationPath);
      const playerState = gameEngine.getPlayerState();

      // Karma should start at 0
      expect(playerState.karma.goodDeeds).toBe(0);
      expect(playerState.karma.karmicDebt).toBe(0);
    });

    test('should have empty history', () => {
      const cultivationPath: CultivationPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      };

      gameEngine.initializeGame('测试玩家', cultivationPath);
      const playerState = gameEngine.getPlayerState();

      // History should be empty at start
      expect(playerState.history).toEqual([]);
    });

    test('should have no faction', () => {
      const cultivationPath: CultivationPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      };

      gameEngine.initializeGame('测试玩家', cultivationPath);
      const playerState = gameEngine.getPlayerState();

      // Should not belong to any faction at start
      expect(playerState.faction.current).toBeNull();
    });
  });

  describe('Initial Options Generation', () => {
    test('should generate initial options after initialization', () => {
      const cultivationPath: CultivationPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      };

      gameEngine.initializeGame('测试玩家', cultivationPath);
      
      // Generate initial options
      const options = gameEngine.generateOptions();

      // Should have at least basic options
      expect(options.length).toBeGreaterThan(0);
      
      // Should include cultivation option
      const cultivateOption = options.find(opt => opt.id === 'cultivate');
      expect(cultivateOption).toBeDefined();
      expect(cultivateOption?.text).toContain('修炼');
    });

    test('should have options appropriate for starting state', () => {
      const cultivationPath: CultivationPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      };

      gameEngine.initializeGame('测试玩家', cultivationPath);
      const options = gameEngine.generateOptions();

      // Should have basic options like cultivate and explore
      const optionIds = options.map(opt => opt.id);
      expect(optionIds).toContain('cultivate');
      expect(optionIds).toContain('explore');
    });
  });

  describe('Game State After Initialization', () => {
    test('should be in running state after initialization', () => {
      const cultivationPath: CultivationPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      };

      gameEngine.initializeGame('测试玩家', cultivationPath);

      // Game should be running
      expect(gameEngine.getGameState()).toBe('running');
    });

    test('should have turn count at 0', () => {
      const cultivationPath: CultivationPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      };

      gameEngine.initializeGame('测试玩家', cultivationPath);

      // Turn count should be 0 at start
      expect(gameEngine.getTurnCount()).toBe(0);
    });
  });

  describe('Cultivation Path Differences', () => {
    test('should have different initial resources for different paths', () => {
      const paths: CultivationPath[] = [
        {
          id: 'sword',
          name: '剑修',
          description: '以剑入道',
          initialStats: { spiritStones: 10 },
          exclusiveEvents: [],
          cultivationBonus: 1.0
        },
        {
          id: 'alchemy',
          name: '丹修',
          description: '精通炼丹',
          initialStats: { spiritStones: 20 },
          exclusiveEvents: [],
          cultivationBonus: 0.8
        },
        {
          id: 'formation',
          name: '阵修',
          description: '精通阵法',
          initialStats: { spiritStones: 15 },
          exclusiveEvents: [],
          cultivationBonus: 0.85
        }
      ];

      const states = paths.map(path => {
        const engine = new GameEngine();
        engine.initializeGame('测试玩家', path);
        return engine.getPlayerState();
      });

      // Verify different initial spirit stones
      expect(states[0].resources.spiritStones).toBe(10);
      expect(states[1].resources.spiritStones).toBe(20);
      expect(states[2].resources.spiritStones).toBe(15);
    });

    test('should have different cultivation bonuses', () => {
      const paths: CultivationPath[] = [
        {
          id: 'sword',
          name: '剑修',
          description: '以剑入道',
          initialStats: { spiritStones: 10 },
          exclusiveEvents: [],
          cultivationBonus: 1.0
        },
        {
          id: 'body',
          name: '体修',
          description: '炼体为主',
          initialStats: { spiritStones: 10 },
          exclusiveEvents: [],
          cultivationBonus: 0.9
        }
      ];

      const states = paths.map(path => {
        const engine = new GameEngine();
        engine.initializeGame('测试玩家', path);
        return engine.getPlayerState();
      });

      // Verify different cultivation bonuses
      expect(states[0].cultivationPath.cultivationBonus).toBe(1.0);
      expect(states[1].cultivationPath.cultivationBonus).toBe(0.9);
    });
  });
});
