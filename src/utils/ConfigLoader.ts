/**
 * ConfigLoader - 配置加载器
 * 负责从JSON文件加载游戏配置，包括事件、修行方向、NPC和任务
 * Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  GameEvent,
  CultivationPath,
  NPCConfig,
  EventConfig,
  CultivationPathConfig,
  NPCsConfig
} from '../types';
import { ErrorHandler, ConfigLoadError, ConfigValidationError } from './ErrorHandler';

// Re-export error classes for backward compatibility
export { ConfigLoadError, ConfigValidationError };

/**
 * 配置文件类型
 */
export enum ConfigType {
  Events = 'events',
  CultivationPaths = 'cultivation_paths',
  NPCs = 'npcs',
  Quests = 'quests'
}

// ConfigValidationError and ConfigLoadError are now imported from ErrorHandler and re-exported

/**
 * 配置加载器
 * Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5
 */
export class ConfigLoader {
  private configCache: Map<ConfigType, any> = new Map();
  private configDirectory: string;
  private isInitialized: boolean = false;

  /**
   * 构造函数
   * @param configDirectory 配置文件目录路径
   */
  constructor(configDirectory: string) {
    this.configDirectory = configDirectory;
  }

  /**
   * 初始化配置加载器
   * 预加载关键配置文件
   * Validates: Requirements 15.1, 15.4, 20.3
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 预加载关键配置
      await this.preloadEssentialConfigs();
      this.isInitialized = true;
    } catch (error) {
      ErrorHandler.logError(error as Error, 'ConfigLoader:initialize');
      throw new ConfigLoadError(
        `配置加载器初始化失败`,
        error as Error
      );
    }
  }

  /**
   * 预加载关键配置文件
   * Validates: Requirements 15.1, 15.4
   */
  private async preloadEssentialConfigs(): Promise<void> {
    await Promise.all([
      this.loadConfig(ConfigType.CultivationPaths),
      this.loadConfig(ConfigType.Events)
    ]);
  }

  /**
   * 加载配置文件（带缓存）
   * Validates: Requirements 15.1, 15.2, 15.3, 15.5, 20.3
   * @param configType 配置类型
   * @returns 配置数据
   */
  async loadConfig<T>(configType: ConfigType): Promise<T> {
    // 检查缓存
    if (this.configCache.has(configType)) {
      return this.configCache.get(configType) as T;
    }

    try {
      // 读取配置文件
      const config = await this.readConfigFile(configType);

      // 验证配置
      this.validateConfig(configType, config);

      // 缓存配置
      this.configCache.set(configType, config);

      return config as T;
    } catch (error) {
      if (error instanceof ConfigValidationError || error instanceof ConfigLoadError) {
        throw error;
      }
      ErrorHandler.handleConfigError(error as Error, configType);
    }
  }

  /**
   * 读取配置文件
   * Validates: Requirements 15.1, 20.3
   * @param configType 配置类型
   * @returns 配置数据
   */
  private async readConfigFile(configType: ConfigType): Promise<any> {
    const filename = this.getConfigFilename(configType);
    const filepath = path.join(this.configDirectory, filename);

    try {
      // 检查文件是否存在
      if (!fs.existsSync(filepath)) {
        throw new ConfigLoadError(
          `配置文件不存在: ${filename}`
        );
      }

      // 读取文件内容
      const content = await fs.promises.readFile(filepath, 'utf-8');

      // 解析JSON
      try {
        const config = JSON.parse(content);
        return config;
      } catch (parseError) {
        throw new ConfigLoadError(
          `配置文件 ${filename} JSON 格式错误`,
          parseError as Error
        );
      }
    } catch (error) {
      if (error instanceof ConfigLoadError) {
        throw error;
      }
      throw new ConfigLoadError(
        `读取配置文件 ${filename} 失败`,
        error as Error
      );
    }
  }

  /**
   * 验证配置文件
   * Validates: Requirements 15.5, 20.3
   * @param configType 配置类型
   * @param config 配置数据
   */
  private validateConfig(configType: ConfigType, config: any): void {
    const errors: string[] = [];

    switch (configType) {
      case ConfigType.Events:
        this.validateEventsConfig(config, errors);
        break;
      case ConfigType.CultivationPaths:
        this.validateCultivationPathsConfig(config, errors);
        break;
      case ConfigType.NPCs:
        this.validateNPCsConfig(config, errors);
        break;
      case ConfigType.Quests:
        this.validateQuestsConfig(config, errors);
        break;
    }

    if (errors.length > 0) {
      throw new ConfigValidationError(
        `配置文件 ${configType} 验证失败`,
        errors
      );
    }
  }

  /**
   * 验证事件配置
   * Validates: Requirements 15.5
   */
  private validateEventsConfig(config: any, errors: string[]): void {
    if (!config || typeof config !== 'object') {
      errors.push('Config must be an object');
      return;
    }

    if (!Array.isArray(config.events)) {
      errors.push('events must be an array');
      return;
    }

    config.events.forEach((event: any, index: number) => {
      const prefix = `events[${index}]`;

      if (!event.id || typeof event.id !== 'string') {
        errors.push(`${prefix}.id is required and must be a string`);
      }

      if (!event.type || typeof event.type !== 'string') {
        errors.push(`${prefix}.type is required and must be a string`);
      }

      if (!event.title || typeof event.title !== 'string') {
        errors.push(`${prefix}.title is required and must be a string`);
      }

      if (!event.description || typeof event.description !== 'string') {
        errors.push(`${prefix}.description is required and must be a string`);
      }

      if (!event.triggerConditions || typeof event.triggerConditions !== 'object') {
        errors.push(`${prefix}.triggerConditions is required and must be an object`);
      }

      if (!Array.isArray(event.options)) {
        errors.push(`${prefix}.options is required and must be an array`);
      } else if (event.options.length === 0) {
        errors.push(`${prefix}.options must contain at least one option`);
      }
    });
  }

  /**
   * 验证修行方向配置
   * Validates: Requirements 15.5
   */
  private validateCultivationPathsConfig(config: any, errors: string[]): void {
    if (!config || typeof config !== 'object') {
      errors.push('Config must be an object');
      return;
    }

    if (!Array.isArray(config.paths)) {
      errors.push('paths must be an array');
      return;
    }

    if (config.paths.length === 0) {
      errors.push('paths must contain at least one cultivation path');
    }

    config.paths.forEach((path: any, index: number) => {
      const prefix = `paths[${index}]`;

      if (!path.id || typeof path.id !== 'string') {
        errors.push(`${prefix}.id is required and must be a string`);
      }

      if (!path.name || typeof path.name !== 'string') {
        errors.push(`${prefix}.name is required and must be a string`);
      }

      if (!path.description || typeof path.description !== 'string') {
        errors.push(`${prefix}.description is required and must be a string`);
      }

      if (!path.initialStats || typeof path.initialStats !== 'object') {
        errors.push(`${prefix}.initialStats is required and must be an object`);
      } else {
        if (typeof path.initialStats.spiritStones !== 'number') {
          errors.push(`${prefix}.initialStats.spiritStones is required and must be a number`);
        }
      }

      if (!Array.isArray(path.exclusiveEvents)) {
        errors.push(`${prefix}.exclusiveEvents is required and must be an array`);
      }

      if (typeof path.cultivationBonus !== 'number') {
        errors.push(`${prefix}.cultivationBonus is required and must be a number`);
      }
    });
  }

  /**
   * 验证NPC配置
   * Validates: Requirements 15.5
   */
  private validateNPCsConfig(config: any, errors: string[]): void {
    if (!config || typeof config !== 'object') {
      errors.push('Config must be an object');
      return;
    }

    if (!Array.isArray(config.npcs)) {
      errors.push('npcs must be an array');
      return;
    }

    config.npcs.forEach((npc: any, index: number) => {
      const prefix = `npcs[${index}]`;

      if (!npc.id || typeof npc.id !== 'string') {
        errors.push(`${prefix}.id is required and must be a string`);
      }

      if (!npc.name || typeof npc.name !== 'string') {
        errors.push(`${prefix}.name is required and must be a string`);
      }

      if (!npc.faction || typeof npc.faction !== 'string') {
        errors.push(`${prefix}.faction is required and must be a string`);
      }

      if (!npc.personality || typeof npc.personality !== 'string') {
        errors.push(`${prefix}.personality is required and must be a string`);
      }

      if (typeof npc.initialRelationship !== 'number') {
        errors.push(`${prefix}.initialRelationship is required and must be a number`);
      }

      if (!npc.dialogues || typeof npc.dialogues !== 'object') {
        errors.push(`${prefix}.dialogues is required and must be an object`);
      }
    });
  }

  /**
   * 验证任务配置
   * Validates: Requirements 15.5
   */
  private validateQuestsConfig(config: any, errors: string[]): void {
    if (!config || typeof config !== 'object') {
      errors.push('Config must be an object');
      return;
    }

    if (!Array.isArray(config.quests)) {
      errors.push('quests must be an array');
      return;
    }

    config.quests.forEach((quest: any, index: number) => {
      const prefix = `quests[${index}]`;

      if (!quest.id || typeof quest.id !== 'string') {
        errors.push(`${prefix}.id is required and must be a string`);
      }

      if (!quest.title || typeof quest.title !== 'string') {
        errors.push(`${prefix}.title is required and must be a string`);
      }

      if (!quest.description || typeof quest.description !== 'string') {
        errors.push(`${prefix}.description is required and must be a string`);
      }
    });
  }

  /**
   * 获取配置文件名
   * @param configType 配置类型
   * @returns 文件名
   */
  private getConfigFilename(configType: ConfigType): string {
    return `${configType}.json`;
  }

  /**
   * 重新加载配置（清除缓存并重新加载）
   * Validates: Requirements 15.6
   * @param configType 配置类型
   */
  async reloadConfig<T>(configType: ConfigType): Promise<T> {
    this.configCache.delete(configType);
    return this.loadConfig<T>(configType);
  }

  /**
   * 清除所有缓存
   */
  clearCache(): void {
    this.configCache.clear();
  }

  /**
   * 检查配置是否已缓存
   * @param configType 配置类型
   */
  isCached(configType: ConfigType): boolean {
    return this.configCache.has(configType);
  }

  /**
   * 获取已缓存的配置类型列表
   */
  getCachedConfigTypes(): ConfigType[] {
    return Array.from(this.configCache.keys());
  }

  /**
   * 加载事件配置
   * Validates: Requirements 15.1
   */
  async loadEvents(): Promise<EventConfig> {
    return this.loadConfig<EventConfig>(ConfigType.Events);
  }

  /**
   * 加载修行方向配置
   * Validates: Requirements 15.4
   */
  async loadCultivationPaths(): Promise<CultivationPathConfig> {
    return this.loadConfig<CultivationPathConfig>(ConfigType.CultivationPaths);
  }

  /**
   * 加载NPC配置
   * Validates: Requirements 15.3
   */
  async loadNPCs(): Promise<NPCsConfig> {
    return this.loadConfig<NPCsConfig>(ConfigType.NPCs);
  }

  /**
   * 加载任务配置
   * Validates: Requirements 15.2
   */
  async loadQuests(): Promise<any> {
    return this.loadConfig<any>(ConfigType.Quests);
  }

  /**
   * 批量加载所有配置
   * @returns 所有配置的映射
   */
  async loadAllConfigs(): Promise<Map<ConfigType, any>> {
    const configs = new Map<ConfigType, any>();

    try {
      const [events, paths, npcs, quests] = await Promise.all([
        this.loadEvents(),
        this.loadCultivationPaths(),
        this.loadNPCs(),
        this.loadQuests()
      ]);

      configs.set(ConfigType.Events, events);
      configs.set(ConfigType.CultivationPaths, paths);
      configs.set(ConfigType.NPCs, npcs);
      configs.set(ConfigType.Quests, quests);

      return configs;
    } catch (error) {
      throw new Error(`Failed to load all configs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取配置目录路径
   */
  getConfigDirectory(): string {
    return this.configDirectory;
  }

  /**
   * 设置配置目录路径
   * @param directory 新的配置目录路径
   */
  setConfigDirectory(directory: string): void {
    this.configDirectory = directory;
    this.clearCache();
    this.isInitialized = false;
  }
}
