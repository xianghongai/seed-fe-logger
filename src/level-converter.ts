import { LogLevel, type LogLevelName } from './types';

/**
 * 将日志级别字符串转换为内部枚举数字
 * @param levelStr 日志级别字符串
 */
export const toLogLevelNumber = (levelStr: string): number => {
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
export const toLogLevelName = (level: number): LogLevelName => {
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
export const parseLogLevelName = (value: string | null): LogLevelName | null => {
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
