/**
 * Unit tests for type definitions
 * 类型定义单元测试
 * 
 * Tests type constraints, default values, and type compatibility
 * Validates: Requirements 14.1
 */

import {
  // Enums
  CultivationLevel,
  Season,
  EventType,
  TribulationType,
  
  // Interfaces
  PlayerState,
  GameEvent,
  EventOption,
  EffectSet,
  CultivationPath,
  GameOption,
  TimeCost,
  PlayerAction,
  TribulationEvent,
  Demon,
  HistoryEntry,
  GameTime,
  SaveData,
  FontSettings,
  WebviewMessage,
  ExtensionMessage,
  EventConfig,
  CultivationPathConfig,
  NPCConfig,
  NPCsConfig,
  StateUpdate,
  Notification
} from '../index';

// ============================================================================
// Enum Tests - 枚举类型测试
// ============================================================================

describe('Enum Types', () => {
  describe('CultivationLevel', () => {
    test('should have all cultivation levels', () => {
      expect(CultivationLevel.QiRefining).toBe('qi_refining');
      expect(CultivationLevel.FoundationEstablishment).toBe('foundation');
      expect(CultivationLevel.GoldenCore).toBe('golden_core');
      expect(CultivationLevel.NascentSoul).toBe('nascent_soul');
      expect(CultivationLevel.SoulFormation).toBe('soul_formation');
      expect(CultivationLevel.Void).toBe('void');
      expect(CultivationLevel.Integration).toBe('integration');
      expect(CultivationLevel.Mahayana).toBe('mahayana');
      expect(CultivationLevel.Tribulation).toBe('tribulation');
      expect(CultivationLevel.Ascension).toBe('ascension');
    });

    test('should be string enum', () => {
      const level: CultivationLevel = CultivationLevel.QiRefining;
      expect(typeof level).toBe('string');
    });
  });

  describe('Season', () => {
    test('should have all seasons with numeric values', () => {
      expect(Season.Spring).toBe(0);
      expect(Season.Summer).toBe(1);
      expect(Season.Autumn).toBe(2);
      expect(Season.Winter).toBe(3);
    });

    test('should be numeric enum', () => {
      const season: Season = Season.Spring;
      expect(typeof season).toBe('number');
    });
  });

  describe('EventType', () => {
    test('should have all event types', () => {
      expect(EventType.Fortune).toBe('fortune');
      expect(EventType.Crisis).toBe('crisis');
      expect(EventType.NPC).toBe('npc');
      expect(EventType.Quest).toBe('quest');
      expect(EventType.Story).toBe('story');
    });
  });

  describe('TribulationType', () => {
    test('should have all tribulation types', () => {
      expect(TribulationType.HeavenlyTribulation).toBe('heavenly');
      expect(TribulationType.InnerDemon).toBe('inner_demon');
      expect(TribulationType.KarmicTribulation).toBe('karmic');
    });
  });
});

// ============================================================================
// PlayerState Tests - 玩家状态测试
// ============================================================================

describe('PlayerState Interface', () => {
  test('should accept valid player state', () => {
    const validState: PlayerState = {
      name: '测试玩家',
      cultivationPath: {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: {
          spiritStones: 100
        },
        exclusiveEvents: ['event1'],
        cultivationBonus: 1.2
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
        current: 100,
        max: 100
      },
      resources: {
        spiritStones: 100,
        pills: new Map([['healing_pill', 5]]),
        artifacts: new Map([['sword', 1]])
      },
      relationships: new Map([['npc1', 50]]),
      faction: {
        current: 'sect1',
        reputation: new Map([['sect1', 100]])
      },
      karma: {
        goodDeeds: 0,
        karmicDebt: 0
      },
      reputation: {
        righteous: 50,
        demonic: 0
      },
      history: [],
      storyProgress: {
        completedQuests: new Set(['quest1']),
        activeQuests: new Set(['quest2']),
        unlockedEvents: new Set(['event1']),
        storyFlags: new Map([['flag1', true]])
      }
    };

    expect(validState.name).toBe('测试玩家');
    expect(validState.cultivation.level).toBe(CultivationLevel.QiRefining);
    expect(validState.time.season).toBe(Season.Spring);
  });

  test('should handle null faction', () => {
    const state: PlayerState = {
      name: '散修',
      cultivationPath: {
        id: 'rogue',
        name: '散修',
        description: '独自修行',
        initialStats: { spiritStones: 50 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      },
      cultivation: {
        level: CultivationLevel.QiRefining,
        experience: 0,
        maxExperience: 100
      },
      time: { year: 1, season: Season.Spring, month: 1 },
      lifespan: { current: 100, max: 100 },
      resources: {
        spiritStones: 50,
        pills: new Map(),
        artifacts: new Map()
      },
      relationships: new Map(),
      faction: {
        current: null,  // No faction
        reputation: new Map()
      },
      karma: { goodDeeds: 0, karmicDebt: 0 },
      reputation: { righteous: 50, demonic: 0 },
      history: [],
      storyProgress: {
        completedQuests: new Set(),
        activeQuests: new Set(),
        unlockedEvents: new Set(),
        storyFlags: new Map()
      }
    };

    expect(state.faction.current).toBeNull();
  });

  test('should handle empty collections', () => {
    const state: PlayerState = {
      name: '新手',
      cultivationPath: {
        id: 'beginner',
        name: '新手',
        description: '刚开始修行',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      },
      cultivation: {
        level: CultivationLevel.QiRefining,
        experience: 0,
        maxExperience: 100
      },
      time: { year: 1, season: Season.Spring, month: 1 },
      lifespan: { current: 100, max: 100 },
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
      karma: { goodDeeds: 0, karmicDebt: 0 },
      reputation: { righteous: 50, demonic: 0 },
      history: [],
      storyProgress: {
        completedQuests: new Set(),
        activeQuests: new Set(),
        unlockedEvents: new Set(),
        storyFlags: new Map()
      }
    };

    expect(state.resources.pills.size).toBe(0);
    expect(state.relationships.size).toBe(0);
    expect(state.history.length).toBe(0);
  });
});

// ============================================================================
// GameEvent Tests - 游戏事件测试
// ============================================================================

describe('GameEvent Interface', () => {
  test('should accept valid game event', () => {
    const event: GameEvent = {
      id: 'event1',
      type: EventType.Fortune,
      title: '奇遇',
      description: '你遇到了一个神秘洞府',
      triggerConditions: {
        minCultivationLevel: CultivationLevel.QiRefining,
        probability: 0.1
      },
      options: [
        {
          id: 'option1',
          text: '进入洞府',
          effects: {
            resourceChanges: { spiritStones: 100 }
          }
        }
      ]
    };

    expect(event.type).toBe(EventType.Fortune);
    expect(event.options.length).toBe(1);
  });

  test('should handle optional fields', () => {
    const minimalEvent: GameEvent = {
      id: 'minimal',
      type: EventType.Story,
      title: '简单事件',
      description: '描述',
      triggerConditions: {},
      options: []
    };

    expect(minimalEvent.triggerConditions.minCultivationLevel).toBeUndefined();
    expect(minimalEvent.nextEvent).toBeUndefined();
  });

  test('should handle event chains', () => {
    const chainedEvent: GameEvent = {
      id: 'event1',
      type: EventType.Quest,
      title: '任务开始',
      description: '接受任务',
      triggerConditions: {},
      options: [],
      nextEvent: 'event2'  // Chain to next event
    };

    expect(chainedEvent.nextEvent).toBe('event2');
  });
});

// ============================================================================
// EffectSet Tests - 效果集合测试
// ============================================================================

describe('EffectSet Interface', () => {
  test('should accept various effect types', () => {
    const effects: EffectSet = {
      resourceChanges: { spiritStones: 100 },
      relationshipChanges: new Map([['npc1', 10]]),
      karmaChange: { goodDeeds: 5 },
      reputationChange: { righteous: 10 },
      cultivationChange: 50,
      lifespanChange: 10,
      setFlags: ['flag1', 'flag2'],
      unlockEvents: ['event1'],
      triggerEvent: 'event2'
    };

    expect(effects.resourceChanges?.spiritStones).toBe(100);
    expect(effects.karmaChange?.goodDeeds).toBe(5);
    expect(effects.setFlags?.length).toBe(2);
  });

  test('should handle empty effects', () => {
    const emptyEffects: EffectSet = {};
    
    expect(emptyEffects.resourceChanges).toBeUndefined();
    expect(emptyEffects.cultivationChange).toBeUndefined();
  });

  test('should handle partial effects', () => {
    const partialEffects: EffectSet = {
      resourceChanges: { spiritStones: -50 },
      cultivationChange: 10
    };

    expect(partialEffects.resourceChanges?.spiritStones).toBe(-50);
    expect(partialEffects.karmaChange).toBeUndefined();
  });
});

// ============================================================================
// CultivationPath Tests - 修行方向测试
// ============================================================================

describe('CultivationPath Interface', () => {
  test('should accept valid cultivation path', () => {
    const path: CultivationPath = {
      id: 'sword',
      name: '剑修',
      description: '以剑入道，攻击力强',
      initialStats: {
        spiritStones: 100,
        specialAbility: '剑气'
      },
      exclusiveEvents: ['sword_event1', 'sword_event2'],
      cultivationBonus: 1.2
    };

    expect(path.id).toBe('sword');
    expect(path.cultivationBonus).toBe(1.2);
    expect(path.exclusiveEvents.length).toBe(2);
  });

  test('should handle optional special ability', () => {
    const basicPath: CultivationPath = {
      id: 'basic',
      name: '基础修行',
      description: '普通修行',
      initialStats: {
        spiritStones: 50
      },
      exclusiveEvents: [],
      cultivationBonus: 1.0
    };

    expect(basicPath.initialStats.specialAbility).toBeUndefined();
  });
});

// ============================================================================
// GameOption Tests - 游戏选项测试
// ============================================================================

describe('GameOption Interface', () => {
  test('should accept valid game option', () => {
    const option: GameOption = {
      id: 'cultivate',
      text: '闭关修炼',
      description: '消耗1个月时间，提升修为',
      timeCost: { months: 1 },
      effects: {
        cultivationChange: 10
      }
    };

    expect(option.id).toBe('cultivate');
    expect(option.timeCost.months).toBe(1);
  });

  test('should handle requirements', () => {
    const optionWithReqs: GameOption = {
      id: 'buy_pill',
      text: '购买丹药',
      timeCost: { days: 1 },
      requirements: {
        minResources: { spiritStones: 100 }
      },
      effects: {}
    };

    expect(optionWithReqs.requirements?.minResources?.spiritStones).toBe(100);
  });
});

// ============================================================================
// TimeCost Tests - 时间消耗测试
// ============================================================================

describe('TimeCost Interface', () => {
  test('should accept days', () => {
    const cost: TimeCost = { days: 7 };
    expect(cost.days).toBe(7);
  });

  test('should accept months', () => {
    const cost: TimeCost = { months: 3 };
    expect(cost.months).toBe(3);
  });

  test('should accept years', () => {
    const cost: TimeCost = { years: 1 };
    expect(cost.years).toBe(1);
  });

  test('should accept combined time costs', () => {
    const cost: TimeCost = { years: 1, months: 6, days: 15 };
    expect(cost.years).toBe(1);
    expect(cost.months).toBe(6);
    expect(cost.days).toBe(15);
  });

  test('should handle empty time cost', () => {
    const cost: TimeCost = {};
    expect(cost.days).toBeUndefined();
    expect(cost.months).toBeUndefined();
    expect(cost.years).toBeUndefined();
  });
});

// ============================================================================
// TribulationEvent Tests - 渡劫事件测试
// ============================================================================

describe('TribulationEvent Interface', () => {
  test('should accept valid tribulation event', () => {
    const tribulation: TribulationEvent = {
      type: TribulationType.InnerDemon,
      difficulty: 5,
      demons: [
        {
          name: '贪念心魔',
          description: '源于贪婪的心魔',
          power: 100
        }
      ]
    };

    expect(tribulation.type).toBe(TribulationType.InnerDemon);
    expect(tribulation.demons.length).toBe(1);
  });

  test('should handle multiple demons', () => {
    const tribulation: TribulationEvent = {
      type: TribulationType.KarmicTribulation,
      difficulty: 8,
      demons: [
        { name: '心魔1', description: '描述1', power: 50 },
        { name: '心魔2', description: '描述2', power: 75 }
      ]
    };

    expect(tribulation.demons.length).toBe(2);
  });
});

// ============================================================================
// SaveData Tests - 存档数据测试
// ============================================================================

describe('SaveData Interface', () => {
  test('should accept valid save data', () => {
    const saveData: SaveData = {
      version: '1.0.0',
      timestamp: Date.now(),
      slotId: 1,
      playerState: {
        name: '玩家',
        cultivationPath: {
          id: 'sword',
          name: '剑修',
          description: '剑修',
          initialStats: { spiritStones: 100 },
          exclusiveEvents: [],
          cultivationBonus: 1.0
        },
        cultivation: {
          level: CultivationLevel.QiRefining,
          experience: 50,
          maxExperience: 100
        },
        time: { year: 1, season: Season.Spring, month: 1 },
        lifespan: { current: 100, max: 100 },
        resources: {
          spiritStones: 100,
          pills: new Map(),
          artifacts: new Map()
        },
        relationships: new Map(),
        faction: { current: null, reputation: new Map() },
        karma: { goodDeeds: 0, karmicDebt: 0 },
        reputation: { righteous: 50, demonic: 0 },
        history: [],
        storyProgress: {
          completedQuests: new Set(),
          activeQuests: new Set(),
          unlockedEvents: new Set(),
          storyFlags: new Map()
        }
      }
    };

    expect(saveData.version).toBe('1.0.0');
    expect(saveData.slotId).toBe(1);
    expect(typeof saveData.timestamp).toBe('number');
  });
});

// ============================================================================
// FontSettings Tests - 字体设置测试
// ============================================================================

describe('FontSettings Interface', () => {
  test('should accept valid font sizes', () => {
    const sizes: FontSettings['size'][] = ['small', 'medium', 'large', 'xlarge'];
    sizes.forEach(size => {
      const settings: FontSettings = { size, family: 'default' };
      expect(settings.size).toBe(size);
    });
  });

  test('should accept valid font families', () => {
    const families: FontSettings['family'][] = ['default', 'songti', 'heiti', 'monospace'];
    families.forEach(family => {
      const settings: FontSettings = { size: 'medium', family };
      expect(settings.family).toBe(family);
    });
  });
});

// ============================================================================
// Message Protocol Tests - 消息协议测试
// ============================================================================

describe('WebviewMessage Type', () => {
  test('should accept action message', () => {
    const msg: WebviewMessage = {
      type: 'action',
      payload: { actionId: 'cultivate' }
    };
    expect(msg.type).toBe('action');
  });

  test('should accept save message with slot', () => {
    const msg: WebviewMessage = {
      type: 'save',
      payload: { slotId: 1 }
    };
    expect(msg.type).toBe('save');
  });

  test('should accept save message without slot', () => {
    const msg: WebviewMessage = {
      type: 'save'
    };
    expect(msg.type).toBe('save');
  });

  test('should accept load message', () => {
    const msg: WebviewMessage = {
      type: 'load',
      payload: { slotId: 1 }
    };
    expect(msg.type).toBe('load');
  });

  test('should accept restart message', () => {
    const msg: WebviewMessage = { type: 'restart' };
    expect(msg.type).toBe('restart');
  });

  test('should accept getHistory message', () => {
    const msg: WebviewMessage = { type: 'getHistory' };
    expect(msg.type).toBe('getHistory');
  });

  test('should accept fontSettings message', () => {
    const msg: WebviewMessage = {
      type: 'fontSettings',
      payload: { size: 'large', family: 'songti' }
    };
    expect(msg.type).toBe('fontSettings');
  });
});

describe('ExtensionMessage Type', () => {
  test('should accept stateUpdate message', () => {
    const msg: ExtensionMessage = {
      type: 'stateUpdate',
      payload: {
        name: '玩家',
        cultivationPath: {
          id: 'sword',
          name: '剑修',
          description: '剑修',
          initialStats: { spiritStones: 100 },
          exclusiveEvents: [],
          cultivationBonus: 1.0
        },
        cultivation: {
          level: CultivationLevel.QiRefining,
          experience: 0,
          maxExperience: 100
        },
        time: { year: 1, season: Season.Spring, month: 1 },
        lifespan: { current: 100, max: 100 },
        resources: {
          spiritStones: 100,
          pills: new Map(),
          artifacts: new Map()
        },
        relationships: new Map(),
        faction: { current: null, reputation: new Map() },
        karma: { goodDeeds: 0, karmicDebt: 0 },
        reputation: { righteous: 50, demonic: 0 },
        history: [],
        storyProgress: {
          completedQuests: new Set(),
          activeQuests: new Set(),
          unlockedEvents: new Set(),
          storyFlags: new Map()
        }
      }
    };
    expect(msg.type).toBe('stateUpdate');
  });

  test('should accept options message', () => {
    const msg: ExtensionMessage = {
      type: 'options',
      payload: [
        {
          id: 'option1',
          text: '选项1',
          timeCost: { days: 1 },
          effects: {}
        }
      ]
    };
    expect(msg.type).toBe('options');
  });

  test('should accept notification message', () => {
    const msg: ExtensionMessage = {
      type: 'notification',
      payload: { message: '测试消息', type: 'success' }
    };
    expect(msg.type).toBe('notification');
    expect(msg.payload.type).toBe('success');
  });
});

// ============================================================================
// Notification Tests - 通知类型测试
// ============================================================================

describe('Notification Interface', () => {
  test('should accept all notification types', () => {
    const types: Notification['type'][] = ['success', 'error', 'info', 'warning'];
    types.forEach(type => {
      const notification: Notification = {
        message: '测试消息',
        type
      };
      expect(notification.type).toBe(type);
    });
  });

  test('should handle optional duration', () => {
    const withDuration: Notification = {
      message: '消息',
      type: 'info',
      duration: 3000
    };
    expect(withDuration.duration).toBe(3000);

    const withoutDuration: Notification = {
      message: '消息',
      type: 'info'
    };
    expect(withoutDuration.duration).toBeUndefined();
  });
});

// ============================================================================
// Type Compatibility Tests - 类型兼容性测试
// ============================================================================

describe('Type Compatibility', () => {
  test('GameTime should be compatible with PlayerState.time', () => {
    const gameTime: GameTime = {
      year: 1,
      season: Season.Spring,
      month: 1
    };

    const playerState: PlayerState = {
      name: '玩家',
      cultivationPath: {
        id: 'sword',
        name: '剑修',
        description: '剑修',
        initialStats: { spiritStones: 100 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      },
      cultivation: {
        level: CultivationLevel.QiRefining,
        experience: 0,
        maxExperience: 100
      },
      time: gameTime,  // Should be compatible
      lifespan: { current: 100, max: 100 },
      resources: {
        spiritStones: 100,
        pills: new Map(),
        artifacts: new Map()
      },
      relationships: new Map(),
      faction: { current: null, reputation: new Map() },
      karma: { goodDeeds: 0, karmicDebt: 0 },
      reputation: { righteous: 50, demonic: 0 },
      history: [],
      storyProgress: {
        completedQuests: new Set(),
        activeQuests: new Set(),
        unlockedEvents: new Set(),
        storyFlags: new Map()
      }
    };

    expect(playerState.time).toEqual(gameTime);
  });

  test('TimeCost should be compatible with GameOption.timeCost', () => {
    const timeCost: TimeCost = { months: 1 };
    const option: GameOption = {
      id: 'test',
      text: '测试',
      timeCost: timeCost,  // Should be compatible
      effects: {}
    };

    expect(option.timeCost).toEqual(timeCost);
  });

  test('EffectSet should be compatible with EventOption.effects', () => {
    const effects: EffectSet = {
      resourceChanges: { spiritStones: 100 }
    };

    const eventOption: EventOption = {
      id: 'option1',
      text: '选项',
      effects: effects  // Should be compatible
    };

    expect(eventOption.effects).toEqual(effects);
  });
});

// ============================================================================
// Default Values and Initialization Tests - 默认值和初始化测试
// ============================================================================

describe('Default Values and Initialization', () => {
  test('should initialize empty Maps correctly', () => {
    const emptyMap = new Map<string, number>();
    expect(emptyMap.size).toBe(0);
    
    const state: PlayerState = {
      name: '玩家',
      cultivationPath: {
        id: 'sword',
        name: '剑修',
        description: '剑修',
        initialStats: { spiritStones: 100 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      },
      cultivation: {
        level: CultivationLevel.QiRefining,
        experience: 0,
        maxExperience: 100
      },
      time: { year: 1, season: Season.Spring, month: 1 },
      lifespan: { current: 100, max: 100 },
      resources: {
        spiritStones: 100,
        pills: emptyMap,
        artifacts: new Map()
      },
      relationships: new Map(),
      faction: { current: null, reputation: new Map() },
      karma: { goodDeeds: 0, karmicDebt: 0 },
      reputation: { righteous: 50, demonic: 0 },
      history: [],
      storyProgress: {
        completedQuests: new Set(),
        activeQuests: new Set(),
        unlockedEvents: new Set(),
        storyFlags: new Map()
      }
    };

    expect(state.resources.pills.size).toBe(0);
  });

  test('should initialize empty Sets correctly', () => {
    const emptySet = new Set<string>();
    expect(emptySet.size).toBe(0);

    const storyProgress = {
      completedQuests: emptySet,
      activeQuests: new Set<string>(),
      unlockedEvents: new Set<string>(),
      storyFlags: new Map<string, any>()
    };

    expect(storyProgress.completedQuests.size).toBe(0);
  });

  test('should initialize arrays correctly', () => {
    const emptyArray: GameEvent[] = [];
    expect(emptyArray.length).toBe(0);

    const state: PlayerState = {
      name: '玩家',
      cultivationPath: {
        id: 'sword',
        name: '剑修',
        description: '剑修',
        initialStats: { spiritStones: 100 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      },
      cultivation: {
        level: CultivationLevel.QiRefining,
        experience: 0,
        maxExperience: 100
      },
      time: { year: 1, season: Season.Spring, month: 1 },
      lifespan: { current: 100, max: 100 },
      resources: {
        spiritStones: 100,
        pills: new Map(),
        artifacts: new Map()
      },
      relationships: new Map(),
      faction: { current: null, reputation: new Map() },
      karma: { goodDeeds: 0, karmicDebt: 0 },
      reputation: { righteous: 50, demonic: 0 },
      history: [] as HistoryEntry[],
      storyProgress: {
        completedQuests: new Set(),
        activeQuests: new Set(),
        unlockedEvents: new Set(),
        storyFlags: new Map()
      }
    };

    expect(state.history.length).toBe(0);
  });

  test('should handle initial cultivation level', () => {
    const initialLevel = CultivationLevel.QiRefining;
    expect(initialLevel).toBe('qi_refining');
  });

  test('should handle initial season', () => {
    const initialSeason = Season.Spring;
    expect(initialSeason).toBe(0);
  });
});
