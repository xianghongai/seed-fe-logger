import log from 'loglevel';

// 导出 loglevel 的日志级别
export const LogLevel = log.levels;

// 明确定义所有可用的日志级别字符串，使用大写形式与 loglevel 区分
export type LogLevelDesc = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SILENT';

/**
 * 日志记录器接口
 */
export interface Logger {
  /**
   * 获取当前日志级别
   */
  getLevel: () => LogLevelDesc;

  /**
   * 设置日志级别
   * @param level 日志级别：'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SILENT'
   * @param persistent 是否持久化设置
   */
  setLevel: (level: LogLevelDesc, persistent?: boolean) => void;

  /**
   * 获取具名日志记录器
   * @param name 日志记录器名称
   */
  getLogger: (name: string) => Logger;

  /**
   * 输出追踪级别日志
   * @param args 日志内容
   */
  trace: (...args: unknown[]) => void;

  /**
   * 输出调试级别日志
   * @param args 日志内容
   */
  debug: (...args: unknown[]) => void;

  /**
   * 输出日志
   * @param args 日志内容
   */
  log: (...args: unknown[]) => void;

  /**
   * 输出信息级别日志
   * @param args 日志内容
   */
  info: (...args: unknown[]) => void;

  /**
   * 输出警告级别日志
   * @param args 日志内容
   */
  warn: (...args: unknown[]) => void;

  /**
   * 输出错误级别日志
   * @param args 日志内容
   */
  error: (...args: unknown[]) => void;
}
