/**
 * Unit tests for FortuneSystem
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { FortuneSystem, FortuneType, RiskLevel, Fortune } from '../FortuneSystem';
import { PlayerState, CultivationLevel, Season } from '../../types';

describe('FortuneSystem', () => {
  let system: FortuneSystem;
  let state: PlayerState;

  beforeEach(() => {
    state = createMockPlayerState();
    system = new FortuneSystem(state);
  });

  describe('Fortune Pool Management', () => {
    test('should initialize with default fortunes', () => {
      const fortunes = system.getAllFortunes();
      expect(fortunes.length).toBeGreaterThan(0);
    });

    test('should register new fortune', () => {
      const customFortune: Fortune = {
        id: 'custom_fortune',
        name: '自定义机缘',
        type: FortuneType.Cave,
        description: '测试机缘',
        riskLevel: RiskLevel.Low,
        minCultivationLevel: CultivationLevel.QiRefining,
        baseProbability: 0.1,
        risks: [],
        rewards: []
      };

      system.registerFortune(customFortune);
      const fortune = system.getFortuneDetails('custom_fortune');
      
      expect(fortune).toBeDefined();
      expect(fortune?.name).toBe('自定义机缘');
    });

    test('should get fortunes by type', () => {
      const caves = system.getFortunesByType(FortuneType.Cave);
      expect(caves.length).toBeGreaterThan(0);
      expect(caves.every(f => f.type === FortuneType.Cave)).toBe(true);
    });

    test('should get fortunes by risk level', () => {
      const mediumRisk = system.getFortunesByRiskLevel(RiskLevel.Medium);
      expect(mediumRisk.length).toBeGreaterThan(0);
      expect(mediumRisk.every(f => f.riskLevel === RiskLevel.Medium)).toBe(true);
    });

    test('should clear fortune pool', () => {
      system.clearFortunePool();
      const fortunes = system.getAllFortunes();
      expect(fortunes.length).toBe(0);
    });
  });

  describe('Fortune Triggering', () => {
    test('should try to trigger fortune', () => {
      // Run multiple times to test probability
      let triggered = false;
      
      for (let i = 0; i < 100; i++) {
        const fortune = system.tryTriggerFortune();
        if (fortune) {
          triggered = true;
          expect(fortune.id).toBeDefined();
          expect(fortune.name).toBeDefined();
          break;
        }
      }
      
      // Should trigger at least once in 100 attempts
      expect(triggered).toBe(true);
    });

    test('should not trigger fortune if cultivation level too low', () => {
      state.cultivation.level = CultivationLevel.QiRefining;
      
      // Register a high-level fortune
      const highLevelFortune: Fortune = {
        id: 'high_level_fortune',
        name: '高级机缘',
        type: FortuneType.Legacy,
        description: '需要高修为',
        riskLevel: RiskLevel.High,
        minCultivationLevel: CultivationLevel.NascentSoul,
        baseProbability: 1.0, // 100% to ensure it would trigger if eligible
        risks: [],
        rewards: []
      };
      
      system.clearFortunePool();
      system.registerFortune(highLevelFortune);
      
      const fortune = system.tryTriggerFortune();
      expect(fortune).toBeNull();
    });

    test('should trigger fortune when cultivation level sufficient', () => {
      state.cultivation.level = CultivationLevel.NascentSoul;
      
      const highLevelFortune: Fortune = {
        id: 'high_level_fortune',
        name: '高级机缘',
        type: FortuneType.Legacy,
        description: '需要高修为',
        riskLevel: RiskLevel.High,
        minCultivationLevel: CultivationLevel.NascentSoul,
        baseProbability: 1.0,
        risks: [],
        rewards: []
      };
      
      system.clearFortunePool();
      system.registerFortune(highLevelFortune);
      
      const fortune = system.tryTriggerFortune();
      expect(fortune).toBeDefined();
      expect(fortune?.id).toBe('high_level_fortune');
    });
  });

  describe('Fortune Probability Calculation', () => {
    test('should calculate base probability', () => {
      const fortune: Fortune = {
        id: 'test_fortune',
        name: '测试机缘',
        type: FortuneType.Adventure,
        description: '测试',
        riskLevel: RiskLevel.Low,
        minCultivationLevel: CultivationLevel.QiRefining,
        baseProbability: 0.1,
        risks: [],
        rewards: []
      };

      const probability = system.calculateTriggerProbability(fortune);
      expect(probability).toBeCloseTo(0.1, 2);
    });

    test('should increase probability with higher cultivation level', () => {
      const fortune: Fortune = {
        id: 'test_fortune',
        name: '测试机缘',
        type: FortuneType.Adventure,
        description: '测试',
        riskLevel: RiskLevel.Low,
        minCultivationLevel: CultivationLevel.QiRefining,
        baseProbability: 0.1,
        risks: [],
        rewards: []
      };

      state.cultivation.level = CultivationLevel.QiRefining;
      const baseProbability = system.calculateTriggerProbability(fortune);

      state.cultivation.level = CultivationLevel.FoundationEstablishment;
      const higherProbability = system.calculateTriggerProbability(fortune);

      expect(higherProbability).toBeGreaterThan(baseProbability);
    });

    test('should increase probability with good deeds', () => {
      const fortune: Fortune = {
        id: 'test_fortune',
        name: '测试机缘',
        type: FortuneType.Adventure,
        description: '测试',
        riskLevel: RiskLevel.Low,
        minCultivationLevel: CultivationLevel.QiRefining,
        baseProbability: 0.1,
        risks: [],
        rewards: []
      };

      state.karma.goodDeeds = 0;
      const baseProbability = system.calculateTriggerProbability(fortune);

      state.karma.goodDeeds = 50;
      const higherProbability = system.calculateTriggerProbability(fortune);

      expect(higherProbability).toBeGreaterThan(baseProbability);
    });

    test('should decrease probability with karmic debt', () => {
      const fortune: Fortune = {
        id: 'test_fortune',
        name: '测试机缘',
        type: FortuneType.Adventure,
        description: '测试',
        riskLevel: RiskLevel.Low,
        minCultivationLevel: CultivationLevel.QiRefining,
        baseProbability: 0.1,
        risks: [],
        rewards: []
      };

      state.karma.karmicDebt = 0;
      const baseProbability = system.calculateTriggerProbability(fortune);

      state.karma.karmicDebt = 50;
      const lowerProbability = system.calculateTriggerProbability(fortune);

      expect(lowerProbability).toBeLessThan(baseProbability);
    });

    test('should keep probability within 0-1 range', () => {
      const fortune: Fortune = {
        id: 'test_fortune',
        name: '测试机缘',
        type: FortuneType.Adventure,
        description: '测试',
        riskLevel: RiskLevel.Low,
        minCultivationLevel: CultivationLevel.QiRefining,
        baseProbability: 0.1,
        risks: [],
        rewards: []
      };

      // Extreme good deeds
      state.karma.goodDeeds = 1000;
      let probability = system.calculateTriggerProbability(fortune);
      expect(probability).toBeLessThanOrEqual(1);

      // Extreme karmic debt
      state.karma.goodDeeds = 0;
      state.karma.karmicDebt = 1000;
      probability = system.calculateTriggerProbability(fortune);
      expect(probability).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Fortune Exploration', () => {
    test('should explore fortune and get result', () => {
      const fortune: Fortune = {
        id: 'test_fortune',
        name: '测试机缘',
        type: FortuneType.Cave,
        description: '测试洞府',
        riskLevel: RiskLevel.Low,
        minCultivationLevel: CultivationLevel.QiRefining,
        baseProbability: 0.1,
        risks: [
          {
            description: '触发禁制',
            probability: 0.5,
            effects: {
              lifespanLoss: 5
            }
          }
        ],
        rewards: [
          {
            description: '获得宝物',
            probability: 0.5,
            effects: {
              cultivationGain: 50
            }
          }
        ]
      };

      system.registerFortune(fortune);
      const result = system.exploreFortune('test_fortune');

      expect(result).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.effects).toBeDefined();
    });

    test('should throw error for nonexistent fortune', () => {
      expect(() => system.exploreFortune('nonexistent')).toThrow('Fortune nonexistent not found');
    });

    test('should handle risk occurrence', () => {
      const fortune: Fortune = {
        id: 'risky_fortune',
        name: '危险机缘',
        type: FortuneType.Cave,
        description: '高风险洞府',
        riskLevel: RiskLevel.High,
        minCultivationLevel: CultivationLevel.QiRefining,
        baseProbability: 0.1,
        risks: [
          {
            description: '必定触发的风险',
            probability: 1.0, // 100% risk
            effects: {
              lifespanLoss: 10,
              cultivationLoss: 20
            }
          }
        ],
        rewards: []
      };

      system.registerFortune(fortune);
      const result = system.exploreFortune('risky_fortune');

      expect(result.success).toBe(false);
      expect(result.description).toBe('必定触发的风险');
      expect(result.effects.lifespanChange).toBe(-10);
      expect(result.effects.cultivationChange).toBe(-20);
    });

    test('should handle reward acquisition', () => {
      const fortune: Fortune = {
        id: 'rewarding_fortune',
        name: '丰厚机缘',
        type: FortuneType.Treasure,
        description: '必得宝物',
        riskLevel: RiskLevel.Low,
        minCultivationLevel: CultivationLevel.QiRefining,
        baseProbability: 0.1,
        risks: [],
        rewards: [
          {
            description: '必定获得的奖励',
            probability: 1.0, // 100% reward
            effects: {
              cultivationGain: 100,
              resourceGain: { spiritStones: 500 },
              itemGain: ['treasure_1', 'treasure_2']
            }
          }
        ]
      };

      system.registerFortune(fortune);
      const result = system.exploreFortune('rewarding_fortune');

      expect(result.success).toBe(true);
      expect(result.description).toBe('必定获得的奖励');
      expect(result.effects.cultivationChange).toBe(100);
      expect(result.effects.resourceChanges?.spiritStones).toBe(500);
      expect(result.effects.itemsGained).toEqual(['treasure_1', 'treasure_2']);
    });

    test('should handle empty fortune', () => {
      const fortune: Fortune = {
        id: 'empty_fortune',
        name: '空洞府',
        type: FortuneType.Cave,
        description: '已被搜刮一空',
        riskLevel: RiskLevel.Low,
        minCultivationLevel: CultivationLevel.QiRefining,
        baseProbability: 0.1,
        risks: [],
        rewards: []
      };

      system.registerFortune(fortune);
      const result = system.exploreFortune('empty_fortune');

      expect(result.success).toBe(true);
      expect(result.description).toContain('洞府已空');
    });
  });

  describe('Fortune Discovery Tracking', () => {
    test('should track discovered fortunes', () => {
      expect(system.isFortuneDiscovered('ancient_cave_1')).toBe(false);

      // Trigger fortune to mark as discovered
      system.clearFortunePool();
      const fortune: Fortune = {
        id: 'test_fortune',
        name: '测试机缘',
        type: FortuneType.Cave,
        description: '测试',
        riskLevel: RiskLevel.Low,
        minCultivationLevel: CultivationLevel.QiRefining,
        baseProbability: 1.0,
        risks: [],
        rewards: []
      };
      system.registerFortune(fortune);
      
      system.tryTriggerFortune();
      
      expect(system.isFortuneDiscovered('test_fortune')).toBe(true);
    });

    test('should get all discovered fortunes', () => {
      system.clearFortunePool();
      
      const fortune1: Fortune = {
        id: 'fortune1',
        name: '机缘1',
        type: FortuneType.Cave,
        description: '测试1',
        riskLevel: RiskLevel.Low,
        minCultivationLevel: CultivationLevel.QiRefining,
        baseProbability: 1.0,
        risks: [],
        rewards: []
      };
      
      const fortune2: Fortune = {
        id: 'fortune2',
        name: '机缘2',
        type: FortuneType.Adventure,
        description: '测试2',
        riskLevel: RiskLevel.Medium,
        minCultivationLevel: CultivationLevel.QiRefining,
        baseProbability: 1.0,
        risks: [],
        rewards: []
      };

      system.registerFortune(fortune1);
      system.registerFortune(fortune2);
      
      system.tryTriggerFortune();
      system.tryTriggerFortune();
      
      const discovered = system.getDiscoveredFortunes();
      expect(discovered.length).toBeGreaterThan(0);
    });

    test('should reset discovered fortunes', () => {
      system.clearFortunePool();
      const fortune: Fortune = {
        id: 'test_fortune',
        name: '测试机缘',
        type: FortuneType.Cave,
        description: '测试',
        riskLevel: RiskLevel.Low,
        minCultivationLevel: CultivationLevel.QiRefining,
        baseProbability: 1.0,
        risks: [],
        rewards: []
      };
      system.registerFortune(fortune);
      
      system.tryTriggerFortune();
      expect(system.isFortuneDiscovered('test_fortune')).toBe(true);
      
      system.resetDiscoveredFortunes();
      expect(system.isFortuneDiscovered('test_fortune')).toBe(false);
    });
  });

  describe('Fortune Descriptions', () => {
    test('should get risk level description', () => {
      expect(system.getRiskLevelDescription(RiskLevel.Low)).toContain('低风险');
      expect(system.getRiskLevelDescription(RiskLevel.Medium)).toContain('中风险');
      expect(system.getRiskLevelDescription(RiskLevel.High)).toContain('高风险');
      expect(system.getRiskLevelDescription(RiskLevel.Extreme)).toContain('极高风险');
    });

    test('should get fortune type description', () => {
      expect(system.getFortuneTypeDescription(FortuneType.Cave)).toContain('洞府');
      expect(system.getFortuneTypeDescription(FortuneType.Adventure)).toContain('奇遇');
      expect(system.getFortuneTypeDescription(FortuneType.Legacy)).toContain('传承');
      expect(system.getFortuneTypeDescription(FortuneType.Treasure)).toContain('宝物');
    });
  });

  describe('Expected Value Calculation', () => {
    test('should calculate positive expected value for rewarding fortune', () => {
      const fortune: Fortune = {
        id: 'good_fortune',
        name: '好机缘',
        type: FortuneType.Adventure,
        description: '高收益低风险',
        riskLevel: RiskLevel.Low,
        minCultivationLevel: CultivationLevel.QiRefining,
        baseProbability: 0.1,
        risks: [],
        rewards: [
          {
            description: '大量收益',
            probability: 1.0,
            effects: {
              cultivationGain: 100,
              resourceGain: { spiritStones: 1000 }
            }
          }
        ]
      };

      system.registerFortune(fortune);
      const expectedValue = system.calculateExpectedValue('good_fortune');
      
      expect(expectedValue).toBeGreaterThan(0);
    });

    test('should calculate negative expected value for risky fortune', () => {
      const fortune: Fortune = {
        id: 'bad_fortune',
        name: '坏机缘',
        type: FortuneType.Cave,
        description: '高风险低收益',
        riskLevel: RiskLevel.Extreme,
        minCultivationLevel: CultivationLevel.QiRefining,
        baseProbability: 0.1,
        risks: [
          {
            description: '巨大损失',
            probability: 1.0,
            effects: {
              lifespanLoss: 50,
              cultivationLoss: 100
            }
          }
        ],
        rewards: []
      };

      system.registerFortune(fortune);
      const expectedValue = system.calculateExpectedValue('bad_fortune');
      
      expect(expectedValue).toBeLessThan(0);
    });

    test('should return 0 for nonexistent fortune', () => {
      const expectedValue = system.calculateExpectedValue('nonexistent');
      expect(expectedValue).toBe(0);
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
