/**
 * Unit tests for ReputationSystem
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

import { ReputationSystem, ReputationLevel, ReputationType } from '../ReputationSystem';
import { PlayerState, CultivationLevel, Season } from '../../types';

describe('ReputationSystem', () => {
  let system: ReputationSystem;
  let state: PlayerState;

  beforeEach(() => {
    state = createMockPlayerState();
    system = new ReputationSystem(state);
  });

  describe('Reputation Value Management', () => {
    test('should get righteous reputation', () => {
      state.reputation.righteous = 50;
      expect(system.getRighteousReputation()).toBe(50);
    });

    test('should get demonic reputation', () => {
      state.reputation.demonic = 30;
      expect(system.getDemonicReputation()).toBe(30);
    });

    test('should set righteous reputation', () => {
      system.setRighteousReputation(40);
      expect(system.getRighteousReputation()).toBe(40);
    });

    test('should set demonic reputation', () => {
      system.setDemonicReputation(25);
      expect(system.getDemonicReputation()).toBe(25);
    });

    test('should clamp righteous reputation to max 100', () => {
      system.setRighteousReputation(150);
      expect(system.getRighteousReputation()).toBe(100);
    });

    test('should clamp righteous reputation to min 0', () => {
      system.setRighteousReputation(-50);
      expect(system.getRighteousReputation()).toBe(0);
    });

    test('should clamp demonic reputation to max 100', () => {
      system.setDemonicReputation(150);
      expect(system.getDemonicReputation()).toBe(100);
    });

    test('should clamp demonic reputation to min 0', () => {
      system.setDemonicReputation(-50);
      expect(system.getDemonicReputation()).toBe(0);
    });
  });

  describe('Reputation Increase', () => {
    test('should increase righteous reputation', () => {
      system.setRighteousReputation(20);
      const newValue = system.increaseRighteousReputation(10);
      expect(newValue).toBe(30);
      expect(system.getRighteousReputation()).toBe(30);
    });

    test('should increase demonic reputation', () => {
      system.setDemonicReputation(15);
      const newValue = system.increaseDemonicReputation(10);
      expect(newValue).toBe(25);
      expect(system.getDemonicReputation()).toBe(25);
    });

    test('should clamp righteous reputation increase', () => {
      system.setRighteousReputation(95);
      system.increaseRighteousReputation(10);
      expect(system.getRighteousReputation()).toBe(100);
    });

    test('should clamp demonic reputation increase', () => {
      system.setDemonicReputation(95);
      system.increaseDemonicReputation(10);
      expect(system.getDemonicReputation()).toBe(100);
    });
  });

  describe('Reputation Levels', () => {
    test('should return Unknown level for reputation < 10', () => {
      expect(system.getReputationLevel(5)).toBe(ReputationLevel.Unknown);
    });

    test('should return KnownLocally level for reputation 10-29', () => {
      expect(system.getReputationLevel(15)).toBe(ReputationLevel.KnownLocally);
    });

    test('should return Famous level for reputation 30-59', () => {
      expect(system.getReputationLevel(45)).toBe(ReputationLevel.Famous);
    });

    test('should return Renowned level for reputation 60-84', () => {
      expect(system.getReputationLevel(70)).toBe(ReputationLevel.Renowned);
    });

    test('should return Legendary level for reputation >= 85', () => {
      expect(system.getReputationLevel(90)).toBe(ReputationLevel.Legendary);
    });

    test('should get righteous reputation level', () => {
      system.setRighteousReputation(45);
      expect(system.getRighteousReputationLevel()).toBe(ReputationLevel.Famous);
    });

    test('should get demonic reputation level', () => {
      system.setDemonicReputation(70);
      expect(system.getDemonicReputationLevel()).toBe(ReputationLevel.Renowned);
    });
  });

  describe('Dominant Reputation Type', () => {
    test('should return Righteous when righteous > demonic and >= 30', () => {
      system.setRighteousReputation(50);
      system.setDemonicReputation(20);
      expect(system.getDominantReputationType()).toBe(ReputationType.Righteous);
    });

    test('should return Demonic when demonic > righteous and >= 30', () => {
      system.setRighteousReputation(20);
      system.setDemonicReputation(50);
      expect(system.getDominantReputationType()).toBe(ReputationType.Demonic);
    });

    test('should return null when both reputations are low', () => {
      system.setRighteousReputation(20);
      system.setDemonicReputation(15);
      expect(system.getDominantReputationType()).toBeNull();
    });

    test('should return null when reputations are equal', () => {
      system.setRighteousReputation(40);
      system.setDemonicReputation(40);
      expect(system.getDominantReputationType()).toBeNull();
    });
  });

  describe('NPC Attitude Modifier', () => {
    test('should return positive modifier for righteous NPCs with high righteous reputation', () => {
      system.setRighteousReputation(60);
      system.setDemonicReputation(20);
      expect(system.getNPCAttitudeModifier('righteous')).toBe(4); // (60-20)/10
    });

    test('should return negative modifier for righteous NPCs with high demonic reputation', () => {
      system.setRighteousReputation(20);
      system.setDemonicReputation(60);
      expect(system.getNPCAttitudeModifier('righteous')).toBe(-4); // (20-60)/10
    });

    test('should return positive modifier for demonic NPCs with high demonic reputation', () => {
      system.setRighteousReputation(20);
      system.setDemonicReputation(60);
      expect(system.getNPCAttitudeModifier('demonic')).toBe(4); // (60-20)/10
    });

    test('should return negative modifier for demonic NPCs with high righteous reputation', () => {
      system.setRighteousReputation(60);
      system.setDemonicReputation(20);
      expect(system.getNPCAttitudeModifier('demonic')).toBe(-4); // (20-60)/10
    });

    test('should return zero modifier for neutral NPCs', () => {
      system.setRighteousReputation(60);
      system.setDemonicReputation(20);
      expect(system.getNPCAttitudeModifier('neutral')).toBe(0);
    });
  });

  describe('Option Access', () => {
    test('should allow righteous option with sufficient reputation', () => {
      system.setRighteousReputation(50);
      expect(system.canAccessRighteousOption(40)).toBe(true);
    });

    test('should not allow righteous option with insufficient reputation', () => {
      system.setRighteousReputation(30);
      expect(system.canAccessRighteousOption(40)).toBe(false);
    });

    test('should allow demonic option with sufficient reputation', () => {
      system.setDemonicReputation(50);
      expect(system.canAccessDemonicOption(40)).toBe(true);
    });

    test('should not allow demonic option with insufficient reputation', () => {
      system.setDemonicReputation(30);
      expect(system.canAccessDemonicOption(40)).toBe(false);
    });
  });

  describe('NPC Hostility', () => {
    test('should be hostile to righteous NPCs with high demonic reputation', () => {
      system.setRighteousReputation(20);
      system.setDemonicReputation(60);
      expect(system.isHostileToRighteousNPCs()).toBe(true);
    });

    test('should not be hostile to righteous NPCs with low demonic reputation', () => {
      system.setRighteousReputation(30);
      system.setDemonicReputation(40);
      expect(system.isHostileToRighteousNPCs()).toBe(false);
    });

    test('should be hostile to demonic NPCs with high righteous reputation', () => {
      system.setRighteousReputation(60);
      system.setDemonicReputation(20);
      expect(system.isHostileToDemonicNPCs()).toBe(true);
    });

    test('should not be hostile to demonic NPCs with low righteous reputation', () => {
      system.setRighteousReputation(40);
      system.setDemonicReputation(30);
      expect(system.isHostileToDemonicNPCs()).toBe(false);
    });
  });

  describe('Ending Tendency', () => {
    test('should return righteous ending tendency', () => {
      system.setRighteousReputation(80);
      system.setDemonicReputation(30);
      expect(system.getEndingTendency()).toBe('righteous');
    });

    test('should return demonic ending tendency', () => {
      system.setRighteousReputation(30);
      system.setDemonicReputation(80);
      expect(system.getEndingTendency()).toBe('demonic');
    });

    test('should return neutral ending tendency', () => {
      system.setRighteousReputation(50);
      system.setDemonicReputation(50);
      expect(system.getEndingTendency()).toBe('neutral');
    });
  });

  describe('Ending Requirements', () => {
    test('should meet ascension requirement with high righteous reputation', () => {
      system.setRighteousReputation(85);
      expect(system.meetsAscensionReputationRequirement()).toBe(true);
    });

    test('should meet ascension requirement with high demonic reputation', () => {
      system.setDemonicReputation(85);
      expect(system.meetsAscensionReputationRequirement()).toBe(true);
    });

    test('should not meet ascension requirement with low reputations', () => {
      system.setRighteousReputation(50);
      system.setDemonicReputation(50);
      expect(system.meetsAscensionReputationRequirement()).toBe(false);
    });

    test('should meet demon lord requirement', () => {
      system.setRighteousReputation(20);
      system.setDemonicReputation(75);
      expect(system.meetsDemonLordRequirement()).toBe(true);
    });

    test('should not meet demon lord requirement with high righteous reputation', () => {
      system.setRighteousReputation(50);
      system.setDemonicReputation(75);
      expect(system.meetsDemonLordRequirement()).toBe(false);
    });

    test('should not meet demon lord requirement with low demonic reputation', () => {
      system.setRighteousReputation(20);
      system.setDemonicReputation(60);
      expect(system.meetsDemonLordRequirement()).toBe(false);
    });
  });

  describe('Reputation Actions', () => {
    test('should perform righteous action', () => {
      system.performRighteousAction(20);
      expect(system.getRighteousReputation()).toBe(20);
    });

    test('should reduce demonic reputation when performing righteous action', () => {
      system.setDemonicReputation(30);
      system.performRighteousAction(20);
      expect(system.getDemonicReputation()).toBe(26); // 30 - (20 * 0.2)
    });

    test('should perform demonic action', () => {
      system.performDemonicAction(20);
      expect(system.getDemonicReputation()).toBe(20);
    });

    test('should reduce righteous reputation when performing demonic action', () => {
      system.setRighteousReputation(30);
      system.performDemonicAction(20);
      expect(system.getRighteousReputation()).toBe(26); // 30 - (20 * 0.2)
    });

    test('should not reduce reputation below 0', () => {
      system.setDemonicReputation(2);
      system.performRighteousAction(20);
      expect(system.getDemonicReputation()).toBe(0);
    });
  });

  describe('Reputation Summary', () => {
    test('should get reputation summary', () => {
      system.setRighteousReputation(45);
      system.setDemonicReputation(70);
      
      const summary = system.getReputationSummary();
      expect(summary.righteous.value).toBe(45);
      expect(summary.righteous.level).toBe(ReputationLevel.Famous);
      expect(summary.demonic.value).toBe(70);
      expect(summary.demonic.level).toBe(ReputationLevel.Renowned);
      expect(summary.dominantType).toBe(ReputationType.Demonic);
      expect(summary.endingTendency).toBe('demonic');
    });
  });

  describe('Reputation Level Description', () => {
    test('should get correct descriptions', () => {
      expect(system.getReputationLevelDescription(ReputationLevel.Unknown)).toBe('无名之辈');
      expect(system.getReputationLevelDescription(ReputationLevel.KnownLocally)).toBe('小有名气');
      expect(system.getReputationLevelDescription(ReputationLevel.Famous)).toBe('名声在外');
      expect(system.getReputationLevelDescription(ReputationLevel.Renowned)).toBe('声名远扬');
      expect(system.getReputationLevelDescription(ReputationLevel.Legendary)).toBe('传奇人物');
    });
  });

  describe('Reputation Impact Description', () => {
    test('should describe impacts for high righteous reputation', () => {
      system.setRighteousReputation(75);
      const impacts = system.getReputationImpactDescription();
      expect(impacts).toContain('正道NPC对你友好');
      expect(impacts).toContain('可以接取高级正道任务');
    });

    test('should describe impacts for high demonic reputation', () => {
      system.setDemonicReputation(75);
      const impacts = system.getReputationImpactDescription();
      expect(impacts).toContain('魔道NPC对你友好');
      expect(impacts).toContain('可以接取高级魔道任务');
    });

    test('should describe hostility', () => {
      system.setRighteousReputation(20);
      system.setDemonicReputation(60);
      const impacts = system.getReputationImpactDescription();
      expect(impacts).toContain('正道NPC敌视你');
    });

    test('should return empty array for low reputations', () => {
      system.setRighteousReputation(20);
      system.setDemonicReputation(20);
      const impacts = system.getReputationImpactDescription();
      expect(impacts.length).toBe(0);
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
