/**
 * Unit tests for FactionSystem
 * Validates: Requirements 9.4, 9.5, 9.6, 9.7
 */

import { FactionSystem, FactionType, FactionRelation } from '../FactionSystem';
import { PlayerState, CultivationLevel, Season } from '../../types';

describe('FactionSystem', () => {
  let system: FactionSystem;
  let state: PlayerState;

  beforeEach(() => {
    state = createMockPlayerState();
    system = new FactionSystem(state);
  });

  describe('Faction Membership', () => {
    test('should start with no faction', () => {
      expect(system.getCurrentFaction()).toBeNull();
    });

    test('should join a faction', () => {
      const success = system.joinFaction('tianxuan_sect');
      expect(success).toBe(true);
      expect(system.getCurrentFaction()).toBe('tianxuan_sect');
    });

    test('should not join unknown faction', () => {
      const success = system.joinFaction('unknown_faction');
      expect(success).toBe(false);
      expect(system.getCurrentFaction()).toBeNull();
    });

    test('should not join another faction when already in one', () => {
      system.joinFaction('tianxuan_sect');
      const success = system.joinFaction('qingyun_sect');
      expect(success).toBe(false);
      expect(system.getCurrentFaction()).toBe('tianxuan_sect');
    });

    test('should leave current faction', () => {
      system.joinFaction('tianxuan_sect');
      const success = system.leaveFaction();
      expect(success).toBe(true);
      expect(system.getCurrentFaction()).toBeNull();
    });

    test('should not leave when not in a faction', () => {
      const success = system.leaveFaction();
      expect(success).toBe(false);
    });

    test('should check membership', () => {
      system.joinFaction('tianxuan_sect');
      expect(system.isMemberOf('tianxuan_sect')).toBe(true);
      expect(system.isMemberOf('qingyun_sect')).toBe(false);
    });

    test('should initialize reputation when joining faction', () => {
      system.joinFaction('tianxuan_sect');
      expect(system.getFactionReputation('tianxuan_sect')).toBe(0);
    });
  });

  describe('Faction Reputation', () => {
    test('should get faction reputation', () => {
      state.faction.reputation.set('tianxuan_sect', 50);
      expect(system.getFactionReputation('tianxuan_sect')).toBe(50);
    });

    test('should return 0 for unknown faction', () => {
      expect(system.getFactionReputation('unknown_faction')).toBe(0);
    });

    test('should set faction reputation', () => {
      system.setFactionReputation('tianxuan_sect', 30);
      expect(system.getFactionReputation('tianxuan_sect')).toBe(30);
    });

    test('should change faction reputation', () => {
      system.setFactionReputation('tianxuan_sect', 20);
      const newValue = system.changeFactionReputation('tianxuan_sect', 10);
      expect(newValue).toBe(30);
      expect(system.getFactionReputation('tianxuan_sect')).toBe(30);
    });

    test('should handle negative reputation changes', () => {
      system.setFactionReputation('tianxuan_sect', 50);
      system.changeFactionReputation('tianxuan_sect', -30);
      expect(system.getFactionReputation('tianxuan_sect')).toBe(20);
    });

    test('should get all faction reputations', () => {
      system.setFactionReputation('tianxuan_sect', 30);
      system.setFactionReputation('qingyun_sect', 20);
      
      const reputations = system.getAllFactionReputations();
      expect(reputations.size).toBe(2);
      expect(reputations.get('tianxuan_sect')).toBe(30);
      expect(reputations.get('qingyun_sect')).toBe(20);
    });
  });

  describe('Faction Relations', () => {
    test('should get faction relation', () => {
      const relation = system.getFactionRelation('tianxuan_sect', 'qingyun_sect');
      expect(relation).toBe(FactionRelation.Allied);
    });

    test('should return neutral for unknown faction pairs', () => {
      const relation = system.getFactionRelation('unknown1', 'unknown2');
      expect(relation).toBe(FactionRelation.Neutral);
    });

    test('should set faction relation', () => {
      system.setFactionRelation('tianxuan_sect', 'rogue_alliance', FactionRelation.Allied);
      expect(system.getFactionRelation('tianxuan_sect', 'rogue_alliance')).toBe(FactionRelation.Allied);
    });

    test('should handle faction order in relation key', () => {
      system.setFactionRelation('faction_a', 'faction_b', FactionRelation.Hostile);
      expect(system.getFactionRelation('faction_b', 'faction_a')).toBe(FactionRelation.Hostile);
    });

    test('should check if factions are hostile', () => {
      expect(system.areFactionsHostile('tianxuan_sect', 'blood_demon_sect')).toBe(true);
      expect(system.areFactionsHostile('tianxuan_sect', 'qingyun_sect')).toBe(false);
    });

    test('should check if factions are allied', () => {
      expect(system.areFactionsAllied('tianxuan_sect', 'qingyun_sect')).toBe(true);
      expect(system.areFactionsAllied('tianxuan_sect', 'blood_demon_sect')).toBe(false);
    });

    test('should get hostile factions', () => {
      const hostile = system.getHostileFactions('tianxuan_sect');
      expect(hostile).toContain('blood_demon_sect');
    });

    test('should get allied factions', () => {
      const allied = system.getAlliedFactions('tianxuan_sect');
      expect(allied).toContain('qingyun_sect');
    });
  });

  describe('Faction Quests and Resources', () => {
    test('should allow faction quest when member with sufficient reputation', () => {
      system.joinFaction('tianxuan_sect');
      system.setFactionReputation('tianxuan_sect', 50);
      expect(system.canAcceptFactionQuest('tianxuan_sect', 30)).toBe(true);
    });

    test('should not allow faction quest when not a member', () => {
      system.setFactionReputation('tianxuan_sect', 50);
      expect(system.canAcceptFactionQuest('tianxuan_sect', 30)).toBe(false);
    });

    test('should not allow faction quest with insufficient reputation', () => {
      system.joinFaction('tianxuan_sect');
      system.setFactionReputation('tianxuan_sect', 20);
      expect(system.canAcceptFactionQuest('tianxuan_sect', 30)).toBe(false);
    });

    test('should allow faction resources when member with sufficient reputation', () => {
      system.joinFaction('tianxuan_sect');
      system.setFactionReputation('tianxuan_sect', 40);
      expect(system.canAccessFactionResources('tianxuan_sect', 30)).toBe(true);
    });

    test('should not allow faction resources when not a member', () => {
      system.setFactionReputation('tianxuan_sect', 50);
      expect(system.canAccessFactionResources('tianxuan_sect', 30)).toBe(false);
    });
  });

  describe('Faction Choice Consequences', () => {
    test('should increase chosen faction reputation', () => {
      system.setFactionReputation('tianxuan_sect', 10);
      system.applyFactionChoiceConsequences('tianxuan_sect', 20);
      expect(system.getFactionReputation('tianxuan_sect')).toBe(30);
    });

    test('should decrease hostile faction reputation', () => {
      system.setFactionReputation('blood_demon_sect', 10);
      system.applyFactionChoiceConsequences('tianxuan_sect', 20);
      expect(system.getFactionReputation('blood_demon_sect')).toBe(-10);
    });

    test('should increase allied faction reputation', () => {
      system.setFactionReputation('qingyun_sect', 10);
      system.applyFactionChoiceConsequences('tianxuan_sect', 20);
      expect(system.getFactionReputation('qingyun_sect')).toBe(20); // 10 + (20 * 0.5)
    });

    test('should handle multiple hostile factions', () => {
      system.setFactionRelation('tianxuan_sect', 'faction_x', FactionRelation.Hostile);
      system.setFactionReputation('blood_demon_sect', 10);
      system.setFactionReputation('faction_x', 10);
      
      system.applyFactionChoiceConsequences('tianxuan_sect', 20);
      
      expect(system.getFactionReputation('blood_demon_sect')).toBe(-10);
      expect(system.getFactionReputation('faction_x')).toBe(-10);
    });
  });

  describe('Faction Definitions', () => {
    test('should get faction definition', () => {
      const definition = system.getFactionDefinition('tianxuan_sect');
      expect(definition).toBeDefined();
      expect(definition?.name).toBe('天玄宗');
      expect(definition?.type).toBe(FactionType.RighteousSect);
    });

    test('should return undefined for unknown faction', () => {
      const definition = system.getFactionDefinition('unknown_faction');
      expect(definition).toBeUndefined();
    });

    test('should register custom faction', () => {
      system.registerFaction({
        id: 'custom_faction',
        name: '自定义势力',
        type: FactionType.RogueCultivator,
        description: '测试势力'
      });
      
      const definition = system.getFactionDefinition('custom_faction');
      expect(definition).toBeDefined();
      expect(definition?.name).toBe('自定义势力');
    });

    test('should get all factions', () => {
      const factions = system.getAllFactions();
      expect(factions.length).toBeGreaterThan(0);
      expect(factions.some(f => f.id === 'tianxuan_sect')).toBe(true);
    });

    test('should get factions by type', () => {
      const righteousFactions = system.getFactionsByType(FactionType.RighteousSect);
      expect(righteousFactions.length).toBeGreaterThan(0);
      expect(righteousFactions.every(f => f.type === FactionType.RighteousSect)).toBe(true);
    });
  });

  describe('Faction Summary', () => {
    test('should get faction summary', () => {
      system.joinFaction('tianxuan_sect');
      system.setFactionReputation('tianxuan_sect', 30);
      system.setFactionReputation('qingyun_sect', 20);
      
      const summary = system.getFactionSummary();
      expect(summary.currentFaction).toBe('tianxuan_sect');
      expect(summary.reputations.length).toBe(2);
      
      const tianxuanRep = summary.reputations.find(r => r.factionId === 'tianxuan_sect');
      expect(tianxuanRep?.reputation).toBe(30);
      expect(tianxuanRep?.name).toBe('天玄宗');
    });

    test('should handle no current faction', () => {
      system.setFactionReputation('tianxuan_sect', 10);
      const summary = system.getFactionSummary();
      expect(summary.currentFaction).toBeNull();
      expect(summary.reputations.length).toBe(1);
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
