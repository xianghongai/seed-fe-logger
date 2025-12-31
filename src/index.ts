import originalLog from 'loglevel';
import { type Logger, LogLevel, type LogLevelDesc } from './types';

const DEFAULT_LOCAL_STORAGE_KEY = '@seed-fe/logger:level';

/**
 * 日志配置
 */
export interface LoggerConfig {
  /**
   * localStorage 中没有值或值非法时使用的默认日志级别
   */
  defaultLevel?: LogLevelDesc;

  /**
   * 持久化日志级别时使用的 localStorage key
   * 传入 null 可以关闭基于 localStorage 的持久化与魔法值能力
   */
  storageKey?: string | null;

  /**
   * 是否允许通过 setLevel(level, true) 持久化日志级别
   */
  enablePersistence?: boolean;
}

interface InternalLoggerConfig {
  defaultLevel: LogLevelDesc;
  storageKey: string | null;
  enablePersistence: boolean;
}

/**
 * 将日志级别字符串转换为内部枚举数字
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
 * 从字符串安全解析日志级别
 * 非法输入返回 null，不会覆盖现有级别
 */
const parseLevelFromString = (value: string | null): LogLevelDesc | null => {
  if (!value) return null;
  const upper = value.toUpperCase();
  switch (upper) {
    case 'TRACE':
    case 'DEBUG':
    case 'INFO':
    case 'WARN':
    case 'ERROR':
    case 'SILENT':
      return upper;
    default:
      return null;
  }
};

// 初始化默认配置：默认级别按照当前 loglevel 的级别推导
let config: InternalLoggerConfig = {
  defaultLevel: levelEnumToString(originalLog.getLevel()),
  storageKey: DEFAULT_LOCAL_STORAGE_KEY,
  enablePersistence: true,
};

// 当前全局日志级别，默认等于配置中的 defaultLevel
let currentLevel: LogLevelDesc = config.defaultLevel;

/**
 * 根据当前配置从 localStorage 与默认值中推导全局日志级别
 */
const applyConfig = (): void => {
  let nextLevel: LogLevelDesc = config.defaultLevel;

  // 只有在启用持久化时才从 localStorage 读取
  if (config.enablePersistence && config.storageKey && typeof localStorage !== 'undefined') {
    try {
      const savedLevel = localStorage.getItem(config.storageKey);
      const parsed = parseLevelFromString(savedLevel);
      if (parsed) {
        nextLevel = parsed;
      }
    } catch (_e) {
      // 忽略本地存储访问错误，退回默认级别
    }
  }

  currentLevel = nextLevel;
  // 同步到默认 loglevel 实例
  originalLog.setLevel(levelStringToEnum(currentLevel) as originalLog.LogLevelNumbers);
};

/**
 * 配置全局 Logger 行为
 * 典型用法：在应用启动时根据系统配置或运行环境调用一次
 */
export const configureLogger = (customConfig: LoggerConfig): void => {
  config = {
    ...config,
    // 只在用户传入时覆盖对应字段
    defaultLevel: customConfig.defaultLevel ?? config.defaultLevel,
    storageKey:
      customConfig.storageKey !== undefined
        ? customConfig.storageKey
        : config.storageKey,
    enablePersistence:
      customConfig.enablePersistence ?? config.enablePersistence,
  };

  applyConfig();
};

// 初始化一次全局级别
applyConfig();

/**
 * 创建日志记录器
 * @param name 日志记录器名称，默认为空
 */
const createLogger = (name = ''): Logger => {
  // 使用 loglevel 创建内部 logger 实例
  const loggerName = name || 'default';
  const internalLogger = name ? originalLog.getLogger(loggerName) : originalLog;

  // 初始化 logger 的日志级别为当前全局级别
  internalLogger.setLevel(levelStringToEnum(currentLevel) as originalLog.LogLevelNumbers);

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
      return currentLevel;
    },

    setLevel: (levelStr: LogLevelDesc, persistent = true): void => {
      const numLevel = levelStringToEnum(levelStr);

      // 更新全局级别
      currentLevel = levelStr;

      // 同步到 loglevel（会自动同步所有子 logger）
      originalLog.setLevel(numLevel as originalLog.LogLevelNumbers);

      // 持久化到 localStorage
      if (
        persistent &&
        config.enablePersistence &&
        config.storageKey &&
        typeof localStorage !== 'undefined'
      ) {
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

// 导出默认的日志记录器实例
const logger = createLogger();

export default logger;

// 导出类型和工具函数，方便使用者扩展
export { Logger, LogLevel, LogLevelDesc } from './types';
export { createLogger };

// 在浏览器环境中自动暴露到全局，方便 DevTools Console 调试
if (typeof window !== 'undefined') {
  (window as any).__SEED_FE_LOGGER__ = logger;
}

// 声明全局类型（方便 TypeScript 用户）
declare global {
  interface Window {
    __SEED_FE_LOGGER__?: Logger;
  }
}
