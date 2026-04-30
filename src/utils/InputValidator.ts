/**
 * InputValidator - 输入验证器
 * 提供各种输入验证方法
 * Validates: Requirements 1.5, 20.1, 20.2, 18.4, 18.5
 */

import { ValidationError } from './ValidationError';
import { GameOption } from '../types';

export class InputValidator {
  /**
   * 验证角色名称
   * Validates: Requirements 18.4, 20.1
   */
  static validateCharacterName(name: string): void {
    // 检查是否为空
    if (!name || name.trim().length === 0) {
      throw ValidationError.invalidCharacterName('道号不能为空');
    }

    // 检查长度
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      throw ValidationError.invalidCharacterName('道号至少需要2个字符');
    }

    if (trimmedName.length > 20) {
      throw ValidationError.invalidCharacterName('道号不能超过20个字符');
    }

    // 检查是否包含非法字符
    const invalidChars = /[<>\/\\|:*?"]/;
    if (invalidChars.test(trimmedName)) {
      throw ValidationError.invalidCharacterName('道号包含非法字符');
    }
  }

  /**
   * 验证修行方向ID
   * Validates: Requirements 18.5, 20.1
   */
  static validateCultivationPathId(pathId: string, validPaths: string[]): void {
    if (!pathId || pathId.trim().length === 0) {
      throw ValidationError.invalidCultivationPath('请选择修行方向');
    }

    if (!validPaths.includes(pathId)) {
      throw ValidationError.invalidCultivationPath('无效的修行方向');
    }
  }

  /**
   * 验证选项ID
   * Validates: Requirements 1.5, 20.1
   */
  static validateOptionId(optionId: string, availableOptions: GameOption[]): void {
    if (!optionId || optionId.trim().length === 0) {
      throw ValidationError.invalidOption('请选择一个选项');
    }

    const optionExists = availableOptions.some(opt => opt.id === optionId);
    if (!optionExists) {
      throw ValidationError.invalidOption('无效的选项，请输入有效的选项编号');
    }
  }

  /**
   * 验证选项编号（数字输入）
   * Validates: Requirements 1.5, 20.1
   */
  static validateOptionNumber(input: string, maxNumber: number): number {
    // 检查是否为空
    if (!input || input.trim().length === 0) {
      throw ValidationError.invalidInput('请输入选项编号');
    }

    // 检查是否为数字
    const number = parseInt(input.trim(), 10);
    if (isNaN(number)) {
      throw ValidationError.invalidInput('请输入数字');
    }

    // 检查范围
    if (number < 1 || number > maxNumber) {
      throw ValidationError.invalidInput(`请输入 1-${maxNumber} 之间的数字`);
    }

    return number;
  }

  /**
   * 验证资源数量
   * Validates: Requirements 20.2
   */
  static validateResourceAmount(amount: number, resourceName: string): void {
    if (amount < 0) {
      throw ValidationError.invalidInput(`${resourceName}数量不能为负数`);
    }

    if (!Number.isInteger(amount)) {
      throw ValidationError.invalidInput(`${resourceName}数量必须为整数`);
    }
  }

  /**
   * 验证灵石是否充足
   * Validates: Requirements 20.2
   */
  static validateSpiritStones(required: number, available: number): void {
    if (available < required) {
      throw ValidationError.insufficientResources(
        `灵石不足，需要${required}，当前只有${available}`,
        { required, available, deficit: required - available }
      );
    }
  }

  /**
   * 验证选项需求
   * Validates: Requirements 1.5, 20.2
   */
  static validateOptionRequirements(
    option: GameOption,
    currentResources: {
      spiritStones: number;
      relationships: Map<string, number>;
      items: Set<string>;
    }
  ): void {
    if (!option.requirements) {
      return;
    }

    // 检查资源需求
    if (option.requirements.minResources) {
      if (option.requirements.minResources.spiritStones !== undefined) {
        const required = option.requirements.minResources.spiritStones;
        if (currentResources.spiritStones < required) {
          throw ValidationError.insufficientResources(
            `灵石不足，需要${required}，当前只有${currentResources.spiritStones}`,
            {
              resourceType: 'spiritStones',
              required,
              available: currentResources.spiritStones
            }
          );
        }
      }
    }

    // 检查关系需求
    if (option.requirements.minRelationship) {
      const { npcId, value } = option.requirements.minRelationship;
      const currentRelationship = currentResources.relationships.get(npcId) || 0;
      if (currentRelationship < value) {
        throw ValidationError.requirementNotMet(
          `与${npcId}的关系不足，需要${value}，当前为${currentRelationship}`,
          {
            npcId,
            required: value,
            current: currentRelationship
          }
        );
      }
    }

    // 检查物品需求
    if (option.requirements.requiredItems) {
      for (const itemId of option.requirements.requiredItems) {
        if (!currentResources.items.has(itemId)) {
          throw ValidationError.requirementNotMet(
            `缺少必需物品：${itemId}`,
            { itemId }
          );
        }
      }
    }
  }

  /**
   * 验证存档槽位
   * Validates: Requirements 20.1
   */
  static validateSaveSlot(slotId: number, maxSlots: number = 3): void {
    if (!Number.isInteger(slotId)) {
      throw ValidationError.invalidInput('存档槽位必须为整数');
    }

    if (slotId < 1 || slotId > maxSlots) {
      throw ValidationError.invalidInput(`存档槽位必须在 1-${maxSlots} 之间`);
    }
  }

  /**
   * 验证字体设置
   * Validates: Requirements 23.3, 23.4, 20.1
   */
  static validateFontSettings(settings: {
    size?: string;
    family?: string;
  }): void {
    const validSizes = ['small', 'medium', 'large', 'xlarge'];
    const validFamilies = ['default', 'songti', 'heiti', 'monospace'];

    if (settings.size && !validSizes.includes(settings.size)) {
      throw ValidationError.invalidInput(
        `无效的字体大小，有效值为：${validSizes.join(', ')}`
      );
    }

    if (settings.family && !validFamilies.includes(settings.family)) {
      throw ValidationError.invalidInput(
        `无效的字体类型，有效值为：${validFamilies.join(', ')}`
      );
    }
  }

  /**
   * 安全地解析JSON
   * Validates: Requirements 20.3
   */
  static safeParseJSON<T>(jsonString: string, errorMessage: string = '无效的JSON格式'): T {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw ValidationError.invalidInput(errorMessage, { originalError: error });
    }
  }

  /**
   * 验证消息类型
   * Validates: Requirements 20.6
   */
  static validateMessageType(type: string, validTypes: string[]): void {
    if (!type || type.trim().length === 0) {
      throw ValidationError.invalidInput('消息类型不能为空');
    }

    if (!validTypes.includes(type)) {
      throw ValidationError.invalidInput(
        `无效的消息类型：${type}，有效类型为：${validTypes.join(', ')}`
      );
    }
  }
}
