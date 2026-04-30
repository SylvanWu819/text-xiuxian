/**
 * Unit tests for ConfigLoader
 * Validates: Requirements 15.1, 15.5
 */

import * as fs from 'fs';
import * as path from 'path';
import { ConfigLoader, ConfigType, ConfigValidationError, ConfigLoadError } from '../ConfigLoader';
import { EventType, CultivationLevel } from '../../types';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  promises: {
    readFile: jest.fn()
  }
}));

describe('ConfigLoader', () => {
  let configLoader: ConfigLoader;
  const testConfigDir = '/test/config';

  beforeEach(() => {
    configLoader = new ConfigLoader(testConfigDir);
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should create ConfigLoader with config directory', () => {
      expect(configLoader.getConfigDirectory()).toBe(testConfigDir);
    });

    test('should initialize and preload essential configs', async () => {
      const mockEventsConfig = {
        events: [
          {
            id: 'test_event',
            type: EventType.Fortune,
            title: '测试事件',
            description: '测试描述',
            triggerConditions: {},
            options: [{ id: 'opt1', text: '选项1', effects: {} }]
          }
        ]
      };

      const mockPathsConfig = {
        paths: [
          {
            id: 'sword',
            name: '剑修',
            description: '以剑入道',
            initialStats: { spiritStones: 10 },
            exclusiveEvents: [],
            cultivationBonus: 1.0
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockPathsConfig))
        .mockResolvedValueOnce(JSON.stringify(mockEventsConfig));

      await configLoader.initialize();

      expect(configLoader.isCached(ConfigType.CultivationPaths)).toBe(true);
      expect(configLoader.isCached(ConfigType.Events)).toBe(true);
    });

    test('should throw error if initialization fails', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(configLoader.initialize()).rejects.toThrow('Failed to initialize ConfigLoader');
    });
  });

  describe('Configuration Loading', () => {
    test('should load events configuration', async () => {
      const mockConfig = {
        events: [
          {
            id: 'ancient_cave',
            type: EventType.Fortune,
            title: '上古洞府',
            description: '发现洞府',
            triggerConditions: { minCultivationLevel: CultivationLevel.QiRefining },
            options: [
              { id: 'enter', text: '进入', effects: {} },
              { id: 'leave', text: '离开', effects: {} }
            ]
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await configLoader.loadEvents();

      expect(config.events).toHaveLength(1);
      expect(config.events[0].id).toBe('ancient_cave');
    });

    test('should load cultivation paths configuration', async () => {
      const mockConfig = {
        paths: [
          {
            id: 'sword',
            name: '剑修',
            description: '以剑入道',
            initialStats: { spiritStones: 10 },
            exclusiveEvents: ['sword_event'],
            cultivationBonus: 1.0
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await configLoader.loadCultivationPaths();

      expect(config.paths).toHaveLength(1);
      expect(config.paths[0].id).toBe('sword');
    });

    test('should load NPCs configuration', async () => {
      const mockConfig = {
        npcs: [
          {
            id: 'elder_chen',
            name: '陈长老',
            faction: 'righteous_sect',
            personality: 'strict',
            initialRelationship: 0,
            dialogues: {
              greeting: '你好',
              high_relationship: '很好',
              low_relationship: '不好'
            }
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await configLoader.loadNPCs();

      expect(config.npcs).toHaveLength(1);
      expect(config.npcs[0].id).toBe('elder_chen');
    });

    test('should load quests configuration', async () => {
      const mockConfig = {
        quests: [
          {
            id: 'quest1',
            title: '任务1',
            description: '描述1'
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await configLoader.loadQuests();

      expect(config.quests).toHaveLength(1);
      expect(config.quests[0].id).toBe('quest1');
    });

    test('should throw error if config file not found', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigLoadError);
    });

    test('should throw error if JSON is invalid', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue('{ invalid json }');

      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigLoadError);
    });
  });

  describe('Configuration Caching', () => {
    test('should cache loaded configuration', async () => {
      const mockConfig = {
        events: [
          {
            id: 'test_event',
            type: EventType.Fortune,
            title: '测试',
            description: '描述',
            triggerConditions: {},
            options: [{ id: 'opt1', text: '选项', effects: {} }]
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      // First load
      await configLoader.loadEvents();
      expect(fs.promises.readFile).toHaveBeenCalledTimes(1);

      // Second load should use cache
      await configLoader.loadEvents();
      expect(fs.promises.readFile).toHaveBeenCalledTimes(1);
    });

    test('should check if config is cached', async () => {
      const mockConfig = {
        events: [
          {
            id: 'test_event',
            type: EventType.Fortune,
            title: '测试',
            description: '描述',
            triggerConditions: {},
            options: [{ id: 'opt1', text: '选项', effects: {} }]
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      expect(configLoader.isCached(ConfigType.Events)).toBe(false);

      await configLoader.loadEvents();

      expect(configLoader.isCached(ConfigType.Events)).toBe(true);
    });

    test('should get cached config types', async () => {
      const mockEventsConfig = {
        events: [
          {
            id: 'test_event',
            type: EventType.Fortune,
            title: '测试',
            description: '描述',
            triggerConditions: {},
            options: [{ id: 'opt1', text: '选项', effects: {} }]
          }
        ]
      };

      const mockPathsConfig = {
        paths: [
          {
            id: 'sword',
            name: '剑修',
            description: '描述',
            initialStats: { spiritStones: 10 },
            exclusiveEvents: [],
            cultivationBonus: 1.0
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockEventsConfig))
        .mockResolvedValueOnce(JSON.stringify(mockPathsConfig));

      await configLoader.loadEvents();
      await configLoader.loadCultivationPaths();

      const cachedTypes = configLoader.getCachedConfigTypes();
      expect(cachedTypes).toContain(ConfigType.Events);
      expect(cachedTypes).toContain(ConfigType.CultivationPaths);
    });

    test('should clear cache', async () => {
      const mockConfig = {
        events: [
          {
            id: 'test_event',
            type: EventType.Fortune,
            title: '测试',
            description: '描述',
            triggerConditions: {},
            options: [{ id: 'opt1', text: '选项', effects: {} }]
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      await configLoader.loadEvents();
      expect(configLoader.isCached(ConfigType.Events)).toBe(true);

      configLoader.clearCache();
      expect(configLoader.isCached(ConfigType.Events)).toBe(false);
    });

    test('should reload configuration', async () => {
      const mockConfig1 = {
        events: [
          {
            id: 'event1',
            type: EventType.Fortune,
            title: '事件1',
            description: '描述1',
            triggerConditions: {},
            options: [{ id: 'opt1', text: '选项', effects: {} }]
          }
        ]
      };

      const mockConfig2 = {
        events: [
          {
            id: 'event2',
            type: EventType.Fortune,
            title: '事件2',
            description: '描述2',
            triggerConditions: {},
            options: [{ id: 'opt1', text: '选项', effects: {} }]
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockConfig1))
        .mockResolvedValueOnce(JSON.stringify(mockConfig2));

      const config1 = await configLoader.loadEvents();
      expect(config1.events[0].id).toBe('event1');

      const config2 = await configLoader.reloadConfig<any>(ConfigType.Events);
      expect(config2.events[0].id).toBe('event2');
    });
  });

  describe('Configuration Validation', () => {
    test('should validate events configuration', async () => {
      const invalidConfig = {
        events: [
          {
            // Missing required fields
            id: 'invalid_event'
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigValidationError);
    });

    test('should validate cultivation paths configuration', async () => {
      const invalidConfig = {
        paths: [
          {
            id: 'sword',
            // Missing required fields
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(configLoader.loadCultivationPaths()).rejects.toThrow(ConfigValidationError);
    });

    test('should validate NPCs configuration', async () => {
      const invalidConfig = {
        npcs: [
          {
            id: 'npc1',
            // Missing required fields
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(configLoader.loadNPCs()).rejects.toThrow(ConfigValidationError);
    });

    test('should reject events config without events array', async () => {
      const invalidConfig = {
        // Missing events array
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigValidationError);
    });

    test('should reject events with empty options', async () => {
      const invalidConfig = {
        events: [
          {
            id: 'event1',
            type: EventType.Fortune,
            title: '事件',
            description: '描述',
            triggerConditions: {},
            options: [] // Empty options
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigValidationError);
    });

    test('should reject cultivation paths with empty paths array', async () => {
      const invalidConfig = {
        paths: [] // Empty paths
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(configLoader.loadCultivationPaths()).rejects.toThrow(ConfigValidationError);
    });
  });

  describe('Batch Operations', () => {
    test('should load all configurations', async () => {
      const mockEventsConfig = {
        events: [
          {
            id: 'event1',
            type: EventType.Fortune,
            title: '事件1',
            description: '描述1',
            triggerConditions: {},
            options: [{ id: 'opt1', text: '选项', effects: {} }]
          }
        ]
      };

      const mockPathsConfig = {
        paths: [
          {
            id: 'sword',
            name: '剑修',
            description: '描述',
            initialStats: { spiritStones: 10 },
            exclusiveEvents: [],
            cultivationBonus: 1.0
          }
        ]
      };

      const mockNPCsConfig = {
        npcs: [
          {
            id: 'npc1',
            name: 'NPC1',
            faction: 'faction1',
            personality: 'friendly',
            initialRelationship: 0,
            dialogues: {
              greeting: 'hello',
              high_relationship: 'good',
              low_relationship: 'bad'
            }
          }
        ]
      };

      const mockQuestsConfig = {
        quests: [
          {
            id: 'quest1',
            title: '任务1',
            description: '描述1'
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockEventsConfig))
        .mockResolvedValueOnce(JSON.stringify(mockPathsConfig))
        .mockResolvedValueOnce(JSON.stringify(mockNPCsConfig))
        .mockResolvedValueOnce(JSON.stringify(mockQuestsConfig));

      const configs = await configLoader.loadAllConfigs();

      expect(configs.size).toBe(4);
      expect(configs.has(ConfigType.Events)).toBe(true);
      expect(configs.has(ConfigType.CultivationPaths)).toBe(true);
      expect(configs.has(ConfigType.NPCs)).toBe(true);
      expect(configs.has(ConfigType.Quests)).toBe(true);
    });

    test('should throw error if any config fails to load', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(configLoader.loadAllConfigs()).rejects.toThrow('Failed to load all configs');
    });
  });

  describe('Configuration Directory Management', () => {
    test('should get config directory', () => {
      expect(configLoader.getConfigDirectory()).toBe(testConfigDir);
    });

    test('should set config directory and clear cache', async () => {
      const mockConfig = {
        events: [
          {
            id: 'event1',
            type: EventType.Fortune,
            title: '事件1',
            description: '描述1',
            triggerConditions: {},
            options: [{ id: 'opt1', text: '选项', effects: {} }]
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      await configLoader.loadEvents();
      expect(configLoader.isCached(ConfigType.Events)).toBe(true);

      configLoader.setConfigDirectory('/new/config/dir');

      expect(configLoader.getConfigDirectory()).toBe('/new/config/dir');
      expect(configLoader.isCached(ConfigType.Events)).toBe(false);
    });
  });

  describe('JSON Parsing Edge Cases', () => {
    test('should handle empty JSON object', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue('{}');

      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigValidationError);
    });

    test('should handle null values in JSON', async () => {
      const invalidConfig = {
        events: null
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigValidationError);
    });

    test('should handle malformed JSON with syntax error', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue('{ "events": [}');

      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigLoadError);
    });

    test('should handle JSON with trailing commas', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue('{ "events": [], }');

      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigLoadError);
    });

    test('should handle empty string as JSON', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue('');

      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigLoadError);
    });

    test('should handle non-object JSON root', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue('[]');

      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigValidationError);
    });
  });

  describe('Configuration Validation Edge Cases', () => {
    test('should reject events with invalid type field', async () => {
      const invalidConfig = {
        events: [
          {
            id: 'event1',
            type: 123, // Should be string
            title: '事件',
            description: '描述',
            triggerConditions: {},
            options: [{ id: 'opt1', text: '选项', effects: {} }]
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigValidationError);
    });

    test('should reject events with missing triggerConditions', async () => {
      const invalidConfig = {
        events: [
          {
            id: 'event1',
            type: EventType.Fortune,
            title: '事件',
            description: '描述',
            // Missing triggerConditions
            options: [{ id: 'opt1', text: '选项', effects: {} }]
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigValidationError);
    });

    test('should reject cultivation paths with invalid cultivationBonus type', async () => {
      const invalidConfig = {
        paths: [
          {
            id: 'sword',
            name: '剑修',
            description: '描述',
            initialStats: { spiritStones: 10 },
            exclusiveEvents: [],
            cultivationBonus: '1.0' // Should be number
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(configLoader.loadCultivationPaths()).rejects.toThrow(ConfigValidationError);
    });

    test('should reject cultivation paths with missing initialStats', async () => {
      const invalidConfig = {
        paths: [
          {
            id: 'sword',
            name: '剑修',
            description: '描述',
            // Missing initialStats
            exclusiveEvents: [],
            cultivationBonus: 1.0
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(configLoader.loadCultivationPaths()).rejects.toThrow(ConfigValidationError);
    });

    test('should reject NPCs with invalid initialRelationship type', async () => {
      const invalidConfig = {
        npcs: [
          {
            id: 'npc1',
            name: 'NPC1',
            faction: 'faction1',
            personality: 'friendly',
            initialRelationship: '0', // Should be number
            dialogues: {
              greeting: 'hello',
              high_relationship: 'good',
              low_relationship: 'bad'
            }
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(configLoader.loadNPCs()).rejects.toThrow(ConfigValidationError);
    });

    test('should reject NPCs with missing dialogues', async () => {
      const invalidConfig = {
        npcs: [
          {
            id: 'npc1',
            name: 'NPC1',
            faction: 'faction1',
            personality: 'friendly',
            initialRelationship: 0
            // Missing dialogues
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(configLoader.loadNPCs()).rejects.toThrow(ConfigValidationError);
    });

    test('should reject quests with missing required fields', async () => {
      const invalidConfig = {
        quests: [
          {
            id: 'quest1'
            // Missing title and description
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(configLoader.loadQuests()).rejects.toThrow(ConfigValidationError);
    });
  });

  describe('Error Handling', () => {
    test('should provide detailed error message for validation errors', async () => {
      const invalidConfig = {
        events: [
          {
            id: 'event1'
            // Missing multiple required fields
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      try {
        await configLoader.loadEvents();
        fail('Should have thrown ConfigValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        expect((error as ConfigValidationError).validationErrors.length).toBeGreaterThan(0);
      }
    });

    test('should provide detailed error message for load errors', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      try {
        await configLoader.loadEvents();
        fail('Should have thrown ConfigLoadError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigLoadError);
        expect((error as ConfigLoadError).originalError).toBeDefined();
      }
    });

    test('should handle file read errors', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigLoadError);
    });

    test('should handle initialization errors gracefully', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockRejectedValue(new Error('Disk error'));

      await expect(configLoader.initialize()).rejects.toThrow('Failed to initialize ConfigLoader');
    });

    test('should not re-initialize if already initialized', async () => {
      const mockEventsConfig = {
        events: [
          {
            id: 'test_event',
            type: EventType.Fortune,
            title: '测试事件',
            description: '测试描述',
            triggerConditions: {},
            options: [{ id: 'opt1', text: '选项1', effects: {} }]
          }
        ]
      };

      const mockPathsConfig = {
        paths: [
          {
            id: 'sword',
            name: '剑修',
            description: '以剑入道',
            initialStats: { spiritStones: 10 },
            exclusiveEvents: [],
            cultivationBonus: 1.0
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockPathsConfig))
        .mockResolvedValueOnce(JSON.stringify(mockEventsConfig));

      await configLoader.initialize();
      const firstCallCount = (fs.promises.readFile as jest.Mock).mock.calls.length;

      // Second initialization should not load configs again
      await configLoader.initialize();
      const secondCallCount = (fs.promises.readFile as jest.Mock).mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount);
    });
  });

  describe('Additional JSON Parsing Tests', () => {
    test('should handle JSON with Unicode characters', async () => {
      const mockConfig = {
        events: [
          {
            id: 'unicode_event',
            type: EventType.Fortune,
            title: '测试事件🎉',
            description: '包含Unicode字符的描述：修仙者™',
            triggerConditions: {},
            options: [{ id: 'opt1', text: '选项', effects: {} }]
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await configLoader.loadEvents();

      expect(config.events[0].title).toBe('测试事件🎉');
      expect(config.events[0].description).toContain('修仙者™');
    });

    test('should handle JSON with nested objects', async () => {
      const mockConfig = {
        npcs: [
          {
            id: 'npc1',
            name: 'NPC1',
            faction: 'faction1',
            personality: 'friendly',
            initialRelationship: 0,
            dialogues: {
              greeting: 'hello',
              high_relationship: 'good',
              low_relationship: 'bad',
              nested: {
                deep: 'value'
              }
            }
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await configLoader.loadNPCs();

      expect(config.npcs[0].dialogues).toBeDefined();
      expect(config.npcs[0].dialogues.greeting).toBe('hello');
    });

    test('should handle JSON with large numbers', async () => {
      const mockConfig = {
        paths: [
          {
            id: 'test',
            name: '测试',
            description: '描述',
            initialStats: { spiritStones: 999999999 },
            exclusiveEvents: [],
            cultivationBonus: 1.5
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await configLoader.loadCultivationPaths();

      expect(config.paths[0].initialStats.spiritStones).toBe(999999999);
    });

    test('should handle JSON with special characters in strings', async () => {
      const mockConfig = {
        events: [
          {
            id: 'special_event',
            type: EventType.Fortune,
            title: '事件"标题"',
            description: '描述\\n换行\\t制表符',
            triggerConditions: {},
            options: [{ id: 'opt1', text: '选项', effects: {} }]
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await configLoader.loadEvents();

      expect(config.events[0].title).toBe('事件"标题"');
    });
  });

  describe('Additional Validation Tests', () => {
    test('should validate events with multiple validation errors', async () => {
      const invalidConfig = {
        events: [
          {
            // Missing all required fields
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      try {
        await configLoader.loadEvents();
        fail('Should have thrown ConfigValidationError');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigValidationError);
        const validationError = error as ConfigValidationError;
        expect(validationError.validationErrors.length).toBeGreaterThan(3);
        expect(validationError.validationErrors.some((e: string) => e.includes('id'))).toBe(true);
        expect(validationError.validationErrors.some((e: string) => e.includes('type'))).toBe(true);
        expect(validationError.validationErrors.some((e: string) => e.includes('title'))).toBe(true);
      }
    });

    test('should validate cultivation paths with invalid exclusiveEvents type', async () => {
      const invalidConfig = {
        paths: [
          {
            id: 'sword',
            name: '剑修',
            description: '描述',
            initialStats: { spiritStones: 10 },
            exclusiveEvents: 'not_an_array',
            cultivationBonus: 1.0
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(configLoader.loadCultivationPaths()).rejects.toThrow(ConfigValidationError);
    });

    test('should validate NPCs with invalid dialogues type', async () => {
      const invalidConfig = {
        npcs: [
          {
            id: 'npc1',
            name: 'NPC1',
            faction: 'faction1',
            personality: 'friendly',
            initialRelationship: 0,
            dialogues: 'not_an_object'
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(configLoader.loadNPCs()).rejects.toThrow(ConfigValidationError);
    });

    test('should validate events with non-array options', async () => {
      const invalidConfig = {
        events: [
          {
            id: 'event1',
            type: EventType.Fortune,
            title: '事件',
            description: '描述',
            triggerConditions: {},
            options: 'not_an_array'
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigValidationError);
    });

    test('should validate events with invalid triggerConditions type', async () => {
      const invalidConfig = {
        events: [
          {
            id: 'event1',
            type: EventType.Fortune,
            title: '事件',
            description: '描述',
            triggerConditions: 'not_an_object',
            options: [{ id: 'opt1', text: '选项', effects: {} }]
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigValidationError);
    });
  });

  describe('Additional Error Handling Tests', () => {
    test('should handle concurrent config loading', async () => {
      const mockEventsConfig = {
        events: [
          {
            id: 'event1',
            type: EventType.Fortune,
            title: '事件1',
            description: '描述1',
            triggerConditions: {},
            options: [{ id: 'opt1', text: '选项', effects: {} }]
          }
        ]
      };

      const mockPathsConfig = {
        paths: [
          {
            id: 'sword',
            name: '剑修',
            description: '描述',
            initialStats: { spiritStones: 10 },
            exclusiveEvents: [],
            cultivationBonus: 1.0
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockEventsConfig))
        .mockResolvedValueOnce(JSON.stringify(mockPathsConfig));

      // Load multiple configs concurrently
      const [events, paths] = await Promise.all([
        configLoader.loadEvents(),
        configLoader.loadCultivationPaths()
      ]);

      expect(events.events).toHaveLength(1);
      expect(paths.paths).toHaveLength(1);
    });

    test('should handle config reload after error', async () => {
      const invalidConfig = {
        events: [{ id: 'invalid' }]
      };

      const validConfig = {
        events: [
          {
            id: 'valid_event',
            type: EventType.Fortune,
            title: '有效事件',
            description: '描述',
            triggerConditions: {},
            options: [{ id: 'opt1', text: '选项', effects: {} }]
          }
        ]
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(invalidConfig))
        .mockResolvedValueOnce(JSON.stringify(validConfig));

      // First load should fail
      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigValidationError);

      // Second load should succeed
      const config = await configLoader.reloadConfig<any>(ConfigType.Events);
      expect(config.events[0].id).toBe('valid_event');
    });

    test('should handle empty file content', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue('');

      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigLoadError);
    });

    test('should handle whitespace-only file content', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockResolvedValue('   \n\t  ');

      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigLoadError);
    });

    test('should handle file read timeout gracefully', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.promises.readFile as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Read timeout')), 100)
        )
      );

      await expect(configLoader.loadEvents()).rejects.toThrow(ConfigLoadError);
    });
  });
});
