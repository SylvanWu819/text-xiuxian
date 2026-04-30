/**
 * ResourceManager - 资源管理器
 * 负责管理灵石、丹药、法器等资源的增减和检查
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import { PlayerState } from '../types';

/**
 * 资源类型
 */
export enum ResourceType {
  SpiritStones = 'spiritStones',
  Pills = 'pills',
  Artifacts = 'artifacts'
}

/**
 * 资源稀有度
 */
export enum ResourceRarity {
  Common = 'common',      // 普通
  Uncommon = 'uncommon',  // 罕见
  Rare = 'rare',          // 稀有
  Epic = 'epic',          // 史诗
  Legendary = 'legendary' // 传说
}

/**
 * 资源效果
 */
export interface ResourceEffect {
  cultivationBonus?: number;  // 修为加成
  lifespanBonus?: number;     // 寿命加成
  description: string;        // 效果描述
}

/**
 * 资源定义
 */
export interface ResourceDefinition {
  id: string;
  name: string;
  type: ResourceType;
  rarity: ResourceRarity;
  effect: ResourceEffect;
}

export class ResourceManager {
  private state: PlayerState;
  private resourceDefinitions: Map<string, ResourceDefinition> = new Map();

  constructor(state: PlayerState) {
    this.state = state;
    this.initializeResourceDefinitions();
  }

  /**
   * 初始化资源定义
   * Validates: Requirements 10.6
   */
  private initializeResourceDefinitions(): void {
    // 丹药定义
    this.registerResource({
      id: 'qi_refining_pill',
      name: '炼气丹',
      type: ResourceType.Pills,
      rarity: ResourceRarity.Common,
      effect: {
        cultivationBonus: 5,
        description: '增加5点修为'
      }
    });

    this.registerResource({
      id: 'foundation_pill',
      name: '筑基丹',
      type: ResourceType.Pills,
      rarity: ResourceRarity.Uncommon,
      effect: {
        cultivationBonus: 20,
        description: '增加20点修为，有助于筑基'
      }
    });

    this.registerResource({
      id: 'golden_core_pill',
      name: '金丹',
      type: ResourceType.Pills,
      rarity: ResourceRarity.Rare,
      effect: {
        cultivationBonus: 50,
        description: '增加50点修为，有助于结丹'
      }
    });

    this.registerResource({
      id: 'longevity_pill',
      name: '延寿丹',
      type: ResourceType.Pills,
      rarity: ResourceRarity.Epic,
      effect: {
        lifespanBonus: 10,
        description: '延长10年寿命'
      }
    });

    // 法器定义
    this.registerResource({
      id: 'flying_sword',
      name: '飞剑',
      type: ResourceType.Artifacts,
      rarity: ResourceRarity.Uncommon,
      effect: {
        description: '增强战斗能力'
      }
    });

    this.registerResource({
      id: 'spirit_armor',
      name: '灵甲',
      type: ResourceType.Artifacts,
      rarity: ResourceRarity.Rare,
      effect: {
        description: '增强防御能力'
      }
    });
  }

  /**
   * 注册资源定义
   */
  registerResource(definition: ResourceDefinition): void {
    this.resourceDefinitions.set(definition.id, definition);
  }

  /**
   * 获取资源定义
   */
  getResourceDefinition(resourceId: string): ResourceDefinition | undefined {
    return this.resourceDefinitions.get(resourceId);
  }

  /**
   * 增加灵石
   * Validates: Requirements 10.1, 10.4
   */
  addSpiritStones(amount: number): void {
    if (amount < 0) {
      throw new Error('Amount must be positive');
    }
    this.state.resources.spiritStones += amount;
    
    // 额外的安全检查：确保不会溢出或变成NaN
    if (isNaN(this.state.resources.spiritStones) || !isFinite(this.state.resources.spiritStones)) {
      console.error(`[ResourceManager] 警告：灵石数值异常！重置为0`);
      this.state.resources.spiritStones = 0;
    }
  }

  /**
   * 减少灵石
   * Validates: Requirements 10.1, 10.5
   */
  removeSpiritStones(amount: number): boolean {
    if (amount < 0) {
      throw new Error('Amount must be positive');
    }

    if (!this.hasSpiritStones(amount)) {
      console.warn(`[ResourceManager] 灵石不足: 需要${amount}, 当前${this.state.resources.spiritStones}`);
      return false;
    }

    this.state.resources.spiritStones -= amount;
    
    // 额外的安全检查：确保不会变成负数
    if (this.state.resources.spiritStones < 0) {
      console.error(`[ResourceManager] 警告：灵石变成负数！重置为0`);
      this.state.resources.spiritStones = 0;
    }
    
    return true;
  }

  /**
   * 检查灵石是否充足
   * Validates: Requirements 10.2, 10.3
   */
  hasSpiritStones(amount: number): boolean {
    return this.state.resources.spiritStones >= amount;
  }

  /**
   * 获取灵石数量
   * Validates: Requirements 10.1
   */
  getSpiritStones(): number {
    // 确保返回值不是负数或NaN
    const stones = this.state.resources.spiritStones;
    if (isNaN(stones) || !isFinite(stones) || stones < 0) {
      console.error(`[ResourceManager] 灵石数值异常: ${stones}, 重置为0`);
      this.state.resources.spiritStones = 0;
      return 0;
    }
    return stones;
  }

  /**
   * 增加丹药
   * Validates: Requirements 10.1, 10.4
   */
  addPill(pillId: string, amount: number = 1): void {
    if (amount < 0) {
      throw new Error('Amount must be positive');
    }

    const currentAmount = this.state.resources.pills.get(pillId) || 0;
    this.state.resources.pills.set(pillId, currentAmount + amount);
  }

  /**
   * 减少丹药
   * Validates: Requirements 10.1, 10.5
   */
  removePill(pillId: string, amount: number = 1): boolean {
    if (amount < 0) {
      throw new Error('Amount must be positive');
    }

    if (!this.hasPill(pillId, amount)) {
      return false;
    }

    const currentAmount = this.state.resources.pills.get(pillId) || 0;
    const newAmount = currentAmount - amount;

    if (newAmount <= 0) {
      this.state.resources.pills.delete(pillId);
    } else {
      this.state.resources.pills.set(pillId, newAmount);
    }

    return true;
  }

  /**
   * 检查丹药是否充足
   * Validates: Requirements 10.2, 10.3
   */
  hasPill(pillId: string, amount: number = 1): boolean {
    const currentAmount = this.state.resources.pills.get(pillId) || 0;
    return currentAmount >= amount;
  }

  /**
   * 获取丹药数量
   * Validates: Requirements 10.1
   */
  getPillCount(pillId: string): number {
    return this.state.resources.pills.get(pillId) || 0;
  }

  /**
   * 获取所有丹药
   */
  getAllPills(): Map<string, number> {
    return new Map(this.state.resources.pills);
  }

  /**
   * 增加法器
   * Validates: Requirements 10.1, 10.4
   */
  addArtifact(artifactId: string, amount: number = 1): void {
    if (amount < 0) {
      throw new Error('Amount must be positive');
    }

    const currentAmount = this.state.resources.artifacts.get(artifactId) || 0;
    this.state.resources.artifacts.set(artifactId, currentAmount + amount);
  }

  /**
   * 减少法器
   * Validates: Requirements 10.1, 10.5
   */
  removeArtifact(artifactId: string, amount: number = 1): boolean {
    if (amount < 0) {
      throw new Error('Amount must be positive');
    }

    if (!this.hasArtifact(artifactId, amount)) {
      return false;
    }

    const currentAmount = this.state.resources.artifacts.get(artifactId) || 0;
    const newAmount = currentAmount - amount;

    if (newAmount <= 0) {
      this.state.resources.artifacts.delete(artifactId);
    } else {
      this.state.resources.artifacts.set(artifactId, newAmount);
    }

    return true;
  }

  /**
   * 检查法器是否充足
   * Validates: Requirements 10.2, 10.3
   */
  hasArtifact(artifactId: string, amount: number = 1): boolean {
    const currentAmount = this.state.resources.artifacts.get(artifactId) || 0;
    return currentAmount >= amount;
  }

  /**
   * 获取法器数量
   * Validates: Requirements 10.1
   */
  getArtifactCount(artifactId: string): number {
    return this.state.resources.artifacts.get(artifactId) || 0;
  }

  /**
   * 获取所有法器
   */
  getAllArtifacts(): Map<string, number> {
    return new Map(this.state.resources.artifacts);
  }

  /**
   * 使用丹药并应用效果
   * Validates: Requirements 10.5, 10.6
   */
  usePill(pillId: string): ResourceEffect | null {
    if (!this.hasPill(pillId)) {
      return null;
    }

    const definition = this.getResourceDefinition(pillId);
    if (!definition) {
      return null;
    }

    // 消耗丹药
    this.removePill(pillId);

    // 返回效果供调用者应用
    return definition.effect;
  }

  /**
   * 检查资源是否充足（通用方法）
   * Validates: Requirements 10.2, 10.3
   */
  hasResources(requirements: {
    spiritStones?: number;
    pills?: Map<string, number>;
    artifacts?: Map<string, number>;
  }): boolean {
    // 检查灵石
    if (requirements.spiritStones !== undefined) {
      if (!this.hasSpiritStones(requirements.spiritStones)) {
        return false;
      }
    }

    // 检查丹药
    if (requirements.pills) {
      for (const [pillId, amount] of requirements.pills.entries()) {
        if (!this.hasPill(pillId, amount)) {
          return false;
        }
      }
    }

    // 检查法器
    if (requirements.artifacts) {
      for (const [artifactId, amount] of requirements.artifacts.entries()) {
        if (!this.hasArtifact(artifactId, amount)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 消耗资源（通用方法）
   * Validates: Requirements 10.5
   */
  consumeResources(requirements: {
    spiritStones?: number;
    pills?: Map<string, number>;
    artifacts?: Map<string, number>;
  }): boolean {
    // 先检查是否充足
    if (!this.hasResources(requirements)) {
      return false;
    }

    // 消耗灵石
    if (requirements.spiritStones !== undefined) {
      this.removeSpiritStones(requirements.spiritStones);
    }

    // 消耗丹药
    if (requirements.pills) {
      for (const [pillId, amount] of requirements.pills.entries()) {
        this.removePill(pillId, amount);
      }
    }

    // 消耗法器
    if (requirements.artifacts) {
      for (const [artifactId, amount] of requirements.artifacts.entries()) {
        this.removeArtifact(artifactId, amount);
      }
    }

    return true;
  }

  /**
   * 获取资源摘要（用于显示）
   * Validates: Requirements 10.1
   */
  getResourceSummary(): {
    spiritStones: number;
    pills: Array<{ id: string; name: string; count: number; rarity: ResourceRarity }>;
    artifacts: Array<{ id: string; name: string; count: number; rarity: ResourceRarity }>;
  } {
    const pills: Array<{ id: string; name: string; count: number; rarity: ResourceRarity }> = [];
    for (const [pillId, count] of this.state.resources.pills.entries()) {
      const definition = this.getResourceDefinition(pillId);
      pills.push({
        id: pillId,
        name: definition?.name || pillId,
        count,
        rarity: definition?.rarity || ResourceRarity.Common
      });
    }

    const artifacts: Array<{ id: string; name: string; count: number; rarity: ResourceRarity }> = [];
    for (const [artifactId, count] of this.state.resources.artifacts.entries()) {
      const definition = this.getResourceDefinition(artifactId);
      artifacts.push({
        id: artifactId,
        name: definition?.name || artifactId,
        count,
        rarity: definition?.rarity || ResourceRarity.Common
      });
    }

    return {
      spiritStones: this.state.resources.spiritStones,
      pills,
      artifacts
    };
  }

  /**
   * 获取资源稀有度的显示颜色
   */
  static getRarityColor(rarity: ResourceRarity): string {
    switch (rarity) {
      case ResourceRarity.Common:
        return '#ffffff';
      case ResourceRarity.Uncommon:
        return '#1eff00';
      case ResourceRarity.Rare:
        return '#0070dd';
      case ResourceRarity.Epic:
        return '#a335ee';
      case ResourceRarity.Legendary:
        return '#ff8000';
      default:
        return '#ffffff';
    }
  }
  
  /**
   * 添加道具
   */
  addItem(itemId: string, amount: number = 1): void {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const currentAmount = this.state.resources.items.get(itemId) || 0;
    this.state.resources.items.set(itemId, currentAmount + amount);
  }

  /**
   * 移除道具
   */
  removeItem(itemId: string, amount: number = 1): boolean {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const currentAmount = this.state.resources.items.get(itemId) || 0;

    if (currentAmount < amount) {
      return false;
    }

    const newAmount = currentAmount - amount;
    if (newAmount === 0) {
      this.state.resources.items.delete(itemId);
    } else {
      this.state.resources.items.set(itemId, newAmount);
    }

    return true;
  }

  /**
   * 检查是否拥有道具
   */
  hasItem(itemId: string, amount: number = 1): boolean {
    const currentAmount = this.state.resources.items.get(itemId) || 0;
    return currentAmount >= amount;
  }

  /**
   * 获取道具数量
   */
  getItemCount(itemId: string): number {
    return this.state.resources.items.get(itemId) || 0;
  }

  /**
   * 获取所有道具
   */
  getAllItems(): Map<string, number> {
    return new Map(this.state.resources.items);
  }
  
  /**
   * 获取背包总览（包含所有类型的物品）
   */
  getInventorySummary(): {
    spiritStones: number;
    pills: Array<{ id: string; count: number; name?: string }>;
    artifacts: Array<{ id: string; count: number; name?: string }>;
    items: Array<{ id: string; count: number; name?: string }>;
    totalItems: number;
  } {
    const pills = Array.from(this.state.resources.pills.entries()).map(([id, count]) => {
      const def = this.getResourceDefinition(id);
      return { id, count, name: def?.name };
    });
    
    const artifacts = Array.from(this.state.resources.artifacts.entries()).map(([id, count]) => {
      const def = this.getResourceDefinition(id);
      return { id, count, name: def?.name };
    });
    
    const items = Array.from(this.state.resources.items.entries()).map(([id, count]) => {
      const def = this.getResourceDefinition(id);
      return { id, count, name: def?.name };
    });
    
    const totalItems = pills.length + artifacts.length + items.length;
    
    return {
      spiritStones: this.state.resources.spiritStones,
      pills,
      artifacts,
      items,
      totalItems
    };
  }
}

