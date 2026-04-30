/**
 * Unit tests for ResourceManager
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import { ResourceManager, ResourceType, ResourceRarity } from '../ResourceManager';
import { PlayerState, CultivationLevel, Season } from '../../types';

describe('ResourceManager', () => {
  let manager: ResourceManager;
  let state: PlayerState;

  beforeEach(() => {
    state = createMockPlayerState();
    manager = new ResourceManager(state);
  });

  describe('Spirit Stones Management', () => {
    test('should add spirit stones', () => {
      manager.addSpiritStones(50);
      expect(manager.getSpiritStones()).toBe(60);
    });

    test('should remove spirit stones', () => {
      const success = manager.removeSpiritStones(5);
      expect(success).toBe(true);
      expect(manager.getSpiritStones()).toBe(5);
    });

    test('should fail to remove insufficient spirit stones', () => {
      const success = manager.removeSpiritStones(100);
      expect(success).toBe(false);
      expect(manager.getSpiritStones()).toBe(10);
    });

    test('should check spirit stones availability', () => {
      expect(manager.hasSpiritStones(10)).toBe(true);
      expect(manager.hasSpiritStones(11)).toBe(false);
    });

    test('should throw error for negative amounts', () => {
      expect(() => manager.addSpiritStones(-10)).toThrow('Amount must be positive');
      expect(() => manager.removeSpiritStones(-10)).toThrow('Amount must be positive');
    });
  });

  describe('Pills Management', () => {
    test('should add pills', () => {
      manager.addPill('qi_refining_pill', 3);
      expect(manager.getPillCount('qi_refining_pill')).toBe(3);
    });

    test('should add pills incrementally', () => {
      manager.addPill('qi_refining_pill', 2);
      manager.addPill('qi_refining_pill', 3);
      expect(manager.getPillCount('qi_refining_pill')).toBe(5);
    });

    test('should remove pills', () => {
      manager.addPill('qi_refining_pill', 5);
      const success = manager.removePill('qi_refining_pill', 2);
      expect(success).toBe(true);
      expect(manager.getPillCount('qi_refining_pill')).toBe(3);
    });

    test('should remove pill entry when count reaches zero', () => {
      manager.addPill('qi_refining_pill', 2);
      manager.removePill('qi_refining_pill', 2);
      expect(manager.getPillCount('qi_refining_pill')).toBe(0);
      expect(manager.getAllPills().has('qi_refining_pill')).toBe(false);
    });

    test('should fail to remove insufficient pills', () => {
      manager.addPill('qi_refining_pill', 2);
      const success = manager.removePill('qi_refining_pill', 5);
      expect(success).toBe(false);
      expect(manager.getPillCount('qi_refining_pill')).toBe(2);
    });

    test('should check pill availability', () => {
      manager.addPill('qi_refining_pill', 3);
      expect(manager.hasPill('qi_refining_pill', 3)).toBe(true);
      expect(manager.hasPill('qi_refining_pill', 4)).toBe(false);
      expect(manager.hasPill('nonexistent_pill')).toBe(false);
    });

    test('should get all pills', () => {
      manager.addPill('qi_refining_pill', 2);
      manager.addPill('foundation_pill', 1);
      const pills = manager.getAllPills();
      expect(pills.size).toBe(2);
      expect(pills.get('qi_refining_pill')).toBe(2);
      expect(pills.get('foundation_pill')).toBe(1);
    });

    test('should throw error for negative amounts', () => {
      expect(() => manager.addPill('qi_refining_pill', -1)).toThrow('Amount must be positive');
      expect(() => manager.removePill('qi_refining_pill', -1)).toThrow('Amount must be positive');
    });
  });

  describe('Artifacts Management', () => {
    test('should add artifacts', () => {
      manager.addArtifact('flying_sword', 1);
      expect(manager.getArtifactCount('flying_sword')).toBe(1);
    });

    test('should remove artifacts', () => {
      manager.addArtifact('flying_sword', 2);
      const success = manager.removeArtifact('flying_sword', 1);
      expect(success).toBe(true);
      expect(manager.getArtifactCount('flying_sword')).toBe(1);
    });

    test('should fail to remove insufficient artifacts', () => {
      manager.addArtifact('flying_sword', 1);
      const success = manager.removeArtifact('flying_sword', 2);
      expect(success).toBe(false);
      expect(manager.getArtifactCount('flying_sword')).toBe(1);
    });

    test('should check artifact availability', () => {
      manager.addArtifact('flying_sword', 2);
      expect(manager.hasArtifact('flying_sword', 2)).toBe(true);
      expect(manager.hasArtifact('flying_sword', 3)).toBe(false);
    });

    test('should get all artifacts', () => {
      manager.addArtifact('flying_sword', 1);
      manager.addArtifact('spirit_armor', 1);
      const artifacts = manager.getAllArtifacts();
      expect(artifacts.size).toBe(2);
    });
  });

  describe('Resource Definitions', () => {
    test('should have predefined pill definitions', () => {
      const qiPill = manager.getResourceDefinition('qi_refining_pill');
      expect(qiPill).toBeDefined();
      expect(qiPill?.name).toBe('炼气丹');
      expect(qiPill?.type).toBe(ResourceType.Pills);
      expect(qiPill?.rarity).toBe(ResourceRarity.Common);
    });

    test('should have predefined artifact definitions', () => {
      const sword = manager.getResourceDefinition('flying_sword');
      expect(sword).toBeDefined();
      expect(sword?.name).toBe('飞剑');
      expect(sword?.type).toBe(ResourceType.Artifacts);
    });

    test('should return undefined for unknown resources', () => {
      const unknown = manager.getResourceDefinition('unknown_item');
      expect(unknown).toBeUndefined();
    });

    test('should allow registering custom resources', () => {
      manager.registerResource({
        id: 'custom_pill',
        name: '自定义丹药',
        type: ResourceType.Pills,
        rarity: ResourceRarity.Rare,
        effect: {
          cultivationBonus: 100,
          description: '测试丹药'
        }
      });

      const custom = manager.getResourceDefinition('custom_pill');
      expect(custom).toBeDefined();
      expect(custom?.name).toBe('自定义丹药');
    });
  });

  describe('Use Pills', () => {
    test('should use pill and return effect', () => {
      manager.addPill('qi_refining_pill', 1);
      const effect = manager.usePill('qi_refining_pill');
      
      expect(effect).toBeDefined();
      expect(effect?.cultivationBonus).toBe(5);
      expect(manager.getPillCount('qi_refining_pill')).toBe(0);
    });

    test('should fail to use nonexistent pill', () => {
      const effect = manager.usePill('nonexistent_pill');
      expect(effect).toBeNull();
    });

    test('should fail to use pill without sufficient quantity', () => {
      const effect = manager.usePill('qi_refining_pill');
      expect(effect).toBeNull();
    });
  });

  describe('Resource Requirements Check', () => {
    test('should check spirit stones requirement', () => {
      const hasResources = manager.hasResources({ spiritStones: 10 });
      expect(hasResources).toBe(true);
      
      const hasInsufficientResources = manager.hasResources({ spiritStones: 100 });
      expect(hasInsufficientResources).toBe(false);
    });

    test('should check pills requirement', () => {
      manager.addPill('qi_refining_pill', 2);
      
      const pillsReq = new Map([['qi_refining_pill', 2]]);
      expect(manager.hasResources({ pills: pillsReq })).toBe(true);
      
      const insufficientPillsReq = new Map([['qi_refining_pill', 3]]);
      expect(manager.hasResources({ pills: insufficientPillsReq })).toBe(false);
    });

    test('should check artifacts requirement', () => {
      manager.addArtifact('flying_sword', 1);
      
      const artifactsReq = new Map([['flying_sword', 1]]);
      expect(manager.hasResources({ artifacts: artifactsReq })).toBe(true);
      
      const insufficientArtifactsReq = new Map([['flying_sword', 2]]);
      expect(manager.hasResources({ artifacts: insufficientArtifactsReq })).toBe(false);
    });

    test('should check combined requirements', () => {
      manager.addPill('qi_refining_pill', 1);
      manager.addArtifact('flying_sword', 1);
      
      const requirements = {
        spiritStones: 10,
        pills: new Map([['qi_refining_pill', 1]]),
        artifacts: new Map([['flying_sword', 1]])
      };
      
      expect(manager.hasResources(requirements)).toBe(true);
    });

    test('should fail if any requirement is not met', () => {
      manager.addPill('qi_refining_pill', 1);
      
      const requirements = {
        spiritStones: 100, // Insufficient
        pills: new Map([['qi_refining_pill', 1]])
      };
      
      expect(manager.hasResources(requirements)).toBe(false);
    });
  });

  describe('Consume Resources', () => {
    test('should consume spirit stones', () => {
      const success = manager.consumeResources({ spiritStones: 5 });
      expect(success).toBe(true);
      expect(manager.getSpiritStones()).toBe(5);
    });

    test('should consume pills', () => {
      manager.addPill('qi_refining_pill', 3);
      const pillsReq = new Map([['qi_refining_pill', 2]]);
      const success = manager.consumeResources({ pills: pillsReq });
      
      expect(success).toBe(true);
      expect(manager.getPillCount('qi_refining_pill')).toBe(1);
    });

    test('should consume artifacts', () => {
      manager.addArtifact('flying_sword', 2);
      const artifactsReq = new Map([['flying_sword', 1]]);
      const success = manager.consumeResources({ artifacts: artifactsReq });
      
      expect(success).toBe(true);
      expect(manager.getArtifactCount('flying_sword')).toBe(1);
    });

    test('should consume combined resources', () => {
      manager.addPill('qi_refining_pill', 2);
      manager.addArtifact('flying_sword', 1);
      
      const requirements = {
        spiritStones: 5,
        pills: new Map([['qi_refining_pill', 1]]),
        artifacts: new Map([['flying_sword', 1]])
      };
      
      const success = manager.consumeResources(requirements);
      expect(success).toBe(true);
      expect(manager.getSpiritStones()).toBe(5);
      expect(manager.getPillCount('qi_refining_pill')).toBe(1);
      expect(manager.getArtifactCount('flying_sword')).toBe(0);
    });

    test('should not consume if requirements not met', () => {
      const requirements = { spiritStones: 100 };
      const success = manager.consumeResources(requirements);
      
      expect(success).toBe(false);
      expect(manager.getSpiritStones()).toBe(10); // Unchanged
    });

    test('should not partially consume on failure', () => {
      manager.addPill('qi_refining_pill', 1);
      
      const requirements = {
        spiritStones: 5,
        pills: new Map([['qi_refining_pill', 2]]) // Insufficient
      };
      
      const success = manager.consumeResources(requirements);
      expect(success).toBe(false);
      expect(manager.getSpiritStones()).toBe(10); // Unchanged
      expect(manager.getPillCount('qi_refining_pill')).toBe(1); // Unchanged
    });
  });

  describe('Resource Summary', () => {
    test('should get resource summary', () => {
      manager.addPill('qi_refining_pill', 2);
      manager.addPill('foundation_pill', 1);
      manager.addArtifact('flying_sword', 1);
      
      const summary = manager.getResourceSummary();
      
      expect(summary.spiritStones).toBe(10);
      expect(summary.pills.length).toBe(2);
      expect(summary.artifacts.length).toBe(1);
      
      const qiPill = summary.pills.find(p => p.id === 'qi_refining_pill');
      expect(qiPill?.count).toBe(2);
      expect(qiPill?.name).toBe('炼气丹');
      expect(qiPill?.rarity).toBe(ResourceRarity.Common);
    });

    test('should handle empty resources', () => {
      state.resources.spiritStones = 0;
      const summary = manager.getResourceSummary();
      
      expect(summary.spiritStones).toBe(0);
      expect(summary.pills.length).toBe(0);
      expect(summary.artifacts.length).toBe(0);
    });
  });

  describe('Rarity Colors', () => {
    test('should return correct colors for rarities', () => {
      expect(ResourceManager.getRarityColor(ResourceRarity.Common)).toBe('#ffffff');
      expect(ResourceManager.getRarityColor(ResourceRarity.Uncommon)).toBe('#1eff00');
      expect(ResourceManager.getRarityColor(ResourceRarity.Rare)).toBe('#0070dd');
      expect(ResourceManager.getRarityColor(ResourceRarity.Epic)).toBe('#a335ee');
      expect(ResourceManager.getRarityColor(ResourceRarity.Legendary)).toBe('#ff8000');
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
