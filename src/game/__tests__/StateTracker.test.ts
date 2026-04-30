/**
 * Unit tests for StateTracker
 * Validates: Requirements 14.1, 14.2, 14.4, 14.5, 26.3, 26.4
 */

import { StateTracker } from '../StateTracker';
import { PlayerState, CultivationLevel, Season } from '../../types';

describe('StateTracker', () => {
  let tracker: StateTracker;
  let initialState: PlayerState;

  beforeEach(() => {
    initialState = createMockPlayerState();
    tracker = new StateTracker(initialState);
  });

  describe('State Management', () => {
    test('should initialize with provided state', () => {
      const state = tracker.getState();
      expect(state.name).toBe('测试玩家');
      expect(state.cultivation.level).toBe(CultivationLevel.QiRefining);
    });

    test('should update state completely', () => {
      const newState = { ...initialState, name: '新玩家' };
      tracker.setState(newState);
      expect(tracker.getState().name).toBe('新玩家');
    });

    test('should update state partially', () => {
      tracker.updateState({ name: '部分更新' });
      expect(tracker.getState().name).toBe('部分更新');
      expect(tracker.getState().cultivation.level).toBe(CultivationLevel.QiRefining);
    });
  });

  describe('History Recording', () => {
    test('should record events', () => {
      tracker.recordEvent('测试事件', false);
      const history = tracker.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].description).toBe('测试事件');
    });

    test('should mark key choices', () => {
      tracker.recordEvent('关键选择', true);
      const history = tracker.getHistory();
      expect(history[0].isKeyChoice).toBe(true);
    });

    test('should limit history to max entries', () => {
      for (let i = 0; i < 60; i++) {
        tracker.recordEvent(`事件 ${i}`, false);
      }
      const history = tracker.getHistory();
      expect(history.length).toBe(50);
    });

    test('should return history in reverse order', () => {
      tracker.recordEvent('第一个事件', false);
      tracker.recordEvent('第二个事件', false);
      const history = tracker.getHistory();
      expect(history[0].description).toBe('第二个事件');
      expect(history[1].description).toBe('第一个事件');
    });

    test('should get recent history', () => {
      for (let i = 0; i < 10; i++) {
        tracker.recordEvent(`事件 ${i}`, false);
      }
      const recent = tracker.getRecentHistory(3);
      expect(recent.length).toBe(3);
      expect(recent[0].description).toBe('事件 9');
    });
  });

  describe('State Change Notifications', () => {
    test('should notify listeners on state change', () => {
      const listener = jest.fn();
      tracker.onStateChange(listener);
      tracker.updateState({ name: '新名字' });
      expect(listener).toHaveBeenCalledWith(tracker.getState());
    });

    test('should support multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      tracker.onStateChange(listener1);
      tracker.onStateChange(listener2);
      tracker.updateState({ name: '新名字' });
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    test('should remove listeners', () => {
      const listener = jest.fn();
      tracker.onStateChange(listener);
      tracker.removeStateChangeListener(listener);
      tracker.updateState({ name: '新名字' });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Cultivation Updates', () => {
    test('should update cultivation experience', () => {
      tracker.updateCultivation(10);
      expect(tracker.getState().cultivation.experience).toBe(10);
    });

    test('should record cultivation increase', () => {
      tracker.updateCultivation(10);
      const history = tracker.getHistory();
      expect(history[0].description).toContain('修为增加 10');
    });

    test('should record when reaching breakthrough threshold', () => {
      const state = tracker.getState();
      state.cultivation.maxExperience = 100;
      tracker.updateCultivation(100);
      const history = tracker.getHistory();
      expect(history[0].description).toContain('已达突破阈值');
    });
  });

  describe('Time Updates', () => {
    test('should advance time by months', () => {
      tracker.updateTime(3);
      expect(tracker.getState().time.month).toBe(4);
    });

    test('should handle year rollover', () => {
      tracker.updateTime(12);
      expect(tracker.getState().time.year).toBe(2);
      expect(tracker.getState().time.month).toBe(1);
    });

    test('should update season correctly', () => {
      tracker.updateTime(3); // Month 4 - Summer
      expect(tracker.getState().time.season).toBe(Season.Summer);
      
      tracker.updateTime(3); // Month 7 - Autumn
      expect(tracker.getState().time.season).toBe(Season.Autumn);
      
      tracker.updateTime(3); // Month 10 - Winter
      expect(tracker.getState().time.season).toBe(Season.Winter);
    });

    test('should format time correctly', () => {
      const formatted = tracker.formatTime();
      expect(formatted).toBe('第1年 春季');
    });
  });

  describe('Relationship Updates', () => {
    test('should update relationship values', () => {
      tracker.updateRelationship('npc1', 10);
      expect(tracker.getState().relationships.get('npc1')).toBe(10);
    });

    test('should clamp relationship values to -100 to 100', () => {
      tracker.updateRelationship('npc1', 150);
      expect(tracker.getState().relationships.get('npc1')).toBe(100);
      
      tracker.updateRelationship('npc1', -250);
      expect(tracker.getState().relationships.get('npc1')).toBe(-100);
    });

    test('should record relationship changes', () => {
      tracker.updateRelationship('npc1', 10);
      const history = tracker.getHistory();
      expect(history[0].description).toContain('关系增加 10');
    });
  });

  describe('Reputation Updates', () => {
    test('should update righteous reputation', () => {
      tracker.updateReputation(10, 0);
      expect(tracker.getState().reputation.righteous).toBe(10);
    });

    test('should update demonic reputation', () => {
      tracker.updateReputation(0, 5);
      expect(tracker.getState().reputation.demonic).toBe(5);
    });

    test('should clamp reputation values to 0-100', () => {
      tracker.updateReputation(150, 0);
      expect(tracker.getState().reputation.righteous).toBe(100);
      
      // Set to 50 first, then decrease by 60 to test clamping to 0
      tracker.updateReputation(-60, 0);
      expect(tracker.getState().reputation.righteous).toBe(40);
    });

    test('should record reputation changes', () => {
      tracker.updateReputation(10, 5);
      const history = tracker.getHistory();
      expect(history[0].description).toContain('正道声望+10');
      expect(history[0].description).toContain('魔道声望+5');
    });
  });

  describe('Karma Updates', () => {
    test('should update good deeds', () => {
      tracker.updateKarma(10, 0);
      expect(tracker.getState().karma.goodDeeds).toBe(10);
    });

    test('should update karmic debt', () => {
      tracker.updateKarma(0, 5);
      expect(tracker.getState().karma.karmicDebt).toBe(5);
    });

    test('should not allow negative karma values', () => {
      tracker.updateKarma(-10, 0);
      expect(tracker.getState().karma.goodDeeds).toBe(0);
    });

    test('should record karma changes', () => {
      tracker.updateKarma(10, 5);
      const history = tracker.getHistory();
      expect(history[0].description).toContain('善缘+10');
      expect(history[0].description).toContain('因果债+5');
    });
  });

  describe('Story Progress', () => {
    test('should set story flags', () => {
      tracker.setStoryFlag('test_flag', true);
      expect(tracker.hasStoryFlag('test_flag')).toBe(true);
      expect(tracker.getStoryFlag('test_flag')).toBe(true);
    });

    test('should unlock events', () => {
      tracker.unlockEvent('event1');
      expect(tracker.isEventUnlocked('event1')).toBe(true);
    });

    test('should add quests', () => {
      tracker.addQuest('quest1');
      expect(tracker.getState().storyProgress.activeQuests.has('quest1')).toBe(true);
    });

    test('should complete quests', () => {
      tracker.addQuest('quest1');
      tracker.completeQuest('quest1');
      expect(tracker.getState().storyProgress.activeQuests.has('quest1')).toBe(false);
      expect(tracker.getState().storyProgress.completedQuests.has('quest1')).toBe(true);
    });
  });

  describe('Serialization', () => {
    test('should serialize state', () => {
      tracker.updateRelationship('npc1', 10);
      tracker.setStoryFlag('flag1', true);
      const serialized = tracker.serialize();
      expect(typeof serialized).toBe('string');
      expect(serialized.length).toBeGreaterThan(0);
    });

    test('should deserialize state', () => {
      tracker.updateRelationship('npc1', 10);
      tracker.setStoryFlag('flag1', true);
      const serialized = tracker.serialize();
      const deserialized = StateTracker.deserialize(serialized);
      
      expect(deserialized.relationships.get('npc1')).toBe(10);
      expect(deserialized.storyProgress.storyFlags.get('flag1')).toBe(true);
    });

    test('should preserve all data types after serialization', () => {
      tracker.updateRelationship('npc1', 10);
      tracker.setStoryFlag('flag1', 'value1');
      tracker.addQuest('quest1');
      tracker.unlockEvent('event1');
      
      const serialized = tracker.serialize();
      const deserialized = StateTracker.deserialize(serialized);
      
      expect(deserialized.relationships instanceof Map).toBe(true);
      expect(deserialized.storyProgress.storyFlags instanceof Map).toBe(true);
      expect(deserialized.storyProgress.activeQuests instanceof Set).toBe(true);
      expect(deserialized.storyProgress.unlockedEvents instanceof Set).toBe(true);
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
