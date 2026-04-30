/**
 * Unit tests for EndingSystem
 * Tests ending condition detection, ending triggering, and ending recording
 */

import { EndingSystem, EndingType } from '../EndingSystem';
import { PlayerState, CultivationLevel, Season } from '../../types';

describe('EndingSystem', () => {
  let endingSystem: EndingSystem;
  let mockState: PlayerState;

  beforeEach(() => {
    // Create a mock player state
    mockState = {
      name: '测试玩家',
      cultivationPath: {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: {
          spiritStones: 10
        },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      },
      cultivation: {
        level: CultivationLevel.GoldenCore,
        experience: 50,
        maxExperience: 100
      },
      time: {
        year: 100,
        season: Season.Spring,
        month: 1
      },
      lifespan: {
        current: 200,
        max: 500
      },
      resources: {
        spiritStones: 1000,
        pills: new Map(),
        artifacts: new Map()
      },
      relationships: new Map(),
      faction: {
        current: null,
        reputation: new Map()
      },
      karma: {
        goodDeeds: 10,
        karmicDebt: 5
      },
      reputation: {
        righteous: 30,
        demonic: 20
      },
      history: [],
      storyProgress: {
        completedQuests: new Set(),
        activeQuests: new Set(),
        unlockedEvents: new Set(),
        storyFlags: new Map()
      }
    };

    endingSystem = new EndingSystem(mockState);
  });

  describe('checkEndingConditions', () => {
    test('should detect no ending when conditions are not met', () => {
      const result = endingSystem.checkEndingConditions();
      expect(result.hasEnding).toBe(false);
      expect(result.endingType).toBeNull();
    });

    test('should detect sitting meditation ending when lifespan is depleted', () => {
      mockState.lifespan.current = 0;
      const result = endingSystem.checkEndingConditions();
      
      expect(result.hasEnding).toBe(true);
      expect(result.endingType).toBe(EndingType.SittingInMeditation);
      expect(result.priority).toBe(100);
    });

    test('should detect karma death ending when karmic debt is too high', () => {
      mockState.karma.karmicDebt = 100;
      const result = endingSystem.checkEndingConditions();
      
      expect(result.hasEnding).toBe(true);
      expect(result.endingType).toBe(EndingType.DeathByKarma);
      expect(result.priority).toBe(100);
    });

    test('should detect ascension ending when cultivation level reaches Ascension', () => {
      mockState.cultivation.level = CultivationLevel.Ascension;
      mockState.reputation.righteous = 80;
      mockState.reputation.demonic = 20;
      
      const result = endingSystem.checkEndingConditions();
      
      expect(result.hasEnding).toBe(true);
      expect(result.endingType).toBe(EndingType.Ascension);
      expect(result.priority).toBe(90);
    });

    test('should detect demonic ascension ending when cultivation level reaches Ascension with high demonic reputation', () => {
      mockState.cultivation.level = CultivationLevel.Ascension;
      mockState.reputation.righteous = 20;
      mockState.reputation.demonic = 80;
      
      const result = endingSystem.checkEndingConditions();
      
      expect(result.hasEnding).toBe(true);
      expect(result.endingType).toBe(EndingType.DemonicAscension);
      expect(result.priority).toBe(90);
    });

    test('should detect demon lord ending with high demonic reputation and cultivation', () => {
      mockState.cultivation.level = CultivationLevel.NascentSoul;
      mockState.reputation.righteous = 20;
      mockState.reputation.demonic = 75;
      
      const result = endingSystem.checkEndingConditions();
      
      expect(result.hasEnding).toBe(true);
      expect(result.endingType).toBe(EndingType.BecomeDemonLord);
      expect(result.priority).toBe(80);
    });

    test('should detect found sect ending with high reputation, cultivation, and relationships', () => {
      mockState.cultivation.level = CultivationLevel.NascentSoul;
      mockState.reputation.righteous = 65;
      
      // Add 10 relationships
      for (let i = 0; i < 10; i++) {
        mockState.relationships.set(`npc_${i}`, 50);
      }
      
      const result = endingSystem.checkEndingConditions();
      
      expect(result.hasEnding).toBe(true);
      expect(result.endingType).toBe(EndingType.FoundSect);
      expect(result.priority).toBe(70);
    });

    test('should detect hermit ending with moderate cultivation and low reputation', () => {
      mockState.cultivation.level = CultivationLevel.GoldenCore;
      mockState.reputation.righteous = 25;
      mockState.reputation.demonic = 25;
      mockState.lifespan.current = 300; // More than 50% of max
      
      const result = endingSystem.checkEndingConditions();
      
      expect(result.hasEnding).toBe(true);
      expect(result.endingType).toBe(EndingType.Hermit);
      expect(result.priority).toBe(60);
    });

    test('should prioritize death endings over ascension endings', () => {
      mockState.cultivation.level = CultivationLevel.Ascension;
      mockState.lifespan.current = 0; // Death condition
      
      const result = endingSystem.checkEndingConditions();
      
      expect(result.hasEnding).toBe(true);
      expect(result.endingType).toBe(EndingType.SittingInMeditation);
      expect(result.priority).toBe(100); // Higher priority than ascension
    });
  });

  describe('triggerEnding', () => {
    test('should generate ending info for ascension ending', () => {
      mockState.cultivation.level = CultivationLevel.Ascension;
      mockState.time.year = 500;
      
      const endingInfo = endingSystem.triggerEnding(EndingType.Ascension);
      
      expect(endingInfo.type).toBe(EndingType.Ascension);
      expect(endingInfo.title).toBe('飞升成仙');
      expect(endingInfo.description).toContain('500年');
      expect(endingInfo.description).toContain('飞升仙界');
      expect(endingInfo.finalStats.cultivationLevel).toBe(CultivationLevel.Ascension);
      expect(endingInfo.finalStats.age).toBe(500);
    });

    test('should generate ending info for sitting meditation ending', () => {
      mockState.lifespan.current = 0;
      mockState.time.year = 200;
      
      const endingInfo = endingSystem.triggerEnding(EndingType.SittingInMeditation);
      
      expect(endingInfo.type).toBe(EndingType.SittingInMeditation);
      expect(endingInfo.title).toBe('寿元耗尽，坐化而终');
      expect(endingInfo.description).toContain('200年');
      expect(endingInfo.description).toContain('坐化而终');
    });

    test('should generate ending info for demon lord ending', () => {
      mockState.reputation.demonic = 80;
      
      const endingInfo = endingSystem.triggerEnding(EndingType.BecomeDemonLord);
      
      expect(endingInfo.type).toBe(EndingType.BecomeDemonLord);
      expect(endingInfo.title).toBe('成就魔尊');
      expect(endingInfo.description).toContain('80点');
      expect(endingInfo.description).toContain('魔尊');
    });

    test('should include final stats in ending info', () => {
      mockState.resources.spiritStones = 5000;
      mockState.relationships.set('npc1', 50);
      mockState.relationships.set('npc2', 60);
      
      const endingInfo = endingSystem.triggerEnding(EndingType.Hermit);
      
      expect(endingInfo.finalStats.spiritStones).toBe(5000);
      expect(endingInfo.finalStats.relationshipsCount).toBe(2);
      expect(endingInfo.finalStats.righteousReputation).toBe(mockState.reputation.righteous);
      expect(endingInfo.finalStats.demonicReputation).toBe(mockState.reputation.demonic);
    });

    test('should record ending in history', () => {
      endingSystem.triggerEnding(EndingType.Ascension);
      
      const history = endingSystem.getEndingHistory();
      expect(history.length).toBe(1);
      expect(history[0].type).toBe(EndingType.Ascension);
    });
  });

  describe('calculateAchievements', () => {
    test('should include cultivation achievements', () => {
      mockState.cultivation.level = CultivationLevel.Ascension;
      
      const endingInfo = endingSystem.triggerEnding(EndingType.Ascension);
      
      expect(endingInfo.achievements).toContain('【修为巅峰】达到飞升境界');
    });

    test('should include reputation achievements', () => {
      mockState.reputation.righteous = 85;
      
      const endingInfo = endingSystem.triggerEnding(EndingType.Ascension);
      
      expect(endingInfo.achievements).toContain('【正道楷模】正道声望达到80+');
    });

    test('should include wealth achievements', () => {
      mockState.resources.spiritStones = 15000;
      
      const endingInfo = endingSystem.triggerEnding(EndingType.Hermit);
      
      expect(endingInfo.achievements).toContain('【富甲一方】灵石超过10000');
    });

    test('should include relationship achievements', () => {
      for (let i = 0; i < 25; i++) {
        mockState.relationships.set(`npc_${i}`, 50);
      }
      
      const endingInfo = endingSystem.triggerEnding(EndingType.FoundSect);
      
      expect(endingInfo.achievements).toContain('【人脉广阔】建立了20+个人际关系');
    });

    test('should include karma achievements', () => {
      mockState.karma.goodDeeds = 120;
      mockState.karma.karmicDebt = 0;
      
      const endingInfo = endingSystem.triggerEnding(EndingType.Ascension);
      
      expect(endingInfo.achievements).toContain('【功德圆满】善缘值达到100+');
      expect(endingInfo.achievements).toContain('【清净无为】无因果债');
    });

    test('should include longevity achievements', () => {
      mockState.time.year = 1200;
      
      const endingInfo = endingSystem.triggerEnding(EndingType.Hermit);
      
      expect(endingInfo.achievements).toContain('【千年修行】修炼超过1000年');
    });
  });

  describe('getEndingHistory', () => {
    test('should return empty array initially', () => {
      const history = endingSystem.getEndingHistory();
      expect(history).toEqual([]);
    });

    test('should return all recorded endings', () => {
      endingSystem.triggerEnding(EndingType.Ascension);
      endingSystem.triggerEnding(EndingType.Hermit);
      
      const history = endingSystem.getEndingHistory();
      expect(history.length).toBe(2);
      expect(history[0].type).toBe(EndingType.Ascension);
      expect(history[1].type).toBe(EndingType.Hermit);
    });

    test('should return a copy of the history array', () => {
      endingSystem.triggerEnding(EndingType.Ascension);
      
      const history1 = endingSystem.getEndingHistory();
      const history2 = endingSystem.getEndingHistory();
      
      expect(history1).not.toBe(history2); // Different array instances
      expect(history1).toEqual(history2); // Same content
    });
  });

  describe('hasAchievedEnding', () => {
    test('should return false for unachieved endings', () => {
      expect(endingSystem.hasAchievedEnding(EndingType.Ascension)).toBe(false);
    });

    test('should return true for achieved endings', () => {
      endingSystem.triggerEnding(EndingType.Ascension);
      
      expect(endingSystem.hasAchievedEnding(EndingType.Ascension)).toBe(true);
      expect(endingSystem.hasAchievedEnding(EndingType.Hermit)).toBe(false);
    });

    test('should handle multiple endings of the same type', () => {
      endingSystem.triggerEnding(EndingType.SittingInMeditation);
      endingSystem.triggerEnding(EndingType.SittingInMeditation);
      
      expect(endingSystem.hasAchievedEnding(EndingType.SittingInMeditation)).toBe(true);
    });
  });

  describe('getEndingStatistics', () => {
    test('should return zero statistics initially', () => {
      const stats = endingSystem.getEndingStatistics();
      
      expect(stats.totalEndings).toBe(0);
      expect(stats.endingTypes.size).toBe(0);
    });

    test('should count total endings correctly', () => {
      endingSystem.triggerEnding(EndingType.Ascension);
      endingSystem.triggerEnding(EndingType.Hermit);
      endingSystem.triggerEnding(EndingType.Ascension);
      
      const stats = endingSystem.getEndingStatistics();
      
      expect(stats.totalEndings).toBe(3);
    });

    test('should count ending types correctly', () => {
      endingSystem.triggerEnding(EndingType.Ascension);
      endingSystem.triggerEnding(EndingType.Hermit);
      endingSystem.triggerEnding(EndingType.Ascension);
      endingSystem.triggerEnding(EndingType.BecomeDemonLord);
      
      const stats = endingSystem.getEndingStatistics();
      
      expect(stats.endingTypes.get(EndingType.Ascension)).toBe(2);
      expect(stats.endingTypes.get(EndingType.Hermit)).toBe(1);
      expect(stats.endingTypes.get(EndingType.BecomeDemonLord)).toBe(1);
    });
  });

  describe('getEndingTypeName', () => {
    test('should return correct names for all ending types', () => {
      expect(endingSystem.getEndingTypeName(EndingType.Ascension)).toBe('飞升成仙');
      expect(endingSystem.getEndingTypeName(EndingType.DemonicAscension)).toBe('魔界飞升');
      expect(endingSystem.getEndingTypeName(EndingType.SittingInMeditation)).toBe('坐化而终');
      expect(endingSystem.getEndingTypeName(EndingType.BecomeDemonLord)).toBe('成就魔尊');
      expect(endingSystem.getEndingTypeName(EndingType.FoundSect)).toBe('开宗立派');
      expect(endingSystem.getEndingTypeName(EndingType.Hermit)).toBe('归隐山林');
      expect(endingSystem.getEndingTypeName(EndingType.DeathByTribulation)).toBe('渡劫失败');
      expect(endingSystem.getEndingTypeName(EndingType.DeathByEnemy)).toBe('死于仇敌');
      expect(endingSystem.getEndingTypeName(EndingType.DeathByKarma)).toBe('因果反噬');
    });
  });

  describe('clearEndingHistory', () => {
    test('should clear all ending history', () => {
      endingSystem.triggerEnding(EndingType.Ascension);
      endingSystem.triggerEnding(EndingType.Hermit);
      
      expect(endingSystem.getEndingHistory().length).toBe(2);
      
      endingSystem.clearEndingHistory();
      
      expect(endingSystem.getEndingHistory().length).toBe(0);
    });
  });

  describe('edge cases', () => {
    test('should handle negative lifespan as ending condition', () => {
      mockState.lifespan.current = -10;
      
      const result = endingSystem.checkEndingConditions();
      
      expect(result.hasEnding).toBe(true);
      expect(result.endingType).toBe(EndingType.SittingInMeditation);
    });

    test('should handle exactly zero lifespan', () => {
      mockState.lifespan.current = 0;
      
      const result = endingSystem.checkEndingConditions();
      
      expect(result.hasEnding).toBe(true);
      expect(result.endingType).toBe(EndingType.SittingInMeditation);
    });

    test('should handle boundary case for demon lord ending (exactly 70 demonic reputation)', () => {
      mockState.cultivation.level = CultivationLevel.NascentSoul;
      mockState.reputation.righteous = 29;
      mockState.reputation.demonic = 70;
      
      const result = endingSystem.checkEndingConditions();
      
      expect(result.hasEnding).toBe(true);
      expect(result.endingType).toBe(EndingType.BecomeDemonLord);
    });

    test('should not trigger demon lord ending if righteous reputation is too high', () => {
      mockState.cultivation.level = CultivationLevel.NascentSoul;
      mockState.reputation.righteous = 30;
      mockState.reputation.demonic = 70;
      
      const result = endingSystem.checkEndingConditions();
      
      expect(result.endingType).not.toBe(EndingType.BecomeDemonLord);
    });

    test('should handle empty relationships for found sect ending', () => {
      mockState.cultivation.level = CultivationLevel.NascentSoul;
      mockState.reputation.righteous = 65;
      mockState.relationships.clear();
      
      const result = endingSystem.checkEndingConditions();
      
      expect(result.endingType).not.toBe(EndingType.FoundSect);
    });
  });

  describe('integration scenarios', () => {
    test('should handle complete ascension scenario', () => {
      // Setup for ascension
      mockState.cultivation.level = CultivationLevel.Ascension;
      mockState.reputation.righteous = 85;
      mockState.time.year = 800;
      mockState.resources.spiritStones = 12000;
      mockState.karma.goodDeeds = 150;
      mockState.karma.karmicDebt = 0;
      
      for (let i = 0; i < 15; i++) {
        mockState.relationships.set(`npc_${i}`, 60);
      }
      
      const checkResult = endingSystem.checkEndingConditions();
      expect(checkResult.hasEnding).toBe(true);
      expect(checkResult.endingType).toBe(EndingType.Ascension);
      
      const endingInfo = endingSystem.triggerEnding(EndingType.Ascension);
      expect(endingInfo.achievements.length).toBeGreaterThan(3);
      expect(endingInfo.achievements).toContain('【修为巅峰】达到飞升境界');
      expect(endingInfo.achievements).toContain('【正道楷模】正道声望达到80+');
      expect(endingInfo.achievements).toContain('【富甲一方】灵石超过10000');
    });

    test('should handle demonic path scenario', () => {
      // Setup for demonic ascension
      mockState.cultivation.level = CultivationLevel.Ascension;
      mockState.reputation.righteous = 10;
      mockState.reputation.demonic = 90;
      mockState.time.year = 600;
      
      const checkResult = endingSystem.checkEndingConditions();
      expect(checkResult.hasEnding).toBe(true);
      expect(checkResult.endingType).toBe(EndingType.DemonicAscension);
      
      const endingInfo = endingSystem.triggerEnding(EndingType.DemonicAscension);
      expect(endingInfo.description).toContain('魔道');
      expect(endingInfo.description).toContain('魔界');
    });
  });
});
