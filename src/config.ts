import originalLog from 'loglevel';
import { DEFAULT_LOCAL_STORAGE_KEY } from './constants';
import { levelEnumToString, levelStringToEnum, parseLevelFromString } from './level-converter';
import type { InternalLoggerConfig, LoggerConfig, LogLevelDesc } from './types';

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
    storageKey: customConfig.storageKey !== undefined ? customConfig.storageKey : config.storageKey,
    enablePersistence: customConfig.enablePersistence ?? config.enablePersistence,
  };

  applyConfig();
};

// 初始化一次全局级别
applyConfig();

// 导出状态访问器（供 create-logger.ts 使用）
export const getConfig = () => config;
export const getCurrentLevel = () => currentLevel;
export const setCurrentLevel = (level: LogLevelDesc) => {
  currentLevel = level;
};
