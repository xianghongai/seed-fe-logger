import originalLog from 'loglevel';
import { getGlobalLevel, setGlobalLevel } from './config';
import { toLogLevelNumber } from './level-converter';
import type { Logger, LogLevelName } from './types';

const prefixedInternalLoggers = new WeakSet<object>();

/**
 * 创建日志记录器
 * @param name 日志记录器名称，默认为空
 */
export const createLogger = (name = ''): Logger => {
  // 使用 loglevel 创建内部 logger 实例
  const loggerName = name || 'default';
  const internalLogger = name ? originalLog.getLogger(loggerName) : originalLog;

  // 初始化 logger 的日志级别为当前全局级别
  // 禁用 loglevel 的内置持久化（传 false），由自己的逻辑控制
  internalLogger.setLevel(toLogLevelNumber(getGlobalLevel()) as originalLog.LogLevelNumbers, false);

  // 如果是具名 logger，设置前缀
  if (name && !prefixedInternalLoggers.has(internalLogger as unknown as object)) {
    const originalFactory = internalLogger.methodFactory;
    internalLogger.methodFactory = (methodName, level, loggerName) => {
      const rawMethod = originalFactory(methodName, level, loggerName);
      return (...args) => {
        rawMethod(`[${name}]`, ...args);
      };
    };

    // 应用方法工厂更改（不会改变 level，也不会触发持久化）
    internalLogger.rebuild();
    prefixedInternalLoggers.add(internalLogger as unknown as object);
  }

  // 创建符合 Logger 接口的对象
  const logger: Logger = {
    getLevel: (): LogLevelName => {
      // 所有 logger 都返回全局级别
      return getGlobalLevel();
    },

    setLevel: (levelStr: LogLevelName, persistent = true): void => {
      setGlobalLevel(levelStr, persistent);
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
