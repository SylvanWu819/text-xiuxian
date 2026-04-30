/**
 * Unit tests for RelationshipSystem
 * Validates: Requirements 9.1, 9.2, 9.3
 */

import { RelationshipSystem, NPCAttitude } from '../RelationshipSystem';
import { PlayerState, CultivationLevel, Season } from '../../types';

describe('RelationshipSystem', () => {
  let system: RelationshipSystem;
  let state: PlayerState;

  beforeEach(() => {
    state = createMockPlayerState();
    system = new RelationshipSystem(state);
  });

  describe('Relationship Value Management', () => {
    test('should get relationship value', () => {
      state.relationships.set('npc1', 50);
      expect(system.getRelationship('npc1')).toBe(50);
    });

    test('should return 0 for unknown NPC', () => {
      expect(system.getRelationship('unknown_npc')).toBe(0);
    });

    test('should set relationship value', () => {
      system.setRelationship('npc1', 30);
      expect(system.getRelationship('npc1')).toBe(30);
    });

    test('should clamp relationship value to max 100', () => {
      system.setRelationship('npc1', 150);
      expect(system.getRelationship('npc1')).toBe(100);
    });

    test('should clamp relationship value to min -100', () => {
      system.setRelationship('npc1', -150);
      expect(system.getRelationship('npc1')).toBe(-100);
    });

    test('should change relationship value', () => {
      system.setRelationship('npc1', 20);
      const newValue = system.changeRelationship('npc1', 10);
      expect(newValue).toBe(30);
      expect(system.getRelationship('npc1')).toBe(30);
    });

    test('should handle negative relationship changes', () => {
      system.setRelationship('npc1', 20);
      system.changeRelationship('npc1', -30);
      expect(system.getRelationship('npc1')).toBe(-10);
    });

    test('should clamp relationship changes', () => {
      system.setRelationship('npc1', 90);
      system.changeRelationship('npc1', 50);
      expect(system.getRelationship('npc1')).toBe(100);
    });
  });

  describe('NPC Attitude', () => {
    test('should return Hostile attitude for relationship < -50', () => {
      system.setRelationship('npc1', -60);
      expect(system.getAttitude('npc1')).toBe(NPCAttitude.Hostile);
    });

    test('should return Unfriendly attitude for relationship -50 to -10', () => {
      system.setRelationship('npc1', -30);
      expect(system.getAttitude('npc1')).toBe(NPCAttitude.Unfriendly);
    });

    test('should return Neutral attitude for relationship -10 to 10', () => {
      system.setRelationship('npc1', 0);
      expect(system.getAttitude('npc1')).toBe(NPCAttitude.Neutral);
      
      system.setRelationship('npc2', 5);
      expect(system.getAttitude('npc2')).toBe(NPCAttitude.Neutral);
    });

    test('should return Friendly attitude for relationship 10 to 50', () => {
      system.setRelationship('npc1', 30);
      expect(system.getAttitude('npc1')).toBe(NPCAttitude.Friendly);
    });

    test('should return Intimate attitude for relationship > 50', () => {
      system.setRelationship('npc1', 70);
      expect(system.getAttitude('npc1')).toBe(NPCAttitude.Intimate);
    });
  });

  describe('NPC Behavior', () => {
    test('should indicate NPC will help when relationship >= 10', () => {
      system.setRelationship('npc1', 10);
      expect(system.willHelp('npc1')).toBe(true);
      
      system.setRelationship('npc2', 50);
      expect(system.willHelp('npc2')).toBe(true);
    });

    test('should indicate NPC will not help when relationship < 10', () => {
      system.setRelationship('npc1', 5);
      expect(system.willHelp('npc1')).toBe(false);
      
      system.setRelationship('npc2', -20);
      expect(system.willHelp('npc2')).toBe(false);
    });

    test('should indicate NPC is hostile when relationship < -50', () => {
      system.setRelationship('npc1', -60);
      expect(system.isHostile('npc1')).toBe(true);
    });

    test('should indicate NPC is not hostile when relationship >= -50', () => {
      system.setRelationship('npc1', -40);
      expect(system.isHostile('npc1')).toBe(false);
      
      system.setRelationship('npc2', 20);
      expect(system.isHostile('npc2')).toBe(false);
    });
  });

  describe('Relationship Queries', () => {
    test('should get all relationships', () => {
      system.setRelationship('npc1', 30);
      system.setRelationship('npc2', -20);
      
      const relationships = system.getAllRelationships();
      expect(relationships.size).toBe(2);
      expect(relationships.get('npc1')).toBe(30);
      expect(relationships.get('npc2')).toBe(-20);
    });

    test('should get friendly NPCs', () => {
      system.setRelationship('npc1', 30);
      system.setRelationship('npc2', 5);
      system.setRelationship('npc3', 60);
      system.setRelationship('npc4', -20);
      
      const friendly = system.getFriendlyNPCs();
      expect(friendly).toContain('npc1');
      expect(friendly).toContain('npc3');
      expect(friendly).not.toContain('npc2');
      expect(friendly).not.toContain('npc4');
    });

    test('should get hostile NPCs', () => {
      system.setRelationship('npc1', -60);
      system.setRelationship('npc2', -40);
      system.setRelationship('npc3', -80);
      system.setRelationship('npc4', 20);
      
      const hostile = system.getHostileNPCs();
      expect(hostile).toContain('npc1');
      expect(hostile).toContain('npc3');
      expect(hostile).not.toContain('npc2');
      expect(hostile).not.toContain('npc4');
    });

    test('should get relationship summary', () => {
      system.setRelationship('npc1', 30);
      system.setRelationship('npc2', -60);
      
      const summary = system.getRelationshipSummary();
      expect(summary.length).toBe(2);
      
      const npc1Summary = summary.find(s => s.npcId === 'npc1');
      expect(npc1Summary?.value).toBe(30);
      expect(npc1Summary?.attitude).toBe(NPCAttitude.Friendly);
      
      const npc2Summary = summary.find(s => s.npcId === 'npc2');
      expect(npc2Summary?.value).toBe(-60);
      expect(npc2Summary?.attitude).toBe(NPCAttitude.Hostile);
    });
  });

  describe('Dialogue Modifier', () => {
    test('should return negative modifier for hostile attitude', () => {
      system.setRelationship('npc1', -60);
      expect(system.getDialogueModifier('npc1')).toBe(-0.5);
    });

    test('should return negative modifier for unfriendly attitude', () => {
      system.setRelationship('npc1', -30);
      expect(system.getDialogueModifier('npc1')).toBe(-0.2);
    });

    test('should return zero modifier for neutral attitude', () => {
      system.setRelationship('npc1', 0);
      expect(system.getDialogueModifier('npc1')).toBe(0);
    });

    test('should return positive modifier for friendly attitude', () => {
      system.setRelationship('npc1', 30);
      expect(system.getDialogueModifier('npc1')).toBe(0.2);
    });

    test('should return positive modifier for intimate attitude', () => {
      system.setRelationship('npc1', 70);
      expect(system.getDialogueModifier('npc1')).toBe(0.5);
    });
  });

  describe('Price Modifier', () => {
    test('should return 2x price for hostile attitude', () => {
      system.setRelationship('npc1', -60);
      expect(system.getPriceModifier('npc1')).toBe(2.0);
    });

    test('should return 1.5x price for unfriendly attitude', () => {
      system.setRelationship('npc1', -30);
      expect(system.getPriceModifier('npc1')).toBe(1.5);
    });

    test('should return 1x price for neutral attitude', () => {
      system.setRelationship('npc1', 0);
      expect(system.getPriceModifier('npc1')).toBe(1.0);
    });

    test('should return 0.8x price for friendly attitude', () => {
      system.setRelationship('npc1', 30);
      expect(system.getPriceModifier('npc1')).toBe(0.8);
    });

    test('should return 0.5x price for intimate attitude', () => {
      system.setRelationship('npc1', 70);
      expect(system.getPriceModifier('npc1')).toBe(0.5);
    });
  });

  describe('Special Events', () => {
    test('should allow special event when relationship meets requirement', () => {
      system.setRelationship('npc1', 50);
      expect(system.canTriggerSpecialEvent('npc1', 40)).toBe(true);
      expect(system.canTriggerSpecialEvent('npc1', 50)).toBe(true);
    });

    test('should not allow special event when relationship below requirement', () => {
      system.setRelationship('npc1', 30);
      expect(system.canTriggerSpecialEvent('npc1', 40)).toBe(false);
    });
  });

  describe('Relationship Reset', () => {
    test('should reset relationship to 0', () => {
      system.setRelationship('npc1', 50);
      system.resetRelationship('npc1');
      expect(system.getRelationship('npc1')).toBe(0);
    });

    test('should clear all relationships', () => {
      system.setRelationship('npc1', 30);
      system.setRelationship('npc2', -20);
      system.clearAllRelationships();
      
      expect(system.getAllRelationships().size).toBe(0);
      expect(system.getRelationship('npc1')).toBe(0);
      expect(system.getRelationship('npc2')).toBe(0);
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
