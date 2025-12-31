import log from 'loglevel';

// 导出 loglevel 的日志级别
export const LogLevel = log.levels;

// 明确定义所有可用的日志级别字符串，使用大写形式与 loglevel 区分
export type LogLevelDesc = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SILENT';

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
   * 是否允许持久化日志级别到 localStorage
   * 为 false 时，即便调用 setLevel(level, true) 也不会写入 localStorage
   * 默认为 true
   */
  enablePersistence?: boolean;
}

/**
 * 内部日志配置（所有字段必填）
 */
export interface InternalLoggerConfig {
  defaultLevel: LogLevelDesc;
  storageKey: string | null;
  enablePersistence: boolean;
}

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
   *
   * 所有 logger（默认 + 具名）共享全局日志级别。
   * 任何 logger 调用 setLevel 都会影响全局级别并同步所有 logger 实例。
   *
   * @param level 日志级别：'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SILENT'
   * @param persistent 是否持久化设置到 localStorage（默认 true）
   *
   * @example
   * // 设置全局级别并持久化（默认行为）
   * logger.setLevel('ERROR')
   *
   * // 设置全局级别但不持久化
   * logger.setLevel('DEBUG', false)
   *
   * // 具名 logger 也会修改全局级别
   * const authLogger = logger.getLogger('auth')
   * authLogger.setLevel('TRACE')  // 影响所有 logger
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
