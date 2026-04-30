/**
 * StoryBranchManager - 剧情分支管理器
 * 负责剧情线加载和管理、剧情分支点追踪、剧情进度和标记系统、剧情事件解锁机制
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { PlayerState, GameEvent, CultivationPath } from '../types';

/**
 * 剧情线配置
 */
export interface StoryLine {
  id: string;
  name: string;
  description: string;
  cultivationPath?: string;  // 关联的修行方向（可选）
  events: string[];  // 剧情事件ID列表
  branches: StoryBranch[];  // 剧情分支点
}

/**
 * 剧情分支点
 */
export interface StoryBranch {
  id: string;
  name: string;
  description: string;
  triggerConditions: {
    requiredFlags?: string[];  // 需要的剧情标记
    requiredQuests?: string[];  // 需要完成的任务
    minReputation?: { righteous?: number; demonic?: number };
    requiredRelationships?: Array<{ npcId: string; minValue: number }>;
  };
  outcomes: StoryBranchOutcome[];  // 分支结果
}

/**
 * 剧情分支结果
 */
export interface StoryBranchOutcome {
  id: string;
  description: string;
  setFlags?: string[];  // 设置的剧情标记
  unlockEvents?: string[];  // 解锁的事件
  unlockStoryLines?: string[];  // 解锁的剧情线
}

/**
 * 剧情进度记录
 */
export interface StoryProgress {
  storyLineId: string;
  currentEventIndex: number;
  completedBranches: Set<string>;
  activeBranches: Set<string>;
}

export class StoryBranchManager {
  private storyLines: Map<string, StoryLine> = new Map();
  private storyProgress: Map<string, StoryProgress> = new Map();
  private activeBranches: Set<string> = new Set();

  constructor() {
    this.initializeStoryLines();
  }

  /**
   * 初始化剧情线
   * Validates: Requirements 6.1
   */
  private initializeStoryLines(): void {
    // 剑修剧情线
    this.registerStoryLine({
      id: 'sword_path_main',
      name: '剑道之路',
      description: '以剑入道，追求极致的剑道境界',
      cultivationPath: 'sword',
      events: ['sword_master_encounter', 'sword_dao_enlightenment', 'sword_trial'],
      branches: [
        {
          id: 'sword_branch_1',
          name: '剑道抉择',
          description: '选择剑道的发展方向',
          triggerConditions: {
            requiredFlags: ['met_sword_master']
          },
          outcomes: [
            {
              id: 'offensive_sword',
              description: '选择攻击型剑道',
              setFlags: ['offensive_sword_path'],
              unlockEvents: ['offensive_sword_technique']
            },
            {
              id: 'defensive_sword',
              description: '选择防御型剑道',
              setFlags: ['defensive_sword_path'],
              unlockEvents: ['defensive_sword_technique']
            }
          ]
        }
      ]
    });

    // 体修剧情线
    this.registerStoryLine({
      id: 'body_path_main',
      name: '炼体之路',
      description: '淬炼肉身，追求不朽金身',
      cultivationPath: 'body',
      events: ['body_tempering_trial', 'ancient_body_technique', 'body_breakthrough'],
      branches: [
        {
          id: 'body_branch_1',
          name: '炼体方向',
          description: '选择炼体的侧重点',
          triggerConditions: {
            requiredFlags: ['body_tempering_complete']
          },
          outcomes: [
            {
              id: 'strength_focus',
              description: '侧重力量',
              setFlags: ['strength_body_path'],
              unlockEvents: ['strength_training']
            },
            {
              id: 'defense_focus',
              description: '侧重防御',
              setFlags: ['defense_body_path'],
              unlockEvents: ['defense_training']
            }
          ]
        }
      ]
    });

    // 通用剧情线：宗门之路
    this.registerStoryLine({
      id: 'sect_path_main',
      name: '宗门之路',
      description: '在宗门中成长，建立人脉和声望',
      events: ['join_sect', 'sect_competition', 'sect_elder_quest'],
      branches: [
        {
          id: 'sect_branch_1',
          name: '宗门立场',
          description: '在宗门内部斗争中选择立场',
          triggerConditions: {
            requiredFlags: ['sect_conflict_triggered'],
            minReputation: { righteous: 30 }
          },
          outcomes: [
            {
              id: 'support_elder',
              description: '支持长老派',
              setFlags: ['elder_faction'],
              unlockEvents: ['elder_faction_quest']
            },
            {
              id: 'support_young',
              description: '支持少壮派',
              setFlags: ['young_faction'],
              unlockEvents: ['young_faction_quest']
            }
          ]
        }
      ]
    });

    // 通用剧情线：魔道之路
    this.registerStoryLine({
      id: 'demonic_path_main',
      name: '魔道之路',
      description: '踏入魔道，追求力量的极致',
      events: ['demonic_temptation', 'demonic_cultivation', 'demonic_tribulation'],
      branches: [
        {
          id: 'demonic_branch_1',
          name: '魔道抉择',
          description: '选择魔道的修炼方式',
          triggerConditions: {
            requiredFlags: ['entered_demonic_path'],
            minReputation: { demonic: 50 }
          },
          outcomes: [
            {
              id: 'blood_path',
              description: '选择血道',
              setFlags: ['blood_demonic_path'],
              unlockEvents: ['blood_cultivation']
            },
            {
              id: 'soul_path',
              description: '选择魂道',
              setFlags: ['soul_demonic_path'],
              unlockEvents: ['soul_cultivation']
            }
          ]
        }
      ]
    });
  }

  /**
   * 注册剧情线
   * Validates: Requirements 6.1
   */
  registerStoryLine(storyLine: StoryLine): void {
    this.storyLines.set(storyLine.id, storyLine);
    
    // 初始化剧情进度
    this.storyProgress.set(storyLine.id, {
      storyLineId: storyLine.id,
      currentEventIndex: 0,
      completedBranches: new Set(),
      activeBranches: new Set()
    });
  }

  /**
   * 根据修行方向加载对应的主线剧情
   * Validates: Requirements 6.1
   */
  loadStoryLineForPath(cultivationPath: CultivationPath, state: PlayerState): void {
    // 查找与修行方向关联的剧情线
    for (const storyLine of this.storyLines.values()) {
      if (storyLine.cultivationPath === cultivationPath.id) {
        // 解锁剧情线的所有事件
        for (const eventId of storyLine.events) {
          state.storyProgress.unlockedEvents.add(eventId);
        }
        
        // 设置初始剧情标记
        state.storyProgress.storyFlags.set(`${storyLine.id}_active`, true);
      }
    }
  }

  /**
   * 追踪剧情分支点
   * Validates: Requirements 6.2
   */
  trackBranchPoint(branchId: string, state: PlayerState): void {
    this.activeBranches.add(branchId);
    
    // 记录到玩家状态
    state.storyProgress.storyFlags.set(`branch_${branchId}_active`, true);
  }

  /**
   * 检查剧情分支点是否可触发
   * Validates: Requirements 6.2
   */
  checkBranchTriggerConditions(branch: StoryBranch, state: PlayerState): boolean {
    const cond = branch.triggerConditions;

    // 检查剧情标记
    if (cond.requiredFlags) {
      for (const flag of cond.requiredFlags) {
        if (!state.storyProgress.storyFlags.has(flag)) {
          return false;
        }
      }
    }

    // 检查任务完成情况
    if (cond.requiredQuests) {
      for (const questId of cond.requiredQuests) {
        if (!state.storyProgress.completedQuests.has(questId)) {
          return false;
        }
      }
    }

    // 检查声望
    if (cond.minReputation) {
      if (cond.minReputation.righteous !== undefined) {
        if (state.reputation.righteous < cond.minReputation.righteous) {
          return false;
        }
      }
      if (cond.minReputation.demonic !== undefined) {
        if (state.reputation.demonic < cond.minReputation.demonic) {
          return false;
        }
      }
    }

    // 检查关系值
    if (cond.requiredRelationships) {
      for (const req of cond.requiredRelationships) {
        const relationshipValue = state.relationships.get(req.npcId) || 0;
        if (relationshipValue < req.minValue) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 获取当前可触发的剧情分支
   * Validates: Requirements 6.2
   */
  getAvailableBranches(state: PlayerState): StoryBranch[] {
    const availableBranches: StoryBranch[] = [];

    for (const storyLine of this.storyLines.values()) {
      // 检查剧情线是否激活
      if (!state.storyProgress.storyFlags.has(`${storyLine.id}_active`)) {
        continue;
      }

      for (const branch of storyLine.branches) {
        // 检查分支是否已完成
        const progress = this.storyProgress.get(storyLine.id);
        if (progress && progress.completedBranches.has(branch.id)) {
          continue;
        }

        // 检查触发条件
        if (this.checkBranchTriggerConditions(branch, state)) {
          availableBranches.push(branch);
        }
      }
    }

    return availableBranches;
  }

  /**
   * 执行剧情分支结果
   * Validates: Requirements 6.3, 6.4
   */
  executeBranchOutcome(branchId: string, outcomeId: string, state: PlayerState): void {
    // 查找分支和结果
    let targetBranch: StoryBranch | null = null;
    let targetOutcome: StoryBranchOutcome | null = null;
    let storyLineId: string | null = null;

    for (const [lineId, storyLine] of this.storyLines.entries()) {
      for (const branch of storyLine.branches) {
        if (branch.id === branchId) {
          targetBranch = branch;
          storyLineId = lineId;
          
          for (const outcome of branch.outcomes) {
            if (outcome.id === outcomeId) {
              targetOutcome = outcome;
              break;
            }
          }
          break;
        }
      }
      if (targetBranch) break;
    }

    if (!targetBranch || !targetOutcome || !storyLineId) {
      return;
    }

    // 设置剧情标记
    if (targetOutcome.setFlags) {
      for (const flag of targetOutcome.setFlags) {
        state.storyProgress.storyFlags.set(flag, true);
      }
    }

    // 解锁事件
    if (targetOutcome.unlockEvents) {
      for (const eventId of targetOutcome.unlockEvents) {
        state.storyProgress.unlockedEvents.add(eventId);
      }
    }

    // 解锁新剧情线
    if (targetOutcome.unlockStoryLines) {
      for (const newLineId of targetOutcome.unlockStoryLines) {
        state.storyProgress.storyFlags.set(`${newLineId}_active`, true);
        
        // 解锁新剧情线的事件
        const newLine = this.storyLines.get(newLineId);
        if (newLine) {
          for (const eventId of newLine.events) {
            state.storyProgress.unlockedEvents.add(eventId);
          }
        }
      }
    }

    // 标记分支已完成
    const progress = this.storyProgress.get(storyLineId);
    if (progress) {
      progress.completedBranches.add(branchId);
      progress.activeBranches.delete(branchId);
    }

    // 移除活跃分支
    this.activeBranches.delete(branchId);
    state.storyProgress.storyFlags.delete(`branch_${branchId}_active`);
  }

  /**
   * 推进剧情进度
   * Validates: Requirements 6.3
   */
  advanceStoryProgress(storyLineId: string, eventId: string): void {
    const progress = this.storyProgress.get(storyLineId);
    if (!progress) {
      return;
    }

    const storyLine = this.storyLines.get(storyLineId);
    if (!storyLine) {
      return;
    }

    // 查找事件在剧情线中的位置
    const eventIndex = storyLine.events.indexOf(eventId);
    if (eventIndex !== -1 && eventIndex > progress.currentEventIndex) {
      progress.currentEventIndex = eventIndex;
    }
  }

  /**
   * 获取剧情进度
   * Validates: Requirements 6.3
   */
  getStoryProgress(storyLineId: string): StoryProgress | undefined {
    return this.storyProgress.get(storyLineId);
  }

  /**
   * 检查剧情事件是否已解锁
   * Validates: Requirements 6.4
   */
  isEventUnlocked(eventId: string, state: PlayerState): boolean {
    return state.storyProgress.unlockedEvents.has(eventId);
  }

  /**
   * 解锁剧情事件
   * Validates: Requirements 6.4
   */
  unlockEvent(eventId: string, state: PlayerState): void {
    state.storyProgress.unlockedEvents.add(eventId);
  }

  /**
   * 批量解锁事件
   * Validates: Requirements 6.4
   */
  unlockEvents(eventIds: string[], state: PlayerState): void {
    for (const eventId of eventIds) {
      state.storyProgress.unlockedEvents.add(eventId);
    }
  }

  /**
   * 检查剧情标记
   * Validates: Requirements 6.3
   */
  hasStoryFlag(flag: string, state: PlayerState): boolean {
    return state.storyProgress.storyFlags.has(flag);
  }

  /**
   * 设置剧情标记
   * Validates: Requirements 6.3
   */
  setStoryFlag(flag: string, value: any, state: PlayerState): void {
    state.storyProgress.storyFlags.set(flag, value);
  }

  /**
   * 获取剧情标记值
   * Validates: Requirements 6.3
   */
  getStoryFlag(flag: string, state: PlayerState): any {
    return state.storyProgress.storyFlags.get(flag);
  }

  /**
   * 获取所有激活的剧情线
   * Validates: Requirements 6.1
   */
  getActiveStoryLines(state: PlayerState): StoryLine[] {
    const activeLines: StoryLine[] = [];

    for (const storyLine of this.storyLines.values()) {
      if (state.storyProgress.storyFlags.has(`${storyLine.id}_active`)) {
        activeLines.push(storyLine);
      }
    }

    return activeLines;
  }

  /**
   * 获取剧情线的下一个事件
   * Validates: Requirements 6.1, 6.3
   */
  getNextEvent(storyLineId: string): string | null {
    const progress = this.storyProgress.get(storyLineId);
    if (!progress) {
      return null;
    }

    const storyLine = this.storyLines.get(storyLineId);
    if (!storyLine) {
      return null;
    }

    const nextIndex = progress.currentEventIndex + 1;
    if (nextIndex < storyLine.events.length) {
      return storyLine.events[nextIndex];
    }

    return null;
  }

  /**
   * 检查剧情线是否完成
   * Validates: Requirements 6.3
   */
  isStoryLineComplete(storyLineId: string): boolean {
    const progress = this.storyProgress.get(storyLineId);
    if (!progress) {
      return false;
    }

    const storyLine = this.storyLines.get(storyLineId);
    if (!storyLine) {
      return false;
    }

    return progress.currentEventIndex >= storyLine.events.length - 1;
  }

  /**
   * 获取剧情线完成度百分比
   * Validates: Requirements 6.3
   */
  getStoryLineCompletionPercentage(storyLineId: string): number {
    const progress = this.storyProgress.get(storyLineId);
    if (!progress) {
      return 0;
    }

    const storyLine = this.storyLines.get(storyLineId);
    if (!storyLine || storyLine.events.length === 0) {
      return 0;
    }

    return Math.round((progress.currentEventIndex / storyLine.events.length) * 100);
  }

  /**
   * 重置剧情进度
   */
  resetStoryProgress(storyLineId: string): void {
    const progress = this.storyProgress.get(storyLineId);
    if (progress) {
      progress.currentEventIndex = 0;
      progress.completedBranches.clear();
      progress.activeBranches.clear();
    }
  }

  /**
   * 获取所有剧情线
   */
  getAllStoryLines(): StoryLine[] {
    return Array.from(this.storyLines.values());
  }

  /**
   * 根据ID获取剧情线
   */
  getStoryLineById(storyLineId: string): StoryLine | undefined {
    return this.storyLines.get(storyLineId);
  }

  /**
   * 根据修行方向获取剧情线
   * Validates: Requirements 6.1
   */
  getStoryLinesByPath(cultivationPathId: string): StoryLine[] {
    return Array.from(this.storyLines.values()).filter(
      line => line.cultivationPath === cultivationPathId
    );
  }

  /**
   * 从JSON配置加载剧情线
   * Validates: Requirements 6.1
   */
  loadStoryLinesFromConfig(config: { storyLines: StoryLine[] }): void {
    for (const storyLine of config.storyLines) {
      this.registerStoryLine(storyLine);
    }
  }

  /**
   * 清空所有剧情线
   */
  clearStoryLines(): void {
    this.storyLines.clear();
    this.storyProgress.clear();
    this.activeBranches.clear();
  }
}
