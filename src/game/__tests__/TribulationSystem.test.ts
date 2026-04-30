/**
 * Unit tests for TribulationSystem
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 */

import { TribulationSystem } from '../TribulationSystem';
import { PlayerState, CultivationLevel, Season, TribulationType } from '../../types';

describe('TribulationSystem', () => {
  let system: TribulationSystem;
  let state: PlayerState;

  beforeEach(() => {
    state = createMockPlayerState();
    system = new TribulationSystem(state);
  });

  describe('Tribulation Triggering', () => {
    test('should not trigger tribulation when experience below threshold', () => {
      state.cultivation.experience = 50;
      state.cultivation.maxExperience = 100;
      
      expect(system.shouldTriggerTribulation()).toBe(false);
    });

    test('should trigger tribulation when experience reaches threshold', () => {
      state.cultivation.experience = 100;
      state.cultivation.maxExperience = 100;
      
      expect(system.shouldTriggerTribulation()).toBe(true);
    });

    test('should trigger tribulation when experience exceeds threshold', () => {
      state.cultivation.experience = 120;
      state.cultivation.maxExperience = 100;
      
      expect(system.shouldTriggerTribulation()).toBe(true);
    });
  });

  describe('Tribulation Type Determination', () => {
    test('should determine heavenly tribulation with low karma debt', () => {
      state.karma.karmicDebt = 30;
      state.reputation.demonic = 20;
      
      expect(system.determineTribulationType()).toBe(TribulationType.HeavenlyTribulation);
    });

    test('should determine inner demon tribulation with high karma debt', () => {
      state.karma.karmicDebt = 60;
      state.reputation.demonic = 20;
      
      expect(system.determineTribulationType()).toBe(TribulationType.InnerDemon);
    });

    test('should determine karmic tribulation with high demonic reputation', () => {
      state.karma.karmicDebt = 30;
      state.reputation.demonic = 70;
      
      expect(system.determineTribulationType()).toBe(TribulationType.KarmicTribulation);
    });

    test('should prioritize inner demon over karmic tribulation', () => {
      state.karma.karmicDebt = 60;
      state.reputation.demonic = 70;
      
      expect(system.determineTribulationType()).toBe(TribulationType.InnerDemon);
    });
  });

  describe('Difficulty Calculation', () => {
    test('should calculate base difficulty', () => {
      state.karma.karmicDebt = 0;
      state.reputation.demonic = 0;
      state.cultivation.level = CultivationLevel.QiRefining;
      
      const difficulty = system.calculateDifficulty();
      expect(difficulty).toBeGreaterThan(0);
    });

    test('should increase difficulty with karmic debt', () => {
      state.karma.karmicDebt = 0;
      const baseDifficulty = system.calculateDifficulty();
      
      state.karma.karmicDebt = 50;
      const higherDifficulty = system.calculateDifficulty();
      
      expect(higherDifficulty).toBeGreaterThan(baseDifficulty);
    });

    test('should increase difficulty with demonic reputation', () => {
      state.reputation.demonic = 0;
      const baseDifficulty = system.calculateDifficulty();
      
      state.reputation.demonic = 50;
      const higherDifficulty = system.calculateDifficulty();
      
      expect(higherDifficulty).toBeGreaterThan(baseDifficulty);
    });

    test('should increase difficulty with higher cultivation level', () => {
      state.cultivation.level = CultivationLevel.QiRefining;
      const lowLevelDifficulty = system.calculateDifficulty();
      
      state.cultivation.level = CultivationLevel.GoldenCore;
      const highLevelDifficulty = system.calculateDifficulty();
      
      expect(highLevelDifficulty).toBeGreaterThan(lowLevelDifficulty);
    });
  });

  describe('Demon Generation', () => {
    test('should generate no demons with clean history', () => {
      state.history = [];
      const demons = system.generateDemons();
      
      expect(demons.length).toBe(0);
    });

    test('should generate generic demon with karmic debt but no history', () => {
      state.karma.karmicDebt = 50;
      state.history = [];
      
      const demons = system.generateDemons();
      
      expect(demons.length).toBe(1);
      expect(demons[0].name).toBe('因果心魔');
      expect(demons[0].power).toBe(50);
    });

    test('should generate demons from negative actions in history', () => {
      state.history = [
        {
          time: { year: 1, season: Season.Spring, month: 1 },
          description: '杀害了无辜村民',
          isKeyChoice: true
        },
        {
          time: { year: 2, season: Season.Summer, month: 6 },
          description: '背叛了师门',
          isKeyChoice: true
        }
      ];
      
      const demons = system.generateDemons();
      
      expect(demons.length).toBe(2);
      expect(demons[0].description).toContain('杀害了无辜村民');
      expect(demons[1].description).toContain('背叛了师门');
    });

    test('should not generate demons from positive actions', () => {
      state.history = [
        {
          time: { year: 1, season: Season.Spring, month: 1 },
          description: '救助了村民',
          isKeyChoice: true
        }
      ];
      
      const demons = system.generateDemons();
      
      expect(demons.length).toBe(0);
    });

    test('should increase demon power with time', () => {
      state.time.year = 10;
      state.history = [
        {
          time: { year: 1, season: Season.Spring, month: 1 },
          description: '杀害了修士',
          isKeyChoice: true
        }
      ];
      
      const demons = system.generateDemons();
      
      expect(demons.length).toBe(1);
      expect(demons[0].power).toBeGreaterThan(50);
    });

    test('should cap demon power at 200', () => {
      state.time.year = 100;
      state.history = [
        {
          time: { year: 1, season: Season.Spring, month: 1 },
          description: '杀害了修士',
          isKeyChoice: true
        }
      ];
      
      const demons = system.generateDemons();
      
      expect(demons[0].power).toBeLessThanOrEqual(200);
    });
  });

  describe('Tribulation Options Generation', () => {
    test('should generate inner demon options', () => {
      const demons = [
        { name: '心魔', description: '测试心魔', power: 50 }
      ];
      
      const options = system.generateTribulationOptions(TribulationType.InnerDemon, demons);
      
      expect(options.length).toBeGreaterThan(0);
      expect(options.some(opt => opt.id === 'face_demons')).toBe(true);
      expect(options.some(opt => opt.id === 'suppress_demons')).toBe(true);
      expect(options.some(opt => opt.id === 'seek_help')).toBe(true);
    });

    test('should generate heavenly tribulation options', () => {
      const options = system.generateTribulationOptions(TribulationType.HeavenlyTribulation, []);
      
      expect(options.length).toBeGreaterThan(0);
      expect(options.some(opt => opt.id === 'resist_tribulation')).toBe(true);
      expect(options.some(opt => opt.id === 'use_treasure')).toBe(true);
      expect(options.some(opt => opt.id === 'formation_protection')).toBe(true);
    });

    test('should generate karmic tribulation options', () => {
      const options = system.generateTribulationOptions(TribulationType.KarmicTribulation, []);
      
      expect(options.length).toBeGreaterThan(0);
      expect(options.some(opt => opt.id === 'repent')).toBe(true);
      expect(options.some(opt => opt.id === 'accept_karma')).toBe(true);
    });

    test('should have valid success rates', () => {
      const options = system.generateTribulationOptions(TribulationType.HeavenlyTribulation, []);
      
      for (const option of options) {
        expect(option.successRate).toBeGreaterThanOrEqual(0);
        expect(option.successRate).toBeLessThanOrEqual(1);
      }
    });

    test('should decrease success rate with higher difficulty', () => {
      state.karma.karmicDebt = 0;
      const lowDifficultyOptions = system.generateTribulationOptions(TribulationType.HeavenlyTribulation, []);
      
      state.karma.karmicDebt = 100;
      const highDifficultyOptions = system.generateTribulationOptions(TribulationType.HeavenlyTribulation, []);
      
      expect(highDifficultyOptions[0].successRate).toBeLessThan(lowDifficultyOptions[0].successRate);
    });
  });

  describe('Tribulation Performance', () => {
    test('should perform tribulation and return result', () => {
      const options = system.generateTribulationOptions(TribulationType.HeavenlyTribulation, []);
      const result = system.performTribulation(options[0].id, TribulationType.HeavenlyTribulation, []);
      
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.effects).toBeDefined();
    });

    test('should throw error for invalid option', () => {
      expect(() => {
        system.performTribulation('invalid_option', TribulationType.HeavenlyTribulation, []);
      }).toThrow('Tribulation option invalid_option not found');
    });

    test('should return success or failure based on probability', () => {
      // Run multiple times to test both outcomes
      let successCount = 0;
      let failureCount = 0;
      
      for (let i = 0; i < 100; i++) {
        const result = system.performTribulation('resist_tribulation', TribulationType.HeavenlyTribulation, []);
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      }
      
      // Should have both successes and failures
      expect(successCount).toBeGreaterThan(0);
      expect(failureCount).toBeGreaterThan(0);
    });

    test('should apply cultivation level up on success', () => {
      // Set high success rate
      state.karma.karmicDebt = 0;
      state.reputation.demonic = 0;
      
      let leveledUp = false;
      for (let i = 0; i < 100; i++) {
        const result = system.performTribulation('resist_tribulation', TribulationType.HeavenlyTribulation, []);
        if (result.success && result.effects.cultivationLevelUp) {
          leveledUp = true;
          expect(result.effects.newLevel).toBeDefined();
          expect(result.effects.lifespanChange).toBeGreaterThan(0);
          break;
        }
      }
      
      expect(leveledUp).toBe(true);
    });

    test('should apply penalties on failure', () => {
      let failed = false;
      for (let i = 0; i < 100; i++) {
        const result = system.performTribulation('resist_tribulation', TribulationType.HeavenlyTribulation, []);
        if (!result.success) {
          failed = true;
          expect(result.effects.lifespanChange).toBeLessThan(0);
          break;
        }
      }
      
      expect(failed).toBe(true);
    });
  });

  describe('Success Rate Calculation', () => {
    test('should calculate base success rate', () => {
      const rate = system.calculateSuccessRate('resist_tribulation', TribulationType.HeavenlyTribulation, []);
      
      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThanOrEqual(1);
    });

    test('should increase success rate with good deeds', () => {
      state.karma.goodDeeds = 0;
      const baseRate = system.calculateSuccessRate('resist_tribulation', TribulationType.HeavenlyTribulation, []);
      
      state.karma.goodDeeds = 100;
      const higherRate = system.calculateSuccessRate('resist_tribulation', TribulationType.HeavenlyTribulation, []);
      
      expect(higherRate).toBeGreaterThan(baseRate);
    });

    test('should increase success rate with righteous reputation', () => {
      state.reputation.righteous = 0;
      const baseRate = system.calculateSuccessRate('resist_tribulation', TribulationType.HeavenlyTribulation, []);
      
      state.reputation.righteous = 100;
      const higherRate = system.calculateSuccessRate('resist_tribulation', TribulationType.HeavenlyTribulation, []);
      
      expect(higherRate).toBeGreaterThan(baseRate);
    });

    test('should return 0 for invalid option', () => {
      const rate = system.calculateSuccessRate('invalid_option', TribulationType.HeavenlyTribulation, []);
      expect(rate).toBe(0);
    });

    test('should clamp success rate to 0-1 range', () => {
      state.karma.goodDeeds = 10000;
      state.reputation.righteous = 10000;
      
      const rate = system.calculateSuccessRate('resist_tribulation', TribulationType.HeavenlyTribulation, []);
      expect(rate).toBeLessThanOrEqual(1);
    });
  });

  describe('Next Cultivation Level', () => {
    test('should get next cultivation level', () => {
      state.cultivation.level = CultivationLevel.QiRefining;
      expect(system.getNextCultivationLevel()).toBe(CultivationLevel.FoundationEstablishment);
      
      state.cultivation.level = CultivationLevel.FoundationEstablishment;
      expect(system.getNextCultivationLevel()).toBe(CultivationLevel.GoldenCore);
    });

    test('should return null for highest level', () => {
      state.cultivation.level = CultivationLevel.Ascension;
      expect(system.getNextCultivationLevel()).toBeNull();
    });
  });

  describe('Helper Methods', () => {
    test('should check if can seek help', () => {
      state.relationships.set('friend1', 60);
      expect(system.canSeekHelp()).toBe(true);
      
      state.relationships.clear();
      state.relationships.set('acquaintance', 30);
      expect(system.canSeekHelp()).toBe(false);
    });

    test('should check if has treasure', () => {
      state.resources.artifacts.set('sword', 1);
      expect(system.hasTreasure()).toBe(true);
      
      state.resources.artifacts.clear();
      expect(system.hasTreasure()).toBe(false);
    });

    test('should get tribulation type description', () => {
      expect(system.getTribulationTypeDescription(TribulationType.HeavenlyTribulation)).toContain('天劫');
      expect(system.getTribulationTypeDescription(TribulationType.InnerDemon)).toContain('心魔劫');
      expect(system.getTribulationTypeDescription(TribulationType.KarmicTribulation)).toContain('因果劫');
    });

    test('should get demon details', () => {
      const demons = [
        { name: '心魔1', description: '描述1', power: 50 },
        { name: '心魔2', description: '描述2', power: 80 }
      ];
      
      const details = system.getDemonDetails(demons);
      expect(details).toContain('心魔1');
      expect(details).toContain('心魔2');
      expect(details).toContain('50');
      expect(details).toContain('80');
    });

    test('should return no demons message for empty array', () => {
      const details = system.getDemonDetails([]);
      expect(details).toBe('无心魔');
    });

    test('should get tribulation advice', () => {
      const advice = system.getTribulationAdvice(TribulationType.HeavenlyTribulation, []);
      
      expect(advice).toContain('难度');
      expect(advice).toContain('建议选择');
      expect(advice).toContain('成功率');
    });
  });

  describe('Lifespan Increase', () => {
    test('should calculate correct lifespan increase for each level', () => {
      const testCases = [
        { level: CultivationLevel.QiRefining, expected: 70 },
        { level: CultivationLevel.FoundationEstablishment, expected: 150 },
        { level: CultivationLevel.GoldenCore, expected: 200 },
        { level: CultivationLevel.NascentSoul, expected: 500 },
        { level: CultivationLevel.SoulFormation, expected: 1000 }
      ];

      for (const testCase of testCases) {
        state.cultivation.level = testCase.level;
        const options = system.generateTribulationOptions(TribulationType.HeavenlyTribulation, []);
        const successEffect = options[0].effects.onSuccess;
        
        expect(successEffect.effects.lifespanChange).toBe(testCase.expected);
      }
    });

    test('should return 0 lifespan increase for tribulation level', () => {
      state.cultivation.level = CultivationLevel.Tribulation;
      const options = system.generateTribulationOptions(TribulationType.HeavenlyTribulation, []);
      const successEffect = options[0].effects.onSuccess;
      
      expect(successEffect.effects.lifespanChange).toBe(0);
    });
  });

  describe('Karma Debt Changes', () => {
    test('should reduce karma debt on successful face demons', () => {
      const options = system.generateTribulationOptions(TribulationType.InnerDemon, []);
      const faceOption = options.find(opt => opt.id === 'face_demons');
      
      expect(faceOption).toBeDefined();
      expect(faceOption!.effects.onSuccess.effects.karmaDebtChange).toBeLessThan(0);
    });

    test('should increase karma debt on suppress demons', () => {
      const options = system.generateTribulationOptions(TribulationType.InnerDemon, []);
      const suppressOption = options.find(opt => opt.id === 'suppress_demons');
      
      expect(suppressOption).toBeDefined();
      expect(suppressOption!.effects.onSuccess.effects.karmaDebtChange).toBeGreaterThan(0);
    });

    test('should reduce karma debt on successful repentance', () => {
      const options = system.generateTribulationOptions(TribulationType.KarmicTribulation, []);
      const repentOption = options.find(opt => opt.id === 'repent');
      
      expect(repentOption).toBeDefined();
      expect(repentOption!.effects.onSuccess.effects.karmaDebtChange).toBeLessThan(0);
    });
  });

  describe('Demonification', () => {
    test('should cause demonification on critical failure', () => {
      const options = system.generateTribulationOptions(TribulationType.InnerDemon, []);
      const suppressOption = options.find(opt => opt.id === 'suppress_demons');
      
      expect(suppressOption).toBeDefined();
      expect(suppressOption!.effects.onFailure.effects.demonification).toBe(true);
    });

    test('should cause demonification on karmic tribulation failure', () => {
      const options = system.generateTribulationOptions(TribulationType.KarmicTribulation, []);
      const acceptOption = options.find(opt => opt.id === 'accept_karma');
      
      expect(acceptOption).toBeDefined();
      expect(acceptOption!.effects.onFailure.effects.demonification).toBe(true);
    });
  });
});

// Helper function to create mock player state
function createMockPlayerState(): PlayerState {
  return {
    name: '测试玩家',
    cultivationPath: {
      id: 'sword',
      name: '剑修',
      description: '以剑入道',
      initialStats: { spiritStones: 10 },
      exclusiveEvents: [],
      cultivationBonus: 1.0
    },
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
      spiritStones: 10,
      pills: new Map(),
      artifacts: new Map(),
      items: new Map()
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
