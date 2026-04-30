/**
 * RelationshipSystem - 人脉系统
 * 负责管理玩家与NPC的关系值及其对NPC行为的影响
 * Validates: Requirements 9.1, 9.2, 9.3
 */

import { PlayerState } from '../types';

/**
 * NPC态度类型
 */
export enum NPCAttitude {
  Hostile = 'hostile',      // 敌对 (< -50)
  Unfriendly = 'unfriendly', // 不友好 (-50 to -10)
  Neutral = 'neutral',       // 中立 (-10 to 10)
  Friendly = 'friendly',     // 友好 (10 to 50)
  Intimate = 'intimate'      // 亲密 (> 50)
}

/**
 * 关系变化原因
 */
export interface RelationshipChangeReason {
  npcId: string;
  change: number;
  reason: string;
  timestamp?: number;
}

export class RelationshipSystem {
  private state: PlayerState;
  private readonly MIN_RELATIONSHIP = -100;
  private readonly MAX_RELATIONSHIP = 100;

  constructor(state: PlayerState) {
    this.state = state;
  }

  /**
   * 获取与NPC的关系值
   * Validates: Requirements 9.1
   */
  getRelationship(npcId: string): number {
    return this.state.relationships.get(npcId) || 0;
  }

  /**
   * 设置与NPC的关系值
   * Validates: Requirements 9.1
   */
  setRelationship(npcId: string, value: number): void {
    const clampedValue = this.clampRelationship(value);
    this.state.relationships.set(npcId, clampedValue);
  }

  /**
   * 修改与NPC的关系值
   * Validates: Requirements 9.2
   */
  changeRelationship(npcId: string, change: number): number {
    const currentValue = this.getRelationship(npcId);
    const newValue = this.clampRelationship(currentValue + change);
    this.state.relationships.set(npcId, newValue);
    return newValue;
  }

  /**
   * 限制关系值在有效范围内
   */
  private clampRelationship(value: number): number {
    return Math.max(this.MIN_RELATIONSHIP, Math.min(this.MAX_RELATIONSHIP, value));
  }

  /**
   * 获取NPC的态度
   * Validates: Requirements 9.3
   */
  getAttitude(npcId: string): NPCAttitude {
    const relationship = this.getRelationship(npcId);
    
    if (relationship < -50) {
      return NPCAttitude.Hostile;
    } else if (relationship < -10) {
      return NPCAttitude.Unfriendly;
    } else if (relationship <= 10) {
      return NPCAttitude.Neutral;
    } else if (relationship <= 50) {
      return NPCAttitude.Friendly;
    } else {
      return NPCAttitude.Intimate;
    }
  }

  /**
   * 检查NPC是否会提供帮助
   * Validates: Requirements 9.3
   */
  willHelp(npcId: string): boolean {
    const relationship = this.getRelationship(npcId);
    return relationship >= 10; // 友好或更高
  }

  /**
   * 检查NPC是否敌对
   * Validates: Requirements 9.3
   */
  isHostile(npcId: string): boolean {
    const relationship = this.getRelationship(npcId);
    return relationship < -50;
  }

  /**
   * 获取所有关系
   */
  getAllRelationships(): Map<string, number> {
    return new Map(this.state.relationships);
  }

  /**
   * 获取所有友好的NPC
   */
  getFriendlyNPCs(): string[] {
    const friendly: string[] = [];
    for (const [npcId, value] of this.state.relationships.entries()) {
      if (value >= 10) {
        friendly.push(npcId);
      }
    }
    return friendly;
  }

  /**
   * 获取所有敌对的NPC
   */
  getHostileNPCs(): string[] {
    const hostile: string[] = [];
    for (const [npcId, value] of this.state.relationships.entries()) {
      if (value < -50) {
        hostile.push(npcId);
      }
    }
    return hostile;
  }

  /**
   * 获取关系摘要（用于显示）
   */
  getRelationshipSummary(): Array<{
    npcId: string;
    value: number;
    attitude: NPCAttitude;
  }> {
    const summary: Array<{
      npcId: string;
      value: number;
      attitude: NPCAttitude;
    }> = [];

    for (const [npcId, value] of this.state.relationships.entries()) {
      summary.push({
        npcId,
        value,
        attitude: this.getAttitude(npcId)
      });
    }

    return summary;
  }

  /**
   * 根据态度获取对话修饰符
   * Validates: Requirements 9.3
   */
  getDialogueModifier(npcId: string): number {
    const attitude = this.getAttitude(npcId);
    
    switch (attitude) {
      case NPCAttitude.Hostile:
        return -0.5; // 50%成功率降低
      case NPCAttitude.Unfriendly:
        return -0.2; // 20%成功率降低
      case NPCAttitude.Neutral:
        return 0;
      case NPCAttitude.Friendly:
        return 0.2; // 20%成功率提升
      case NPCAttitude.Intimate:
        return 0.5; // 50%成功率提升
      default:
        return 0;
    }
  }

  /**
   * 根据态度获取价格修饰符
   * Validates: Requirements 9.3
   */
  getPriceModifier(npcId: string): number {
    const attitude = this.getAttitude(npcId);
    
    switch (attitude) {
      case NPCAttitude.Hostile:
        return 2.0; // 价格翻倍
      case NPCAttitude.Unfriendly:
        return 1.5; // 价格提高50%
      case NPCAttitude.Neutral:
        return 1.0; // 正常价格
      case NPCAttitude.Friendly:
        return 0.8; // 价格降低20%
      case NPCAttitude.Intimate:
        return 0.5; // 价格减半
      default:
        return 1.0;
    }
  }

  /**
   * 检查是否可以触发特殊事件
   * Validates: Requirements 9.3
   */
  canTriggerSpecialEvent(npcId: string, requiredRelationship: number): boolean {
    return this.getRelationship(npcId) >= requiredRelationship;
  }

  /**
   * 重置与NPC的关系
   */
  resetRelationship(npcId: string): void {
    this.state.relationships.delete(npcId);
  }

  /**
   * 清除所有关系
   */
  clearAllRelationships(): void {
    this.state.relationships.clear();
  }
}
