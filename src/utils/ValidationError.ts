/**
 * ValidationError - 验证错误类
 * 用于表示输入验证失败的错误
 * Validates: Requirements 1.5, 20.1, 20.2
 */

export enum ValidationErrorType {
  InvalidInput = 'invalid_input',
  InsufficientResources = 'insufficient_resources',
  RequirementNotMet = 'requirement_not_met',
  InvalidOption = 'invalid_option',
  InvalidCharacterName = 'invalid_character_name',
  InvalidCultivationPath = 'invalid_cultivation_path'
}

export class ValidationError extends Error {
  public readonly type: ValidationErrorType;
  public readonly details?: any;

  constructor(type: ValidationErrorType, message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.type = type;
    this.details = details;
  }

  /**
   * 创建无效输入错误
   */
  static invalidInput(message: string, details?: any): ValidationError {
    return new ValidationError(ValidationErrorType.InvalidInput, message, details);
  }

  /**
   * 创建资源不足错误
   */
  static insufficientResources(message: string, details?: any): ValidationError {
    return new ValidationError(ValidationErrorType.InsufficientResources, message, details);
  }

  /**
   * 创建需求未满足错误
   */
  static requirementNotMet(message: string, details?: any): ValidationError {
    return new ValidationError(ValidationErrorType.RequirementNotMet, message, details);
  }

  /**
   * 创建无效选项错误
   */
  static invalidOption(message: string, details?: any): ValidationError {
    return new ValidationError(ValidationErrorType.InvalidOption, message, details);
  }

  /**
   * 创建无效角色名错误
   */
  static invalidCharacterName(message: string, details?: any): ValidationError {
    return new ValidationError(ValidationErrorType.InvalidCharacterName, message, details);
  }

  /**
   * 创建无效修行方向错误
   */
  static invalidCultivationPath(message: string, details?: any): ValidationError {
    return new ValidationError(ValidationErrorType.InvalidCultivationPath, message, details);
  }

  /**
   * 转换为用户友好的消息
   */
  toUserMessage(): string {
    return this.message;
  }

  /**
   * 转换为JSON格式
   */
  toJSON(): {
    type: ValidationErrorType;
    message: string;
    details?: any;
  } {
    return {
      type: this.type,
      message: this.message,
      details: this.details
    };
  }
}
