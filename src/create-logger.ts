import originalLog from 'loglevel';
import { getConfig, getCurrentLevel, setCurrentLevel } from './config';
import { levelEnumToString, levelStringToEnum } from './level-converter';
import type { Logger, LogLevelDesc } from './types';

/**
 * 创建日志记录器
 * @param name 日志记录器名称，默认为空
 */
export const createLogger = (name = ''): Logger => {
  // 使用 loglevel 创建内部 logger 实例
  const loggerName = name || 'default';
  const internalLogger = name ? originalLog.getLogger(loggerName) : originalLog;

  // 初始化 logger 的日志级别为当前全局级别
  internalLogger.setLevel(levelStringToEnum(getCurrentLevel()) as originalLog.LogLevelNumbers);

  // 如果是具名 logger，设置前缀
  if (name) {
    const originalFactory = internalLogger.methodFactory;
    internalLogger.methodFactory = (methodName, level, loggerName) => {
      const rawMethod = originalFactory(methodName, level, loggerName);
      return (...args) => {
        rawMethod(`[${name}]`, ...args);
      };
    };

    // 应用方法工厂更改
    internalLogger.setLevel(internalLogger.getLevel());
  }

  // 创建符合 Logger 接口的对象
  const logger: Logger = {
    getLevel: (): LogLevelDesc => {
      // 所有 logger 都返回全局级别
      return getCurrentLevel();
    },

    setLevel: (levelStr: LogLevelDesc, persistent = true): void => {
      const numLevel = levelStringToEnum(levelStr);

      // 更新全局级别
      setCurrentLevel(levelStr);

      // 同步到 loglevel（会自动同步所有子 logger）
      originalLog.setLevel(numLevel as originalLog.LogLevelNumbers);

      // 持久化到 localStorage
      const config = getConfig();
      if (persistent && config.enablePersistence && config.storageKey && typeof localStorage !== 'undefined') {
        try {
          // 规范化为大写字符串
          localStorage.setItem(config.storageKey, levelEnumToString(numLevel));
        } catch (_e) {
          // 忽略本地存储访问错误
        }
      }
    },

    getLogger: (subName: string): Logger => {
      const fullName = name ? `${name}:${subName}` : subName;
      return createLogger(fullName);
    },

    trace: (...args: unknown[]): void => {
      internalLogger.trace(...args);
    },

    debug: (...args: unknown[]): void => {
      internalLogger.debug(...args);
    },

    log: (...args: unknown[]): void => {
      // log 方法映射到 loglevel 的 log 方法 (loglevel 内部会将其映射到 debug 级别)
      internalLogger.log(...args);
    },

    info: (...args: unknown[]): void => {
      internalLogger.info(...args);
    },

    warn: (...args: unknown[]): void => {
      internalLogger.warn(...args);
    },

    error: (...args: unknown[]): void => {
      internalLogger.error(...args);
    },
  };

  return logger;
};
