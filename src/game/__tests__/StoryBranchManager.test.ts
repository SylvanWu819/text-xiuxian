/**
 * Unit tests for StoryBranchManager
 * Tests story line loading, branch tracking, progress management, and event unlocking
 */

import { StoryBranchManager, StoryLine, StoryBranch } from '../StoryBranchManager';
import { PlayerState, CultivationLevel, Season } from '../../types';

describe('StoryBranchManager', () => {
  let manager: StoryBranchManager;
  let mockState: PlayerState;

  beforeEach(() => {
    manager = new StoryBranchManager();
    
    // Create mock player state
    mockState = {
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
  });

  describe('Story Line Management', () => {
    test('should initialize with default story lines', () => {
      const allLines = manager.getAllStoryLines();
      expect(allLines.length).toBeGreaterThan(0);
    });

    test('should register a new story line', () => {
      const testLine: StoryLine = {
        id: 'test_line',
        name: '测试剧情',
        description: '测试用剧情线',
        events: ['event1', 'event2'],
        branches: []
      };

      manager.registerStoryLine(testLine);
      const retrieved = manager.getStoryLineById('test_line');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('测试剧情');
    });

    test('should load story line for cultivation path', () => {
      manager.loadStoryLineForPath(mockState.cultivationPath, mockState);
      
      // Should unlock events for sword path
      const swordLines = manager.getStoryLinesByPath('sword');
      expect(swordLines.length).toBeGreaterThan(0);
      
      // Check if events are unlocked
      const firstLine = swordLines[0];
      for (const eventId of firstLine.events) {
        expect(mockState.storyProgress.unlockedEvents.has(eventId)).toBe(true);
      }
    });

    test('should get story lines by cultivation path', () => {
      const swordLines = manager.getStoryLinesByPath('sword');
      const bodyLines = manager.getStoryLinesByPath('body');
      
      expect(swordLines.length).toBeGreaterThan(0);
      expect(bodyLines.length).toBeGreaterThan(0);
      
      swordLines.forEach(line => {
        expect(line.cultivationPath).toBe('sword');
      });
    });

    test('should get active story lines', () => {
      // Activate a story line
      mockState.storyProgress.storyFlags.set('sword_path_main_active', true);
      
      const activeLines = manager.getActiveStoryLines(mockState);
      expect(activeLines.length).toBeGreaterThan(0);
      expect(activeLines.some(line => line.id === 'sword_path_main')).toBe(true);
    });
  });

  describe('Branch Point Tracking', () => {
    test('should track branch point', () => {
      manager.trackBranchPoint('test_branch', mockState);
      
      expect(mockState.storyProgress.storyFlags.has('branch_test_branch_active')).toBe(true);
    });

    test('should check branch trigger conditions - flags', () => {
      const branch: StoryBranch = {
        id: 'test_branch',
        name: '测试分支',
        description: '测试用分支',
        triggerConditions: {
          requiredFlags: ['flag1', 'flag2']
        },
        outcomes: []
      };

      // Without flags
      expect(manager.checkBranchTriggerConditions(branch, mockState)).toBe(false);

      // With one flag
      mockState.storyProgress.storyFlags.set('flag1', true);
      expect(manager.checkBranchTriggerConditions(branch, mockState)).toBe(false);

      // With all flags
      mockState.storyProgress.storyFlags.set('flag2', true);
      expect(manager.checkBranchTriggerConditions(branch, mockState)).toBe(true);
    });

    test('should check branch trigger conditions - quests', () => {
      const branch: StoryBranch = {
        id: 'test_branch',
        name: '测试分支',
        description: '测试用分支',
        triggerConditions: {
          requiredQuests: ['quest1']
        },
        outcomes: []
      };

      // Without quest
      expect(manager.checkBranchTriggerConditions(branch, mockState)).toBe(false);

      // With quest completed
      mockState.storyProgress.completedQuests.add('quest1');
      expect(manager.checkBranchTriggerConditions(branch, mockState)).toBe(true);
    });

    test('should check branch trigger conditions - reputation', () => {
      const branch: StoryBranch = {
        id: 'test_branch',
        name: '测试分支',
        description: '测试用分支',
        triggerConditions: {
          minReputation: { righteous: 50, demonic: 30 }
        },
        outcomes: []
      };

      // Insufficient reputation
      mockState.reputation.righteous = 40;
      mockState.reputation.demonic = 20;
      expect(manager.checkBranchTriggerConditions(branch, mockState)).toBe(false);

      // Sufficient reputation
      mockState.reputation.righteous = 60;
      mockState.reputation.demonic = 40;
      expect(manager.checkBranchTriggerConditions(branch, mockState)).toBe(true);
    });

    test('should check branch trigger conditions - relationships', () => {
      const branch: StoryBranch = {
        id: 'test_branch',
        name: '测试分支',
        description: '测试用分支',
        triggerConditions: {
          requiredRelationships: [
            { npcId: 'npc1', minValue: 50 }
          ]
        },
        outcomes: []
      };

      // Insufficient relationship
      mockState.relationships.set('npc1', 30);
      expect(manager.checkBranchTriggerConditions(branch, mockState)).toBe(false);

      // Sufficient relationship
      mockState.relationships.set('npc1', 60);
      expect(manager.checkBranchTriggerConditions(branch, mockState)).toBe(true);
    });

    test('should get available branches', () => {
      // Activate sword path story line
      mockState.storyProgress.storyFlags.set('sword_path_main_active', true);
      mockState.storyProgress.storyFlags.set('met_sword_master', true);

      const availableBranches = manager.getAvailableBranches(mockState);
      expect(availableBranches.length).toBeGreaterThan(0);
    });
  });

  describe('Branch Outcome Execution', () => {
    test('should execute branch outcome and set flags', () => {
      // Setup: activate story line and meet conditions
      mockState.storyProgress.storyFlags.set('sword_path_main_active', true);
      mockState.storyProgress.storyFlags.set('met_sword_master', true);

      // Execute outcome
      manager.executeBranchOutcome('sword_branch_1', 'offensive_sword', mockState);

      // Check if flag is set
      expect(mockState.storyProgress.storyFlags.has('offensive_sword_path')).toBe(true);
    });

    test('should execute branch outcome and unlock events', () => {
      mockState.storyProgress.storyFlags.set('sword_path_main_active', true);
      mockState.storyProgress.storyFlags.set('met_sword_master', true);

      manager.executeBranchOutcome('sword_branch_1', 'offensive_sword', mockState);

      // Check if event is unlocked
      expect(mockState.storyProgress.unlockedEvents.has('offensive_sword_technique')).toBe(true);
    });

    test('should mark branch as completed after execution', () => {
      mockState.storyProgress.storyFlags.set('sword_path_main_active', true);
      mockState.storyProgress.storyFlags.set('met_sword_master', true);

      manager.executeBranchOutcome('sword_branch_1', 'offensive_sword', mockState);

      const progress = manager.getStoryProgress('sword_path_main');
      expect(progress?.completedBranches.has('sword_branch_1')).toBe(true);
    });
  });

  describe('Story Progress Management', () => {
    test('should advance story progress', () => {
      manager.advanceStoryProgress('sword_path_main', 'sword_dao_enlightenment');

      const progress = manager.getStoryProgress('sword_path_main');
      expect(progress).toBeDefined();
      expect(progress!.currentEventIndex).toBeGreaterThanOrEqual(0);
    });

    test('should get story progress', () => {
      const progress = manager.getStoryProgress('sword_path_main');
      expect(progress).toBeDefined();
      expect(progress?.storyLineId).toBe('sword_path_main');
    });

    test('should get next event in story line', () => {
      const nextEvent = manager.getNextEvent('sword_path_main');
      expect(nextEvent).toBeDefined();
      expect(typeof nextEvent).toBe('string');
    });

    test('should check if story line is complete', () => {
      const isComplete = manager.isStoryLineComplete('sword_path_main');
      expect(typeof isComplete).toBe('boolean');
    });

    test('should calculate story line completion percentage', () => {
      const percentage = manager.getStoryLineCompletionPercentage('sword_path_main');
      expect(percentage).toBeGreaterThanOrEqual(0);
      expect(percentage).toBeLessThanOrEqual(100);
    });

    test('should reset story progress', () => {
      // Advance progress first
      manager.advanceStoryProgress('sword_path_main', 'sword_dao_enlightenment');
      
      // Reset
      manager.resetStoryProgress('sword_path_main');
      
      const progress = manager.getStoryProgress('sword_path_main');
      expect(progress?.currentEventIndex).toBe(0);
      expect(progress?.completedBranches.size).toBe(0);
    });
  });

  describe('Event Unlocking', () => {
    test('should check if event is unlocked', () => {
      expect(manager.isEventUnlocked('test_event', mockState)).toBe(false);
      
      mockState.storyProgress.unlockedEvents.add('test_event');
      expect(manager.isEventUnlocked('test_event', mockState)).toBe(true);
    });

    test('should unlock event', () => {
      manager.unlockEvent('test_event', mockState);
      expect(mockState.storyProgress.unlockedEvents.has('test_event')).toBe(true);
    });

    test('should unlock multiple events', () => {
      const events = ['event1', 'event2', 'event3'];
      manager.unlockEvents(events, mockState);
      
      events.forEach(eventId => {
        expect(mockState.storyProgress.unlockedEvents.has(eventId)).toBe(true);
      });
    });
  });

  describe('Story Flag Management', () => {
    test('should check if story flag exists', () => {
      expect(manager.hasStoryFlag('test_flag', mockState)).toBe(false);
      
      mockState.storyProgress.storyFlags.set('test_flag', true);
      expect(manager.hasStoryFlag('test_flag', mockState)).toBe(true);
    });

    test('should set story flag', () => {
      manager.setStoryFlag('test_flag', 'test_value', mockState);
      expect(mockState.storyProgress.storyFlags.get('test_flag')).toBe('test_value');
    });

    test('should get story flag value', () => {
      mockState.storyProgress.storyFlags.set('test_flag', 42);
      const value = manager.getStoryFlag('test_flag', mockState);
      expect(value).toBe(42);
    });

    test('should handle different flag value types', () => {
      manager.setStoryFlag('bool_flag', true, mockState);
      manager.setStoryFlag('string_flag', 'test', mockState);
      manager.setStoryFlag('number_flag', 123, mockState);
      manager.setStoryFlag('object_flag', { key: 'value' }, mockState);

      expect(manager.getStoryFlag('bool_flag', mockState)).toBe(true);
      expect(manager.getStoryFlag('string_flag', mockState)).toBe('test');
      expect(manager.getStoryFlag('number_flag', mockState)).toBe(123);
      expect(manager.getStoryFlag('object_flag', mockState)).toEqual({ key: 'value' });
    });
  });

  describe('Configuration Loading', () => {
    test('should load story lines from config', () => {
      const config = {
        storyLines: [
          {
            id: 'config_line_1',
            name: '配置剧情1',
            description: '从配置加载的剧情',
            events: ['event1'],
            branches: []
          },
          {
            id: 'config_line_2',
            name: '配置剧情2',
            description: '从配置加载的剧情',
            events: ['event2'],
            branches: []
          }
        ]
      };

      manager.loadStoryLinesFromConfig(config);

      const line1 = manager.getStoryLineById('config_line_1');
      const line2 = manager.getStoryLineById('config_line_2');

      expect(line1).toBeDefined();
      expect(line2).toBeDefined();
      expect(line1?.name).toBe('配置剧情1');
      expect(line2?.name).toBe('配置剧情2');
    });
  });

  describe('Edge Cases', () => {
    test('should handle non-existent story line', () => {
      const progress = manager.getStoryProgress('non_existent');
      expect(progress).toBeUndefined();
    });

    test('should handle non-existent branch execution', () => {
      // Should not throw error
      expect(() => {
        manager.executeBranchOutcome('non_existent', 'outcome', mockState);
      }).not.toThrow();
    });

    test('should handle empty cultivation path', () => {
      const lines = manager.getStoryLinesByPath('non_existent_path');
      expect(lines).toEqual([]);
    });

    test('should clear all story lines', () => {
      manager.clearStoryLines();
      const allLines = manager.getAllStoryLines();
      expect(allLines.length).toBe(0);
    });

    test('should handle story line with no events', () => {
      const emptyLine: StoryLine = {
        id: 'empty_line',
        name: '空剧情',
        description: '没有事件的剧情',
        events: [],
        branches: []
      };

      manager.registerStoryLine(emptyLine);
      const nextEvent = manager.getNextEvent('empty_line');
      expect(nextEvent).toBeNull();
    });

    test('should handle completion percentage for empty story line', () => {
      const emptyLine: StoryLine = {
        id: 'empty_line',
        name: '空剧情',
        description: '没有事件的剧情',
        events: [],
        branches: []
      };

      manager.registerStoryLine(emptyLine);
      const percentage = manager.getStoryLineCompletionPercentage('empty_line');
      expect(percentage).toBe(0);
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complete story line progression', () => {
      // Load story line for path
      manager.loadStoryLineForPath(mockState.cultivationPath, mockState);

      // Check initial state
      const swordLines = manager.getStoryLinesByPath('sword');
      expect(swordLines.length).toBeGreaterThan(0);

      // Activate branch
      mockState.storyProgress.storyFlags.set('met_sword_master', true);
      const availableBranches = manager.getAvailableBranches(mockState);
      expect(availableBranches.length).toBeGreaterThan(0);

      // Execute branch outcome
      if (availableBranches.length > 0) {
        const branch = availableBranches[0];
        if (branch.outcomes.length > 0) {
          manager.executeBranchOutcome(branch.id, branch.outcomes[0].id, mockState);
          
          // Verify outcome
          const progress = manager.getStoryProgress('sword_path_main');
          expect(progress?.completedBranches.has(branch.id)).toBe(true);
        }
      }
    });

    test('should handle multiple active story lines', () => {
      // Activate multiple story lines
      mockState.storyProgress.storyFlags.set('sword_path_main_active', true);
      mockState.storyProgress.storyFlags.set('sect_path_main_active', true);

      const activeLines = manager.getActiveStoryLines(mockState);
      expect(activeLines.length).toBeGreaterThanOrEqual(2);
    });

    test('should handle complex branch conditions', () => {
      // Setup complex conditions
      mockState.storyProgress.storyFlags.set('sect_path_main_active', true);
      mockState.storyProgress.storyFlags.set('sect_conflict_triggered', true);
      mockState.reputation.righteous = 50;

      const availableBranches = manager.getAvailableBranches(mockState);
      const sectBranch = availableBranches.find(b => b.id === 'sect_branch_1');
      
      expect(sectBranch).toBeDefined();
    });
  });
});
