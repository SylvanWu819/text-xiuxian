/**
 * Type definitions for Cultivation Simulator
 * 修仙模拟器类型定义
 */

// ============================================================================
// Enums - 枚举类型
// ============================================================================

/**
 * 修为等级
 */
export enum CultivationLevel {
  QiRefining = 'qi_refining',              // 炼气期
  FoundationEstablishment = 'foundation',   // 筑基期
  GoldenCore = 'golden_core',              // 金丹期
  NascentSoul = 'nascent_soul',            // 元婴期
  SoulFormation = 'soul_formation',        // 化神期
  Void = 'void',                           // 返虚期
  Integration = 'integration',             // 合体期
  Mahayana = 'mahayana',                   // 大乘期
  Tribulation = 'tribulation',             // 渡劫期
  Ascension = 'ascension'                  // 飞升
}

/**
 * 季节
 */
export enum Season {
  Spring = 0,  // 春季
  Summer = 1,  // 夏季
  Autumn = 2,  // 秋季
  Winter = 3   // 冬季
}

/**
 * 事件类型
 */
export enum EventType {
  Fortune = 'fortune',    // 机缘
  Crisis = 'crisis',      // 危机
  NPC = 'npc',           // NPC遭遇
  Quest = 'quest',       // 任务
  Story = 'story'        // 剧情
}

/**
 * 劫难类型
 */
export enum TribulationType {
  HeavenlyTribulation = 'heavenly',  // 天劫
  InnerDemon = 'inner_demon',        // 心魔劫
  KarmicTribulation = 'karmic'       // 因果劫
}

// ============================================================================
// Core Interfaces - 核心接口
// ============================================================================

/**
 * 玩家状态 - 完整的游戏状态
 * Validates: Requirements 14.1, 14.6
 */
export interface PlayerState {
  // 基础信息
  name: string;
  cultivationPath: CultivationPath;
  
  // 修为系统
  cultivation: {
    level: CultivationLevel;  // 炼气期、筑基期、金丹期等
    experience: number;        // 当前境界的修为值
    maxExperience: number;     // 突破所需修为值
  };
  
  // 时间系统
  time: {
    year: number;
    season: Season;  // 春夏秋冬
    month: number;
  };
  
  // 寿命系统
  lifespan: {
    current: number;  // 剩余寿命
    max: number;      // 最大寿命
  };
  
  // 资源系统
  resources: {
    spiritStones: number;  // 灵石
    pills: Map<string, number>;  // 丹药 {丹药ID: 数量}
    artifacts: Map<string, number>;  // 法器
  };
  
  // 关系系统
  relationships: Map<string, number>;  // {NPC_ID: 关系值(-100~100)}
  
  // 势力系统
  faction: {
    current: string | null;  // 当前所属势力
    reputation: Map<string, number>;  // {势力ID: 声望值}
  };
  
  // 因果系统
  karma: {
    goodDeeds: number;   // 善缘值
    karmicDebt: number;  // 因果债
  };
  
  // 声望系统
  reputation: {
    righteous: number;  // 正道声望 (0-100)
    demonic: number;    // 魔道声望 (0-100)
  };
  
  // 历史记录
  history: HistoryEntry[];  // 历史事件列表
  
  // 剧情进度
  storyProgress: {
    completedQuests: Set<string>;  // 已完成任务
    activeQuests: Set<string>;     // 进行中任务
    unlockedEvents: Set<string>;   // 已解锁事件
    storyFlags: Map<string, any>;  // 剧情标记
  };
}

/**
 * 游戏事件
 * Validates: Requirements 4.1-4.7
 */
export interface GameEvent {
  id: string;
  type: EventType;  // 'fortune' | 'crisis' | 'npc' | 'quest' | 'story'
  title: string;
  description: string;
  
  // 触发条件
  triggerConditions: {
    minCultivationLevel?: CultivationLevel;
    maxCultivationLevel?: CultivationLevel;
    requiredPath?: string;  // CultivationPath ID
    minReputation?: { righteous?: number; demonic?: number };
    requiredFlags?: string[];  // 需要的剧情标记
    probability?: number;  // 触发概率 (0-1)
  };
  
  // 事件选项
  options: EventOption[];
  
  // 事件链
  nextEvent?: string;  // 下一个事件ID
}

/**
 * 事件选项
 */
export interface EventOption {
  id: string;
  text: string;
  description?: string;  // 选项说明
  
  // 选项要求
  requirements?: {
    minResources?: { spiritStones?: number };
    minRelationship?: { npcId: string; value: number };
    requiredItems?: string[];
  };
  
  // 选项结果
  effects: EffectSet;
  
  // 随机结果
  outcomes?: {
    probability: number;
    description: string;
    effects: EffectSet;
  }[];
}

/**
 * 效果集合
 */
export interface EffectSet {
  resourceChanges?: { spiritStones?: number };
  relationshipChanges?: Map<string, number>;
  karmaChange?: { goodDeeds?: number; karmicDebt?: number };
  reputationChange?: { righteous?: number; demonic?: number };
  cultivationChange?: number;
  lifespanChange?: number;
  setFlags?: string[];  // 设置剧情标记
  unlockEvents?: string[];  // 解锁事件
  triggerEvent?: string;  // 触发事件
}

/**
 * 修行方向
 * Validates: Requirements 2.1-2.5
 */
export interface CultivationPath {
  id: string;
  name: string;  // 剑修、体修、丹修、阵修
  description: string;
  
  // 初始属性
  initialStats: {
    spiritStones: number;
    specialAbility?: string;
  };
  
  // 专属事件池
  exclusiveEvents: string[];  // 事件ID列表
  
  // 修炼速度加成
  cultivationBonus: number;  // 1.0 = 正常, 1.2 = 快20%
}

// ============================================================================
// Game Action Types - 游戏行动类型
// ============================================================================

/**
 * 游戏选项
 * Validates: Requirements 1.1-1.8
 */
export interface GameOption {
  id: string;
  text: string;
  description?: string;
  
  // 时间消耗
  timeCost: TimeCost;
  
  // 选项要求
  requirements?: {
    minResources?: { spiritStones?: number };
    minRelationship?: { npcId: string; value: number };
    requiredItems?: string[];
  };
  
  // 选项效果
  effects: EffectSet;
}

/**
 * 时间消耗
 */
export interface TimeCost {
  days?: number;
  months?: number;
  years?: number;
}

/**
 * 玩家行动
 */
export interface PlayerAction {
  actionId: string;
  timeCost: TimeCost;
  effects: EffectSet;
}

// ============================================================================
// Tribulation System - 渡劫系统
// ============================================================================

/**
 * 渡劫事件
 * Validates: Requirements 8.1-8.7
 */
export interface TribulationEvent {
  type: TribulationType;
  difficulty: number;
  demons: Demon[];
}

/**
 * 心魔
 */
export interface Demon {
  name: string;
  description: string;
  power: number;
}

// ============================================================================
// History System - 历史记录系统
// ============================================================================

/**
 * 历史记录条目
 * Validates: Requirements 26.1-26.9
 */
export interface HistoryEntry {
  time: GameTime;
  description: string;
  isKeyChoice: boolean;  // 是否为关键选择
}

/**
 * 游戏时间
 */
export interface GameTime {
  year: number;
  season: Season;
  month: number;
}

// ============================================================================
// Save System - 存档系统
// ============================================================================

/**
 * 存档数据
 * Validates: Requirements 16.1-16.7
 */
export interface SaveData {
  version: string;  // 存档版本
  timestamp: number;  // 保存时间戳
  slotId: number;  // 存档槽位
  playerState: PlayerState;  // 完整游戏状态
}

// ============================================================================
// UI System - 界面系统
// ============================================================================

/**
 * 字体设置
 * Validates: Requirements 23.1-23.10
 */
export interface FontSettings {
  size: 'small' | 'medium' | 'large' | 'xlarge';
  family: 'default' | 'songti' | 'heiti' | 'monospace';
}

// ============================================================================
// Message Protocol - 消息通信协议
// ============================================================================

/**
 * Webview -> Extension 消息类型
 * Validates: Requirements 14.1, 14.6, 18.4, 18.5
 */
export type WebviewMessage = 
  | { type: 'createCharacter'; payload: { playerName: string; pathId: string } }
  | { type: 'action'; payload: { actionId: string } }
  | { type: 'save'; payload?: { slotId?: number } }
  | { type: 'load'; payload: { slotId: number } }
  | { type: 'restart' }
  | { type: 'getHistory' }
  | { type: 'fontSettings'; payload: FontSettings }
  | { type: 'getAchievements' }
  | { type: 'resetAchievements' };

/**
 * Extension -> Webview 消息类型
 * Validates: Requirements 1.7, 14.4, 18.6
 */
export type ExtensionMessage =
  | { type: 'gameInitialized'; payload: {} }
  | { type: 'stateUpdate'; payload: PlayerState }
  | { type: 'options'; payload: GameOption[] }
  | { type: 'event'; payload: GameEvent }
  | { type: 'history'; payload: HistoryEntry[] }
  | { type: 'notification'; payload: { message: string; type: 'success' | 'error' | 'info' } }
  | { type: 'restart'; payload: {} }
  | { type: 'ending'; payload: { title: string; description: string; achievements: string[]; finalStats: any; progress?: any } }
  | { type: 'achievements'; payload: any }
  | { type: 'actionFeedback'; payload: { text: string } }
  | { type: 'clearEvent' };

// ============================================================================
// Configuration Types - 配置类型
// ============================================================================

/**
 * 事件配置文件格式
 */
export interface EventConfig {
  events: GameEvent[];
}

/**
 * 修行方向配置文件格式
 */
export interface CultivationPathConfig {
  paths: CultivationPath[];
}

/**
 * NPC配置
 */
export interface NPCConfig {
  id: string;
  name: string;
  faction: string;
  personality: string;
  initialRelationship: number;
  dialogues: {
    greeting: string;
    high_relationship: string;
    low_relationship: string;
  };
}

/**
 * NPC配置文件格式
 */
export interface NPCsConfig {
  npcs: NPCConfig[];
}

// ============================================================================
// Utility Types - 工具类型
// ============================================================================

/**
 * 状态更新
 */
export interface StateUpdate {
  type: 'resource' | 'cultivation' | 'relationship' | 'reputation' | 'karma' | 'time' | 'lifespan';
  data: any;
}

/**
 * 通知类型
 */
export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;  // 显示时长（毫秒）
}
