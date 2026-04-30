import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GameEngine, GameState } from './game/GameEngine';
import { WebviewMessage, ExtensionMessage, GameOption, CultivationPath, EventType } from './types';
import { ErrorHandler, CommunicationError } from './utils/ErrorHandler';
import { AchievementSystem } from './game/AchievementSystem';

/**
 * Extension activation function
 * Implements Requirements 21.1, 21.2, 21.9, 20.6
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('修仙模拟器插件已激活');

  try {
    // Register Webview Provider (Requirement 21.1, 21.2)
    const provider = new CultivationSimulatorProvider(context);
    
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        'cultivationSimulator',
        provider,
        {
          webviewOptions: {
            retainContextWhenHidden: true
          }
        }
      )
    );
    
    // Register commands (Requirement 21.2)
    context.subscriptions.push(
      vscode.commands.registerCommand('cultivationSimulator.newGame', () => {
        try {
          provider.newGame();
        } catch (error) {
          ErrorHandler.logError(error as Error, 'Command:newGame');
          vscode.window.showErrorMessage(ErrorHandler.getUserFriendlyMessage(error as Error));
        }
      })
    );
    
    context.subscriptions.push(
      vscode.commands.registerCommand('cultivationSimulator.loadGame', () => {
        try {
          provider.loadGame();
        } catch (error) {
          ErrorHandler.logError(error as Error, 'Command:loadGame');
          vscode.window.showErrorMessage(ErrorHandler.getUserFriendlyMessage(error as Error));
        }
      })
    );
  } catch (error) {
    ErrorHandler.logError(error as Error, 'Extension:activate');
    vscode.window.showErrorMessage('修仙模拟器插件激活失败: ' + ErrorHandler.getUserFriendlyMessage(error as Error));
  }
}

export function deactivate() {
  console.log('修仙模拟器插件已停用');
}

/**
 * MessageBridge - 消息桥接器
 * Implements Requirements 17.12, 21.6, 21.7, 20.6
 * Task 16.1: 实现 MessageBridge 消息桥接器
 */
class MessageBridge {
  private view?: vscode.WebviewView;
  private messageHandlers: Map<string, (payload: any) => void | Promise<void>>;
  
  constructor() {
    this.messageHandlers = new Map();
  }
  
  /**
   * 设置 Webview
   */
  setView(view: vscode.WebviewView): void {
    this.view = view;
  }
  
  /**
   * 注册消息处理器
   * Implements Requirement 21.6
   */
  registerHandler(type: string, handler: (payload: any) => void | Promise<void>): void {
    this.messageHandlers.set(type, handler);
  }
  
  /**
   * 处理来自 Webview 的消息
   * Implements Requirements 21.6, 20.6
   */
  async handleMessage(message: WebviewMessage): Promise<void> {
    try {
      const handler = this.messageHandlers.get(message.type);
      
      if (handler) {
        // Extract payload, handling messages without payload
        const payload = 'payload' in message ? message.payload : undefined;
        await handler(payload);
      } else {
        console.warn(`未注册的消息类型: ${message.type}`);
        this.sendError(`未知的消息类型: ${message.type}`);
      }
    } catch (error) {
      ErrorHandler.logError(error as Error, `MessageBridge:handleMessage:${message.type}`);
      const friendlyMessage = ErrorHandler.getUserFriendlyMessage(error as Error);
      this.sendError(friendlyMessage);
    }
  }
  
  /**
   * 发送消息到 Webview
   * Implements Requirements 21.7, 20.6
   */
  sendToWebview(message: ExtensionMessage): void {
    try {
      if (this.view) {
        this.view.webview.postMessage(message);
      } else {
        const error = new CommunicationError('Webview 未初始化，无法发送消息');
        ErrorHandler.logError(error, 'MessageBridge:sendToWebview');
      }
    } catch (error) {
      ErrorHandler.logError(error as Error, 'MessageBridge:sendToWebview');
      throw new CommunicationError('发送消息到 Webview 失败', error as Error);
    }
  }
  
  /**
   * 发送通知消息
   */
  sendNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.sendToWebview({
      type: 'notification',
      payload: { message, type }
    });
  }
  
  /**
   * 发送错误消息
   */
  sendError(message: string): void {
    this.sendNotification(message, 'error');
  }
  
  /**
   * 发送成功消息
   */
  sendSuccess(message: string): void {
    this.sendNotification(message, 'success');
  }
}

/**
 * Webview Provider for the Cultivation Simulator
 * Implements Requirements 21.1, 21.3, 21.6, 21.7
 * Task 16.2: 连接前后端系统
 */
class CultivationSimulatorProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private messageBridge: MessageBridge;
  private gameEngine?: GameEngine;
  private achievementSystem: AchievementSystem;
  
  constructor(private context: vscode.ExtensionContext) {
    this.messageBridge = new MessageBridge();
    
    // 初始化成就系统
    const savedAchievements = context.globalState.get('achievements');
    this.achievementSystem = new AchievementSystem(savedAchievements);
    
    this.setupMessageHandlers();
  }
  
  /**
   * 设置消息处理器
   * Task 16.1: 实现消息类型路由和分发
   */
  private setupMessageHandlers(): void {
    // 处理角色创建
    this.messageBridge.registerHandler('createCharacter', async (payload) => {
      await this.handleCreateCharacter(payload);
    });
    
    // 处理玩家行动
    this.messageBridge.registerHandler('action', async (payload) => {
      await this.handleAction(payload);
    });
    
    // 处理存档
    this.messageBridge.registerHandler('save', async (payload) => {
      await this.handleSave(payload);
    });
    
    // 处理加载
    this.messageBridge.registerHandler('load', async (payload) => {
      await this.handleLoad(payload);
    });
    
    // 处理重开
    this.messageBridge.registerHandler('restart', async () => {
      await this.handleRestart();
    });
    
    // 处理获取历史
    this.messageBridge.registerHandler('getHistory', async () => {
      await this.handleGetHistory();
    });
    
    // 处理字体设置
    this.messageBridge.registerHandler('fontSettings', async (payload) => {
      await this.handleFontSettings(payload);
    });
    
    // 处理获取成就数据
    this.messageBridge.registerHandler('getAchievements', async () => {
      await this.handleGetAchievements();
    });
    
    // 处理重置成就
    this.messageBridge.registerHandler('resetAchievements', async () => {
      await this.handleResetAchievements();
    });
    
    // 处理检查存档
    this.messageBridge.registerHandler('checkSave', async () => {
      await this.handleCheckSave();
    });
  }
  
  /**
   * Resolve the webview view
   * Implements Requirement 21.1
   */
  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ): void {
    console.log('[Extension] resolveWebviewView 被调用');
    this.view = webviewView;
    this.messageBridge.setView(webviewView);
    
    // Enable scripts in webview (Requirement 21.3)
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri]
    };
    
    console.log('[Extension] 开始设置 HTML 内容');
    const html = this.getHtmlContent(webviewView.webview);
    console.log('[Extension] HTML 长度:', html.length);
    console.log('[Extension] HTML 前 200 字符:', html.substring(0, 200));
    
    // Set HTML content
    webviewView.webview.html = html;
    console.log('[Extension] HTML 已设置');
    
    // Handle messages from webview (Requirement 21.3, 21.6)
    webviewView.webview.onDidReceiveMessage(message => {
      this.messageBridge.handleMessage(message);
    });
    
    // Send initial state to webview (Requirement 21.7)
    this.messageBridge.sendNotification('欢迎来到修仙模拟器！', 'success');
    console.log('[Extension] resolveWebviewView 完成');
  }
  
  /**
   * 处理角色创建
   * Task 17.1: 实现角色创建和修行方向选择
   * Implements Requirements 18.4, 18.5, 2.1-2.5, 20.1, 20.2
   */
  private async handleCreateCharacter(payload: { playerName: string; pathId: string }): Promise<void> {
    try {
      // 验证角色名称
      if (!payload.playerName || payload.playerName.trim().length === 0) {
        this.messageBridge.sendError('道号不能为空');
        return;
      }

      const trimmedName = payload.playerName.trim();
      if (trimmedName.length < 2) {
        this.messageBridge.sendError('道号至少需要2个字符');
        return;
      }

      if (trimmedName.length > 20) {
        this.messageBridge.sendError('道号不能超过20个字符');
        return;
      }

      // 检查是否包含非法字符
      const invalidChars = /[<>\/\\|:*?"]/;
      if (invalidChars.test(trimmedName)) {
        this.messageBridge.sendError('道号包含非法字符');
        return;
      }
      
      // 验证修行方向
      if (!payload.pathId || payload.pathId.trim().length === 0) {
        this.messageBridge.sendError('请选择修行方向');
        return;
      }
      
      // 加载修行方向配置
      const cultivationPaths = await this.loadCultivationPaths();
      const selectedPath = cultivationPaths.find(p => p.id === payload.pathId);
      
      if (!selectedPath) {
        this.messageBridge.sendError('无效的修行方向');
        return;
      }
      
      // 初始化游戏
      this.initializeNewGame(trimmedName, selectedPath);
      
    } catch (error) {
      ErrorHandler.logError(error as Error, 'CultivationSimulatorProvider:handleCreateCharacter');
      this.messageBridge.sendError(ErrorHandler.getUserFriendlyMessage(error as Error));
    }
  }
  
  /**
   * 加载修行方向配置
   */
  private async loadCultivationPaths(): Promise<CultivationPath[]> {
    // 默认修行方向配置
    const defaultPaths: CultivationPath[] = [
      {
        id: 'sword',
        name: '剑修',
        description: '以剑入道，攻击力强',
        initialStats: {
          spiritStones: 10,
          specialAbility: '剑气'
        },
        exclusiveEvents: ['sword_master_encounter', 'sword_dao_enlightenment'],
        cultivationBonus: 1.0
      },
      {
        id: 'body',
        name: '体修',
        description: '炼体为主，防御力高',
        initialStats: {
          spiritStones: 10,
          specialAbility: '金刚体'
        },
        exclusiveEvents: ['body_tempering_trial'],
        cultivationBonus: 0.9
      },
      {
        id: 'alchemy',
        name: '丹修',
        description: '精通炼丹，资源丰富',
        initialStats: {
          spiritStones: 20,
          specialAbility: '炼丹术'
        },
        exclusiveEvents: ['alchemy_master_encounter', 'rare_herb_discovery'],
        cultivationBonus: 0.8
      },
      {
        id: 'formation',
        name: '阵修',
        description: '精通阵法，控制力强',
        initialStats: {
          spiritStones: 15,
          specialAbility: '阵法'
        },
        exclusiveEvents: ['ancient_formation_discovery'],
        cultivationBonus: 0.85
      }
    ];
    
    return defaultPaths;
  }
  
  /**
   * 处理玩家行动
   * Task 16.2: 实现选项选择的双向通信
   * Implements Requirements 1.4, 1.7, 19.3, 20.6
   */
  private async handleAction(payload: { actionId: string }): Promise<void> {
    console.log('[Extension] handleAction 被调用, actionId:', payload.actionId);
    console.log('[Extension] gameEngine 存在:', !!this.gameEngine);
    
    if (!this.gameEngine) {
      console.error('[Extension] gameEngine 为空！');
      this.messageBridge.sendError('游戏未初始化，请先开始新游戏');
      return;
    }
    
    const gameState = this.gameEngine.getGameState();
    console.log('[Extension] 游戏状态:', gameState);
    
    if (gameState !== GameState.Running) {
      console.error('[Extension] 游戏状态不是 Running:', gameState);
      this.messageBridge.sendError('游戏未运行，当前状态: ' + gameState);
      return;
    }
    
    try {
      // 执行游戏回合
      const result = this.gameEngine.executeTurn(payload.actionId);
      
      if (!result.success) {
        this.messageBridge.sendError(result.message || '行动执行失败');
        return;
      }
      
      // 检查并解锁成就（从玩家状态的flags中）
      const playerState = this.gameEngine.getPlayerState();
      const currentFlags = Array.from(playerState.storyProgress.storyFlags.keys());
      const newlyUnlocked = this.achievementSystem.unlockAchievementsFromFlags(currentFlags);
      
      // 如果有新成就解锁，保存并通知
      if (newlyUnlocked.length > 0) {
        await this.saveAchievements();
        // 可以在这里添加成就解锁通知
        console.log('[Extension] 解锁新成就:', newlyUnlocked);
      }
      
      // 显示反馈信息
      if (result.feedback) {
        // 组合所有反馈信息
        const allMessages: string[] = [];
        
        // 添加标题
        allMessages.push('━━━━━━━━━━━━━━━━');
        allMessages.push('📋 行动结果');
        allMessages.push('━━━━━━━━━━━━━━━━');
        allMessages.push('');
        
        if (result.feedback.positiveEffects.length > 0) {
          allMessages.push('【✨ 正面效果】');
          allMessages.push(...result.feedback.positiveEffects);
          allMessages.push('');
        }
        
        if (result.feedback.negativeEffects.length > 0) {
          allMessages.push('【⚠️ 负面效果】');
          allMessages.push(...result.feedback.negativeEffects);
          allMessages.push('');
        }
        
        if (result.feedback.messages.length > 0) {
          allMessages.push('【📖 详细说明】');
          allMessages.push(...result.feedback.messages);
        }
        
        if (allMessages.length > 4) { // 至少有标题和一些内容
          this.messageBridge.sendNotification(allMessages.join('\n'), 'info');
        }
      }
      
      // 发送状态更新到前端
      this.syncGameState();
      
      // 显示突破提示
      if (result.breakthroughOccurred) {
        this.messageBridge.sendSuccess('恭喜！修为突破成功！');
      }
      
      // 检查结局
      if (result.endingReached && result.endingInfo) {
        // 记录成就
        const playerState = this.gameEngine.getPlayerState();
        this.achievementSystem.recordEnding(
          result.endingInfo.type,
          result.endingInfo.title,
          playerState.time.year,
          result.endingInfo.finalStats.cultivationLevel,
          result.endingInfo.achievements,
          {
            age: result.endingInfo.finalStats.age,
            spiritStones: result.endingInfo.finalStats.spiritStones,
            righteousReputation: result.endingInfo.finalStats.righteousReputation,
            demonicReputation: result.endingInfo.finalStats.demonicReputation,
            relationshipsCount: result.endingInfo.finalStats.relationshipsCount
          }
        );
        
        // 保存成就数据
        await this.saveAchievements();
        
        // 获取达成度信息
        const progress = this.achievementSystem.getEndingProgress();
        
        // 发送结局事件（包含达成度）
        this.messageBridge.sendToWebview({
          type: 'ending',
          payload: {
            title: result.endingInfo.title,
            description: result.endingInfo.description,
            achievements: result.endingInfo.achievements,
            finalStats: result.endingInfo.finalStats,
            progress: {
              unlockedCount: progress.unlockedCount,
              totalCount: progress.totalCount,
              percentage: progress.percentage,
              isFirstTime: !this.achievementSystem.isEndingUnlocked(result.endingInfo.type)
            }
          }
        });
        return;
      }
      
      // 尝试触发随机事件（探索时提高触发率）
      const isExploring = payload.actionId === 'explore';
      const eventTriggerRate = isExploring ? 0.8 : 0.3; // 探索时80%触发率
      
      const randomEvent = this.gameEngine.tryTriggerRandomEvent(eventTriggerRate);
      if (randomEvent) {
        this.messageBridge.sendToWebview({
          type: 'event',
          payload: randomEvent
        });
      } else if (isExploring) {
        // 探索时如果没触发大事件，触发小事件
        const minorEvent = this.generateMinorExplorationEvent();
        
        // 设置当前事件到GameEngine
        this.gameEngine.setCurrentEvent(minorEvent);
        
        this.messageBridge.sendToWebview({
          type: 'event',
          payload: minorEvent
        });
      } else {
        // 非探索行动，显示日常状态
        const dailyEvent = this.generateDailyEvent();
        
        this.messageBridge.sendToWebview({
          type: 'event',
          payload: dailyEvent
        });
        
        // 生成新选项
        const options = this.gameEngine.generateOptions();
        this.messageBridge.sendToWebview({
          type: 'options',
          payload: options
        });
      }
    } catch (error) {
      ErrorHandler.logError(error as Error, 'CultivationSimulatorProvider:handleAction');
      this.messageBridge.sendError(ErrorHandler.getUserFriendlyMessage(error as Error));
    }
  }
  
  /**
   * 同步游戏状态到前端
   * Task 16.2: 实现状态更新的自动同步
   * Implements Requirements 21.6, 21.7
   */
  private syncGameState(): void {
    if (!this.gameEngine) {
      return;
    }
    
    const playerState = this.gameEngine.getPlayerState();
    
    // 计算战力并添加到状态中
    const combatSystem = this.gameEngine.getCombatSystem();
    const combatPower = combatSystem.calculatePlayerPower();
    
    // 序列化 Map 对象为数组（JSON 不支持 Map）
    const serializedState = {
      ...playerState,
      combatPower,  // 添加战力信息
      resources: {
        ...playerState.resources,
        pills: Array.from(playerState.resources.pills.entries()),
        artifacts: Array.from(playerState.resources.artifacts.entries()),
        items: Array.from(playerState.resources.items.entries())  // 将 Map 转换为数组
      },
      relationships: Array.from(playerState.relationships.entries()),
      faction: {
        ...playerState.faction,
        reputation: Array.from(playerState.faction.reputation.entries())
      },
      storyProgress: {
        ...playerState.storyProgress,
        completedQuests: Array.from(playerState.storyProgress.completedQuests),
        activeQuests: Array.from(playerState.storyProgress.activeQuests),
        unlockedEvents: Array.from(playerState.storyProgress.unlockedEvents),
        storyFlags: Array.from(playerState.storyProgress.storyFlags.entries())
      }
    };
    
    this.messageBridge.sendToWebview({
      type: 'stateUpdate',
      payload: serializedState as any  // 序列化后的状态与 PlayerState 类型不同
    });
  }
  
  /**
   * 处理存档
   * Task 16.2: 实现工具栏功能的消息传递
   * Implements Requirements 20.4
   */
  private async handleSave(payload?: { slotId?: number }): Promise<void> {
    if (!this.gameEngine) {
      this.messageBridge.sendError('游戏未初始化');
      return;
    }
    
    try {
      const slotId = payload?.slotId || 1;
      const playerState = this.gameEngine.getPlayerState();
      
      // 保存到 VSCode globalState
      const saveData = {
        version: '2.5.3',
        timestamp: Date.now(),
        slotId,
        playerState
      };
      
      await this.context.globalState.update(`save_slot_${slotId}`, saveData);
      
      this.messageBridge.sendSuccess('保存成功');
    } catch (error) {
      ErrorHandler.logError(error as Error, 'CultivationSimulatorProvider:handleSave');
      this.messageBridge.sendError(ErrorHandler.getUserFriendlyMessage(error as Error));
    }
  }
  
  /**
   * 处理加载
   * Implements Requirements 20.4
   */
  private async handleLoad(payload: { slotId: number }): Promise<void> {
    try {
      const saveData = this.context.globalState.get<any>(`save_slot_${payload.slotId}`);
      
      if (!saveData) {
        this.messageBridge.sendError('存档不存在');
        return;
      }
      
      // 创建新的游戏引擎并加载状态
      this.gameEngine = new GameEngine();
      await this.gameEngine.loadGameState(saveData.playerState);
      
      // 通知前端切换到游戏界面
      this.messageBridge.sendToWebview({
        type: 'gameInitialized',
        payload: {}
      });
      
      // 同步状态到前端
      this.syncGameState();
      
      // 生成选项
      const options = this.gameEngine.generateOptions();
      this.messageBridge.sendToWebview({
        type: 'options',
        payload: options
      });
      
      // 显示欢迎回来的消息
      const playerName = saveData.playerState.name;
      const cultivationLevel = this.getCultivationLevelName(saveData.playerState.cultivation.level);
      this.messageBridge.sendToWebview({
        type: 'event',
        payload: {
          id: 'load_game',
          type: EventType.System,
          title: '欢迎回来',
          description: `${playerName}道友，欢迎回到修仙世界！\n\n当前境界：${cultivationLevel}\n继续你的修仙之路吧！`,
          triggerConditions: {},
          options: []
        }
      });
      
      this.messageBridge.sendSuccess('加载成功');
    } catch (error) {
      ErrorHandler.logError(error as Error, 'CultivationSimulatorProvider:handleLoad');
      this.messageBridge.sendError(ErrorHandler.getUserFriendlyMessage(error as Error));
    }
  }
  
  /**
   * 处理重开
   */
  private async handleRestart(): Promise<void> {
    console.log('[Extension] handleRestart 被调用');
    
    // 重置游戏引擎
    this.gameEngine = undefined;
    
    // 通知前端显示欢迎界面
    this.messageBridge.sendToWebview({
      type: 'restart',
      payload: {}
    });
    
    // 通知前端重置成功
    this.messageBridge.sendNotification('游戏已重置，请开始新游戏', 'success');
  }
  
  /**
   * 处理获取历史记录
   * Implements Requirements 20.6
   */
  private async handleGetHistory(): Promise<void> {
    try {
      if (!this.gameEngine) {
        this.messageBridge.sendError('游戏未初始化');
        return;
      }
      
      const stateTracker = this.gameEngine.getStateTracker();
      const history = stateTracker.getHistory();
      
      this.messageBridge.sendToWebview({
        type: 'history',
        payload: history
      });
    } catch (error) {
      ErrorHandler.logError(error as Error, 'CultivationSimulatorProvider:handleGetHistory');
      this.messageBridge.sendError(ErrorHandler.getUserFriendlyMessage(error as Error));
    }
  }
  
  /**
   * 处理字体设置
   * Implements Requirements 20.6
   */
  private async handleFontSettings(payload: any): Promise<void> {
    try {
      await this.context.globalState.update('fontSettings', payload);
    } catch (error) {
      ErrorHandler.logError(error as Error, 'CultivationSimulatorProvider:handleFontSettings');
      this.messageBridge.sendError('保存字体设置失败');
    }
  }
  
  /**
   * 处理获取成就数据
   */
  private async handleGetAchievements(): Promise<void> {
    try {
      const endingProgress = this.achievementSystem.getEndingProgress();
      const statistics = this.achievementSystem.getStatistics();
      const recentRecords = this.achievementSystem.getEndingRecords(10);
      
      // 加载成就定义
      const achievementsData = await this.loadAchievementsData();
      
      // 计算真实成就进度
      const totalAchievements = this.countTotalAchievements(achievementsData);
      const achievementProgress = this.achievementSystem.getAchievementProgress(totalAchievements);
      
      // 格式化记录
      const formattedRecords = recentRecords.map(record => ({
        endingType: record.endingType,
        title: record.title,
        achievedAt: record.achievedAt,
        playTime: record.playTime,
        cultivationLevel: record.cultivationLevel,
        achievements: record.achievements,
        finalStats: record.finalStats
      }));
      
      this.messageBridge.sendToWebview({
        type: 'achievements',
        payload: {
          endingProgress,
          achievementProgress,
          statistics,
          recentRecords: formattedRecords,
          categories: achievementsData?.categories || {}
        }
      });
    } catch (error) {
      ErrorHandler.logError(error as Error, 'CultivationSimulatorProvider:handleGetAchievements');
      this.messageBridge.sendError('获取成就数据失败');
    }
  }
  
  /**
   * 加载成就定义数据
   */
  private async loadAchievementsData(): Promise<any> {
    try {
      const achievementsPath = path.join(this.context.extensionPath, 'data', 'achievements.json');
      const data = await fs.promises.readFile(achievementsPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      ErrorHandler.logError(error as Error, 'Failed to load achievements.json');
      return null;
    }
  }
  
  /**
   * 统计总成就数量
   */
  private countTotalAchievements(achievementsData: any): number {
    if (!achievementsData || !achievementsData.categories) {
      return 0;
    }
    
    let total = 0;
    for (const category of Object.values(achievementsData.categories) as any[]) {
      if (category.achievements) {
        total += category.achievements.length;
      }
    }
    return total;
  }
  
  /**
   * 处理重置成就
   */
  private async handleResetAchievements(): Promise<void> {
    try {
      this.achievementSystem.reset();
      await this.saveAchievements();
      this.messageBridge.sendSuccess('成就数据已重置');
      
      // 重新发送成就数据
      await this.handleGetAchievements();
    } catch (error) {
      ErrorHandler.logError(error as Error, 'CultivationSimulatorProvider:handleResetAchievements');
      this.messageBridge.sendError('重置成就数据失败');
    }
  }
  
  /**
   * 保存成就数据
   */
  private async saveAchievements(): Promise<void> {
    try {
      const data = this.achievementSystem.serialize();
      await this.context.globalState.update('achievements', data);
    } catch (error) {
      ErrorHandler.logError(error as Error, 'CultivationSimulatorProvider:saveAchievements');
      throw error;
    }
  }
  
  /**
   * 处理检查存档
   */
  private async handleCheckSave(): Promise<void> {
    try {
      const saveData = this.context.globalState.get<any>('save_slot_1');
      
      if (saveData && saveData.playerState) {
        // 存档存在，发送存档信息
        this.messageBridge.sendToWebview({
          type: 'saveExists',
          payload: {
            exists: true,
            info: {
              playerName: saveData.playerState.name,
              cultivationLevel: this.getCultivationLevelName(saveData.playerState.cultivation.level),
              timestamp: saveData.timestamp,
              version: saveData.version
            }
          }
        });
      } else {
        // 存档不存在
        this.messageBridge.sendToWebview({
          type: 'saveExists',
          payload: {
            exists: false
          }
        });
      }
    } catch (error) {
      ErrorHandler.logError(error as Error, 'CultivationSimulatorProvider:handleCheckSave');
      // 出错时假设没有存档
      this.messageBridge.sendToWebview({
        type: 'saveExists',
        payload: {
          exists: false
        }
      });
    }
  }
  
  /**
   * 获取修为境界中文名称
   */
  private getCultivationLevelName(level: string): string {
    const levelNames: Record<string, string> = {
      'qi_refining': '炼气期',
      'foundation_establishment': '筑基期',
      'golden_core': '金丹期',
      'nascent_soul': '元婴期',
      'soul_formation': '化神期',
      'void': '返虚期',
      'integration': '合体期',
      'mahayana': '大乘期',
      'tribulation': '渡劫期',
      'ascension': '飞升境界'
    };
    return levelNames[level] || level || '炼气期';
  }
  
  /**
   * 生成日常事件描述
   */
  private generateDailyEvent(): any {
    if (!this.gameEngine) {
      return {
        id: 'daily_default',
        type: 'daily',
        title: '日常修炼',
        description: '平静的一天，你继续着修仙之路。',
        triggerConditions: {},
        options: []
      };
    }
    
    const playerState = this.gameEngine.getPlayerState();
    const season = ['春', '夏', '秋', '冬'][playerState.time.season] || '春';
    
    // 根据修为境界生成不同的日常描述
    const cultivationLevel = playerState.cultivation.level;
    const levelDescriptions: Record<string, string[]> = {
      'qi_refining': [
        `${season}日的清晨，你在洞府中醒来。作为一名炼气期修士，你每天都在努力修炼，希望早日突破到筑基期。\n\n你完成了今天的修炼，感觉修为有所精进。`,
        `又是平静的一天。你感受着体内微弱的灵力，继续着日复一日的修炼。\n\n时间在修炼中悄然流逝，你的修为稳步提升。`,
        `${season}风拂过，你站在洞府外眺望远方。修仙之路漫漫，而你才刚刚起步。\n\n今日的修炼让你对修仙之道有了更深的理解。`,
        `清晨的阳光洒在身上，你开始了新一天的修炼。炼气期的修为虽然微薄，但你相信终有一天能够飞升成仙。\n\n一天的修炼结束，你感到体内灵力更加凝实。`
      ],
      'foundation_establishment': [
        `作为筑基期修士，你已经在修仙界站稳了脚跟。${season}日里，你思考着下一步的修炼计划。\n\n今日的修炼颇有收获，距离金丹期又近了一步。`,
        `筑基已成，你感受着体内稳固的灵力根基。距离金丹期还有很长的路要走。\n\n你完成了今天的功课，修为稳步增长。`,
        `${season}风中，你运转功法，感受着天地灵气的流动。筑基期的修为让你有了更多的选择。\n\n一天的修炼让你对功法有了新的领悟。`
      ],
      'golden_core': [
        `金丹在体内熠熠生辉，你已经是一方小有名气的修士了。${season}日的修炼依然不能松懈。\n\n今日的修炼让金丹更加凝实，你感到实力又有提升。`,
        `作为金丹期修士，你开始思考更深层次的修炼之道。元婴期的门槛就在眼前。\n\n你完成了今天的修炼，对元婴期的突破有了新的想法。`,
        `${season}风吹过，你感受着金丹的力量。这是你多年修炼的成果。\n\n一天的修炼结束，你的修为又有所精进。`
      ],
      'nascent_soul': [
        `元婴期的修为让你在修仙界有了一席之地。${season}日里，你思考着化神期的奥秘。\n\n今日的修炼让你对大道有了更深的感悟。`,
        `元婴在识海中沉浮，你已经是真正的强者了。但修仙之路还很漫长。\n\n你完成了今天的修炼，元婴更加凝实。`,
        `${season}风中，你的元婴与天地共鸣。距离化神期还有一步之遥。\n\n一天的修炼让你距离化神期又近了一步。`
      ]
    };
    
    // 获取对应境界的描述，如果没有则使用默认
    const descriptions = levelDescriptions[cultivationLevel] || levelDescriptions['qi_refining'];
    const randomIndex = Math.floor(Math.random() * descriptions.length);
    const description = descriptions[randomIndex];
    
    return {
      id: 'daily_routine',
      type: 'daily',
      title: '✅ 行动完成',
      description: description,
      triggerConditions: {},
      options: []
    };
  }
  
  /**
   * 生成小型探索事件（探索时没触发大事件的替代）
   */
  private generateMinorExplorationEvent(): any {
    if (!this.gameEngine) {
      return this.generateDailyEvent();
    }
    
    const playerState = this.gameEngine.getPlayerState();
    const random = Math.random();
    
    // 小事件类型权重
    if (random < 0.3) {
      // 30% - 发现资源
      return this.generateResourceDiscovery();
    } else if (random < 0.55) {
      // 25% - 修炼感悟
      return this.generateCultivationInsight();
    } else if (random < 0.75) {
      // 20% - 遇到路人
      return this.generatePasserbyEncounter();
    } else if (random < 0.9) {
      // 15% - 发现线索
      return this.generateClueDiscovery();
    } else {
      // 10% - 什么都没发现
      return this.generateNothingFound();
    }
  }
  
  /**
   * 生成资源发现事件
   */
  private generateResourceDiscovery(): any {
    const discoveries = [
      {
        title: '发现灵石矿',
        description: '你在山壁上发现了一小块灵石矿脉，虽然不大，但也算是意外之喜。',
        reward: { spiritStones: 30, cultivation: 10 }
      },
      {
        title: '采集灵草',
        description: '路边生长着几株低阶灵草，你顺手采集了下来。',
        reward: { spiritStones: 20, cultivation: 15, item: 'spirit_herb' }
      },
      {
        title: '捡到遗物',
        description: '你在路边发现了一个破旧的储物袋，里面还有一些灵石和一块玉佩。',
        reward: { spiritStones: 40, cultivation: 5, item: 'jade_pendant' }
      },
      {
        title: '发现灵泉',
        description: '你发现了一处小型灵泉，泉水中蕴含微弱的灵气。你喝了几口，感觉神清气爽，还装了一瓶带走。',
        reward: { spiritStones: 15, cultivation: 25, item: 'spirit_water' }
      },
      {
        title: '野果收获',
        description: '你在林中发现了一些灵果，虽然品质一般，但也能补充一些灵力。',
        reward: { spiritStones: 10, cultivation: 20 }
      },
      {
        title: '发现古籍',
        description: '你在一个废弃的洞府中发现了一本残破的修炼古籍。',
        reward: { spiritStones: 0, cultivation: 30, item: 'ancient_manual' }
      }
    ];
    
    const discovery = discoveries[Math.floor(Math.random() * discoveries.length)];
    
    const effects: any = {
      cultivationChange: discovery.reward.cultivation
    };
    
    if (discovery.reward.spiritStones > 0) {
      effects.resourceChanges = { spiritStones: discovery.reward.spiritStones };
    }
    
    if (discovery.reward.item) {
      effects.addItems = [discovery.reward.item];
    }
    
    let description = `获得${discovery.reward.cultivation}修为`;
    if (discovery.reward.spiritStones > 0) {
      description += `和${discovery.reward.spiritStones}灵石`;
    }
    if (discovery.reward.item) {
      description += `，获得道具：${this.getItemName(discovery.reward.item)}`;
    }
    
    return {
      id: 'minor_resource_discovery',
      type: 'minor',
      title: discovery.title,
      description: discovery.description,
      triggerConditions: {},
      options: [
        {
          id: 'collect_resource',
          text: '收集资源',
          description,
          effects
        },
        {
          id: 'leave_resource',
          text: '离开',
          description: '不收集',
          effects: {
            cultivationChange: 5
          }
        }
      ]
    };
  }
  
  /**
   * 获取道具中文名称
   */
  private getItemName(itemId: string): string {
    const itemNames: Record<string, string> = {
      'spirit_herb': '灵草',
      'jade_pendant': '玉佩',
      'spirit_water': '灵泉水',
      'ancient_manual': '古籍残页',
      'mysterious_stone': '神秘石头',
      'broken_sword': '断剑',
      'talisman': '符箓'
    };
    return itemNames[itemId] || itemId;
  }
  
  /**
   * 生成修炼感悟事件
   */
  private generateCultivationInsight(): any {
    const insights = [
      {
        title: '观云悟道',
        description: '你抬头看着天空中的云朵变幻，突然对功法有了新的理解。',
        cultivation: 40
      },
      {
        title: '听风悟道',
        description: '山风吹过，你从风声中感悟到了一丝天地至理。',
        cultivation: 35
      },
      {
        title: '观水悟道',
        description: '溪水潺潺，你从流水中领悟到了功法运转的奥妙。',
        cultivation: 45
      },
      {
        title: '观石悟道',
        description: '路边的一块顽石引起了你的注意，你从中感悟到了坚韧之道。',
        cultivation: 30
      },
      {
        title: '观花悟道',
        description: '野花盛开，你从花开花落中领悟到了生命的真谛。',
        cultivation: 38
      }
    ];
    
    const insight = insights[Math.floor(Math.random() * insights.length)];
    
    return {
      id: 'minor_cultivation_insight',
      type: 'minor',
      title: insight.title,
      description: insight.description,
      triggerConditions: {},
      options: [
        {
          id: 'meditate_insight',
          text: '静心感悟',
          description: `获得${insight.cultivation}修为`,
          effects: {
            cultivationChange: insight.cultivation
          }
        },
        {
          id: 'continue_explore',
          text: '继续探索',
          description: '不停留',
          effects: {
            cultivationChange: 10
          }
        }
      ]
    };
  }
  
  /**
   * 生成路人遇见事件
   */
  private generatePasserbyEncounter(): any {
    const encounters = [
      {
        title: '遇到散修',
        description: '你遇到一位同样在外游历的散修，你们交流了一些修炼心得。',
        cultivation: 25
      },
      {
        title: '遇到商队',
        description: '一支商队路过，商人向你兜售一些小物件。',
        cultivation: 15
      },
      {
        title: '遇到采药人',
        description: '一位采药人正在山间采集灵草，你们聊了几句。',
        cultivation: 20
      },
      {
        title: '遇到猎人',
        description: '一位猎人正在追踪猎物，他告诉你附近的地形情况。',
        cultivation: 18
      }
    ];
    
    const encounter = encounters[Math.floor(Math.random() * encounters.length)];
    
    return {
      id: 'minor_passerby_encounter',
      type: 'minor',
      title: encounter.title,
      description: encounter.description,
      triggerConditions: {},
      options: [
        {
          id: 'chat_passerby',
          text: '交谈几句',
          description: `获得${encounter.cultivation}修为`,
          effects: {
            cultivationChange: encounter.cultivation
          }
        },
        {
          id: 'ignore_passerby',
          text: '点头离开',
          description: '不多交流',
          effects: {
            cultivationChange: 5
          }
        }
      ]
    };
  }
  
  /**
   * 生成线索发现事件
   */
  private generateClueDiscovery(): any {
    const clues = [
      {
        title: '发现洞府痕迹',
        description: '你发现了一些古老的建筑痕迹，似乎这里曾经有过洞府。',
        cultivation: 20
      },
      {
        title: '发现阵法残迹',
        description: '地面上有一些奇怪的纹路，似乎是某个阵法的残留。',
        cultivation: 25
      },
      {
        title: '发现战斗痕迹',
        description: '周围的树木和岩石上有战斗留下的痕迹，看起来是高手交锋。',
        cultivation: 22
      },
      {
        title: '发现古老石碑',
        description: '你发现了一块风化的石碑，上面的文字已经模糊不清。',
        cultivation: 28
      }
    ];
    
    const clue = clues[Math.floor(Math.random() * clues.length)];
    
    return {
      id: 'minor_clue_discovery',
      type: 'minor',
      title: clue.title,
      description: clue.description,
      triggerConditions: {},
      options: [
        {
          id: 'investigate_clue',
          text: '仔细调查',
          description: `获得${clue.cultivation}修为`,
          effects: {
            cultivationChange: clue.cultivation
          }
        },
        {
          id: 'ignore_clue',
          text: '不予理会',
          description: '继续前行',
          effects: {
            cultivationChange: 8
          }
        }
      ]
    };
  }
  
  /**
   * 生成什么都没发现事件
   */
  private generateNothingFound(): any {
    const nothings = [
      {
        title: '平静的探索',
        description: '你在附近转了一圈，虽然没有什么特别的发现，但也熟悉了周围的环境。',
        cultivation: 15
      },
      {
        title: '徒劳的搜寻',
        description: '你仔细搜寻了一番，可惜没有发现什么有价值的东西。不过锻炼了身体也算有所收获。',
        cultivation: 12
      },
      {
        title: '无果而返',
        description: '探索无果，但你在途中欣赏了沿途的风景，心情愉悦。',
        cultivation: 10
      }
    ];
    
    const nothing = nothings[Math.floor(Math.random() * nothings.length)];
    
    return {
      id: 'minor_nothing_found',
      type: 'minor',
      title: nothing.title,
      description: nothing.description,
      triggerConditions: {},
      options: [
        {
          id: 'return_empty',
          text: '返回',
          description: `获得${nothing.cultivation}修为`,
          effects: {
            cultivationChange: nothing.cultivation
          }
        }
      ]
    };
  }
  
  /**
   * 生成行动反馈文本
   */
  private generateActionFeedback(actionId: string): string {
    const feedbackTemplates: Record<string, string[]> = {
      'cultivate': [
        '你盘膝而坐，感受天地灵气缓缓流入体内。',
        '一缕灵气在经脉中游走，修为略有精进。',
        '你静心凝神，体内真气运转一周天。',
        '闭关修炼中，你对功法有了新的领悟。',
        '灵气入体，丹田中的真气愈发凝实。',
        '你专注修炼，感觉离下一个境界又近了一步。',
        '天地灵气汇聚，你的修为稳步提升。',
        '修炼有成，你感到体内真气更加充盈。'
      ],
      'explore': [
        '你在附近转了一圈，没有什么特别的发现。',
        '探索途中，你欣赏了沿途的风景。',
        '你四处查看，熟悉了周围的环境。',
        '一番探索后，你对这片区域更加了解了。',
        '你在山林间漫步，呼吸着清新的空气。',
        '探索无果，但你锻炼了身体。',
        '你仔细搜寻，可惜没有发现什么宝物。',
        '平静的一天，你在附近走了走。'
      ],
      'rest': [
        '你好好休息了一番，精神恢复了不少。',
        '躺下小憩片刻，感觉神清气爽。',
        '你闭目养神，恢复了一些体力。',
        '休息过后，你感到身心舒畅。',
        '你放松身心，享受难得的宁静时光。',
        '小睡一会儿，你的状态好了很多。',
        '你静静休息，让疲惫的身体得到恢复。',
        '休息调整后，你感觉精力充沛。'
      ],
      'meditate': [
        '你进入冥想状态，心境愈发平和。',
        '冥想中，你感悟到一丝天地至理。',
        '你静心打坐，杂念渐渐消散。',
        '冥想让你的心境更加澄明。',
        '你沉浸在冥想中，忘却了时间的流逝。',
        '打坐冥想，你对修行有了新的理解。',
        '你入定冥想，感觉心神合一。',
        '冥想过后，你的道心更加坚定。'
      ],
      'gather': [
        '你采集了一些灵草，收获不错。',
        '在山间找到了几株药材。',
        '你采集了一些有用的材料。',
        '收获了一些灵药，可以用来炼丹。',
        '你找到了几株不错的灵草。',
        '采集途中，你发现了一些珍贵的药材。',
        '你仔细搜寻，采集到了一些资源。',
        '今天的采集收获颇丰。'
      ],
      'default': [
        '你完成了这个行动。',
        '时间悄然流逝。',
        '平静的一天。',
        '你继续着修仙之路。',
        '日子一天天过去。',
        '你坚持着自己的选择。',
        '修仙路漫漫，你稳步前行。',
        '又是充实的一天。'
      ]
    };
    
    // 获取对应的反馈模板
    const templates = feedbackTemplates[actionId] || feedbackTemplates['default'];
    
    // 随机选择一条反馈
    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex];
  }
  
  /**
   * Start a new game
   * Creates a new GameEngine instance and initializes the game
   */
  public newGame(): void {
    // For now, just notify - full implementation in Task 17
    this.messageBridge.sendNotification('请在界面中选择修行方向开始新游戏', 'info');
  }
  
  /**
   * Load a saved game
   */
  public loadGame(): void {
    this.messageBridge.sendNotification('请选择存档槽位', 'info');
  }
  
  /**
   * Initialize a new game with player name and cultivation path
   * Task 16.2: 连接 GameEngine 和 UIRenderer
   * Task 17.1: 初始化游戏并通知前端
   * Task 17.2: 实现开局剧情和初始化
   * Implements Requirements 20.6
   */
  public async initializeNewGame(playerName: string, cultivationPath: CultivationPath): Promise<void> {
    try {
      // Create new game engine
      this.gameEngine = new GameEngine();
      
      // Initialize game (now async)
      await this.gameEngine.initializeGame(playerName, cultivationPath);
      
      // Notify frontend that game is initialized
      this.messageBridge.sendToWebview({
        type: 'gameInitialized',
        payload: {}
      });
      
      // Task 17.2: Display opening storyline based on cultivation path
      const openingStory = this.getOpeningStoryline(playerName, cultivationPath);
      this.messageBridge.sendToWebview({
        type: 'event',
        payload: {
          id: 'opening_story',
          type: 'story' as any,
          title: '修仙之路的开端',
          description: openingStory,
          triggerConditions: {},
          options: []
        }
      });
      
      // Sync state to frontend
      this.syncGameState();
      
      // Generate initial options
      const options = this.gameEngine.generateOptions();
      this.messageBridge.sendToWebview({
        type: 'options',
        payload: options
      });
      
      this.messageBridge.sendSuccess(`欢迎，${playerName}！开始你的${cultivationPath.name}之路！`);
    } catch (error) {
      ErrorHandler.logError(error as Error, 'CultivationSimulatorProvider:initializeNewGame');
      this.messageBridge.sendError(ErrorHandler.getUserFriendlyMessage(error as Error));
    }
  }
  
  /**
   * Get opening storyline based on cultivation path
   * Task 17.2: 实现开局剧情显示
   * Implements Requirements 18.6, 18.7, 2.4, 2.5
   */
  private getOpeningStoryline(playerName: string, cultivationPath: CultivationPath): string {
    const storylines: Record<string, string> = {
      sword: `你是${playerName}，一个对剑道充满向往的少年。

在一次偶然的机会中，你在山中发现了一把古剑。当你握住剑柄的那一刻，一股剑意涌入你的体内，你感受到了修仙的可能。

从此，你踏上了剑修之路。以剑入道，以剑证道，这是你的选择。

你的初始资源：
- 灵石：${cultivationPath.initialStats.spiritStones}
- 特殊能力：${cultivationPath.initialStats.specialAbility || '无'}
- 修为：炼气期 0层
- 寿命：80年

剑修之路充满挑战，但你的剑气将斩破一切阻碍！`,

      body: `你是${playerName}，一个天生体质强健的少年。

在一次意外中，你从悬崖跌落却毫发无伤。你意识到自己的身体蕴含着巨大的潜力，于是决定走上体修之路。

炼体为主，以肉身抗天劫，这是你的道路。

你的初始资源：
- 灵石：${cultivationPath.initialStats.spiritStones}
- 特殊能力：${cultivationPath.initialStats.specialAbility || '无'}
- 修为：炼气期 0层
- 寿命：80年

体修之路艰辛无比，但你的金刚之体将无坚不摧！`,

      alchemy: `你是${playerName}，一个对炼丹术充满兴趣的少年。

在一次采药时，你意外发现了一本古老的丹方。通过研读丹方，你领悟了炼丹的奥秘，决定走上丹修之路。

精通炼丹，以丹药辅助修行，这是你的选择。

你的初始资源：
- 灵石：${cultivationPath.initialStats.spiritStones}
- 特殊能力：${cultivationPath.initialStats.specialAbility || '无'}
- 修为：炼气期 0层
- 寿命：80年

丹修之路需要大量资源，但你的炼丹术将为你带来无尽财富！`,

      formation: `你是${playerName}，一个对阵法充满好奇的少年。

在一次探索古迹时，你破解了一个上古阵法。在破阵的过程中，你领悟了阵法的玄妙，决定走上阵修之路。

精通阵法，以阵法困敌制胜，这是你的道路。

你的初始资源：
- 灵石：${cultivationPath.initialStats.spiritStones}
- 特殊能力：${cultivationPath.initialStats.specialAbility || '无'}
- 修为：炼气期 0层
- 寿命：80年

阵修之路需要智慧与耐心，但你的阵法将困住一切敌人！`
    };
    
    return storylines[cultivationPath.id] || `你是${playerName}，一个踏上修仙之路的少年。

你的修仙之旅从今天开始。

你的初始资源：
- 灵石：${cultivationPath.initialStats.spiritStones}
- 修为：炼气期 0层
- 寿命：80年

愿你在修仙之路上一帆风顺！`;
  }
  
  /**
   * Generate HTML content for the webview
   * Implements Requirements 21.1, 17.1, 17.2, 17.4, 17.5, 17.6, 17.8, 18.1-18.7
   */
  private getHtmlContent(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'style.css')
    );
    
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'main.js')
    );
    
    return `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline';">
        <link href="${styleUri}" rel="stylesheet">
        <title>修仙模拟器</title>
      </head>
      <body>
        <div id="app">
          <!-- Toolbar Area (Requirement 17.2, 22.1) -->
          <div class="toolbar" id="toolbar">
            <button id="btn-how-to-play-toolbar" class="toolbar-button" title="玩法说明">
              <span class="icon">📖</span> 说明
            </button>
            <button id="btn-font" class="toolbar-button" title="字体设置">
              <span class="icon">🔤</span> 字体
            </button>
            <button id="btn-save" class="toolbar-button" title="快速存档" disabled>
              <span class="icon">💾</span> 存档
            </button>
            <button id="btn-restart" class="toolbar-button" title="重新开始" disabled>
              <span class="icon">🔄</span> 重开
            </button>
            <button id="btn-history" class="toolbar-button" title="历史记录" disabled>
              <span class="icon">📜</span> 历史
            </button>
            <button id="btn-action-log" class="toolbar-button" title="行动日志">
              <span class="icon">📋</span> 日志
            </button>
            <button id="btn-toggle-stats" class="toolbar-button" title="详细面板" disabled>
              <span class="icon">📊</span> 面板
            </button>
          </div>
          
          <!-- Main Content Area -->
          <div class="content" id="content">
            <!-- Welcome Screen (Requirement 18.1, 18.2, 18.3) -->
            <div id="welcome-screen" class="welcome-screen">
              <div class="welcome-title">修仙模拟器</div>
              <div class="welcome-version">v2.5.3</div>
              <div class="welcome-description">
                欢迎来到修仙世界！<br><br>
                在这里，你将体验从凡人到仙人的修炼之路。<br>
                选择你的修行方向，经历机缘与劫难，<br>
                最终达成属于你的结局。<br><br>
                你准备好开始你的修仙之旅了吗？
              </div>
              <div class="welcome-buttons">
                <button id="btn-new-game" class="button button-primary" onclick="console.log('内联点击！'); alert('按钮被点击了！');">开始新游戏</button>
                <button id="btn-continue-game" class="button" onclick="console.log('继续游戏点击！'); alert('继续游戏！');">继续游戏</button>
                <button id="btn-how-to-play" class="button" onclick="console.log('玩法说明点击！'); alert('玩法说明！');">玩法说明</button>
              </div>
            </div>
            
            <!-- Character Creation Screen (Requirement 18.4, 18.5) -->
            <div id="character-creation" class="character-creation" style="display: none;">
              <div class="creation-title">创建角色</div>
              
              <!-- Name Input (Requirement 18.4) -->
              <div class="creation-section">
                <label class="creation-label">道号：</label>
                <input type="text" id="player-name" class="creation-input" placeholder="请输入你的道号" maxlength="20">
                <div class="creation-hint">（2-20个字符）</div>
              </div>
              
              <!-- Cultivation Path Selection (Requirement 18.5, 2.1-2.5) -->
              <div class="creation-section">
                <label class="creation-label">修行方向：</label>
                <div class="cultivation-paths" id="cultivation-paths">
                  <div class="path-card" data-path-id="sword">
                    <div class="path-icon">⚔️</div>
                    <div class="path-name">剑修</div>
                    <div class="path-description">以剑入道，攻击力强</div>
                    <div class="path-stats">初始灵石：10</div>
                  </div>
                  <div class="path-card" data-path-id="body">
                    <div class="path-icon">💪</div>
                    <div class="path-name">体修</div>
                    <div class="path-description">炼体为主，防御力高</div>
                    <div class="path-stats">初始灵石：10</div>
                  </div>
                  <div class="path-card" data-path-id="alchemy">
                    <div class="path-icon">🧪</div>
                    <div class="path-name">丹修</div>
                    <div class="path-description">精通炼丹，资源丰富</div>
                    <div class="path-stats">初始灵石：20</div>
                  </div>
                  <div class="path-card" data-path-id="formation">
                    <div class="path-icon">🔮</div>
                    <div class="path-name">阵修</div>
                    <div class="path-description">精通阵法，控制力强</div>
                    <div class="path-stats">初始灵石：15</div>
                  </div>
                </div>
              </div>
              
              <div class="creation-buttons">
                <button id="btn-start-game" class="button button-primary" disabled>开始修仙</button>
                <button id="btn-back-welcome" class="button">返回</button>
              </div>
            </div>
            
            <!-- Game Screen (initially hidden) -->
            <div id="game-screen" style="display: none;">
              <!-- Game State Display Area (Requirement 17.4, 17.5) -->
              <div class="game-header" id="game-header">
                <div class="game-time" id="game-time">第1年 春季</div>
                <div class="game-stats" id="game-stats">
                  <div class="stat-line">
                    <span class="stat-label">修为:</span>
                    <span class="stat-value">炼气期 0/100</span>
                  </div>
                </div>
              </div>
              
              <!-- Event Description Area (Requirement 17.6) -->
              <div class="event-section" id="event-section">
                <div class="event-title" id="event-title"></div>
                <div class="event-description" id="event-description"></div>
              </div>
              
              <!-- Action Result Area (显示选项结果) -->
              <div class="action-result-section" id="action-result-section" style="display: none;">
                <div class="result-title">📋 行动结果</div>
                <div class="result-content" id="result-content"></div>
              </div>
              
              <!-- Option Buttons Area (Requirement 17.8) -->
              <div class="options-section" id="options-section">
              </div>
            </div>
          </div>
        </div>
        <script src="${scriptUri}"></script>
      </body>
      </html>
    `;
  }
}
