/**
 * SaveSystem Unit Tests
 * Tests for save/load functionality, slot management, and version compatibility
 * Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7
 */

import { SaveSystem, SaveSlotInfo } from '../SaveSystem';
import { PlayerState, CultivationLevel, Season } from '../../types';
import * as vscode from 'vscode';

// Mock VSCode ExtensionContext
class MockMemento implements vscode.Memento {
  private storage = new Map<string, any>();

  keys(): readonly string[] {
    return Array.from(this.storage.keys());
  }

  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  get<T>(key: string, defaultValue?: T): T | undefined {
    const value = this.storage.get(key);
    return value !== undefined ? value : defaultValue;
  }

  async update(key: string, value: any): Promise<void> {
    if (value === undefined) {
      this.storage.delete(key);
    } else {
      // Simulate JSON serialization/deserialization like VSCode does
      const serialized = JSON.stringify(value);
      const deserialized = JSON.parse(serialized);
      this.storage.set(key, deserialized);
    }
  }

  setKeysForSync(keys: readonly string[]): void {
    // Mock implementation - not needed for tests
  }

  clear(): void {
    this.storage.clear();
  }
}

class MockExtensionContext implements Partial<vscode.ExtensionContext> {
  globalState: vscode.Memento & { setKeysForSync(keys: readonly string[]): void };
  workspaceState: vscode.Memento & { setKeysForSync(keys: readonly string[]): void };

  constructor() {
    this.globalState = new MockMemento();
    this.workspaceState = new MockMemento();
  }
}

// Helper function to create a test player state
function createTestPlayerState(name: string = '测试玩家'): PlayerState {
  return {
    name,
    cultivationPath: {
      id: 'sword',
      name: '剑修',
      description: '以剑入道',
      initialStats: {
        spiritStones: 10,
        specialAbility: '剑气'
      },
      exclusiveEvents: [],
      cultivationBonus: 1.0
    },
    cultivation: {
      level: CultivationLevel.QiRefining,
      experience: 30,
      maxExperience: 100
    },
    time: {
      year: 1,
      season: Season.Spring,
      month: 3
    },
    lifespan: {
      current: 78,
      max: 80
    },
    resources: {
      spiritStones: 50,
      pills: new Map([
        ['qi_refining_pill', 5],
        ['foundation_pill', 2]
      ]),
      artifacts: new Map([
        ['flying_sword', 1]
      ])
    },
    relationships: new Map([
      ['elder_chen', 20],
      ['master_wang', -10]
    ]),
    faction: {
      current: 'righteous_sect',
      reputation: new Map([
        ['righteous_sect', 50],
        ['demonic_sect', -20]
      ])
    },
    karma: {
      goodDeeds: 10,
      karmicDebt: 5
    },
    reputation: {
      righteous: 30,
      demonic: 5
    },
    history: [
      {
        time: { year: 1, season: Season.Spring, month: 1 },
        description: '开始修仙之路',
        isKeyChoice: true
      }
    ],
    storyProgress: {
      completedQuests: new Set(['intro_quest']),
      activeQuests: new Set(['main_quest_1']),
      unlockedEvents: new Set(['event_1', 'event_2']),
      storyFlags: new Map<string, any>([
        ['met_elder', true],
        ['quest_progress', 50]
      ])
    }
  };
}

describe('SaveSystem', () => {
  let saveSystem: SaveSystem;
  let mockContext: MockExtensionContext;

  beforeEach(() => {
    mockContext = new MockExtensionContext();
    saveSystem = new SaveSystem(mockContext as any);
  });

  afterEach(() => {
    (mockContext.globalState as MockMemento).clear();
  });

  describe('save and load', () => {
    test('should save game state to slot', async () => {
      const state = createTestPlayerState('玩家1');
      
      await saveSystem.save(1, state);
      
      const hasSave = await saveSystem.hasSave(1);
      expect(hasSave).toBe(true);
    });

    test('should load saved game state', async () => {
      const originalState = createTestPlayerState('玩家1');
      
      await saveSystem.save(1, originalState);
      const loadedState = await saveSystem.load(1);
      
      expect(loadedState).not.toBeNull();
      expect(loadedState!.name).toBe('玩家1');
      expect(loadedState!.cultivation.level).toBe(CultivationLevel.QiRefining);
      expect(loadedState!.cultivation.experience).toBe(30);
      expect(loadedState!.resources.spiritStones).toBe(50);
    });

    test('should return null when loading non-existent save', async () => {
      const loadedState = await saveSystem.load(2);
      
      expect(loadedState).toBeNull();
    });

    test('should throw error for invalid slot ID when saving', async () => {
      const state = createTestPlayerState();
      
      await expect(saveSystem.save(0, state)).rejects.toThrow('Invalid slot ID');
      await expect(saveSystem.save(4, state)).rejects.toThrow('Invalid slot ID');
      await expect(saveSystem.save(-1, state)).rejects.toThrow('Invalid slot ID');
    });

    test('should throw error for invalid slot ID when loading', async () => {
      await expect(saveSystem.load(0)).rejects.toThrow('Invalid slot ID');
      await expect(saveSystem.load(4)).rejects.toThrow('Invalid slot ID');
    });
  });

  describe('serialization and deserialization', () => {
    test('should correctly serialize and deserialize Map objects', async () => {
      const state = createTestPlayerState();
      state.resources.pills.set('test_pill', 10);
      state.relationships.set('test_npc', 50);
      
      await saveSystem.save(1, state);
      const loadedState = await saveSystem.load(1);
      
      expect(loadedState!.resources.pills.get('test_pill')).toBe(10);
      expect(loadedState!.relationships.get('test_npc')).toBe(50);
      expect(loadedState!.resources.pills instanceof Map).toBe(true);
      expect(loadedState!.relationships instanceof Map).toBe(true);
    });

    test('should correctly serialize and deserialize Set objects', async () => {
      const state = createTestPlayerState();
      state.storyProgress.completedQuests.add('quest_1');
      state.storyProgress.activeQuests.add('quest_2');
      state.storyProgress.unlockedEvents.add('event_3');
      
      await saveSystem.save(1, state);
      const loadedState = await saveSystem.load(1);
      
      expect(loadedState!.storyProgress.completedQuests.has('quest_1')).toBe(true);
      expect(loadedState!.storyProgress.activeQuests.has('quest_2')).toBe(true);
      expect(loadedState!.storyProgress.unlockedEvents.has('event_3')).toBe(true);
      expect(loadedState!.storyProgress.completedQuests instanceof Set).toBe(true);
    });

    test('should preserve all player state properties', async () => {
      const state = createTestPlayerState('完整测试');
      
      await saveSystem.save(1, state);
      const loadedState = await saveSystem.load(1);
      
      expect(loadedState!.name).toBe('完整测试');
      expect(loadedState!.cultivationPath.id).toBe('sword');
      expect(loadedState!.time.year).toBe(1);
      expect(loadedState!.time.season).toBe(Season.Spring);
      expect(loadedState!.lifespan.current).toBe(78);
      expect(loadedState!.karma.goodDeeds).toBe(10);
      expect(loadedState!.reputation.righteous).toBe(30);
      expect(loadedState!.faction.current).toBe('righteous_sect');
    });
  });

  describe('slot management', () => {
    test('should support 3 save slots', async () => {
      const state1 = createTestPlayerState('玩家1');
      const state2 = createTestPlayerState('玩家2');
      const state3 = createTestPlayerState('玩家3');
      
      await saveSystem.save(1, state1);
      await saveSystem.save(2, state2);
      await saveSystem.save(3, state3);
      
      const loaded1 = await saveSystem.load(1);
      const loaded2 = await saveSystem.load(2);
      const loaded3 = await saveSystem.load(3);
      
      expect(loaded1!.name).toBe('玩家1');
      expect(loaded2!.name).toBe('玩家2');
      expect(loaded3!.name).toBe('玩家3');
    });

    test('should list all save slots', async () => {
      const state1 = createTestPlayerState('玩家1');
      const state2 = createTestPlayerState('玩家2');
      
      await saveSystem.save(1, state1);
      await saveSystem.save(2, state2);
      
      const saves = await saveSystem.listSaves();
      
      expect(saves).toHaveLength(3);
      expect(saves[0].exists).toBe(true);
      expect(saves[0].playerName).toBe('玩家1');
      expect(saves[1].exists).toBe(true);
      expect(saves[1].playerName).toBe('玩家2');
      expect(saves[2].exists).toBe(false);
    });

    test('should delete save from slot', async () => {
      const state = createTestPlayerState();
      
      await saveSystem.save(1, state);
      expect(await saveSystem.hasSave(1)).toBe(true);
      
      await saveSystem.deleteSave(1);
      expect(await saveSystem.hasSave(1)).toBe(false);
    });

    test('should get save info for slot', async () => {
      const state = createTestPlayerState('测试玩家');
      
      await saveSystem.save(1, state);
      const info = await saveSystem.getSaveInfo(1);
      
      expect(info).not.toBeNull();
      expect(info!.exists).toBe(true);
      expect(info!.playerName).toBe('测试玩家');
      expect(info!.cultivationLevel).toBe(CultivationLevel.QiRefining);
      expect(info!.year).toBe(1);
      expect(info!.timestamp).toBeDefined();
    });

    test('should return empty info for non-existent slot', async () => {
      const info = await saveSystem.getSaveInfo(2);
      
      expect(info).not.toBeNull();
      expect(info!.exists).toBe(false);
      expect(info!.playerName).toBeUndefined();
    });

    test('should overwrite existing save in slot', async () => {
      const state1 = createTestPlayerState('玩家1');
      const state2 = createTestPlayerState('玩家2');
      
      await saveSystem.save(1, state1);
      await saveSystem.save(1, state2);
      
      const loaded = await saveSystem.load(1);
      expect(loaded!.name).toBe('玩家2');
    });
  });

  describe('quick save and load', () => {
    test('should quick save to slot 1', async () => {
      const state = createTestPlayerState('快速存档');
      
      await saveSystem.quickSave(state);
      
      const loaded = await saveSystem.load(1);
      expect(loaded!.name).toBe('快速存档');
    });

    test('should quick load from slot 1', async () => {
      const state = createTestPlayerState('快速读档');
      
      await saveSystem.save(1, state);
      const loaded = await saveSystem.quickLoad();
      
      expect(loaded!.name).toBe('快速读档');
    });

    test('should return null when quick loading empty slot', async () => {
      const loaded = await saveSystem.quickLoad();
      expect(loaded).toBeNull();
    });
  });

  describe('version compatibility', () => {
    test('should save with current version', async () => {
      const state = createTestPlayerState();
      
      await saveSystem.save(1, state);
      const info = await saveSystem.getSaveInfo(1);
      
      expect(info!.version).toBe('2.2.0');
    });

    test('should load compatible version', async () => {
      const state = createTestPlayerState();
      
      await saveSystem.save(1, state);
      const loaded = await saveSystem.load(1);
      
      expect(loaded).not.toBeNull();
    });

    test('should reject incompatible major version', async () => {
      const state = createTestPlayerState();
      
      // Save with current version
      await saveSystem.save(1, state);
      
      // Manually modify the save data to have incompatible version
      const key = 'cultivation_simulator_save_slot_1';
      const saveData = (mockContext.globalState as MockMemento).get(key);
      (saveData as any).version = '2.0.0';  // Different major version
      await (mockContext.globalState as MockMemento).update(key, saveData);
      
      // Should throw error when loading
      await expect(saveSystem.load(1)).rejects.toThrow('Incompatible save version');
    });

    test('should reject incompatible minor version (newer than current)', async () => {
      const state = createTestPlayerState();
      
      // Save with current version
      await saveSystem.save(1, state);
      
      // Manually modify the save data to have newer minor version
      const key = 'cultivation_simulator_save_slot_1';
      const saveData = (mockContext.globalState as MockMemento).get(key);
      (saveData as any).version = '1.5.0';  // Newer minor version
      await (mockContext.globalState as MockMemento).update(key, saveData);
      
      // Should throw error when loading
      await expect(saveSystem.load(1)).rejects.toThrow('Incompatible save version');
    });

    test('should accept compatible minor version (older than current)', async () => {
      const state = createTestPlayerState();
      
      // Save with current version
      await saveSystem.save(1, state);
      
      // Manually modify the save data to have older minor version
      const key = 'cultivation_simulator_save_slot_1';
      const saveData = (mockContext.globalState as MockMemento).get(key);
      (saveData as any).version = '1.0.0';  // Same or older minor version
      await (mockContext.globalState as MockMemento).update(key, saveData);
      
      // Should load successfully
      const loaded = await saveSystem.load(1);
      expect(loaded).not.toBeNull();
    });

    test('should reject incompatible version on import', async () => {
      const state = createTestPlayerState();
      
      await saveSystem.save(1, state);
      const exported = await saveSystem.exportSave(1);
      
      // Modify exported data to have incompatible version
      const saveData = JSON.parse(exported!);
      saveData.version = '2.0.0';
      const modifiedExport = JSON.stringify(saveData);
      
      await expect(saveSystem.importSave(2, modifiedExport)).rejects.toThrow('Incompatible save version');
    });

    test('should get current version', () => {
      const version = saveSystem.getCurrentVersion();
      expect(version).toBe('2.2.0');
    });

    test('should get max slots', () => {
      const maxSlots = saveSystem.getMaxSlots();
      expect(maxSlots).toBe(3);
    });
  });

  describe('export and import', () => {
    test('should export save data as JSON', async () => {
      const state = createTestPlayerState('导出测试');
      
      await saveSystem.save(1, state);
      const exported = await saveSystem.exportSave(1);
      
      expect(exported).not.toBeNull();
      expect(typeof exported).toBe('string');
      
      const parsed = JSON.parse(exported!);
      expect(parsed.version).toBe('2.2.0');
      expect(parsed.slotId).toBe(1);
      expect(parsed.playerState.name).toBe('导出测试');
    });

    test('should return null when exporting non-existent save', async () => {
      const exported = await saveSystem.exportSave(2);
      expect(exported).toBeNull();
    });

    test('should import save data from JSON', async () => {
      const state = createTestPlayerState('导入测试');
      
      await saveSystem.save(1, state);
      const exported = await saveSystem.exportSave(1);
      
      await saveSystem.deleteSave(1);
      expect(await saveSystem.hasSave(1)).toBe(false);
      
      await saveSystem.importSave(1, exported!);
      const loaded = await saveSystem.load(1);
      
      expect(loaded!.name).toBe('导入测试');
    });

    test('should import to different slot', async () => {
      const state = createTestPlayerState('跨槽位导入');
      
      await saveSystem.save(1, state);
      const exported = await saveSystem.exportSave(1);
      
      await saveSystem.importSave(2, exported!);
      const loaded = await saveSystem.load(2);
      
      expect(loaded!.name).toBe('跨槽位导入');
    });

    test('should throw error when importing invalid JSON', async () => {
      await expect(saveSystem.importSave(1, 'invalid json')).rejects.toThrow();
    });

    test('should throw error when importing to invalid slot', async () => {
      const state = createTestPlayerState();
      await saveSystem.save(1, state);
      const exported = await saveSystem.exportSave(1);
      
      await expect(saveSystem.importSave(0, exported!)).rejects.toThrow('Invalid slot ID');
    });
  });

  describe('clear all saves', () => {
    test('should clear all save slots', async () => {
      const state1 = createTestPlayerState('玩家1');
      const state2 = createTestPlayerState('玩家2');
      const state3 = createTestPlayerState('玩家3');
      
      await saveSystem.save(1, state1);
      await saveSystem.save(2, state2);
      await saveSystem.save(3, state3);
      
      await saveSystem.clearAllSaves();
      
      expect(await saveSystem.hasSave(1)).toBe(false);
      expect(await saveSystem.hasSave(2)).toBe(false);
      expect(await saveSystem.hasSave(3)).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('should handle empty Maps and Sets', async () => {
      const state = createTestPlayerState();
      state.resources.pills = new Map();
      state.resources.artifacts = new Map();
      state.relationships = new Map();
      state.storyProgress.completedQuests = new Set();
      state.storyProgress.activeQuests = new Set();
      
      await saveSystem.save(1, state);
      const loaded = await saveSystem.load(1);
      
      expect(loaded!.resources.pills.size).toBe(0);
      expect(loaded!.resources.artifacts.size).toBe(0);
      expect(loaded!.relationships.size).toBe(0);
      expect(loaded!.storyProgress.completedQuests.size).toBe(0);
    });

    test('should handle large numbers in resources', async () => {
      const state = createTestPlayerState();
      state.resources.spiritStones = 999999999;
      state.resources.pills.set('rare_pill', 1000000);
      
      await saveSystem.save(1, state);
      const loaded = await saveSystem.load(1);
      
      expect(loaded!.resources.spiritStones).toBe(999999999);
      expect(loaded!.resources.pills.get('rare_pill')).toBe(1000000);
    });

    test('should handle special characters in names', async () => {
      const state = createTestPlayerState('测试玩家@#$%^&*()');
      
      await saveSystem.save(1, state);
      const loaded = await saveSystem.load(1);
      
      expect(loaded!.name).toBe('测试玩家@#$%^&*()');
    });

    test('should handle long history arrays', async () => {
      const state = createTestPlayerState();
      for (let i = 0; i < 100; i++) {
        state.history.push({
          time: { year: 1, season: Season.Spring, month: 1 },
          description: `事件 ${i}`,
          isKeyChoice: false
        });
      }
      
      await saveSystem.save(1, state);
      const loaded = await saveSystem.load(1);
      
      expect(loaded!.history.length).toBe(state.history.length);
    });

    test('should reject non-integer slot IDs when saving', async () => {
      const state = createTestPlayerState();
      
      await expect(saveSystem.save(1.5, state)).rejects.toThrow('Invalid slot ID');
      await expect(saveSystem.save(NaN, state)).rejects.toThrow('Invalid slot ID');
    });

    test('should reject non-integer slot IDs when loading', async () => {
      await expect(saveSystem.load(1.5)).rejects.toThrow('Invalid slot ID');
      await expect(saveSystem.load(NaN)).rejects.toThrow('Invalid slot ID');
    });

    test('should return false for hasSave with invalid slot ID', async () => {
      expect(await saveSystem.hasSave(0)).toBe(false);
      expect(await saveSystem.hasSave(4)).toBe(false);
      expect(await saveSystem.hasSave(1.5)).toBe(false);
    });

    test('should return null for getSaveInfo with invalid slot ID', async () => {
      expect(await saveSystem.getSaveInfo(0)).toBeNull();
      expect(await saveSystem.getSaveInfo(4)).toBeNull();
      expect(await saveSystem.getSaveInfo(-1)).toBeNull();
    });

    test('should handle nested Map in storyFlags', async () => {
      const state = createTestPlayerState();
      state.storyProgress.storyFlags.set('nested_data', { key: 'value', count: 42 });
      state.storyProgress.storyFlags.set('boolean_flag', true);
      state.storyProgress.storyFlags.set('number_flag', 123);
      
      await saveSystem.save(1, state);
      const loaded = await saveSystem.load(1);
      
      expect(loaded!.storyProgress.storyFlags.get('nested_data')).toEqual({ key: 'value', count: 42 });
      expect(loaded!.storyProgress.storyFlags.get('boolean_flag')).toBe(true);
      expect(loaded!.storyProgress.storyFlags.get('number_flag')).toBe(123);
    });
  });

  describe('timestamp', () => {
    test('should record timestamp when saving', async () => {
      const state = createTestPlayerState();
      const beforeSave = Date.now();
      
      await saveSystem.save(1, state);
      
      const info = await saveSystem.getSaveInfo(1);
      const afterSave = Date.now();
      
      expect(info!.timestamp).toBeDefined();
      expect(info!.timestamp!).toBeGreaterThanOrEqual(beforeSave);
      expect(info!.timestamp!).toBeLessThanOrEqual(afterSave);
    });

    test('should update timestamp when overwriting save', async () => {
      const state = createTestPlayerState();
      
      await saveSystem.save(1, state);
      const info1 = await saveSystem.getSaveInfo(1);
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await saveSystem.save(1, state);
      const info2 = await saveSystem.getSaveInfo(1);
      
      expect(info2!.timestamp!).toBeGreaterThan(info1!.timestamp!);
    });
  });
});
