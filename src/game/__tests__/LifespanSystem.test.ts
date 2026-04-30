/**
 * Unit tests for LifespanSystem
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 */

import { LifespanSystem } from '../LifespanSystem';
import { PlayerState, CultivationLevel, Season } from '../../types';

describe('LifespanSystem', () => {
  let system: LifespanSystem;
  let state: PlayerState;

  beforeEach(() => {
    state = createMockPlayerState();
    system = new LifespanSystem(state);
  });

  describe('Lifespan Initialization', () => {
    test('should initialize lifespan for Qi Refining level', () => {
      system.initializeLifespan(CultivationLevel.QiRefining);
      expect(state.lifespan.current).toBe(80);
      expect(state.lifespan.max).toBe(80);
    });

    test('should initialize lifespan for Foundation Establishment level', () => {
      system.initializeLifespan(CultivationLevel.FoundationEstablishment);
      expect(state.lifespan.current).toBe(150);
      expect(state.lifespan.max).toBe(150);
    });

    test('should initialize lifespan for Golden Core level', () => {
      system.initializeLifespan(CultivationLevel.GoldenCore);
      expect(state.lifespan.current).toBe(300);
      expect(state.lifespan.max).toBe(300);
    });

    test('should initialize lifespan for Ascension level', () => {
      system.initializeLifespan(CultivationLevel.Ascension);
      expect(state.lifespan.current).toBe(Infinity);
      expect(state.lifespan.max).toBe(Infinity);
    });
  });

  describe('Lifespan Decrease', () => {
    test('should decrease lifespan', () => {
      system.decreaseLifespan(10);
      expect(system.getRemainingLifespan()).toBe(70);
    });

    test('should not go below zero', () => {
      system.decreaseLifespan(100);
      expect(system.getRemainingLifespan()).toBe(0);
    });

    test('should throw error for negative years', () => {
      expect(() => system.decreaseLifespan(-10)).toThrow('Years must be positive');
    });

    test('should consume lifespan by time', () => {
      system.consumeLifespanByTime(12); // 1 year
      expect(system.getRemainingLifespan()).toBe(79);
    });

    test('should consume lifespan by months', () => {
      system.consumeLifespanByTime(6); // 0.5 years
      expect(system.getRemainingLifespan()).toBe(79.5);
    });
  });

  describe('Lifespan Increase', () => {
    test('should increase lifespan', () => {
      system.decreaseLifespan(20);
      system.increaseLifespan(10);
      expect(system.getRemainingLifespan()).toBe(70);
    });

    test('should not exceed max lifespan', () => {
      system.increaseLifespan(10);
      expect(system.getRemainingLifespan()).toBe(80);
    });

    test('should throw error for negative years', () => {
      expect(() => system.increaseLifespan(-10)).toThrow('Years must be positive');
    });
  });

  describe('Breakthrough Lifespan Extension', () => {
    test('should extend lifespan on breakthrough to Foundation', () => {
      system.breakthroughLifespanExtension(CultivationLevel.FoundationEstablishment);
      expect(state.lifespan.max).toBe(150);
      expect(state.lifespan.current).toBe(150);
    });

    test('should extend lifespan on breakthrough to Golden Core', () => {
      system.initializeLifespan(CultivationLevel.FoundationEstablishment);
      system.decreaseLifespan(50); // Current: 100
      system.breakthroughLifespanExtension(CultivationLevel.GoldenCore);
      
      expect(state.lifespan.max).toBe(300);
      expect(state.lifespan.current).toBe(250); // 100 + (300-150)
    });

    test('should not exceed new max lifespan', () => {
      system.initializeLifespan(CultivationLevel.FoundationEstablishment);
      // Current is already at max (150)
      system.breakthroughLifespanExtension(CultivationLevel.GoldenCore);
      
      expect(state.lifespan.current).toBe(300);
      expect(state.lifespan.max).toBe(300);
    });

    test('should calculate breakthrough lifespan gain', () => {
      const gain = system.calculateBreakthroughLifespanGain(
        CultivationLevel.QiRefining,
        CultivationLevel.FoundationEstablishment
      );
      expect(gain).toBe(70); // 150 - 80
    });
  });

  describe('Lifespan Status Checks', () => {
    test('should detect depleted lifespan', () => {
      system.decreaseLifespan(80);
      expect(system.isLifespanDepleted()).toBe(true);
    });

    test('should detect non-depleted lifespan', () => {
      expect(system.isLifespanDepleted()).toBe(false);
    });

    test('should detect critical lifespan', () => {
      system.decreaseLifespan(65); // 15 remaining, 18.75%
      expect(system.isLifespanCritical()).toBe(true);
    });

    test('should detect healthy lifespan', () => {
      system.decreaseLifespan(30); // 50 remaining, 62.5%
      expect(system.isLifespanHealthy()).toBe(true);
    });

    test('should calculate lifespan percentage', () => {
      system.decreaseLifespan(40);
      expect(system.getLifespanPercentage()).toBe(50);
    });

    test('should handle zero max lifespan', () => {
      state.lifespan.max = 0;
      expect(system.getLifespanPercentage()).toBe(0);
    });
  });

  describe('Lifespan Status Description', () => {
    test('should return correct status for depleted lifespan', () => {
      system.decreaseLifespan(80);
      expect(system.getLifespanStatus()).toBe('寿命已尽');
    });

    test('should return correct status for critical lifespan', () => {
      system.decreaseLifespan(72); // 10% remaining
      expect(system.getLifespanStatus()).toContain('危急');
    });

    test('should return correct status for low lifespan', () => {
      system.decreaseLifespan(68); // 15% remaining
      expect(system.getLifespanStatus()).toContain('危急');
    });

    test('should return correct status for moderate lifespan', () => {
      system.decreaseLifespan(50); // 37.5% remaining
      expect(system.getLifespanStatus()).toContain('不足');
    });

    test('should return correct status for healthy lifespan', () => {
      system.decreaseLifespan(20); // 75% remaining
      expect(system.getLifespanStatus()).toContain('充足');
    });

    test('should return correct status for abundant lifespan', () => {
      system.decreaseLifespan(5); // 93.75% remaining
      expect(system.getLifespanStatus()).toContain('充沛');
    });
  });

  describe('Life Extension Items', () => {
    test('should use life extension item', () => {
      system.decreaseLifespan(20);
      const success = system.useLifeExtensionItem(10);
      
      expect(success).toBe(true);
      expect(system.getRemainingLifespan()).toBe(70);
    });

    test('should fail if already at max lifespan', () => {
      const success = system.useLifeExtensionItem(10);
      expect(success).toBe(false);
      expect(system.getRemainingLifespan()).toBe(80);
    });

    test('should fail for zero or negative years', () => {
      system.decreaseLifespan(20);
      expect(system.useLifeExtensionItem(0)).toBe(false);
      expect(system.useLifeExtensionItem(-10)).toBe(false);
    });
  });

  describe('Lifespan Info', () => {
    test('should get complete lifespan info', () => {
      system.decreaseLifespan(20);
      const info = system.getLifespanInfo();
      
      expect(info.current).toBe(60);
      expect(info.max).toBe(80);
      expect(info.percentage).toBe(75);
      expect(info.status).toBe('寿命充足');
      expect(info.isCritical).toBe(false);
      expect(info.isDepleted).toBe(false);
    });

    test('should indicate critical status in info', () => {
      system.decreaseLifespan(70);
      const info = system.getLifespanInfo();
      
      expect(info.isCritical).toBe(true);
      expect(info.isDepleted).toBe(false);
    });

    test('should indicate depleted status in info', () => {
      system.decreaseLifespan(80);
      const info = system.getLifespanInfo();
      
      expect(info.isDepleted).toBe(true);
    });
  });

  describe('Breakthrough Recommendations', () => {
    test('should recommend breakthrough when lifespan is low', () => {
      system.decreaseLifespan(60); // 25% remaining
      expect(system.needsBreakthroughForLifespan()).toBe(true);
    });

    test('should not recommend breakthrough when lifespan is healthy', () => {
      expect(system.needsBreakthroughForLifespan()).toBe(false);
    });

    test('should not recommend breakthrough at max level', () => {
      state.cultivation.level = CultivationLevel.Ascension;
      system.decreaseLifespan(60);
      expect(system.needsBreakthroughForLifespan()).toBe(false);
    });
  });

  describe('Next Level Lifespan Info', () => {
    test('should get next level lifespan info', () => {
      const info = system.getNextLevelLifespanInfo();
      
      expect(info).not.toBeNull();
      expect(info?.nextLevel).toBe(CultivationLevel.FoundationEstablishment);
      expect(info?.nextMaxLifespan).toBe(150);
      expect(info?.lifespanGain).toBe(70);
    });

    test('should return null at max level', () => {
      state.cultivation.level = CultivationLevel.Ascension;
      const info = system.getNextLevelLifespanInfo();
      expect(info).toBeNull();
    });
  });

  describe('Static Methods', () => {
    test('should get basic lifespan for each level', () => {
      expect(LifespanSystem.getBasicLifespan(CultivationLevel.QiRefining)).toBe(80);
      expect(LifespanSystem.getBasicLifespan(CultivationLevel.FoundationEstablishment)).toBe(150);
      expect(LifespanSystem.getBasicLifespan(CultivationLevel.GoldenCore)).toBe(300);
      expect(LifespanSystem.getBasicLifespan(CultivationLevel.NascentSoul)).toBe(500);
      expect(LifespanSystem.getBasicLifespan(CultivationLevel.Ascension)).toBe(Infinity);
    });
  });

  describe('Lifespan Prediction', () => {
    test('should predict lifespan depletion time', () => {
      const prediction = system.predictLifespanDepletionTime();
      expect(prediction).toBe(80);
    });

    test('should predict remaining time after decrease', () => {
      system.decreaseLifespan(30);
      const prediction = system.predictLifespanDepletionTime();
      expect(prediction).toBe(50);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very small lifespan decreases', () => {
      system.decreaseLifespan(0.1);
      expect(system.getRemainingLifespan()).toBeCloseTo(79.9);
    });

    test('should handle multiple small time consumptions', () => {
      for (let i = 0; i < 12; i++) {
        system.consumeLifespanByTime(1); // 1 month each
      }
      expect(system.getRemainingLifespan()).toBeCloseTo(79, 5);
    });

    test('should handle breakthrough at depleted lifespan', () => {
      system.decreaseLifespan(80);
      system.breakthroughLifespanExtension(CultivationLevel.FoundationEstablishment);
      expect(system.getRemainingLifespan()).toBe(70); // 0 + (150-80)
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
