/**
 * ErrorHandler - 错误处理器
 * 提供统一的错误处理和用户友好的错误消息
 * Validates: Requirements 20.3, 20.4, 20.5, 20.6
 */

/**
 * 错误类型枚举
 */
export enum ErrorType {
  ConfigLoad = 'CONFIG_LOAD',
  ConfigValidation = 'CONFIG_VALIDATION',
  SaveLoad = 'SAVE_LOAD',
  SaveWrite = 'SAVE_WRITE',
  Communication = 'COMMUNICATION',
  GameLogic = 'GAME_LOGIC',
  Unknown = 'UNKNOWN'
}

/**
 * 游戏错误基类
 */
export class GameError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'GameError';
  }
}

/**
 * 配置加载错误
 */
export class ConfigLoadError extends GameError {
  constructor(message: string, originalError?: Error) {
    super(ErrorType.ConfigLoad, message, originalError);
    this.name = 'ConfigLoadError';
  }
}

/**
 * 配置验证错误
 */
export class ConfigValidationError extends GameError {
  constructor(
    message: string,
    public validationErrors: string[],
    originalError?: Error
  ) {
    super(ErrorType.ConfigValidation, message, originalError);
    this.name = 'ConfigValidationError';
  }
}

/**
 * 存档加载错误
 */
export class SaveLoadError extends GameError {
  constructor(message: string, originalError?: Error) {
    super(ErrorType.SaveLoad, message, originalError);
    this.name = 'SaveLoadError';
  }
}

/**
 * 存档写入错误
 */
export class SaveWriteError extends GameError {
  constructor(message: string, originalError?: Error) {
    super(ErrorType.SaveWrite, message, originalError);
    this.name = 'SaveWriteError';
  }
}

/**
 * 通信错误
 */
export class CommunicationError extends GameError {
  constructor(message: string, originalError?: Error) {
    super(ErrorType.Communication, message, originalError);
    this.name = 'CommunicationError';
  }
}

/**
 * 错误处理器
 * Validates: Requirements 20.3, 20.4, 20.5, 20.6
 */
export class ErrorHandler {
  /**
   * 获取用户友好的错误消息
   * Validates: Requirements 20.3, 20.4, 20.5
   */
  static getUserFriendlyMessage(error: Error): string {
    if (error instanceof ConfigLoadError) {
      return `配置文件加载失败：${error.message}。请检查游戏安装是否完整。`;
    }

    if (error instanceof ConfigValidationError) {
      return `配置文件格式错误：${error.message}。请联系开发者或重新安装游戏。`;
    }

    if (error instanceof SaveLoadError) {
      return `存档加载失败：${error.message}。存档可能已损坏，请尝试其他存档槽位。`;
    }

    if (error instanceof SaveWriteError) {
      return `存档保存失败：${error.message}。请检查磁盘空间是否充足。`;
    }

    if (error instanceof CommunicationError) {
      return `通信错误：${error.message}。请尝试重新加载游戏界面。`;
    }

    if (error instanceof GameError) {
      return `游戏错误：${error.message}`;
    }

    // 未知错误
    return `发生未知错误：${error.message}。请尝试重新启动游戏。`;
  }

  /**
   * 记录错误到控制台
   * Validates: Requirements 20.6
   */
  static logError(error: Error, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${context}]` : '';
    
    console.error(`[${timestamp}]${contextStr} Error:`, error);
    
    if (error instanceof GameError && error.originalError) {
      console.error('Original error:', error.originalError);
    }
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }

  /**
   * 处理配置加载错误
   * Validates: Requirements 20.3
   */
  static handleConfigError(error: Error, configType: string): never {
    this.logError(error, `ConfigLoader:${configType}`);
    
    if (error instanceof SyntaxError) {
      throw new ConfigLoadError(
        `配置文件 ${configType} 格式错误，JSON 解析失败`,
        error
      );
    }

    if (error.message.includes('not found') || error.message.includes('ENOENT')) {
      throw new ConfigLoadError(
        `配置文件 ${configType} 不存在`,
        error
      );
    }

    throw new ConfigLoadError(
      `无法加载配置文件 ${configType}`,
      error
    );
  }

  /**
   * 处理存档错误
   * Validates: Requirements 20.4
   */
  static handleSaveError(error: Error, operation: 'load' | 'save', slotId: number): never {
    this.logError(error, `SaveSystem:${operation}:slot${slotId}`);
    
    if (operation === 'load') {
      if (error.message.includes('Incompatible')) {
        throw new SaveLoadError(
          `存档槽位 ${slotId} 版本不兼容，无法加载`,
          error
        );
      }

      if (error.message.includes('Invalid')) {
        throw new SaveLoadError(
          `存档槽位 ${slotId} 数据损坏`,
          error
        );
      }

      throw new SaveLoadError(
        `无法加载存档槽位 ${slotId}`,
        error
      );
    } else {
      throw new SaveWriteError(
        `无法保存到存档槽位 ${slotId}`,
        error
      );
    }
  }

  /**
   * 处理通信错误
   * Validates: Requirements 20.6
   */
  static handleCommunicationError(error: Error, messageType: string): never {
    this.logError(error, `MessageBridge:${messageType}`);
    
    throw new CommunicationError(
      `消息通信失败 (类型: ${messageType})`,
      error
    );
  }

  /**
   * 安全执行函数，捕获并处理错误
   * Validates: Requirements 20.6
   */
  static async safeExecute<T>(
    fn: () => Promise<T>,
    context: string,
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await fn();
    } catch (error) {
      this.logError(error as Error, context);
      return fallback;
    }
  }

  /**
   * 安全执行同步函数，捕获并处理错误
   * Validates: Requirements 20.6
   */
  static safeExecuteSync<T>(
    fn: () => T,
    context: string,
    fallback?: T
  ): T | undefined {
    try {
      return fn();
    } catch (error) {
      this.logError(error as Error, context);
      return fallback;
    }
  }

  /**
   * 包装异步函数，自动处理错误
   * Validates: Requirements 20.6
   */
  static wrapAsync<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context: string
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error) {
        this.logError(error as Error, context);
        throw error;
      }
    };
  }

  /**
   * 包装同步函数，自动处理错误
   * Validates: Requirements 20.6
   */
  static wrapSync<T extends any[], R>(
    fn: (...args: T) => R,
    context: string
  ): (...args: T) => R {
    return (...args: T): R => {
      try {
        return fn(...args);
      } catch (error) {
        this.logError(error as Error, context);
        throw error;
      }
    };
  }

  /**
   * 验证并抛出错误
   */
  static assert(condition: boolean, message: string, errorType: ErrorType = ErrorType.GameLogic): void {
    if (!condition) {
      throw new GameError(errorType, message);
    }
  }

  /**
   * 创建错误恢复策略
   * Validates: Requirements 20.6
   */
  static createRecoveryStrategy<T>(
    attempts: number,
    delay: number = 1000
  ): (fn: () => Promise<T>) => Promise<T> {
    return async (fn: () => Promise<T>): Promise<T> => {
      let lastError: Error | undefined;
      
      for (let i = 0; i < attempts; i++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error as Error;
          this.logError(lastError, `Retry attempt ${i + 1}/${attempts}`);
          
          if (i < attempts - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      throw lastError;
    };
  }
}
