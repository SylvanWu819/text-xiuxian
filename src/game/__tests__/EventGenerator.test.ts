/**
 * Unit tests for EventGenerator
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import { EventGenerator } from '../EventGenerator';
import { PlayerState, GameEvent, CultivationLevel, Season, EventType } from '../../types';

describe('EventGenerator', () => {
  let generator: EventGenerator;
  let state: PlayerState;

  beforeEach(() => {
    state = createMockPlayerState();
    generator = new EventGenerator();
  });

  describe('Event Pool Management', () => {
    test('should initialize with default events', () => {
      const events = generator.getAllEvents();
      expect(events.length).toBeGreaterThan(0);
    });

    test('should register new event', () => {
      const customEvent: GameEvent = {
        id: 'custom_event',
        type: EventType.Fortune,
        title: '自定义事件',
        description: '测试事件',
        triggerConditions: {},
        options: []
      };

      generator.registerEvent(customEvent, 15);
      const event = generator.getEventById('custom_event');
      
      expect(event).toBeDefined();
      expect(event?.title).toBe('自定义事件');
      expect(generator.getEventWeight('custom_event')).toBe(15);
    });

    test('should unregister event', () => {
      const event = generator.getEventById('ancient_cave');
      expect(event).toBeDefined();

      generator.unregisterEvent('ancient_cave');
      const removedEvent = generator.getEventById('ancient_cave');
      
      expect(removedEvent).toBeUndefined();
    });

    test('should get events by type', () => {
      const fortuneEvents = generator.getEventsByType(EventType.Fortune);
      expect(fortuneEvents.length).toBeGreaterThan(0);
      expect(fortuneEvents.every(e => e.type === EventType.Fortune)).toBe(true);
    });

    test('should clear event pool', () => {
      generator.clearEventPool();
      const events = generator.getAllEvents();
      expect(events.length).toBe(0);
    });
  });

  describe('Event Trigger Conditions', () => {
    test('should check minimum cultivation level', () => {
      const event: GameEvent = {
        id: 'high_level_event',
        type: EventType.Fortune,
        title: '高级事件',
        description: '需要高修为',
        triggerConditions: {
          minCultivationLevel: CultivationLevel.GoldenCore
        },
        options: []
      };

      state.cultivation.level = CultivationLevel.QiRefining;
      expect(generator.checkTriggerConditions(event, state)).toBe(false);

      state.cultivation.level = CultivationLevel.GoldenCore;
      expect(generator.checkTriggerConditions(event, state)).toBe(true);

      state.cultivation.level = CultivationLevel.NascentSoul;
      expect(generator.checkTriggerConditions(event, state)).toBe(true);
    });

    test('should check maximum cultivation level', () => {
      const event: GameEvent = {
        id: 'low_level_event',
        type: EventType.Fortune,
        title: '低级事件',
        description: '只对低修为开放',
        triggerConditions: {
          maxCultivationLevel: CultivationLevel.FoundationEstablishment
        },
        options: []
      };

      state.cultivation.level = CultivationLevel.QiRefining;
      expect(generator.checkTriggerConditions(event, state)).toBe(true);

      state.cultivation.level = CultivationLevel.FoundationEstablishment;
      expect(generator.checkTriggerConditions(event, state)).toBe(true);

      state.cultivation.level = CultivationLevel.GoldenCore;
      expect(generator.checkTriggerConditions(event, state)).toBe(false);
    });

    test('should check required cultivation path', () => {
      const event: GameEvent = {
        id: 'sword_event',
        type: EventType.Fortune,
        title: '剑修专属',
        description: '只有剑修可以触发',
        triggerConditions: {
          requiredPath: 'sword'
        },
        options: []
      };

      state.cultivationPath.id = 'sword';
      expect(generator.checkTriggerConditions(event, state)).toBe(true);

      state.cultivationPath.id = 'body';
      expect(generator.checkTriggerConditions(event, state)).toBe(false);
    });

    test('should check minimum reputation', () => {
      const event: GameEvent = {
        id: 'righteous_event',
        type: EventType.Quest,
        title: '正道任务',
        description: '需要正道声望',
        triggerConditions: {
          minReputation: { righteous: 50 }
        },
        options: []
      };

      state.reputation.righteous = 30;
      expect(generator.checkTriggerConditions(event, state)).toBe(false);

      state.reputation.righteous = 50;
      expect(generator.checkTriggerConditions(event, state)).toBe(true);

      state.reputation.righteous = 70;
      expect(generator.checkTriggerConditions(event, state)).toBe(true);
    });

    test('should check required story flags', () => {
      const event: GameEvent = {
        id: 'sequel_event',
        type: EventType.Story,
        title: '后续事件',
        description: '需要完成前置任务',
        triggerConditions: {
          requiredFlags: ['quest_1_completed', 'met_elder']
        },
        options: []
      };

      expect(generator.checkTriggerConditions(event, state)).toBe(false);

      state.storyProgress.storyFlags.set('quest_1_completed', true);
      expect(generator.checkTriggerConditions(event, state)).toBe(false);

      state.storyProgress.storyFlags.set('met_elder', true);
      expect(generator.checkTriggerConditions(event, state)).toBe(true);
    });

    test('should check event probability', () => {
      const event: GameEvent = {
        id: 'rare_event',
        type: EventType.Fortune,
        title: '稀有事件',
        description: '低概率触发',
        triggerConditions: {
          probability: 0.01 // 1% probability
        },
        options: []
      };

      // Run multiple times to test probability
      let triggered = 0;
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        if (generator.checkTriggerConditions(event, state)) {
          triggered++;
        }
      }

      // Should trigger roughly 1% of the time (with some variance)
      expect(triggered).toBeGreaterThan(0);
      expect(triggered).toBeLessThan(50); // Should be much less than 5%
    });

    test('should check combined conditions', () => {
      const event: GameEvent = {
        id: 'complex_event',
        type: EventType.Quest,
        title: '复杂事件',
        description: '多重条件',
        triggerConditions: {
          minCultivationLevel: CultivationLevel.FoundationEstablishment,
          requiredPath: 'sword',
          minReputation: { righteous: 30 },
          requiredFlags: ['joined_sect']
        },
        options: []
      };

      // Missing all conditions
      expect(generator.checkTriggerConditions(event, state)).toBe(false);

      // Meet cultivation level
      state.cultivation.level = CultivationLevel.FoundationEstablishment;
      expect(generator.checkTriggerConditions(event, state)).toBe(false);

      // Meet path requirement
      state.cultivationPath.id = 'sword';
      expect(generator.checkTriggerConditions(event, state)).toBe(false);

      // Meet reputation
      state.reputation.righteous = 30;
      expect(generator.checkTriggerConditions(event, state)).toBe(false);

      // Meet all conditions
      state.storyProgress.storyFlags.set('joined_sect', true);
      expect(generator.checkTriggerConditions(event, state)).toBe(true);
    });
  });

  describe('Event Triggering', () => {
    test('should try to trigger event with probability', () => {
      // With 100% trigger probability, should always return an event
      const event = generator.tryTriggerEvent(state, 1.0);
      expect(event).toBeDefined();
    });

    test('should not trigger event with 0% probability', () => {
      const event = generator.tryTriggerEvent(state, 0.0);
      expect(event).toBeNull();
    });

    test('should return null when no eligible events', () => {
      generator.clearEventPool();
      const event = generator.tryTriggerEvent(state, 1.0);
      expect(event).toBeNull();
    });

    test('should get eligible event count', () => {
      const count = generator.getEligibleEventCount(state);
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Weighted Random Selection', () => {
    test('should set and get event weight', () => {
      generator.setEventWeight('ancient_cave', 50);
      expect(generator.getEventWeight('ancient_cave')).toBe(50);
    });

    test('should throw error for negative weight', () => {
      expect(() => generator.setEventWeight('ancient_cave', -10)).toThrow('Weight must be non-negative');
    });

    test('should use default weight for unregistered events', () => {
      expect(generator.getEventWeight('nonexistent_event')).toBe(10);
    });

    test('should select events based on weight distribution', () => {
      generator.clearEventPool();

      const event1: GameEvent = {
        id: 'common_event',
        type: EventType.Fortune,
        title: '常见事件',
        description: '高权重',
        triggerConditions: {},
        options: []
      };

      const event2: GameEvent = {
        id: 'rare_event',
        type: EventType.Fortune,
        title: '稀有事件',
        description: '低权重',
        triggerConditions: {},
        options: []
      };

      generator.registerEvent(event1, 90); // 90% weight
      generator.registerEvent(event2, 10); // 10% weight

      const selections: { [key: string]: number } = {};
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const event = generator.tryTriggerEvent(state, 1.0);
        if (event) {
          selections[event.id] = (selections[event.id] || 0) + 1;
        }
      }

      // Common event should be selected much more often
      expect(selections['common_event']).toBeGreaterThan(selections['rare_event']);
    });
  });

  describe('Event Chains', () => {
    test('should trigger next event in chain', () => {
      state.storyProgress.storyFlags.set('sect_quest_1_completed', true);
      
      const nextEvent = generator.triggerNextEvent('sect_quest_1', state);
      
      expect(nextEvent).toBeDefined();
      expect(nextEvent?.id).toBe('sect_quest_2');
    });

    test('should return null if no next event', () => {
      const nextEvent = generator.triggerNextEvent('ancient_cave', state);
      expect(nextEvent).toBeNull();
    });

    test('should return null if next event conditions not met', () => {
      // sect_quest_2 requires 'sect_quest_1_completed' flag
      const nextEvent = generator.triggerNextEvent('sect_quest_1', state);
      expect(nextEvent).toBeNull();
    });

    test('should track triggered event chains', () => {
      state.storyProgress.storyFlags.set('sect_quest_1_completed', true);
      
      expect(generator.isEventChainTriggered('sect_quest_1')).toBe(false);
      
      generator.triggerNextEvent('sect_quest_1', state);
      
      expect(generator.isEventChainTriggered('sect_quest_1')).toBe(true);
    });

    test('should reset event chain', () => {
      state.storyProgress.storyFlags.set('sect_quest_1_completed', true);
      generator.triggerNextEvent('sect_quest_1', state);
      
      expect(generator.isEventChainTriggered('sect_quest_1')).toBe(true);
      
      generator.resetEventChain('sect_quest_1');
      
      expect(generator.isEventChainTriggered('sect_quest_1')).toBe(false);
    });
  });

  describe('Batch Operations', () => {
    test('should register multiple events at once', () => {
      generator.clearEventPool();

      const events = [
        {
          event: {
            id: 'event1',
            type: EventType.Fortune,
            title: '事件1',
            description: '描述1',
            triggerConditions: {},
            options: []
          },
          weight: 10
        },
        {
          event: {
            id: 'event2',
            type: EventType.Crisis,
            title: '事件2',
            description: '描述2',
            triggerConditions: {},
            options: []
          },
          weight: 20
        }
      ];

      generator.registerEvents(events);

      expect(generator.getAllEvents().length).toBe(2);
      expect(generator.getEventWeight('event1')).toBe(10);
      expect(generator.getEventWeight('event2')).toBe(20);
    });

    test('should load events from config', () => {
      generator.clearEventPool();

      const config = {
        events: [
          {
            id: 'config_event',
            type: EventType.Quest,
            title: '配置事件',
            description: '从配置加载',
            triggerConditions: {},
            options: []
          }
        ]
      };

      generator.loadEventsFromConfig(config);

      const event = generator.getEventById('config_event');
      expect(event).toBeDefined();
      expect(event?.title).toBe('配置事件');
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
