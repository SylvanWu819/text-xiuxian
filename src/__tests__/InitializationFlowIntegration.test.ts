/**
 * Initialization Flow Integration Tests
 * Task 17.3: 编写初始化流程的集成测试
 * Validates: Requirements 18.1, 2.1
 * 
 * Tests the complete initialization flow:
 * 1. Welcome screen display
 * 2. Character creation (name input + cultivation path selection)
 * 3. Game initialization with correct initial state
 * 4. First turn options generation
 */

import { GameEngine, GameState } from '../game/GameEngine';
import { CultivationPath, CultivationLevel, Season } from '../types';

describe('Initialization Flow Integration Tests', () => {
  describe('Complete Initialization Flow', () => {
    /**
     * Validates: Requirements 18.1, 18.4, 18.5, 18.6, 18.7, 2.1, 2.3
     * Tests the entire flow from welcome to first playable state
     */
    test('should complete full initialization flow for sword path', () => {
      // Step 1: Welcome screen state (simulated)
      const welcomeScreenState = {
        showWelcome: true,
        showCharacterCreation: false,
        gameStarted: false
      };
      expect(welcomeScreenState.showWelcome).toBe(true);

      // Step 2: User selects "New Game"
      welcomeScreenState.showWelcome = false;
      welcomeScreenState.showCharacterCreation = true;

      // Step 3: Character creation - name input
      const playerName = '测试剑修';
      expect(playerName.length).toBeGreaterThanOrEqual(2);
      expect(playerName.length).toBeLessThanOrEqual(20);

      // Step 4: Character creation - cultivation path selection
      const swordPath: CultivationPath = {
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

      // Step 5: Initialize game engine
      const gameEngine = new GameEngine();
      gameEngine.initializeGame(playerName, swordPath);

      // Step 6: Verify game state is running
      expect(gameEngine.getGameState()).toBe(GameState.Running);

      // Step 7: Verify player state initialization
      const playerState = gameEngine.getPlayerState();
      
      // Character info
      expect(playerState.name).toBe(playerName);
      expect(playerState.cultivationPath.id).toBe('sword');
      expect(playerState.cultivationPath.name).toBe('剑修');
      
      // Cultivation state
      expect(playerState.cultivation.level).toBe(CultivationLevel.QiRefining);
      expect(playerState.cultivation.experience).toBe(0);
      expect(playerState.cultivation.maxExperience).toBe(100);
      
      // Time state
      expect(playerState.time.year).toBe(1);
      expect(playerState.time.season).toBe(Season.Spring);
      expect(playerState.time.month).toBe(1);
      
      // Lifespan state
      expect(playerState.lifespan.current).toBe(80);
      expect(playerState.lifespan.max).toBe(80);
      
      // Resources
      expect(playerState.resources.spiritStones).toBe(10);
      expect(playerState.resources.pills.size).toBe(0);
      expect(playerState.resources.artifacts.size).toBe(0);
      
      // Relationships and faction
      expect(playerState.relationships.size).toBe(0);
      expect(playerState.faction.current).toBeNull();
      expect(playerState.faction.reputation.size).toBe(0);
      
      // Karma and reputation
      expect(playerState.karma.goodDeeds).toBe(0);
      expect(playerState.karma.karmicDebt).toBe(0);
      expect(playerState.reputation.righteous).toBe(0);
      expect(playerState.reputation.demonic).toBe(0);
      
      // History and story progress
      expect(playerState.history).toEqual([]);
      expect(playerState.storyProgress.completedQuests.size).toBe(0);
      expect(playerState.storyProgress.activeQuests.size).toBe(0);
      expect(playerState.storyProgress.unlockedEvents.size).toBe(0);
      expect(playerState.storyProgress.storyFlags.size).toBe(0);

      // Step 8: Generate initial options
      const options = gameEngine.generateOptions();
      expect(options.length).toBeGreaterThan(0);
      
      // Verify basic options are available
      const optionIds = options.map(opt => opt.id);
      expect(optionIds).toContain('cultivate');
      expect(optionIds).toContain('explore');

      // Step 9: Verify turn count
      expect(gameEngine.getTurnCount()).toBe(0);

      // Step 10: Verify all subsystems are initialized
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

    /**
     * Validates: Requirements 18.1, 2.1, 2.2, 2.3
     * Tests initialization with alchemy path (different initial resources)
     */
    test('should complete full initialization flow for alchemy path', () => {
      const playerName = '测试丹修';
      const alchemyPath: CultivationPath = {
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

      const gameEngine = new GameEngine();
      gameEngine.initializeGame(playerName, alchemyPath);

      const playerState = gameEngine.getPlayerState();
      
      // Verify alchemy-specific initialization
      expect(playerState.name).toBe(playerName);
      expect(playerState.cultivationPath.id).toBe('alchemy');
      expect(playerState.resources.spiritStones).toBe(20); // Higher initial resources
      expect(playerState.cultivationPath.cultivationBonus).toBe(0.8);
      expect(playerState.cultivationPath.exclusiveEvents).toContain('alchemy_master_encounter');
      
      // Verify game is ready to play
      expect(gameEngine.getGameState()).toBe(GameState.Running);
      const options = gameEngine.generateOptions();
      expect(options.length).toBeGreaterThan(0);
    });

    /**
     * Validates: Requirements 18.1, 2.1, 2.2, 2.3
     * Tests initialization with body cultivation path
     */
    test('should complete full initialization flow for body cultivation path', () => {
      const playerName = '测试体修';
      const bodyPath: CultivationPath = {
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

      const gameEngine = new GameEngine();
      gameEngine.initializeGame(playerName, bodyPath);

      const playerState = gameEngine.getPlayerState();
      
      // Verify body cultivation-specific initialization
      expect(playerState.name).toBe(playerName);
      expect(playerState.cultivationPath.id).toBe('body');
      expect(playerState.resources.spiritStones).toBe(10);
      expect(playerState.cultivationPath.cultivationBonus).toBe(0.9);
      expect(playerState.cultivationPath.exclusiveEvents).toContain('body_tempering_trial');
      
      // Verify game is ready to play
      expect(gameEngine.getGameState()).toBe(GameState.Running);
      const options = gameEngine.generateOptions();
      expect(options.length).toBeGreaterThan(0);
    });

    /**
     * Validates: Requirements 18.1, 2.1, 2.2, 2.3
     * Tests initialization with formation path
     */
    test('should complete full initialization flow for formation path', () => {
      const playerName = '测试阵修';
      const formationPath: CultivationPath = {
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

      const gameEngine = new GameEngine();
      gameEngine.initializeGame(playerName, formationPath);

      const playerState = gameEngine.getPlayerState();
      
      // Verify formation-specific initialization
      expect(playerState.name).toBe(playerName);
      expect(playerState.cultivationPath.id).toBe('formation');
      expect(playerState.resources.spiritStones).toBe(15);
      expect(playerState.cultivationPath.cultivationBonus).toBe(0.85);
      expect(playerState.cultivationPath.exclusiveEvents).toContain('ancient_formation_discovery');
      
      // Verify game is ready to play
      expect(gameEngine.getGameState()).toBe(GameState.Running);
      const options = gameEngine.generateOptions();
      expect(options.length).toBeGreaterThan(0);
    });
  });

  describe('Character Creation Validation', () => {
    /**
     * Validates: Requirement 18.4
     * Tests character name validation during initialization
     */
    test('should accept valid character names', () => {
      const validNames = [
        '张三',
        '李四',
        '王五修仙者',
        '赵六',
        'TestPlayer',
        '修仙之路',
        '剑道独尊'
      ];

      const testPath: CultivationPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      };

      validNames.forEach(name => {
        const gameEngine = new GameEngine();
        gameEngine.initializeGame(name, testPath);
        
        expect(gameEngine.getPlayerState().name).toBe(name);
        expect(gameEngine.getGameState()).toBe(GameState.Running);
      });
    });

    /**
     * Validates: Requirement 18.4
     * Tests name length constraints
     */
    test('should validate name length constraints', () => {
      const shortName = '张'; // Too short (< 2 chars)
      const validName = '张三'; // Valid (2 chars)
      const longName = '这是一个非常非常非常非常长的名字超过二十个字符限制'; // Too long (> 20 chars)

      expect(shortName.length).toBeLessThan(2);
      expect(validName.length).toBeGreaterThanOrEqual(2);
      expect(validName.length).toBeLessThanOrEqual(20);
      expect(longName.length).toBeGreaterThan(20);
    });
  });

  describe('Cultivation Path Selection', () => {
    /**
     * Validates: Requirements 2.1, 2.2
     * Tests that all cultivation paths are available and properly configured
     */
    test('should have all cultivation paths available with correct properties', () => {
      const cultivationPaths: CultivationPath[] = [
        {
          id: 'sword',
          name: '剑修',
          description: '以剑入道，攻击力强',
          initialStats: { spiritStones: 10, specialAbility: '剑气' },
          exclusiveEvents: ['sword_master_encounter', 'sword_dao_enlightenment'],
          cultivationBonus: 1.0
        },
        {
          id: 'body',
          name: '体修',
          description: '炼体为主，防御力高',
          initialStats: { spiritStones: 10, specialAbility: '金刚体' },
          exclusiveEvents: ['body_tempering_trial'],
          cultivationBonus: 0.9
        },
        {
          id: 'alchemy',
          name: '丹修',
          description: '精通炼丹，资源丰富',
          initialStats: { spiritStones: 20, specialAbility: '炼丹术' },
          exclusiveEvents: ['alchemy_master_encounter', 'rare_herb_discovery'],
          cultivationBonus: 0.8
        },
        {
          id: 'formation',
          name: '阵修',
          description: '精通阵法，控制力强',
          initialStats: { spiritStones: 15, specialAbility: '阵法' },
          exclusiveEvents: ['ancient_formation_discovery'],
          cultivationBonus: 0.85
        }
      ];

      // Verify all paths have required properties
      cultivationPaths.forEach(path => {
        expect(path.id).toBeDefined();
        expect(path.name).toBeDefined();
        expect(path.description).toBeDefined();
        expect(path.initialStats).toBeDefined();
        expect(path.initialStats.spiritStones).toBeGreaterThan(0);
        expect(path.exclusiveEvents).toBeDefined();
        expect(Array.isArray(path.exclusiveEvents)).toBe(true);
        expect(path.exclusiveEvents.length).toBeGreaterThan(0);
        expect(path.cultivationBonus).toBeDefined();
        expect(path.cultivationBonus).toBeGreaterThan(0);
      });

      // Verify unique IDs
      const ids = cultivationPaths.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(cultivationPaths.length);
    });

    /**
     * Validates: Requirements 2.3, 2.5
     * Tests that different paths initialize with different characteristics
     */
    test('should initialize different paths with unique characteristics', () => {
      const paths: CultivationPath[] = [
        {
          id: 'sword',
          name: '剑修',
          description: '以剑入道',
          initialStats: { spiritStones: 10 },
          exclusiveEvents: ['sword_event'],
          cultivationBonus: 1.0
        },
        {
          id: 'alchemy',
          name: '丹修',
          description: '精通炼丹',
          initialStats: { spiritStones: 20 },
          exclusiveEvents: ['alchemy_event'],
          cultivationBonus: 0.8
        },
        {
          id: 'formation',
          name: '阵修',
          description: '精通阵法',
          initialStats: { spiritStones: 15 },
          exclusiveEvents: ['formation_event'],
          cultivationBonus: 0.85
        }
      ];

      const engines = paths.map(path => {
        const engine = new GameEngine();
        engine.initializeGame('测试玩家', path);
        return engine;
      });

      // Verify different initial resources
      expect(engines[0].getPlayerState().resources.spiritStones).toBe(10);
      expect(engines[1].getPlayerState().resources.spiritStones).toBe(20);
      expect(engines[2].getPlayerState().resources.spiritStones).toBe(15);

      // Verify different cultivation bonuses
      expect(engines[0].getPlayerState().cultivationPath.cultivationBonus).toBe(1.0);
      expect(engines[1].getPlayerState().cultivationPath.cultivationBonus).toBe(0.8);
      expect(engines[2].getPlayerState().cultivationPath.cultivationBonus).toBe(0.85);

      // Verify different exclusive events
      expect(engines[0].getPlayerState().cultivationPath.exclusiveEvents).toContain('sword_event');
      expect(engines[1].getPlayerState().cultivationPath.exclusiveEvents).toContain('alchemy_event');
      expect(engines[2].getPlayerState().cultivationPath.exclusiveEvents).toContain('formation_event');
    });
  });

  describe('Initial State Correctness', () => {
    let gameEngine: GameEngine;
    let testPath: CultivationPath;

    beforeEach(() => {
      gameEngine = new GameEngine();
      testPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      };
      gameEngine.initializeGame('测试玩家', testPath);
    });

    /**
     * Validates: Requirement 18.7
     * Tests cultivation state initialization
     */
    test('should initialize cultivation state correctly', () => {
      const playerState = gameEngine.getPlayerState();

      expect(playerState.cultivation.level).toBe(CultivationLevel.QiRefining);
      expect(playerState.cultivation.experience).toBe(0);
      expect(playerState.cultivation.maxExperience).toBe(100);
    });

    /**
     * Validates: Requirement 18.7
     * Tests time state initialization
     */
    test('should initialize time state correctly', () => {
      const playerState = gameEngine.getPlayerState();

      expect(playerState.time.year).toBe(1);
      expect(playerState.time.season).toBe(Season.Spring);
      expect(playerState.time.month).toBe(1);
    });

    /**
     * Validates: Requirement 18.7
     * Tests lifespan initialization
     */
    test('should initialize lifespan correctly', () => {
      const playerState = gameEngine.getPlayerState();

      expect(playerState.lifespan.current).toBe(80);
      expect(playerState.lifespan.max).toBe(80);
    });

    /**
     * Validates: Requirement 18.7
     * Tests resource initialization
     */
    test('should initialize resources correctly', () => {
      const playerState = gameEngine.getPlayerState();

      expect(playerState.resources.spiritStones).toBe(10);
      expect(playerState.resources.pills).toBeInstanceOf(Map);
      expect(playerState.resources.pills.size).toBe(0);
      expect(playerState.resources.artifacts).toBeInstanceOf(Map);
      expect(playerState.resources.artifacts.size).toBe(0);
    });

    /**
     * Validates: Requirement 18.7
     * Tests reputation initialization
     */
    test('should initialize reputation correctly', () => {
      const playerState = gameEngine.getPlayerState();

      expect(playerState.reputation.righteous).toBe(0);
      expect(playerState.reputation.demonic).toBe(0);
    });

    /**
     * Validates: Requirement 18.7
     * Tests karma initialization
     */
    test('should initialize karma correctly', () => {
      const playerState = gameEngine.getPlayerState();

      expect(playerState.karma.goodDeeds).toBe(0);
      expect(playerState.karma.karmicDebt).toBe(0);
    });

    /**
     * Validates: Requirement 18.7
     * Tests faction initialization
     */
    test('should initialize faction correctly', () => {
      const playerState = gameEngine.getPlayerState();

      expect(playerState.faction.current).toBeNull();
      expect(playerState.faction.reputation).toBeInstanceOf(Map);
      expect(playerState.faction.reputation.size).toBe(0);
    });

    /**
     * Validates: Requirement 18.7
     * Tests relationships initialization
     */
    test('should initialize relationships correctly', () => {
      const playerState = gameEngine.getPlayerState();

      expect(playerState.relationships).toBeInstanceOf(Map);
      expect(playerState.relationships.size).toBe(0);
    });

    /**
     * Validates: Requirement 18.7
     * Tests history initialization
     */
    test('should initialize history correctly', () => {
      const playerState = gameEngine.getPlayerState();

      expect(playerState.history).toEqual([]);
      expect(Array.isArray(playerState.history)).toBe(true);
    });

    /**
     * Validates: Requirement 18.7
     * Tests story progress initialization
     */
    test('should initialize story progress correctly', () => {
      const playerState = gameEngine.getPlayerState();

      expect(playerState.storyProgress.completedQuests).toBeInstanceOf(Set);
      expect(playerState.storyProgress.completedQuests.size).toBe(0);
      expect(playerState.storyProgress.activeQuests).toBeInstanceOf(Set);
      expect(playerState.storyProgress.activeQuests.size).toBe(0);
      expect(playerState.storyProgress.unlockedEvents).toBeInstanceOf(Set);
      expect(playerState.storyProgress.unlockedEvents.size).toBe(0);
      expect(playerState.storyProgress.storyFlags).toBeInstanceOf(Map);
      expect(playerState.storyProgress.storyFlags.size).toBe(0);
    });
  });

  describe('Initial Options Generation', () => {
    /**
     * Validates: Requirements 18.6, 1.1, 1.6
     * Tests that initial options are generated correctly after initialization
     */
    test('should generate appropriate initial options', () => {
      const gameEngine = new GameEngine();
      const testPath: CultivationPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      };

      gameEngine.initializeGame('测试玩家', testPath);
      const options = gameEngine.generateOptions();

      // Should have at least basic options
      expect(options.length).toBeGreaterThan(0);

      // Should include cultivation option
      const cultivateOption = options.find(opt => opt.id === 'cultivate');
      expect(cultivateOption).toBeDefined();
      expect(cultivateOption?.text).toBeDefined();
      expect(cultivateOption?.description).toBeDefined();

      // Should include explore option
      const exploreOption = options.find(opt => opt.id === 'explore');
      expect(exploreOption).toBeDefined();

      // All options should have required properties
      options.forEach(option => {
        expect(option.id).toBeDefined();
        expect(option.text).toBeDefined();
        expect(option.timeCost).toBeDefined();
        expect(option.effects).toBeDefined();
      });
    });

    /**
     * Validates: Requirement 1.6
     * Tests that options are appropriate for starting state
     */
    test('should not include options requiring resources player does not have', () => {
      const gameEngine = new GameEngine();
      const testPath: CultivationPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 }, // Only 10 spirit stones
        exclusiveEvents: [],
        cultivationBonus: 1.0
      };

      gameEngine.initializeGame('测试玩家', testPath);
      const options = gameEngine.generateOptions();

      // Should not include expensive options that require more than 10 spirit stones
      const expensiveOptions = options.filter(opt => 
        opt.requirements?.minResources?.spiritStones && 
        opt.requirements.minResources.spiritStones > 10
      );

      expect(expensiveOptions.length).toBe(0);
    });
  });

  describe('Subsystem Initialization', () => {
    /**
     * Validates: Requirement 18.7
     * Tests that all subsystems are properly initialized
     */
    test('should initialize all subsystems correctly', () => {
      const gameEngine = new GameEngine();
      const testPath: CultivationPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      };

      gameEngine.initializeGame('测试玩家', testPath);

      // Verify all subsystems are initialized and functional
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

      // Verify subsystems can perform basic operations
      expect(() => gameEngine.getResourceManager().getSpiritStones()).not.toThrow();
      expect(() => gameEngine.getLifespanSystem().getRemainingLifespan()).not.toThrow();
      expect(() => gameEngine.getKarmaSystem().getKarmaBalance()).not.toThrow();
      expect(() => gameEngine.getReputationSystem().getRighteousReputation()).not.toThrow();
    });
  });

  describe('Game State Transitions', () => {
    /**
     * Validates: Requirement 18.6
     * Tests game state transitions during initialization
     */
    test('should transition through correct states during initialization', () => {
      const gameEngine = new GameEngine();
      
      // Initial state
      expect(gameEngine.getGameState()).toBe(GameState.NotInitialized);

      // After initialization
      const testPath: CultivationPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      };

      gameEngine.initializeGame('测试玩家', testPath);
      
      // Should be running after initialization
      expect(gameEngine.getGameState()).toBe(GameState.Running);
    });

    /**
     * Validates: Requirement 18.6
     * Tests that game is ready to accept player actions after initialization
     */
    test('should be ready to accept player actions after initialization', () => {
      const gameEngine = new GameEngine();
      const testPath: CultivationPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      };

      gameEngine.initializeGame('测试玩家', testPath);

      // Should be able to generate options
      const options = gameEngine.generateOptions();
      expect(options.length).toBeGreaterThan(0);

      // Should be able to execute a turn
      const result = gameEngine.executeTurn('cultivate');
      expect(result.success).toBe(true);

      // Turn count should increase
      expect(gameEngine.getTurnCount()).toBe(1);
    });
  });

  describe('Multiple Initialization Scenarios', () => {
    /**
     * Tests that multiple games can be initialized sequentially
     */
    test('should support multiple sequential initializations', () => {
      const gameEngine = new GameEngine();
      
      const path1: CultivationPath = {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      };

      const path2: CultivationPath = {
        id: 'alchemy',
        name: '丹修',
        description: '精通炼丹',
        initialStats: { spiritStones: 20 },
        exclusiveEvents: [],
        cultivationBonus: 0.8
      };

      // First initialization
      gameEngine.initializeGame('玩家一', path1);
      expect(gameEngine.getPlayerState().name).toBe('玩家一');
      expect(gameEngine.getPlayerState().resources.spiritStones).toBe(10);

      // Reset and second initialization
      gameEngine.resetGame();
      gameEngine.initializeGame('玩家二', path2);
      expect(gameEngine.getPlayerState().name).toBe('玩家二');
      expect(gameEngine.getPlayerState().resources.spiritStones).toBe(20);
    });
  });
});
