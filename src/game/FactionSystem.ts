/**
 * FactionSystem - 势力系统
 * 负责管理玩家与各势力的关系、加入逻辑和势力间关系
 * Validates: Requirements 9.4, 9.5, 9.6, 9.7
 */

import { PlayerState } from '../types';

/**
 * 势力类型
 */
export enum FactionType {
  RighteousSect = 'righteous_sect',    // 正道宗门
  DemonicPath = 'demonic_path',        // 魔道
  RogueCultivator = 'rogue_cultivator' // 散修
}

/**
 * 势力关系类型
 */
export enum FactionRelation {
  Allied = 'allied',     // 同盟
  Neutral = 'neutral',   // 中立
  Hostile = 'hostile'    // 敌对
}

/**
 * 势力定义
 */
export interface FactionDefinition {
  id: string;
  name: string;
  type: FactionType;
  description: string;
  joinRequirements?: {
    minCultivationLevel?: string;
    minReputation?: number;
    requiredItems?: string[];
  };
}

/**
 * 势力关系配置
 */
export interface FactionRelationConfig {
  faction1: string;
  faction2: string;
  relation: FactionRelation;
}

export class FactionSystem {
  private state: PlayerState;
  private factionDefinitions: Map<string, FactionDefinition> = new Map();
  private factionRelations: Map<string, FactionRelation> = new Map();
  // Store faction pairs for easier lookup
  private factionPairs: Map<string, [string, string]> = new Map();

  constructor(state: PlayerState) {
    this.state = state;
    this.initializeDefaultFactions();
  }

  /**
   * 初始化默认势力
   */
  private initializeDefaultFactions(): void {
    // 正道宗门
    this.registerFaction({
      id: 'tianxuan_sect',
      name: '天玄宗',
      type: FactionType.RighteousSect,
      description: '正道第一大宗门'
    });

    this.registerFaction({
      id: 'qingyun_sect',
      name: '青云宗',
      type: FactionType.RighteousSect,
      description: '正道名门'
    });

    // 魔道
    this.registerFaction({
      id: 'blood_demon_sect',
      name: '血魔宗',
      type: FactionType.DemonicPath,
      description: '魔道势力'
    });

    // 散修
    this.registerFaction({
      id: 'rogue_alliance',
      name: '散修联盟',
      type: FactionType.RogueCultivator,
      description: '散修组织'
    });

    // 设置势力关系
    this.setFactionRelation('tianxuan_sect', 'qingyun_sect', FactionRelation.Allied);
    this.setFactionRelation('tianxuan_sect', 'blood_demon_sect', FactionRelation.Hostile);
    this.setFactionRelation('qingyun_sect', 'blood_demon_sect', FactionRelation.Hostile);
  }

  /**
   * 注册势力定义
   */
  registerFaction(definition: FactionDefinition): void {
    this.factionDefinitions.set(definition.id, definition);
  }

  /**
   * 获取势力定义
   */
  getFactionDefinition(factionId: string): FactionDefinition | undefined {
    return this.factionDefinitions.get(factionId);
  }

  /**
   * 获取当前所属势力
   * Validates: Requirements 9.4
   */
  getCurrentFaction(): string | null {
    return this.state.faction.current;
  }

  /**
   * 加入势力
   * Validates: Requirements 9.4, 9.5
   */
  joinFaction(factionId: string): boolean {
    const definition = this.getFactionDefinition(factionId);
    if (!definition) {
      return false;
    }

    // 如果已经加入其他势力，需要先退出
    if (this.state.faction.current && this.state.faction.current !== factionId) {
      return false;
    }

    this.state.faction.current = factionId;
    
    // 初始化声望
    if (!this.state.faction.reputation.has(factionId)) {
      this.state.faction.reputation.set(factionId, 0);
    }

    return true;
  }

  /**
   * 退出当前势力
   * Validates: Requirements 9.4
   */
  leaveFaction(): boolean {
    if (!this.state.faction.current) {
      return false;
    }

    this.state.faction.current = null;
    return true;
  }

  /**
   * 检查是否属于某个势力
   * Validates: Requirements 9.4
   */
  isMemberOf(factionId: string): boolean {
    return this.state.faction.current === factionId;
  }

  /**
   * 获取势力声望
   * Validates: Requirements 9.5
   */
  getFactionReputation(factionId: string): number {
    return this.state.faction.reputation.get(factionId) || 0;
  }

  /**
   * 修改势力声望
   * Validates: Requirements 9.5
   */
  changeFactionReputation(factionId: string, change: number): number {
    const currentReputation = this.getFactionReputation(factionId);
    const newReputation = currentReputation + change;
    this.state.faction.reputation.set(factionId, newReputation);
    return newReputation;
  }

  /**
   * 设置势力声望
   * Validates: Requirements 9.5
   */
  setFactionReputation(factionId: string, value: number): void {
    this.state.faction.reputation.set(factionId, value);
  }

  /**
   * 获取所有势力声望
   */
  getAllFactionReputations(): Map<string, number> {
    return new Map(this.state.faction.reputation);
  }

  /**
   * 设置势力间关系
   * Validates: Requirements 9.6
   */
  setFactionRelation(faction1: string, faction2: string, relation: FactionRelation): void {
    const key = this.getFactionRelationKey(faction1, faction2);
    this.factionRelations.set(key, relation);
    this.factionPairs.set(key, [faction1, faction2]);
  }

  /**
   * 获取势力间关系
   * Validates: Requirements 9.6
   */
  getFactionRelation(faction1: string, faction2: string): FactionRelation {
    const key = this.getFactionRelationKey(faction1, faction2);
    return this.factionRelations.get(key) || FactionRelation.Neutral;
  }

  /**
   * 生成势力关系键（确保顺序一致）
   */
  private getFactionRelationKey(faction1: string, faction2: string): string {
    return [faction1, faction2].sort().join('_');
  }

  /**
   * 检查两个势力是否敌对
   * Validates: Requirements 9.6
   */
  areFactionsHostile(faction1: string, faction2: string): boolean {
    return this.getFactionRelation(faction1, faction2) === FactionRelation.Hostile;
  }

  /**
   * 检查两个势力是否同盟
   * Validates: Requirements 9.6
   */
  areFactionsAllied(faction1: string, faction2: string): boolean {
    return this.getFactionRelation(faction1, faction2) === FactionRelation.Allied;
  }

  /**
   * 获取敌对势力列表
   * Validates: Requirements 9.6
   */
  getHostileFactions(factionId: string): string[] {
    const hostile: string[] = [];
    
    for (const [key, relation] of this.factionRelations.entries()) {
      if (relation === FactionRelation.Hostile) {
        const pair = this.factionPairs.get(key);
        if (pair) {
          const [faction1, faction2] = pair;
          if (faction1 === factionId) {
            hostile.push(faction2);
          } else if (faction2 === factionId) {
            hostile.push(faction1);
          }
        }
      }
    }
    
    return hostile;
  }

  /**
   * 获取同盟势力列表
   * Validates: Requirements 9.6
   */
  getAlliedFactions(factionId: string): string[] {
    const allied: string[] = [];
    
    for (const [key, relation] of this.factionRelations.entries()) {
      if (relation === FactionRelation.Allied) {
        const pair = this.factionPairs.get(key);
        if (pair) {
          const [faction1, faction2] = pair;
          if (faction1 === factionId) {
            allied.push(faction2);
          } else if (faction2 === factionId) {
            allied.push(faction1);
          }
        }
      }
    }
    
    return allied;
  }

  /**
   * 检查是否可以接取势力任务
   * Validates: Requirements 9.5
   */
  canAcceptFactionQuest(factionId: string, requiredReputation: number = 0): boolean {
    // 必须是该势力成员
    if (!this.isMemberOf(factionId)) {
      return false;
    }

    // 检查声望要求
    return this.getFactionReputation(factionId) >= requiredReputation;
  }

  /**
   * 检查是否可以访问势力资源
   * Validates: Requirements 9.5
   */
  canAccessFactionResources(factionId: string, requiredReputation: number = 0): boolean {
    // 必须是该势力成员
    if (!this.isMemberOf(factionId)) {
      return false;
    }

    // 检查声望要求
    return this.getFactionReputation(factionId) >= requiredReputation;
  }

  /**
   * 玩家行为影响其他势力态度
   * Validates: Requirements 9.7
   */
  applyFactionChoiceConsequences(chosenFactionId: string, reputationChange: number): void {
    // 提升选择势力的声望
    this.changeFactionReputation(chosenFactionId, reputationChange);

    // 降低敌对势力的声望
    const hostileFactions = this.getHostileFactions(chosenFactionId);
    for (const hostileFaction of hostileFactions) {
      this.changeFactionReputation(hostileFaction, -reputationChange);
    }

    // 轻微提升同盟势力的声望
    const alliedFactions = this.getAlliedFactions(chosenFactionId);
    for (const alliedFaction of alliedFactions) {
      this.changeFactionReputation(alliedFaction, Math.floor(reputationChange * 0.5));
    }
  }

  /**
   * 获取势力摘要（用于显示）
   */
  getFactionSummary(): {
    currentFaction: string | null;
    reputations: Array<{
      factionId: string;
      name: string;
      reputation: number;
      type: FactionType;
    }>;
  } {
    const reputations: Array<{
      factionId: string;
      name: string;
      reputation: number;
      type: FactionType;
    }> = [];

    for (const [factionId, reputation] of this.state.faction.reputation.entries()) {
      const definition = this.getFactionDefinition(factionId);
      if (definition) {
        reputations.push({
          factionId,
          name: definition.name,
          reputation,
          type: definition.type
        });
      }
    }

    return {
      currentFaction: this.state.faction.current,
      reputations
    };
  }

  /**
   * 获取所有势力定义
   */
  getAllFactions(): FactionDefinition[] {
    return Array.from(this.factionDefinitions.values());
  }

  /**
   * 根据类型获取势力
   */
  getFactionsByType(type: FactionType): FactionDefinition[] {
    return Array.from(this.factionDefinitions.values()).filter(
      faction => faction.type === type
    );
  }
}
