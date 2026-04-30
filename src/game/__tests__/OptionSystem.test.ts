/**
 * Unit tests for OptionSystem
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
 */

import { OptionSystem } from '../OptionSystem';
import { ResourceManager } from '../ResourceManager';
import { PlayerState, CultivationLevel, Season, GameOption } from '../../types';

describe('OptionSystem', () => {
  let optionSystem: OptionSystem;
  let resourceManager: ResourceManager;
  let playerState: PlayerState;

  beforeEach(() => {
    // 创建测试用的玩家状态
    playerState = {
      name: '测试玩家',
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
        experience: 0,
        maxExperience: 100
      },
      time: {
        year: 1,
        season: Season.Spring,
        month: 1
      },
      lifespan: {
        current: 80,
        max: 80
      },
      resources: {
        spiritStones: 100,
        pills: new Map(),
        artifacts: new Map()
      },
      relationships: new Map(),
      faction: {
        current: null,
        reputation: new Map()
      },
      karma: {
        goodDeeds: 0,
        karmicDebt: 0
      },
      reputation: {
        righteous: 0,
        demonic: 0
      },
      history: [],
      storyProgress: {
        completedQuests: new Set(),
        activeQuests: new Set(),
        unlockedEvents: new Set(),
        storyFlags: new Map()
      }
    };

    resourceManager = new ResourceManager(playerState);
    optionSystem = new OptionSystem(playerState, resourceManager);
  });

  describe('生成选项', () => {
    test('应该生成基础选项', () => {
      const options = optionSystem.generateOptions();

      expect(options.length).toBeGreaterThan(0);
      
      // 检查是否包含基础选项
      const cultivateOption = options.find(opt => opt.id === 'cultivate');
      expect(cultivateOption).toBeDefined();
      expect(cultivateOption?.text).toBe('闭关修炼');

      const exploreOption = options.find(opt => opt.id === 'explore');
      expect(exploreOption).toBeDefined();
      expect(exploreOption?.text).toBe('外出探索');

      // 只有两个基础选项
      expect(options.length).toBe(2);
    });

    test('应该生成修炼方向专属选项', () => {
      const options = optionSystem.generateOptions();

      // 剑修应该有剑道修炼选项
      const swordOption = options.find(opt => opt.id === 'sword_practice');
      expect(swordOption).toBeDefined();
      expect(swordOption?.text).toBe('剑道修炼');
    });

    test('应该根据配置生成选项', () => {
      const options = optionSystem.generateOptions({
        includeBasicOptions: true,
        includeConditionalOptions: false,
        includeFactionOptions: false,
        includeResourceOptions: false
      });

      // 应该有基础选项
      expect(options.length).toBeGreaterThanOrEqual(3);
      
      // 检查基础选项存在
      const hasBasicOptions = options.some(opt => 
        opt.id === 'cultivate' || 
        opt.id === 'explore' || 
        opt.id === 'view_status'
      );
      expect(hasBasicOptions).toBe(true);
    });

    test('应该在修为达到阈值时生成突破选项', () => {
      playerState.cultivation.experience = 100;
      playerState.cultivation.maxExperience = 100;

      const options = optionSystem.generateOptions();

      const breakthroughOption = options.find(opt => opt.id === 'breakthrough');
      expect(breakthroughOption).toBeDefined();
      expect(breakthroughOption?.text).toBe('尝试突破');
    });

    test('应该在加入势力后生成宗门任务选项', () => {
      playerState.faction.current = 'righteous_sect';

      const options = optionSystem.generateOptions();

      const sectQuestOption = options.find(opt => opt.id === 'sect_quest');
      expect(sectQuestOption).toBeDefined();
      expect(sectQuestOption?.text).toBe('接取宗门任务');
    });

    test('应该在未加入势力时生成加入宗门选项', () => {
      playerState.faction.current = null;

      const options = optionSystem.generateOptions();

      const joinSectOption = options.find(opt => opt.id === 'join_sect');
      expect(joinSectOption).toBeDefined();
      expect(joinSectOption?.text).toBe('加入宗门');
    });

    test('应该在有足够灵石时生成购买丹药选项', () => {
      playerState.resources.spiritStones = 150;

      const options = optionSystem.generateOptions();

      const buyPillOption = options.find(opt => opt.id === 'buy_pill');
      expect(buyPillOption).toBeDefined();
      expect(buyPillOption?.text).toBe('购买筑基丹');
    });

    test('应该在灵石不足时不生成购买丹药选项', () => {
      playerState.resources.spiritStones = 50;

      const options = optionSystem.generateOptions();

      const buyPillOption = options.find(opt => opt.id === 'buy_pill');
      expect(buyPillOption).toBeUndefined();
    });

    test('应该在拥有丹药时生成使用丹药选项', () => {
      resourceManager.addPill('qi_refining_pill', 2);

      const options = optionSystem.generateOptions();

      const usePillOption = options.find(opt => opt.id === 'use_pill_qi_refining_pill');
      expect(usePillOption).toBeDefined();
      expect(usePillOption?.text).toContain('炼气丹');
    });
  });

  describe('选项编号', () => {
    test('应该为选项分配数字编号', () => {
      const options = optionSystem.generateOptions();
      const numberedOptions = optionSystem.assignNumbersToOptions(options);

      expect(numberedOptions.length).toBe(options.length);
      expect(numberedOptions[0].number).toBe(1);
      expect(numberedOptions[1].number).toBe(2);
    });

    test('应该根据数字编号获取选项', () => {
      const options = optionSystem.generateOptions();
      const option = optionSystem.getOptionByNumber(1, options);

      expect(option).toBeDefined();
      expect(option).toBe(options[0]);
    });

    test('应该在编号无效时返回null', () => {
      const options = optionSystem.generateOptions();
      
      expect(optionSystem.getOptionByNumber(0, options)).toBeNull();
      expect(optionSystem.getOptionByNumber(999, options)).toBeNull();
      expect(optionSystem.getOptionByNumber(-1, options)).toBeNull();
    });
  });

  describe('选项描述', () => {
    test('应该生成包含效果预览的选项描述', () => {
      const option: GameOption = {
        id: 'test',
        text: '测试选项',
        description: '这是一个测试',
        timeCost: { months: 1 },
        effects: {
          cultivationChange: 10,
          resourceChanges: { spiritStones: 50 }
        }
      };

      const description = optionSystem.generateOptionDescription(option);

      expect(description).toContain('这是一个测试');
      expect(description).toContain('1个月');
      expect(description).toContain('修为+10');
      expect(description).toContain('灵石+50');
    });

    test('应该格式化选项显示', () => {
      const option: GameOption = {
        id: 'cultivate',
        text: '闭关修炼',
        description: '提升修为',
        timeCost: { months: 1 },
        effects: {
          cultivationChange: 10
        }
      };

      const display = optionSystem.formatOptionDisplay(1, option);

      expect(display).toContain('[1]');
      expect(display).toContain('闭关修炼');
      expect(display).toContain('提升修为');
    });

    test('应该格式化所有选项显示', () => {
      const options = optionSystem.generateOptions();
      const display = optionSystem.formatAllOptionsDisplay(options);

      expect(display).toContain('[1]');
      expect(display).toContain('[2]');
      expect(display).toContain('闭关修炼');
    });
  });

  describe('选项要求检查', () => {
    test('应该检查资源要求', () => {
      const option: GameOption = {
        id: 'test',
        text: '测试',
        timeCost: { months: 0 },
        requirements: {
          minResources: { spiritStones: 200 }
        },
        effects: {}
      };

      playerState.resources.spiritStones = 100;
      expect(optionSystem.checkOptionRequirements(option)).toBe(false);

      playerState.resources.spiritStones = 200;
      expect(optionSystem.checkOptionRequirements(option)).toBe(true);

      playerState.resources.spiritStones = 300;
      expect(optionSystem.checkOptionRequirements(option)).toBe(true);
    });

    test('应该检查关系要求', () => {
      const option: GameOption = {
        id: 'test',
        text: '测试',
        timeCost: { months: 0 },
        requirements: {
          minRelationship: { npcId: 'elder_chen', value: 50 }
        },
        effects: {}
      };

      playerState.relationships.set('elder_chen', 30);
      expect(optionSystem.checkOptionRequirements(option)).toBe(false);

      playerState.relationships.set('elder_chen', 50);
      expect(optionSystem.checkOptionRequirements(option)).toBe(true);

      playerState.relationships.set('elder_chen', 70);
      expect(optionSystem.checkOptionRequirements(option)).toBe(true);
    });

    test('应该在没有要求时返回true', () => {
      const option: GameOption = {
        id: 'test',
        text: '测试',
        timeCost: { months: 0 },
        effects: {}
      };

      expect(optionSystem.checkOptionRequirements(option)).toBe(true);
    });
  });

  describe('选项执行', () => {
    test('应该执行有效的选项', () => {
      const options = optionSystem.generateOptions();
      const optionId = options[0].id;

      const effects = optionSystem.executeOption(optionId);

      expect(effects).toBeDefined();
      expect(effects).toBe(options[0].effects);
    });

    test('应该在选项不存在时返回null', () => {
      const effects = optionSystem.executeOption('invalid_option');

      expect(effects).toBeNull();
    });

    test('应该在不满足要求时返回null', () => {
      playerState.resources.spiritStones = 50;
      const options = optionSystem.generateOptions();
      
      // 手动添加一个需要200灵石的选项到缓存
      const expensiveOption: GameOption = {
        id: 'expensive',
        text: '昂贵选项',
        timeCost: { months: 0 },
        requirements: {
          minResources: { spiritStones: 200 }
        },
        effects: {}
      };
      
      // 直接测试缓存的选项
      optionSystem['generatedOptions'].set('expensive', expensiveOption);

      const effects = optionSystem.executeOption('expensive');

      expect(effects).toBeNull();
    });
  });

  describe('效果应用', () => {
    test('应该应用资源变化', () => {
      const effects = {
        resourceChanges: { spiritStones: 50 }
      };

      const initialStones = playerState.resources.spiritStones;
      optionSystem.applyEffects(effects);

      expect(playerState.resources.spiritStones).toBe(initialStones + 50);
    });

    test('应该应用负资源变化', () => {
      const effects = {
        resourceChanges: { spiritStones: -30 }
      };

      const initialStones = playerState.resources.spiritStones;
      optionSystem.applyEffects(effects);

      expect(playerState.resources.spiritStones).toBe(initialStones - 30);
    });

    test('应该设置剧情标记', () => {
      const effects = {
        setFlags: ['test_flag', 'another_flag']
      };

      optionSystem.applyEffects(effects);

      expect(playerState.storyProgress.storyFlags.has('test_flag')).toBe(true);
      expect(playerState.storyProgress.storyFlags.has('another_flag')).toBe(true);
    });

    test('应该解锁事件', () => {
      const effects = {
        unlockEvents: ['event1', 'event2']
      };

      optionSystem.applyEffects(effects);

      expect(playerState.storyProgress.unlockedEvents.has('event1')).toBe(true);
      expect(playerState.storyProgress.unlockedEvents.has('event2')).toBe(true);
    });
  });

  describe('选项验证', () => {
    test('应该验证有效的选项ID', () => {
      const options = optionSystem.generateOptions();
      const validId = options[0].id;

      expect(optionSystem.validateOptionId(validId)).toBe(true);
    });

    test('应该拒绝无效的选项ID', () => {
      optionSystem.generateOptions();

      expect(optionSystem.validateOptionId('invalid_id')).toBe(false);
    });

    test('应该获取所有可用选项ID', () => {
      const options = optionSystem.generateOptions();
      const ids = optionSystem.getAvailableOptionIds();

      expect(ids.length).toBe(options.length);
      expect(ids).toContain(options[0].id);
    });

    test('应该获取选项数量', () => {
      const options = optionSystem.generateOptions();
      const count = optionSystem.getOptionCount();

      expect(count).toBe(options.length);
    });
  });

  describe('缓存管理', () => {
    test('应该缓存生成的选项', () => {
      const options = optionSystem.generateOptions();
      const cachedOption = optionSystem.getCachedOption(options[0].id);

      expect(cachedOption).toBeDefined();
      expect(cachedOption).toBe(options[0]);
    });

    test('应该清空缓存', () => {
      optionSystem.generateOptions();
      expect(optionSystem.getOptionCount()).toBeGreaterThan(0);

      optionSystem.clearCache();
      expect(optionSystem.getOptionCount()).toBe(0);
    });

    test('应该在重新生成时更新缓存', () => {
      const options1 = optionSystem.generateOptions();
      const count1 = optionSystem.getOptionCount();

      playerState.faction.current = 'righteous_sect';
      const options2 = optionSystem.generateOptions();
      const count2 = optionSystem.getOptionCount();

      expect(count2).toBeGreaterThanOrEqual(count1);
    });
  });

  describe('修炼收益计算', () => {
    test('应该根据修炼方向加成计算收益', () => {
      playerState.cultivationPath.cultivationBonus = 1.2;
      const options = optionSystem.generateOptions();
      const cultivateOption = options.find(opt => opt.id === 'cultivate');

      expect(cultivateOption?.effects.cultivationChange).toBeGreaterThan(10);
    });

    test('应该根据境界降低收益', () => {
      playerState.cultivation.level = CultivationLevel.GoldenCore;
      const options = optionSystem.generateOptions();
      const cultivateOption = options.find(opt => opt.id === 'cultivate');

      expect(cultivateOption?.effects.cultivationChange).toBeLessThan(10);
    });
  });

  describe('不同修炼方向', () => {
    test('体修应该有炼体选项', () => {
      playerState.cultivationPath.id = 'body';
      const options = optionSystem.generateOptions();

      const bodyOption = options.find(opt => opt.id === 'body_tempering');
      expect(bodyOption).toBeDefined();
      expect(bodyOption?.text).toBe('炼体修炼');
    });

    test('丹修应该有炼丹选项', () => {
      playerState.cultivationPath.id = 'alchemy';
      playerState.resources.spiritStones = 100;
      const options = optionSystem.generateOptions();

      const alchemyOption = options.find(opt => opt.id === 'alchemy_practice');
      expect(alchemyOption).toBeDefined();
      expect(alchemyOption?.text).toBe('炼制丹药');
    });

    test('阵修应该有研究阵法选项', () => {
      playerState.cultivationPath.id = 'formation';
      const options = optionSystem.generateOptions();

      const formationOption = options.find(opt => opt.id === 'formation_study');
      expect(formationOption).toBeDefined();
      expect(formationOption?.text).toBe('研究阵法');
    });
  });
});
