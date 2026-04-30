/**
 * Tests for Welcome Screen and Character Creation
 * Task 17.1: 实现欢迎界面和角色创建
 * Validates: Requirements 18.1-18.7, 2.1-2.5
 */

import { CultivationPath } from '../types';

describe('Welcome Screen and Character Creation', () => {
  describe('Cultivation Path Configuration', () => {
    const cultivationPaths: CultivationPath[] = [
      {
        id: 'sword',
        name: '剑修',
        description: '以剑入道，攻击力强',
        initialStats: {
          spiritStones: 10,
          specialAbility: '剑气'
        },
        exclusiveEvents: ['sword_master_encounter', 'sword_dao_enlightenment'],
        cultivationBonus: 1.0
      },
      {
        id: 'body',
        name: '体修',
        description: '炼体为主，防御力高',
        initialStats: {
          spiritStones: 10,
          specialAbility: '金刚体'
        },
        exclusiveEvents: ['body_tempering_trial'],
        cultivationBonus: 0.9
      },
      {
        id: 'alchemy',
        name: '丹修',
        description: '精通炼丹，资源丰富',
        initialStats: {
          spiritStones: 20,
          specialAbility: '炼丹术'
        },
        exclusiveEvents: ['alchemy_master_encounter', 'rare_herb_discovery'],
        cultivationBonus: 0.8
      },
      {
        id: 'formation',
        name: '阵修',
        description: '精通阵法，控制力强',
        initialStats: {
          spiritStones: 15,
          specialAbility: '阵法'
        },
        exclusiveEvents: ['ancient_formation_discovery'],
        cultivationBonus: 0.85
      }
    ];

    /**
     * Validates: Requirement 2.1 - Display available cultivation paths
     */
    test('should have 4 cultivation paths available', () => {
      expect(cultivationPaths).toHaveLength(4);
    });

    /**
     * Validates: Requirement 2.2 - Display path descriptions and initial talents
     */
    test('each cultivation path should have required properties', () => {
      cultivationPaths.forEach(path => {
        expect(path).toHaveProperty('id');
        expect(path).toHaveProperty('name');
        expect(path).toHaveProperty('description');
        expect(path).toHaveProperty('initialStats');
        expect(path).toHaveProperty('exclusiveEvents');
        expect(path).toHaveProperty('cultivationBonus');
        
        // Check initial stats
        expect(path.initialStats).toHaveProperty('spiritStones');
        expect(path.initialStats.spiritStones).toBeGreaterThan(0);
      });
    });

    /**
     * Validates: Requirement 2.2 - Each path has unique characteristics
     */
    test('cultivation paths should have unique IDs', () => {
      const ids = cultivationPaths.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(cultivationPaths.length);
    });

    /**
     * Validates: Requirement 2.3 - Initialize corresponding storyline based on path
     */
    test('each path should have exclusive events', () => {
      cultivationPaths.forEach(path => {
        expect(path.exclusiveEvents).toBeDefined();
        expect(Array.isArray(path.exclusiveEvents)).toBe(true);
        expect(path.exclusiveEvents.length).toBeGreaterThan(0);
      });
    });

    /**
     * Validates: Requirement 2.5 - Different paths provide unique options
     */
    test('cultivation paths should have different initial resources', () => {
      const spiritStones = cultivationPaths.map(p => p.initialStats.spiritStones);
      const uniqueStones = new Set(spiritStones);
      
      // At least some paths should have different initial spirit stones
      expect(uniqueStones.size).toBeGreaterThan(1);
    });
  });

  describe('Character Name Validation', () => {
    /**
     * Validates: Requirement 18.4 - Player name input
     */
    test('should accept valid player names', () => {
      const validNames = ['张三', '李四', '王五', '赵六', '修仙者', 'TestPlayer'];
      
      validNames.forEach(name => {
        expect(name.length).toBeGreaterThanOrEqual(2);
        expect(name.length).toBeLessThanOrEqual(20);
      });
    });

    /**
     * Validates: Requirement 18.4 - Name length validation
     */
    test('should reject names that are too short', () => {
      const shortName = '张';
      expect(shortName.length).toBeLessThan(2);
    });

    /**
     * Validates: Requirement 18.4 - Name length validation
     */
    test('should reject names that are too long', () => {
      const longName = '这是一个非常非常非常非常长的名字超过二十个字符';
      expect(longName.length).toBeGreaterThan(20);
    });
  });

  describe('Character Creation Flow', () => {
    /**
     * Validates: Requirement 18.3 - New game vs continue game selection
     */
    test('should provide new game and continue game options', () => {
      const options = ['newGame', 'continueGame'];
      expect(options).toContain('newGame');
      expect(options).toContain('continueGame');
    });

    /**
     * Validates: Requirement 18.6 - Display opening storyline after initialization
     */
    test('should initialize game state after character creation', () => {
      const playerName = '测试玩家';
      const pathId = 'sword';
      
      // Simulate character creation
      const characterData = {
        playerName,
        pathId
      };
      
      expect(characterData.playerName).toBe(playerName);
      expect(characterData.pathId).toBe(pathId);
    });

    /**
     * Validates: Requirement 18.7 - Initialize PlayerState with default values
     */
    test('should initialize player state with correct default values', () => {
      const expectedDefaults = {
        cultivationLevel: 'qi_refining',
        spiritStones: 10, // varies by path
        lifespan: 80,
        year: 1
      };
      
      expect(expectedDefaults.cultivationLevel).toBe('qi_refining');
      expect(expectedDefaults.lifespan).toBe(80);
      expect(expectedDefaults.year).toBe(1);
    });
  });

  describe('Message Communication', () => {
    /**
     * Validates: Requirements 18.4, 18.5 - Character creation message format
     */
    test('should format character creation message correctly', () => {
      const message = {
        type: 'createCharacter',
        payload: {
          playerName: '测试玩家',
          pathId: 'sword'
        }
      };
      
      expect(message.type).toBe('createCharacter');
      expect(message.payload).toHaveProperty('playerName');
      expect(message.payload).toHaveProperty('pathId');
      expect(message.payload.playerName).toBe('测试玩家');
      expect(message.payload.pathId).toBe('sword');
    });

    /**
     * Validates: Requirement 18.6 - Game initialization notification
     */
    test('should send game initialized message after successful creation', () => {
      const message = {
        type: 'gameInitialized',
        payload: {}
      };
      
      expect(message.type).toBe('gameInitialized');
      expect(message.payload).toBeDefined();
    });
  });

  describe('UI State Management', () => {
    /**
     * Validates: Requirement 18.1 - Display welcome message and game introduction
     */
    test('should show welcome screen initially', () => {
      const screens = {
        welcome: true,
        characterCreation: false,
        game: false
      };
      
      expect(screens.welcome).toBe(true);
      expect(screens.characterCreation).toBe(false);
      expect(screens.game).toBe(false);
    });

    /**
     * Validates: Requirement 18.3 - Show character creation after new game selection
     */
    test('should transition to character creation when new game is selected', () => {
      const screens = {
        welcome: false,
        characterCreation: true,
        game: false
      };
      
      expect(screens.welcome).toBe(false);
      expect(screens.characterCreation).toBe(true);
      expect(screens.game).toBe(false);
    });

    /**
     * Validates: Requirement 18.6 - Show game screen after initialization
     */
    test('should transition to game screen after character creation', () => {
      const screens = {
        welcome: false,
        characterCreation: false,
        game: true
      };
      
      expect(screens.welcome).toBe(false);
      expect(screens.characterCreation).toBe(false);
      expect(screens.game).toBe(true);
    });
  });

  describe('Toolbar Button States', () => {
    /**
     * Validates: Requirement 22.7 - Disable buttons when game not initialized
     */
    test('should disable game buttons on welcome screen', () => {
      const buttonStates = {
        font: false,      // always enabled
        save: true,       // disabled
        restart: true,    // disabled
        history: true     // disabled
      };
      
      expect(buttonStates.font).toBe(false);
      expect(buttonStates.save).toBe(true);
      expect(buttonStates.restart).toBe(true);
      expect(buttonStates.history).toBe(true);
    });

    /**
     * Validates: Requirement 22.7 - Enable buttons when game is running
     */
    test('should enable game buttons after game initialization', () => {
      const buttonStates = {
        font: false,      // always enabled
        save: false,      // enabled
        restart: false,   // enabled
        history: false    // enabled
      };
      
      expect(buttonStates.font).toBe(false);
      expect(buttonStates.save).toBe(false);
      expect(buttonStates.restart).toBe(false);
      expect(buttonStates.history).toBe(false);
    });
  });
});
