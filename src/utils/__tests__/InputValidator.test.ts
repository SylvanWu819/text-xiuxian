/**
 * InputValidator Tests
 * Validates: Requirements 1.5, 20.1, 20.2, 18.4, 18.5
 */

import { InputValidator } from '../InputValidator';
import { ValidationError, ValidationErrorType } from '../ValidationError';
import { GameOption } from '../../types';

describe('InputValidator', () => {
  describe('validateCharacterName', () => {
    it('should accept valid character names', () => {
      expect(() => InputValidator.validateCharacterName('张三')).not.toThrow();
      expect(() => InputValidator.validateCharacterName('李四丰')).not.toThrow();
      expect(() => InputValidator.validateCharacterName('王五六七八九十')).not.toThrow();
    });

    it('should reject empty names', () => {
      expect(() => InputValidator.validateCharacterName('')).toThrow(ValidationError);
      expect(() => InputValidator.validateCharacterName('  ')).toThrow(ValidationError);
      
      try {
        InputValidator.validateCharacterName('');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).type).toBe(ValidationErrorType.InvalidCharacterName);
        expect((error as ValidationError).message).toBe('道号不能为空');
      }
    });

    it('should reject names that are too short', () => {
      expect(() => InputValidator.validateCharacterName('a')).toThrow(ValidationError);
      
      try {
        InputValidator.validateCharacterName('张');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe('道号至少需要2个字符');
      }
    });

    it('should reject names that are too long', () => {
      const longName = '这是一个非常非常非常非常非常非常非常长的名字';
      expect(() => InputValidator.validateCharacterName(longName)).toThrow(ValidationError);
      
      try {
        InputValidator.validateCharacterName(longName);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe('道号不能超过20个字符');
      }
    });

    it('should reject names with invalid characters', () => {
      const invalidNames = ['张<三', '李>四', '王/五', '赵\\六', '钱|七', '孙:八', '周*九', '吴?十', '郑"十一'];
      
      for (const name of invalidNames) {
        expect(() => InputValidator.validateCharacterName(name)).toThrow(ValidationError);
      }
      
      try {
        InputValidator.validateCharacterName('张<三');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe('道号包含非法字符');
      }
    });

    it('should trim whitespace before validation', () => {
      expect(() => InputValidator.validateCharacterName('  张三  ')).not.toThrow();
    });
  });

  describe('validateCultivationPathId', () => {
    const validPaths = ['sword', 'body', 'alchemy', 'formation'];

    it('should accept valid path IDs', () => {
      expect(() => InputValidator.validateCultivationPathId('sword', validPaths)).not.toThrow();
      expect(() => InputValidator.validateCultivationPathId('body', validPaths)).not.toThrow();
    });

    it('should reject empty path IDs', () => {
      expect(() => InputValidator.validateCultivationPathId('', validPaths)).toThrow(ValidationError);
      
      try {
        InputValidator.validateCultivationPathId('', validPaths);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).type).toBe(ValidationErrorType.InvalidCultivationPath);
        expect((error as ValidationError).message).toBe('请选择修行方向');
      }
    });

    it('should reject invalid path IDs', () => {
      expect(() => InputValidator.validateCultivationPathId('invalid', validPaths)).toThrow(ValidationError);
      
      try {
        InputValidator.validateCultivationPathId('invalid', validPaths);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe('无效的修行方向');
      }
    });
  });

  describe('validateOptionId', () => {
    const availableOptions: GameOption[] = [
      { id: 'cultivate', text: '修炼', description: '', timeCost: { months: 1 }, effects: {} },
      { id: 'explore', text: '探索', description: '', timeCost: { months: 1 }, effects: {} }
    ];

    it('should accept valid option IDs', () => {
      expect(() => InputValidator.validateOptionId('cultivate', availableOptions)).not.toThrow();
      expect(() => InputValidator.validateOptionId('explore', availableOptions)).not.toThrow();
    });

    it('should reject empty option IDs', () => {
      expect(() => InputValidator.validateOptionId('', availableOptions)).toThrow(ValidationError);
      
      try {
        InputValidator.validateOptionId('', availableOptions);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).type).toBe(ValidationErrorType.InvalidOption);
        expect((error as ValidationError).message).toBe('请选择一个选项');
      }
    });

    it('should reject invalid option IDs', () => {
      expect(() => InputValidator.validateOptionId('invalid', availableOptions)).toThrow(ValidationError);
      
      try {
        InputValidator.validateOptionId('invalid', availableOptions);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe('无效的选项，请输入有效的选项编号');
      }
    });
  });

  describe('validateOptionNumber', () => {
    it('should accept valid option numbers', () => {
      expect(InputValidator.validateOptionNumber('1', 5)).toBe(1);
      expect(InputValidator.validateOptionNumber('3', 5)).toBe(3);
      expect(InputValidator.validateOptionNumber('5', 5)).toBe(5);
    });

    it('should trim whitespace', () => {
      expect(InputValidator.validateOptionNumber('  2  ', 5)).toBe(2);
    });

    it('should reject empty input', () => {
      expect(() => InputValidator.validateOptionNumber('', 5)).toThrow(ValidationError);
      
      try {
        InputValidator.validateOptionNumber('', 5);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe('请输入选项编号');
      }
    });

    it('should reject non-numeric input', () => {
      expect(() => InputValidator.validateOptionNumber('abc', 5)).toThrow(ValidationError);
      
      try {
        InputValidator.validateOptionNumber('abc', 5);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe('请输入数字');
      }
    });

    it('should reject numbers out of range', () => {
      expect(() => InputValidator.validateOptionNumber('0', 5)).toThrow(ValidationError);
      expect(() => InputValidator.validateOptionNumber('6', 5)).toThrow(ValidationError);
      
      try {
        InputValidator.validateOptionNumber('6', 5);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe('请输入 1-5 之间的数字');
      }
    });
  });

  describe('validateSpiritStones', () => {
    it('should accept sufficient spirit stones', () => {
      expect(() => InputValidator.validateSpiritStones(50, 100)).not.toThrow();
      expect(() => InputValidator.validateSpiritStones(100, 100)).not.toThrow();
    });

    it('should reject insufficient spirit stones', () => {
      expect(() => InputValidator.validateSpiritStones(100, 50)).toThrow(ValidationError);
      
      try {
        InputValidator.validateSpiritStones(100, 50);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).type).toBe(ValidationErrorType.InsufficientResources);
        expect((error as ValidationError).message).toBe('灵石不足，需要100，当前只有50');
        expect((error as ValidationError).details).toEqual({
          required: 100,
          available: 50,
          deficit: 50
        });
      }
    });
  });

  describe('validateOptionRequirements', () => {
    it('should accept options with no requirements', () => {
      const option: GameOption = {
        id: 'test',
        text: 'Test',
        description: '',
        timeCost: { months: 1 },
        effects: {}
      };
      
      const resources = {
        spiritStones: 100,
        relationships: new Map<string, number>(),
        items: new Set<string>()
      };
      
      expect(() => InputValidator.validateOptionRequirements(option, resources)).not.toThrow();
    });

    it('should accept options with satisfied requirements', () => {
      const option: GameOption = {
        id: 'test',
        text: 'Test',
        description: '',
        timeCost: { months: 1 },
        effects: {},
        requirements: {
          minResources: { spiritStones: 50 }
        }
      };
      
      const resources = {
        spiritStones: 100,
        relationships: new Map<string, number>(),
        items: new Set<string>()
      };
      
      expect(() => InputValidator.validateOptionRequirements(option, resources)).not.toThrow();
    });

    it('should reject options with insufficient spirit stones', () => {
      const option: GameOption = {
        id: 'test',
        text: 'Test',
        description: '',
        timeCost: { months: 1 },
        effects: {},
        requirements: {
          minResources: { spiritStones: 100 }
        }
      };
      
      const resources = {
        spiritStones: 50,
        relationships: new Map<string, number>(),
        items: new Set<string>()
      };
      
      expect(() => InputValidator.validateOptionRequirements(option, resources)).toThrow(ValidationError);
      
      try {
        InputValidator.validateOptionRequirements(option, resources);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).type).toBe(ValidationErrorType.InsufficientResources);
        expect((error as ValidationError).message).toContain('灵石不足');
      }
    });

    it('should reject options with insufficient relationship', () => {
      const option: GameOption = {
        id: 'test',
        text: 'Test',
        description: '',
        timeCost: { months: 1 },
        effects: {},
        requirements: {
          minRelationship: { npcId: 'elder_chen', value: 50 }
        }
      };
      
      const resources = {
        spiritStones: 100,
        relationships: new Map<string, number>([['elder_chen', 30]]),
        items: new Set<string>()
      };
      
      expect(() => InputValidator.validateOptionRequirements(option, resources)).toThrow(ValidationError);
      
      try {
        InputValidator.validateOptionRequirements(option, resources);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).type).toBe(ValidationErrorType.RequirementNotMet);
        expect((error as ValidationError).message).toContain('关系不足');
      }
    });

    it('should reject options with missing required items', () => {
      const option: GameOption = {
        id: 'test',
        text: 'Test',
        description: '',
        timeCost: { months: 1 },
        effects: {},
        requirements: {
          requiredItems: ['sword', 'armor']
        }
      };
      
      const resources = {
        spiritStones: 100,
        relationships: new Map<string, number>(),
        items: new Set<string>(['sword'])
      };
      
      expect(() => InputValidator.validateOptionRequirements(option, resources)).toThrow(ValidationError);
      
      try {
        InputValidator.validateOptionRequirements(option, resources);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).type).toBe(ValidationErrorType.RequirementNotMet);
        expect((error as ValidationError).message).toContain('缺少必需物品');
      }
    });
  });

  describe('validateSaveSlot', () => {
    it('should accept valid save slots', () => {
      expect(() => InputValidator.validateSaveSlot(1)).not.toThrow();
      expect(() => InputValidator.validateSaveSlot(2)).not.toThrow();
      expect(() => InputValidator.validateSaveSlot(3)).not.toThrow();
    });

    it('should reject non-integer slots', () => {
      expect(() => InputValidator.validateSaveSlot(1.5)).toThrow(ValidationError);
      
      try {
        InputValidator.validateSaveSlot(1.5);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe('存档槽位必须为整数');
      }
    });

    it('should reject slots out of range', () => {
      expect(() => InputValidator.validateSaveSlot(0)).toThrow(ValidationError);
      expect(() => InputValidator.validateSaveSlot(4)).toThrow(ValidationError);
      
      try {
        InputValidator.validateSaveSlot(4);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe('存档槽位必须在 1-3 之间');
      }
    });
  });

  describe('validateFontSettings', () => {
    it('should accept valid font settings', () => {
      expect(() => InputValidator.validateFontSettings({ size: 'medium' })).not.toThrow();
      expect(() => InputValidator.validateFontSettings({ family: 'default' })).not.toThrow();
      expect(() => InputValidator.validateFontSettings({ size: 'large', family: 'songti' })).not.toThrow();
    });

    it('should reject invalid font sizes', () => {
      expect(() => InputValidator.validateFontSettings({ size: 'invalid' })).toThrow(ValidationError);
      
      try {
        InputValidator.validateFontSettings({ size: 'invalid' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('无效的字体大小');
      }
    });

    it('should reject invalid font families', () => {
      expect(() => InputValidator.validateFontSettings({ family: 'invalid' })).toThrow(ValidationError);
      
      try {
        InputValidator.validateFontSettings({ family: 'invalid' });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('无效的字体类型');
      }
    });
  });

  describe('validateMessageType', () => {
    const validTypes = ['action', 'save', 'load', 'restart'];

    it('should accept valid message types', () => {
      expect(() => InputValidator.validateMessageType('action', validTypes)).not.toThrow();
      expect(() => InputValidator.validateMessageType('save', validTypes)).not.toThrow();
    });

    it('should reject empty message types', () => {
      expect(() => InputValidator.validateMessageType('', validTypes)).toThrow(ValidationError);
      
      try {
        InputValidator.validateMessageType('', validTypes);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toBe('消息类型不能为空');
      }
    });

    it('should reject invalid message types', () => {
      expect(() => InputValidator.validateMessageType('invalid', validTypes)).toThrow(ValidationError);
      
      try {
        InputValidator.validateMessageType('invalid', validTypes);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('无效的消息类型');
      }
    });
  });
});
