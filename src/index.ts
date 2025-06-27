import originalLog from 'loglevel';
import { type Logger, LogLevel, type LogLevelDesc } from './types';

const LOCAL_STORAGE_KEY = '@seed-fe/logger:level';

/**
 * 将日志级别字符串转换为数字
 * @param levelStr 日志级别字符串
 */
const levelStringToEnum = (levelStr: string): number => {
  const normalizedLevel = levelStr.toUpperCase();
  switch (normalizedLevel) {
    case 'TRACE':
      return LogLevel.TRACE;
    case 'DEBUG':
      return LogLevel.DEBUG;
    case 'INFO':
      return LogLevel.INFO;
    case 'WARN':
      return LogLevel.WARN;
    case 'ERROR':
      return LogLevel.ERROR;
    case 'SILENT':
      return LogLevel.SILENT;
    default:
      return LogLevel.ERROR;
  }
};

/**
 * 将日志级别数字转换为字符串
 * @param level 日志级别数字
 */
const levelEnumToString = (level: number): LogLevelDesc => {
  switch (level) {
    case LogLevel.TRACE:
      return 'TRACE';
    case LogLevel.DEBUG:
      return 'DEBUG';
    case LogLevel.INFO:
      return 'INFO';
    case LogLevel.WARN:
      return 'WARN';
    case LogLevel.ERROR:
      return 'ERROR';
    case LogLevel.SILENT:
      return 'SILENT';
    default:
      return 'ERROR';
  }
};

/**
 * 创建日志记录器
 * @param name 日志记录器名称，默认为空
 */
const createLogger = (name = ''): Logger => {
  // 使用 loglevel 创建内部 logger 实例
  const loggerName = name || 'default';
  const internalLogger = name ? originalLog.getLogger(loggerName) : originalLog;

  // 尝试从 localStorage 获取持久化的日志级别设置
  if (typeof localStorage !== 'undefined') {
    try {
      const savedLevel = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedLevel) {
        internalLogger.setLevel(levelStringToEnum(savedLevel) as originalLog.LogLevelNumbers);
      }
    } catch (_e) {
      // 忽略本地存储访问错误
    }
  }

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
      return levelEnumToString(internalLogger.getLevel());
    },

    setLevel: (levelStr: LogLevelDesc, persistent = false): void => {
      const numLevel = levelStringToEnum(levelStr);
      internalLogger.setLevel(numLevel as originalLog.LogLevelNumbers);

      if (persistent && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, levelStr);
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

// 导出默认的日志记录器实例
const logger = createLogger();

export default logger;

// 导出类型和工具函数，方便使用者扩展
export { Logger, LogLevel, LogLevelDesc } from './types';
export { createLogger };
