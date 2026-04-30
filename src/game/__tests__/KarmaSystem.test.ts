/**
 * Unit tests for KarmaSystem
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { KarmaSystem, KarmaEventType } from '../KarmaSystem';
import { PlayerState, CultivationLevel, Season } from '../../types';

describe('KarmaSystem', () => {
  let system: KarmaSystem;
  let state: PlayerState;

  beforeEach(() => {
    state = createMockPlayerState();
    system = new KarmaSystem(state);
  });

  describe('Karma Value Management', () => {
    test('should get initial good deeds value', () => {
      expect(system.getGoodDeeds()).toBe(0);
    });

    test('should get initial karmic debt value', () => {
      expect(system.getKarmicDebt()).toBe(0);
    });

    test('should add good deeds', () => {
      system.addGoodDeeds(10);
      expect(system.getGoodDeeds()).toBe(10);
    });

    test('should add karmic debt', () => {
      system.addKarmicDebt(20);
      expect(system.getKarmicDebt()).toBe(20);
    });

    test('should throw error when adding negative good deeds', () => {
      expect(() => system.addGoodDeeds(-10)).toThrow('Good deeds amount must be non-negative');
    });

    test('should throw error when adding negative karmic debt', () => {
      expect(() => system.addKarmicDebt(-10)).toThrow('Karmic debt amount must be non-negative');
    });

    test('should reduce good deeds', () => {
      system.addGoodDeeds(50);
      system.reduceGoodDeeds(20);
      expect(system.getGoodDeeds()).toBe(30);
    });

    test('should reduce karmic debt', () => {
      system.addKarmicDebt(50);
      system.reduceKarmicDebt(20);
      expect(system.getKarmicDebt()).toBe(30);
    });

    test('should not reduce good deeds below 0', () => {
      system.addGoodDeeds(10);
      system.reduceGoodDeeds(20);
      expect(system.getGoodDeeds()).toBe(0);
    });

    test('should not reduce karmic debt below 0', () => {
      system.addKarmicDebt(10);
      system.reduceKarmicDebt(20);
      expect(system.getKarmicDebt()).toBe(0);
    });
  });

  describe('Karma Event Triggering', () => {
    test('should not trigger karma event with low karma values', () => {
      system.addGoodDeeds(10);
      system.addKarmicDebt(10);
      
      // Run multiple times to ensure it doesn't trigger
      let triggered = false;
      for (let i = 0; i < 100; i++) {
        const event = system.shouldTriggerKarmaEvent();
        if (event) {
          triggered = true;
          break;
        }
      }
      
      expect(triggered).toBe(false);
    });

    test('should trigger helpful event with high good deeds', () => {
      system.addGoodDeeds(60);
      
      // Run multiple times to test probability
      let triggered = false;
      let eventType: KarmaEventType | null = null;
      
      for (let i = 0; i < 100; i++) {
        const event = system.shouldTriggerKarmaEvent();
        if (event) {
          triggered = true;
          eventType = event.type;
          break;
        }
      }
      
      expect(triggered).toBe(true);
      expect(eventType).toBe(KarmaEventType.HelpfulEvent);
    });

    test('should trigger enemy pursuit with high karmic debt', () => {
      system.addKarmicDebt(60);
      
      // Run multiple times to test probability
      let triggered = false;
      let eventType: KarmaEventType | null = null;
      
      for (let i = 0; i < 100; i++) {
        const event = system.shouldTriggerKarmaEvent();
        if (event) {
          triggered = true;
          eventType = event.type;
          break;
        }
      }
      
      expect(triggered).toBe(true);
      expect(eventType).toBe(KarmaEventType.EnemyPursuit);
    });

    test('should increase probability with higher good deeds', () => {
      system.addGoodDeeds(80);
      
      let triggerCount = 0;
      for (let i = 0; i < 100; i++) {
        const event = system.shouldTriggerKarmaEvent();
        if (event && event.type === KarmaEventType.HelpfulEvent) {
          triggerCount++;
        }
      }
      
      // With 80 good deeds, should trigger more frequently
      expect(triggerCount).toBeGreaterThan(20);
    });

    test('should increase probability with higher karmic debt', () => {
      system.addKarmicDebt(80);
      
      let triggerCount = 0;
      for (let i = 0; i < 100; i++) {
        const event = system.shouldTriggerKarmaEvent();
        if (event && event.type === KarmaEventType.EnemyPursuit) {
          triggerCount++;
        }
      }
      
      // With 80 karmic debt, should trigger more frequently
      expect(triggerCount).toBeGreaterThan(15);
    });
  });

  describe('Event Trigger Modifier', () => {
    test('should return 0 modifier with balanced karma', () => {
      system.addGoodDeeds(50);
      system.addKarmicDebt(50);
      expect(system.getEventTriggerModifier()).toBe(0);
    });

    test('should return positive modifier with more good deeds', () => {
      system.addGoodDeeds(60);
      system.addKarmicDebt(10);
      expect(system.getEventTriggerModifier()).toBeGreaterThan(0);
    });

    test('should return negative modifier with more karmic debt', () => {
      system.addGoodDeeds(10);
      system.addKarmicDebt(60);
      expect(system.getEventTriggerModifier()).toBeLessThan(0);
    });

    test('should clamp modifier to -0.5 to 0.5 range', () => {
      system.addGoodDeeds(1000);
      expect(system.getEventTriggerModifier()).toBeLessThanOrEqual(0.5);
      
      system.setKarma(0, 1000);
      expect(system.getEventTriggerModifier()).toBeGreaterThanOrEqual(-0.5);
    });
  });

  describe('Good and Evil Deed Recording', () => {
    test('should record good deed with history', () => {
      system.recordGoodDeed('救助村民', 10);
      
      expect(system.getGoodDeeds()).toBe(10);
      expect(state.history.length).toBeGreaterThan(0);
      expect(state.history[0].description).toContain('救助村民');
      expect(state.history[0].description).toContain('善缘+10');
      expect(state.history[0].isKeyChoice).toBe(true);
    });

    test('should record evil deed with history', () => {
      system.recordEvilDeed('杀害无辜', 20);
      
      expect(system.getKarmicDebt()).toBe(20);
      expect(state.history.length).toBeGreaterThan(0);
      expect(state.history[0].description).toContain('杀害无辜');
      expect(state.history[0].description).toContain('因果债+20');
      expect(state.history[0].isKeyChoice).toBe(true);
    });
  });

  describe('NPC Influence', () => {
    test('should return 0 influence with low karma values', () => {
      system.addGoodDeeds(20);
      system.addKarmicDebt(10);
      expect(system.getKarmaInfluenceOnNPC('npc1')).toBe(0);
    });

    test('should return positive influence with high good deeds', () => {
      system.addGoodDeeds(50);
      expect(system.getKarmaInfluenceOnNPC('npc1')).toBeGreaterThan(0);
    });

    test('should return negative influence with high karmic debt', () => {
      system.addKarmicDebt(50);
      expect(system.getKarmaInfluenceOnNPC('npc1')).toBeLessThan(0);
    });

    test('should calculate correct influence value', () => {
      system.addGoodDeeds(40);
      expect(system.getKarmaInfluenceOnNPC('npc1')).toBe(4);
      
      system.setKarma(0, 60);
      expect(system.getKarmaInfluenceOnNPC('npc1')).toBe(-6);
    });
  });

  describe('Karma Status Description', () => {
    test('should return correct status for high good deeds', () => {
      system.addGoodDeeds(85);
      expect(system.getKarmaStatus()).toBe('功德无量');
      
      system.setKarma(55, 0);
      expect(system.getKarmaStatus()).toBe('善缘深厚');
    });

    test('should return correct status for high karmic debt', () => {
      system.addKarmicDebt(85);
      expect(system.getKarmaStatus()).toBe('罪孽深重');
      
      system.setKarma(0, 55);
      expect(system.getKarmaStatus()).toBe('因果缠身');
    });

    test('should return correct status for balanced karma', () => {
      system.addGoodDeeds(30);
      system.addKarmicDebt(10);
      expect(system.getKarmaStatus()).toBe('善多于恶');
      
      system.setKarma(10, 30);
      expect(system.getKarmaStatus()).toBe('恶多于善');
      
      system.setKarma(20, 20);
      expect(system.getKarmaStatus()).toBe('因果平衡');
    });
  });

  describe('Tribulation Influence', () => {
    test('should not trigger inner demon with low karmic debt', () => {
      system.addKarmicDebt(30);
      const influence = system.getTribulationInfluence();
      
      expect(influence.willTriggerInnerDemon).toBe(false);
      expect(influence.difficultyModifier).toBe(0.3);
    });

    test('should trigger inner demon with high karmic debt', () => {
      system.addKarmicDebt(60);
      const influence = system.getTribulationInfluence();
      
      expect(influence.willTriggerInnerDemon).toBe(true);
      expect(influence.difficultyModifier).toBe(0.6);
    });

    test('should increase difficulty modifier with karmic debt', () => {
      system.addKarmicDebt(100);
      const influence = system.getTribulationInfluence();
      
      expect(influence.difficultyModifier).toBe(1.0);
    });
  });

  describe('Karma Balance', () => {
    test('should calculate karma balance correctly', () => {
      system.addGoodDeeds(60);
      system.addKarmicDebt(20);
      expect(system.getKarmaBalance()).toBe(40);
      
      system.setKarma(20, 60);
      expect(system.getKarmaBalance()).toBe(-40);
      
      system.setKarma(50, 50);
      expect(system.getKarmaBalance()).toBe(0);
    });
  });

  describe('Person Type Checks', () => {
    test('should identify good person', () => {
      system.addGoodDeeds(60);
      system.addKarmicDebt(20);
      expect(system.isGoodPerson()).toBe(true);
    });

    test('should not identify good person with low good deeds', () => {
      system.addGoodDeeds(40);
      system.addKarmicDebt(10);
      expect(system.isGoodPerson()).toBe(false);
    });

    test('should not identify good person with high karmic debt', () => {
      system.addGoodDeeds(60);
      system.addKarmicDebt(40);
      expect(system.isGoodPerson()).toBe(false);
    });

    test('should identify evil person', () => {
      system.addKarmicDebt(60);
      system.addGoodDeeds(20);
      expect(system.isEvilPerson()).toBe(true);
    });

    test('should not identify evil person with low karmic debt', () => {
      system.addKarmicDebt(40);
      system.addGoodDeeds(10);
      expect(system.isEvilPerson()).toBe(false);
    });

    test('should not identify evil person with high good deeds', () => {
      system.addKarmicDebt(60);
      system.addGoodDeeds(40);
      expect(system.isEvilPerson()).toBe(false);
    });
  });

  describe('Karma Reset and Set', () => {
    test('should reset karma to 0', () => {
      system.addGoodDeeds(50);
      system.addKarmicDebt(30);
      system.resetKarma();
      
      expect(system.getGoodDeeds()).toBe(0);
      expect(system.getKarmicDebt()).toBe(0);
    });

    test('should set karma values', () => {
      system.setKarma(40, 20);
      
      expect(system.getGoodDeeds()).toBe(40);
      expect(system.getKarmicDebt()).toBe(20);
    });

    test('should throw error when setting negative karma values', () => {
      expect(() => system.setKarma(-10, 20)).toThrow('Karma values must be non-negative');
      expect(() => system.setKarma(20, -10)).toThrow('Karma values must be non-negative');
    });
  });

  describe('Karma Change Listeners', () => {
    test('should notify listeners on karma change', () => {
      let notified = false;
      let goodDeedsValue = 0;
      let karmicDebtValue = 0;

      system.onKarmaChange((goodDeeds, karmicDebt) => {
        notified = true;
        goodDeedsValue = goodDeeds;
        karmicDebtValue = karmicDebt;
      });

      system.addGoodDeeds(10);

      expect(notified).toBe(true);
      expect(goodDeedsValue).toBe(10);
      expect(karmicDebtValue).toBe(0);
    });

    test('should remove karma change listener', () => {
      let notifyCount = 0;

      const listener = () => {
        notifyCount++;
      };

      system.onKarmaChange(listener);
      system.addGoodDeeds(10);
      expect(notifyCount).toBe(1);

      system.removeKarmaChangeListener(listener);
      system.addGoodDeeds(10);
      expect(notifyCount).toBe(1); // Should not increase
    });

    test('should notify multiple listeners', () => {
      let notify1 = false;
      let notify2 = false;

      system.onKarmaChange(() => { notify1 = true; });
      system.onKarmaChange(() => { notify2 = true; });

      system.addKarmicDebt(10);

      expect(notify1).toBe(true);
      expect(notify2).toBe(true);
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
