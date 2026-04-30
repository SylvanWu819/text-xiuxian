/**
 * SaveSystem - 存档系统
 * 负责游戏状态的保存、加载、列表和删除功能
 * Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 21.8
 */

import * as vscode from 'vscode';
import { PlayerState, SaveData } from '../types';
import { StateTracker } from './StateTracker';
import { ErrorHandler, SaveLoadError, SaveWriteError } from '../utils/ErrorHandler';

/**
 * 存档槽位信息
 */
export interface SaveSlotInfo {
  slotId: number;
  exists: boolean;
  timestamp?: number;
  playerName?: string;
  cultivationLevel?: string;
  year?: number;
  version?: string;
}

/**
 * 存档系统版本
 */
const SAVE_VERSION = '2.3.3';

/**
 * 最大存档槽位数量
 */
const MAX_SAVE_SLOTS = 3;

export class SaveSystem {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * 保存游戏到指定槽位
   * Validates: Requirements 16.1, 16.2, 21.8, 20.4
   */
  async save(slotId: number, state: PlayerState): Promise<void> {
    // 验证槽位ID
    if (!this.isValidSlotId(slotId)) {
      throw new SaveWriteError(`无效的存档槽位: ${slotId}。槽位必须在 1 到 ${MAX_SAVE_SLOTS} 之间`);
    }

    try {
      // 创建存档数据
      const saveData: SaveData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        slotId,
        playerState: this.serializePlayerState(state)
      };

      // 保存到 VSCode globalState
      const key = this.getSaveKey(slotId);
      await this.context.globalState.update(key, saveData);
      
      ErrorHandler.logError = (error, context) => {
        console.log(`[SaveSystem] Successfully saved to slot ${slotId}`);
      };
    } catch (error) {
      ErrorHandler.handleSaveError(error as Error, 'save', slotId);
    }
  }

  /**
   * 从指定槽位加载游戏
   * Validates: Requirements 16.3, 16.4, 16.5, 20.4
   */
  async load(slotId: number): Promise<PlayerState | null> {
    // 验证槽位ID
    if (!this.isValidSlotId(slotId)) {
      throw new SaveLoadError(`无效的存档槽位: ${slotId}。槽位必须在 1 到 ${MAX_SAVE_SLOTS} 之间`);
    }

    try {
      const key = this.getSaveKey(slotId);
      const saveData = this.context.globalState.get<SaveData>(key);

      if (!saveData) {
        return null;
      }

      // 版本兼容性检查
      if (!this.isCompatibleVersion(saveData.version)) {
        throw new SaveLoadError(
          `存档版本不兼容: ${saveData.version}。当前版本: ${SAVE_VERSION}`
        );
      }

      // 反序列化玩家状态
      const playerState = this.deserializePlayerState(saveData.playerState);
      
      console.log(`[SaveSystem] Successfully loaded from slot ${slotId}`);
      return playerState;
    } catch (error) {
      if (error instanceof SaveLoadError) {
        throw error;
      }
      ErrorHandler.handleSaveError(error as Error, 'load', slotId);
    }
  }

  /**
   * 列出所有存档槽位信息
   * Validates: Requirements 16.4, 20.4
   */
  async listSaves(): Promise<SaveSlotInfo[]> {
    const saves: SaveSlotInfo[] = [];

    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
      try {
        const key = this.getSaveKey(i);
        const saveData = this.context.globalState.get<SaveData>(key);

        if (saveData) {
          saves.push({
            slotId: i,
            exists: true,
            timestamp: saveData.timestamp,
            playerName: saveData.playerState.name,
            cultivationLevel: saveData.playerState.cultivation.level,
            year: saveData.playerState.time.year,
            version: saveData.version
          });
        } else {
          saves.push({
            slotId: i,
            exists: false
          });
        }
      } catch (error) {
        // 如果某个槽位读取失败，记录错误但继续处理其他槽位
        ErrorHandler.logError(error as Error, `SaveSystem:listSaves:slot${i}`);
        saves.push({
          slotId: i,
          exists: false
        });
      }
    }

    return saves;
  }

  /**
   * 删除指定槽位的存档
   * Validates: Requirements 16.4, 20.4
   */
  async deleteSave(slotId: number): Promise<void> {
    // 验证槽位ID
    if (!this.isValidSlotId(slotId)) {
      throw new SaveWriteError(`无效的存档槽位: ${slotId}。槽位必须在 1 到 ${MAX_SAVE_SLOTS} 之间`);
    }

    try {
      const key = this.getSaveKey(slotId);
      await this.context.globalState.update(key, undefined);
      console.log(`[SaveSystem] Successfully deleted slot ${slotId}`);
    } catch (error) {
      ErrorHandler.logError(error as Error, `SaveSystem:deleteSave:slot${slotId}`);
      throw new SaveWriteError(`删除存档槽位 ${slotId} 失败`, error as Error);
    }
  }

  /**
   * 检查指定槽位是否有存档
   * Validates: Requirements 16.4
   */
  async hasSave(slotId: number): Promise<boolean> {
    if (!this.isValidSlotId(slotId)) {
      return false;
    }

    const key = this.getSaveKey(slotId);
    const saveData = this.context.globalState.get<SaveData>(key);
    return saveData !== undefined;
  }

  /**
   * 获取指定槽位的存档信息
   * Validates: Requirements 16.4
   */
  async getSaveInfo(slotId: number): Promise<SaveSlotInfo | null> {
    if (!this.isValidSlotId(slotId)) {
      return null;
    }

    const key = this.getSaveKey(slotId);
    const saveData = this.context.globalState.get<SaveData>(key);

    if (!saveData) {
      return {
        slotId,
        exists: false
      };
    }

    return {
      slotId,
      exists: true,
      timestamp: saveData.timestamp,
      playerName: saveData.playerState.name,
      cultivationLevel: saveData.playerState.cultivation.level,
      year: saveData.playerState.time.year,
      version: saveData.version
    };
  }

  /**
   * 快速保存到槽位1
   * Validates: Requirements 16.1, 21.8
   */
  async quickSave(state: PlayerState): Promise<void> {
    await this.save(1, state);
  }

  /**
   * 快速加载槽位1
   * Validates: Requirements 16.3
   */
  async quickLoad(): Promise<PlayerState | null> {
    return await this.load(1);
  }

  /**
   * 清除所有存档（用于测试或重置）
   */
  async clearAllSaves(): Promise<void> {
    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
      await this.deleteSave(i);
    }
  }

  /**
   * 序列化玩家状态
   * Validates: Requirements 16.1, 16.2
   */
  private serializePlayerState(state: PlayerState): any {
    // 将 Map 和 Set 转换为可序列化的格式（数组）
    // VSCode globalState 使用 JSON.stringify，不支持 Map 和 Set
    return {
      ...state,
      resources: {
        spiritStones: state.resources.spiritStones,
        pills: Array.from(state.resources.pills.entries()),
        artifacts: Array.from(state.resources.artifacts.entries())
      },
      relationships: Array.from(state.relationships.entries()),
      faction: {
        current: state.faction.current,
        reputation: Array.from(state.faction.reputation.entries())
      },
      storyProgress: {
        completedQuests: Array.from(state.storyProgress.completedQuests),
        activeQuests: Array.from(state.storyProgress.activeQuests),
        unlockedEvents: Array.from(state.storyProgress.unlockedEvents),
        storyFlags: Array.from(state.storyProgress.storyFlags.entries())
      }
    };
  }

  /**
   * 反序列化玩家状态
   * Validates: Requirements 16.3, 16.5
   */
  private deserializePlayerState(data: any): PlayerState {
    // VSCode globalState 会自动处理 JSON 序列化/反序列化
    // 但 Map 和 Set 会被转换为普通对象/数组，需要重新构造
    
    // 处理 resources
    const resources = {
      spiritStones: data.resources.spiritStones,
      pills: data.resources.pills instanceof Map 
        ? new Map(data.resources.pills)
        : new Map(Array.isArray(data.resources.pills) 
            ? data.resources.pills 
            : Object.entries(data.resources.pills || {})),
      artifacts: data.resources.artifacts instanceof Map
        ? new Map(data.resources.artifacts)
        : new Map(Array.isArray(data.resources.artifacts)
            ? data.resources.artifacts
            : Object.entries(data.resources.artifacts || {}))
    };

    // 处理 relationships
    const relationships = data.relationships instanceof Map
      ? new Map(data.relationships)
      : new Map(Array.isArray(data.relationships)
          ? data.relationships
          : Object.entries(data.relationships || {}));

    // 处理 faction
    const faction = {
      current: data.faction.current,
      reputation: data.faction.reputation instanceof Map
        ? new Map(data.faction.reputation)
        : new Map(Array.isArray(data.faction.reputation)
            ? data.faction.reputation
            : Object.entries(data.faction.reputation || {}))
    };

    // 处理 storyProgress
    const storyProgress = {
      completedQuests: data.storyProgress.completedQuests instanceof Set
        ? new Set(data.storyProgress.completedQuests)
        : new Set(Array.isArray(data.storyProgress.completedQuests)
            ? data.storyProgress.completedQuests
            : Object.values(data.storyProgress.completedQuests || {})),
      activeQuests: data.storyProgress.activeQuests instanceof Set
        ? new Set(data.storyProgress.activeQuests)
        : new Set(Array.isArray(data.storyProgress.activeQuests)
            ? data.storyProgress.activeQuests
            : Object.values(data.storyProgress.activeQuests || {})),
      unlockedEvents: data.storyProgress.unlockedEvents instanceof Set
        ? new Set(data.storyProgress.unlockedEvents)
        : new Set(Array.isArray(data.storyProgress.unlockedEvents)
            ? data.storyProgress.unlockedEvents
            : Object.values(data.storyProgress.unlockedEvents || {})),
      storyFlags: data.storyProgress.storyFlags instanceof Map
        ? new Map(data.storyProgress.storyFlags)
        : new Map(Array.isArray(data.storyProgress.storyFlags)
            ? data.storyProgress.storyFlags
            : Object.entries(data.storyProgress.storyFlags || {}))
    };

    return {
      ...data,
      resources,
      relationships,
      faction,
      storyProgress
    };
  }

  /**
   * 检查版本兼容性
   * Validates: Requirements 16.5, 16.6, 16.7
   */
  private isCompatibleVersion(saveVersion: string): boolean {
    // 简单的版本兼容性检查
    // 格式: major.minor.patch
    const currentParts = SAVE_VERSION.split('.').map(Number);
    const saveParts = saveVersion.split('.').map(Number);

    // 主版本号必须相同
    if (currentParts[0] !== saveParts[0]) {
      return false;
    }

    // 次版本号向后兼容（当前版本 >= 存档版本）
    if (currentParts[1] < saveParts[1]) {
      return false;
    }

    // 补丁版本号允许差异（同一主次版本的补丁版本都兼容）
    return true;
  }

  /**
   * 验证槽位ID是否有效
   */
  private isValidSlotId(slotId: number): boolean {
    return Number.isInteger(slotId) && slotId >= 1 && slotId <= MAX_SAVE_SLOTS;
  }

  /**
   * 获取存档键名
   */
  private getSaveKey(slotId: number): string {
    return `cultivation_simulator_save_slot_${slotId}`;
  }

  /**
   * 获取最大槽位数量
   */
  getMaxSlots(): number {
    return MAX_SAVE_SLOTS;
  }

  /**
   * 获取当前存档版本
   */
  getCurrentVersion(): string {
    return SAVE_VERSION;
  }

  /**
   * 导出存档数据（用于备份）
   * Validates: Requirements 16.1
   */
  async exportSave(slotId: number): Promise<string | null> {
    const key = this.getSaveKey(slotId);
    const saveData = this.context.globalState.get<SaveData>(key);

    if (!saveData) {
      return null;
    }

    // 将存档数据转换为 JSON 字符串
    return JSON.stringify(saveData, (key, value) => {
      // 处理 Map 和 Set 的序列化
      if (value instanceof Map) {
        return {
          dataType: 'Map',
          value: Array.from(value.entries())
        };
      }
      if (value instanceof Set) {
        return {
          dataType: 'Set',
          value: Array.from(value)
        };
      }
      return value;
    }, 2);
  }

  /**
   * 导入存档数据（用于恢复备份）
   * Validates: Requirements 16.3
   */
  async importSave(slotId: number, jsonData: string): Promise<void> {
    if (!this.isValidSlotId(slotId)) {
      throw new Error(`Invalid slot ID: ${slotId}. Must be between 1 and ${MAX_SAVE_SLOTS}`);
    }

    // 解析 JSON 数据
    const saveData = JSON.parse(jsonData, (key, value) => {
      // 处理 Map 和 Set 的反序列化
      if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
          return new Map(value.value);
        }
        if (value.dataType === 'Set') {
          return new Set(value.value);
        }
      }
      return value;
    }) as SaveData;

    // 验证版本兼容性
    if (!this.isCompatibleVersion(saveData.version)) {
      throw new Error(`Incompatible save version: ${saveData.version}. Current version: ${SAVE_VERSION}`);
    }

    // 更新槽位ID
    saveData.slotId = slotId;

    // 保存到 globalState
    const key = this.getSaveKey(slotId);
    await this.context.globalState.update(key, saveData);
  }
}
