/**
 * Unit tests for TimeManager
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { TimeManager, TimeEvent } from '../TimeManager';
import { PlayerState, CultivationLevel, Season } from '../../types';

describe('TimeManager', () => {
  let manager: TimeManager;
  let state: PlayerState;

  beforeEach(() => {
    state = createMockPlayerState();
    manager = new TimeManager(state);
  });

  describe('Time Advancement', () => {
    test('should advance time by months', () => {
      manager.advance({ months: 3 });
      expect(state.time.month).toBe(4);
      expect(state.time.year).toBe(1);
    });

    test('should advance time by years', () => {
      manager.advance({ years: 2 });
      expect(state.time.year).toBe(3);
    });

    test('should handle month overflow to next year', () => {
      manager.advance({ months: 13 });
      expect(state.time.month).toBe(2);
      expect(state.time.year).toBe(2);
    });

    test('should handle multiple year overflow', () => {
      manager.advance({ months: 25 });
      expect(state.time.month).toBe(2);
      expect(state.time.year).toBe(3);
    });

    test('should advance time by days (converted to months)', () => {
      manager.advance({ days: 60 });
      expect(state.time.month).toBe(3);
    });

    test('should handle combined time costs', () => {
      manager.advance({ years: 1, months: 6, days: 30 });
      expect(state.time.year).toBe(2);
      expect(state.time.month).toBe(8);
    });
  });

  describe('Season Updates', () => {
    test('should set season to Spring for months 1-3', () => {
      state.time.month = 1;
      manager.advance({ months: 0 });
      expect(state.time.season).toBe(Season.Spring);

      state.time.month = 2;
      manager.advance({ months: 0 });
      expect(state.time.season).toBe(Season.Spring);

      state.time.month = 3;
      manager.advance({ months: 0 });
      expect(state.time.season).toBe(Season.Spring);
    });

    test('should set season to Summer for months 4-6', () => {
      manager.setTime(1, 4);
      expect(state.time.season).toBe(Season.Summer);

      manager.setTime(1, 6);
      expect(state.time.season).toBe(Season.Summer);
    });

    test('should set season to Autumn for months 7-9', () => {
      manager.setTime(1, 7);
      expect(state.time.season).toBe(Season.Autumn);

      manager.setTime(1, 9);
      expect(state.time.season).toBe(Season.Autumn);
    });

    test('should set season to Winter for months 10-12', () => {
      manager.setTime(1, 10);
      expect(state.time.season).toBe(Season.Winter);

      manager.setTime(1, 12);
      expect(state.time.season).toBe(Season.Winter);
    });

    test('should update season when advancing months', () => {
      state.time.month = 1;
      state.time.season = Season.Spring;
      
      manager.advance({ months: 5 });
      expect(state.time.month).toBe(6);
      expect(state.time.season).toBe(Season.Summer);
    });
  });

  describe('Time Event Triggers', () => {
    test('should trigger sect competition in spring month 1 with faction', () => {
      state.time.year = 1;
      state.time.month = 1;
      state.time.season = Season.Spring;
      state.faction.current = 'righteous_sect';

      const events = manager.checkTimeEvents();
      const sectEvent = events.find(e => e.id === 'sect_competition');
      
      expect(sectEvent).toBeDefined();
      expect(sectEvent?.name).toBe('宗门大比');
    });

    test('should not trigger sect competition without faction', () => {
      state.time.year = 1;
      state.time.month = 1;
      state.time.season = Season.Spring;
      state.faction.current = null;

      const events = manager.checkTimeEvents();
      const sectEvent = events.find(e => e.id === 'sect_competition');
      
      expect(sectEvent).toBeUndefined();
    });

    test('should trigger secret realm every 5 years', () => {
      state.time.year = 5;
      state.time.month = 1;

      const events = manager.checkTimeEvents();
      const realmEvent = events.find(e => e.id === 'secret_realm_opens');
      
      expect(realmEvent).toBeDefined();
      expect(realmEvent?.name).toBe('秘境开启');
    });

    test('should trigger celestial phenomenon every 10 years in month 6', () => {
      state.time.year = 10;
      state.time.month = 6;

      const events = manager.checkTimeEvents();
      const celestialEvent = events.find(e => e.id === 'celestial_phenomenon');
      
      expect(celestialEvent).toBeDefined();
      expect(celestialEvent?.name).toBe('天地异象');
    });

    test('should not trigger events when conditions not met', () => {
      state.time.year = 3;
      state.time.month = 5;

      const events = manager.checkTimeEvents();
      
      expect(events.length).toBe(0);
    });
  });

  describe('Time Event Registration', () => {
    test('should register custom time event', () => {
      const customEvent: TimeEvent = {
        id: 'custom_event',
        name: '自定义事件',
        description: '测试事件',
        triggerCondition: (state) => state.time.year === 2
      };

      manager.registerTimeEvent(customEvent);
      
      state.time.year = 2;
      const events = manager.checkTimeEvents();
      const custom = events.find(e => e.id === 'custom_event');
      
      expect(custom).toBeDefined();
    });

    test('should get all registered time events', () => {
      const events = manager.getTimeEvents();
      expect(events.length).toBeGreaterThan(0);
    });

    test('should clear all time events', () => {
      manager.clearTimeEvents();
      const events = manager.getTimeEvents();
      expect(events.length).toBe(0);
    });
  });

  describe('Time Queries', () => {
    test('should get current time', () => {
      state.time.year = 5;
      state.time.month = 7;
      state.time.season = Season.Autumn;

      const time = manager.getCurrentTime();
      expect(time.year).toBe(5);
      expect(time.month).toBe(7);
      expect(time.season).toBe(Season.Autumn);
    });

    test('should format time correctly', () => {
      state.time.year = 3;
      state.time.season = Season.Summer;

      const formatted = manager.formatTime();
      expect(formatted).toBe('第3年 夏季');
    });

    test('should get season name', () => {
      expect(manager.getSeasonName(Season.Spring)).toBe('春季');
      expect(manager.getSeasonName(Season.Summer)).toBe('夏季');
      expect(manager.getSeasonName(Season.Autumn)).toBe('秋季');
      expect(manager.getSeasonName(Season.Winter)).toBe('冬季');
    });

    test('should get current year', () => {
      state.time.year = 10;
      expect(manager.getCurrentYear()).toBe(10);
    });

    test('should get current month', () => {
      state.time.month = 7;
      expect(manager.getCurrentMonth()).toBe(7);
    });

    test('should get current season', () => {
      state.time.season = Season.Autumn;
      expect(manager.getCurrentSeason()).toBe(Season.Autumn);
    });
  });

  describe('Time Calculations', () => {
    test('should calculate months difference', () => {
      const time1 = { year: 1, month: 3 };
      const time2 = { year: 2, month: 5 };

      const diff = manager.calculateMonthsDifference(time1, time2);
      expect(diff).toBe(14); // 12 months + 2 months
    });

    test('should calculate negative months difference', () => {
      const time1 = { year: 2, month: 5 };
      const time2 = { year: 1, month: 3 };

      const diff = manager.calculateMonthsDifference(time1, time2);
      expect(diff).toBe(-14);
    });

    test('should check if at specific time point', () => {
      state.time.year = 5;
      state.time.month = 7;

      expect(manager.isTimePoint(5, 7)).toBe(true);
      expect(manager.isTimePoint(5, 8)).toBe(false);
      expect(manager.isTimePoint(6, 7)).toBe(false);
    });

    test('should check if in specific season', () => {
      state.time.season = Season.Summer;

      expect(manager.isInSeason(Season.Summer)).toBe(true);
      expect(manager.isInSeason(Season.Winter)).toBe(false);
    });
  });

  describe('Time Manipulation', () => {
    test('should set time directly', () => {
      manager.setTime(10, 8);

      expect(state.time.year).toBe(10);
      expect(state.time.month).toBe(8);
      expect(state.time.season).toBe(Season.Autumn);
    });

    test('should update season when setting time', () => {
      manager.setTime(5, 12);

      expect(state.time.season).toBe(Season.Winter);
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
