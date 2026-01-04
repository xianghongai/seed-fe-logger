import originalLog from 'loglevel';
import { DEFAULT_LOCAL_STORAGE_KEY } from './constants';
import { parseLogLevelName, toLogLevelName, toLogLevelNumber } from './level-converter';
import type { InternalLoggerConfig, LoggerConfig, LogLevelName } from './types';

// 初始化默认配置：默认级别按照当前 loglevel 的级别推导
let config: InternalLoggerConfig = {
  defaultLevel: toLogLevelName(originalLog.getLevel()),
  storageKey: DEFAULT_LOCAL_STORAGE_KEY,
  enablePersistence: true,
};

// 当前全局日志级别，默认等于配置中的 defaultLevel
let globalLevel: LogLevelName = config.defaultLevel;

const normalizeLogLevelName = (value: string): LogLevelName => {
  return toLogLevelName(toLogLevelNumber(value));
};

const applyLoglevelGlobalLevel = (level: LogLevelName): void => {
  // 显式禁用 loglevel 自带的持久化能力（避免写入 localStorage['loglevel*'] / cookie）
  const numLevel = toLogLevelNumber(level) as originalLog.LogLevelNumbers;
  originalLog.setLevel(numLevel, false);

  // 同步到所有已创建的具名 logger（loglevel 的 defaultLogger.setLevel 不会自动更新子 logger）
  const loggers = originalLog.getLoggers?.() ?? {};
  for (const logger of Object.values(loggers)) {
    logger.setLevel(numLevel, false);
  }
};

/**
 * 根据当前配置从 localStorage 与默认值中推导全局日志级别
 */
const applyConfig = (): void => {
  let nextLevel: LogLevelName = config.defaultLevel;

  // 只有在启用持久化时才从 localStorage 读取
  if (config.enablePersistence && config.storageKey && typeof localStorage !== 'undefined') {
    try {
      const savedLevel = localStorage.getItem(config.storageKey);
      const parsed = parseLogLevelName(savedLevel);
      if (parsed) {
        nextLevel = parsed;
      }
    } catch (_e) {
      // 忽略本地存储访问错误，退回默认级别
    }
  }

  globalLevel = nextLevel;
  applyLoglevelGlobalLevel(globalLevel);
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
    storageKey: customConfig.storageKey !== undefined ? customConfig.storageKey : config.storageKey,
    enablePersistence: customConfig.enablePersistence ?? config.enablePersistence,
  };

  applyConfig();
};

// 初始化一次全局级别
applyConfig();

// 导出状态访问器（供 create-logger.ts 使用）
export const getLoggerConfig = () => config;
export const getGlobalLevel = () => globalLevel;

export const setGlobalLevel = (level: LogLevelName, persist = true): void => {
  globalLevel = normalizeLogLevelName(level);
  applyLoglevelGlobalLevel(globalLevel);

  if (!persist) return;

  if (config.enablePersistence && config.storageKey && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(config.storageKey, globalLevel);
    } catch (_e) {
      // 忽略本地存储访问错误
    }
  }
};
