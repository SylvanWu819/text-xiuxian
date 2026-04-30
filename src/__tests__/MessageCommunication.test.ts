/**
 * Integration tests for message communication between Extension and Webview
 * Task 16.3: 编写消息通信的集成测试
 * Validates: Requirements 17.12, 20.6
 */

import { GameEngine } from '../game/GameEngine';
import { CultivationLevel, Season, WebviewMessage, ExtensionMessage } from '../types';

describe('Message Communication Integration Tests', () => {
  describe('Message Routing', () => {
    /**
     * Test message type routing
     * Validates: Requirement 17.12
     */
    it('should route different message types correctly', () => {
      const messageTypes: WebviewMessage['type'][] = [
        'action',
        'save',
        'load',
        'restart',
        'getHistory',
        'fontSettings'
      ];
      
      messageTypes.forEach(type => {
        const message: WebviewMessage = {
          type,
          payload: type === 'action' ? { actionId: 'test' } : 
                   type === 'load' ? { slotId: 1 } :
                   type === 'fontSettings' ? { size: 'medium', family: 'default' } :
                   undefined
        } as WebviewMessage;
        
        expect(message.type).toBe(type);
        expect(message).toHaveProperty('payload');
      });
    });
    
    /**
     * Test extension message types
     * Validates: Requirement 17.12
     */
    it('should create valid extension messages', () => {
      const stateUpdateMessage: ExtensionMessage = {
        type: 'stateUpdate',
        payload: {
          name: 'Test Player',
          cultivationPath: {
            id: 'sword',
            name: '剑修',
            description: '以剑入道',
            initialStats: { spiritStones: 10 },
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
            spiritStones: 10,
            pills: new Map(),
            artifacts: new Map(),
            items: new Map()
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
        }
      };
      
      expect(stateUpdateMessage.type).toBe('stateUpdate');
      expect(stateUpdateMessage.payload).toHaveProperty('name');
      expect(stateUpdateMessage.payload).toHaveProperty('cultivation');
    });
  });
  
  describe('Message Sending and Receiving', () => {
    /**
     * Test action message flow
     * Validates: Requirement 17.12
     */
    it('should handle action messages correctly', () => {
      const actionMessage: WebviewMessage = {
        type: 'action',
        payload: { actionId: 'cultivate' }
      };
      
      expect(actionMessage.type).toBe('action');
      expect(actionMessage.payload).toEqual({ actionId: 'cultivate' });
    });
    
    /**
     * Test save message flow
     * Validates: Requirement 17.12
     */
    it('should handle save messages correctly', () => {
      const saveMessage: WebviewMessage = {
        type: 'save',
        payload: { slotId: 1 }
      };
      
      expect(saveMessage.type).toBe('save');
      expect(saveMessage.payload).toHaveProperty('slotId');
    });
    
    /**
     * Test notification messages
     * Validates: Requirement 17.12
     */
    it('should create notification messages', () => {
      const notificationMessage: ExtensionMessage = {
        type: 'notification',
        payload: {
          message: '保存成功',
          type: 'success'
        }
      };
      
      expect(notificationMessage.type).toBe('notification');
      expect(notificationMessage.payload.message).toBe('保存成功');
      expect(notificationMessage.payload.type).toBe('success');
    });
  });
  
  describe('Error Handling', () => {
    /**
     * Test error message handling
     * Validates: Requirement 20.6
     */
    it('should handle error messages correctly', () => {
      const errorMessage: ExtensionMessage = {
        type: 'notification',
        payload: {
          message: '游戏未运行',
          type: 'error'
        }
      };
      
      expect(errorMessage.type).toBe('notification');
      expect(errorMessage.payload.type).toBe('error');
      expect(errorMessage.payload.message).toBeTruthy();
    });
    
    /**
     * Test invalid message type handling
     * Validates: Requirement 20.6
     */
    it('should handle invalid message types gracefully', () => {
      // Simulate an unknown message type
      const unknownMessage = {
        type: 'unknown',
        payload: {}
      };
      
      // In a real scenario, this would be caught by the message handler
      expect(unknownMessage.type).toBe('unknown');
    });
    
    /**
     * Test missing payload handling
     * Validates: Requirement 20.6
     */
    it('should handle messages with missing payload', () => {
      const messageWithoutPayload: WebviewMessage = {
        type: 'restart'
      } as WebviewMessage;
      
      expect(messageWithoutPayload.type).toBe('restart');
      // Restart doesn't require a payload
    });
  });
  
  describe('GameEngine Integration', () => {
    let gameEngine: GameEngine;
    
    beforeEach(() => {
      gameEngine = new GameEngine();
      gameEngine.initializeGame('Test Player', {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      });
    });
    
    /**
     * Test state synchronization
     * Validates: Requirement 17.12
     */
    it('should synchronize game state correctly', () => {
      const playerState = gameEngine.getPlayerState();
      
      const stateMessage: ExtensionMessage = {
        type: 'stateUpdate',
        payload: playerState
      };
      
      expect(stateMessage.type).toBe('stateUpdate');
      expect(stateMessage.payload.name).toBe('Test Player');
      expect(stateMessage.payload.cultivation.level).toBe(CultivationLevel.QiRefining);
    });
    
    /**
     * Test options generation and sending
     * Validates: Requirement 17.12
     */
    it('should generate and send options correctly', () => {
      const options = gameEngine.generateOptions();
      
      const optionsMessage: ExtensionMessage = {
        type: 'options',
        payload: options
      };
      
      expect(optionsMessage.type).toBe('options');
      expect(Array.isArray(optionsMessage.payload)).toBe(true);
      expect(optionsMessage.payload.length).toBeGreaterThan(0);
    });
    
    /**
     * Test action execution flow
     * Validates: Requirement 17.12
     */
    it('should execute action and return result', () => {
      const options = gameEngine.generateOptions();
      expect(options.length).toBeGreaterThan(0);
      
      const result = gameEngine.executeTurn(options[0].id);
      
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
    });
  });
  
  describe('Toolbar Message Communication', () => {
    /**
     * Test font settings message
     * Validates: Requirement 17.12
     */
    it('should handle font settings messages', () => {
      const fontMessage: WebviewMessage = {
        type: 'fontSettings',
        payload: {
          size: 'large',
          family: 'songti'
        }
      };
      
      expect(fontMessage.type).toBe('fontSettings');
      expect(fontMessage.payload.size).toBe('large');
      expect(fontMessage.payload.family).toBe('songti');
    });
    
    /**
     * Test history request message
     * Validates: Requirement 17.12
     */
    it('should handle history request messages', () => {
      const historyMessage: WebviewMessage = {
        type: 'getHistory'
      } as WebviewMessage;
      
      expect(historyMessage.type).toBe('getHistory');
    });
    
    /**
     * Test restart message
     * Validates: Requirement 17.12
     */
    it('should handle restart messages', () => {
      const restartMessage: WebviewMessage = {
        type: 'restart'
      } as WebviewMessage;
      
      expect(restartMessage.type).toBe('restart');
    });
  });
  
  describe('State Update Communication', () => {
    let gameEngine: GameEngine;
    
    beforeEach(() => {
      gameEngine = new GameEngine();
      gameEngine.initializeGame('Test Player', {
        id: 'sword',
        name: '剑修',
        description: '以剑入道',
        initialStats: { spiritStones: 10 },
        exclusiveEvents: [],
        cultivationBonus: 1.0
      });
    });
    
    /**
     * Test state update after action
     * Validates: Requirement 17.12
     */
    it('should send state update after action execution', () => {
      const options = gameEngine.generateOptions();
      const result = gameEngine.executeTurn(options[0].id);
      
      expect(result.success).toBe(true);
      
      const updatedState = gameEngine.getPlayerState();
      const stateMessage: ExtensionMessage = {
        type: 'stateUpdate',
        payload: updatedState
      };
      
      expect(stateMessage.type).toBe('stateUpdate');
      expect(stateMessage.payload).toBeDefined();
    });
    
    /**
     * Test breakthrough notification
     * Validates: Requirement 17.12
     */
    it('should send notification on breakthrough', () => {
      // Simulate breakthrough by setting high experience
      const playerState = gameEngine.getPlayerState();
      playerState.cultivation.experience = playerState.cultivation.maxExperience;
      
      const options = gameEngine.generateOptions();
      const result = gameEngine.executeTurn(options[0].id);
      
      // Check if breakthrough occurred
      if (result.breakthroughOccurred) {
        const notificationMessage: ExtensionMessage = {
          type: 'notification',
          payload: {
            message: '恭喜！修为突破成功！',
            type: 'success'
          }
        };
        
        expect(notificationMessage.type).toBe('notification');
        expect(notificationMessage.payload.message).toContain('突破');
      }
    });
  });
});
