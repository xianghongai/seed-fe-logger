import originalLog from 'loglevel';
import { vi } from 'vitest';
import { LogLevel } from '../src/types';

/**
 * 模拟 loglevel
 */
export const mockLoglevel = () => {
  // 保存原始方法
  const originalMethods = {
    trace: originalLog.trace,
    debug: originalLog.debug,
    log: originalLog.log,
    info: originalLog.info,
    warn: originalLog.warn,
    error: originalLog.error,
    setLevel: originalLog.setLevel,
    getLevel: originalLog.getLevel,
    methodFactory: originalLog.methodFactory,
  };

  // 模拟状态
  let currentLevel = LogLevel.ERROR as unknown as originalLog.LogLevelNumbers; // 默认级别为 ERROR

  // 模拟方法
  originalLog.trace = vi.fn().mockImplementation((...args) => {
    if (currentLevel <= LogLevel.TRACE) console.trace(...args);
  });

  originalLog.debug = vi.fn().mockImplementation((...args) => {
    if (currentLevel <= LogLevel.DEBUG) console.debug(...args);
  });

  // 添加 log 方法 - 在 loglevel 中，log 是映射到 debug 级别的
  originalLog.log = vi.fn().mockImplementation((...args) => {
    if (currentLevel <= LogLevel.DEBUG) console.debug(...args);
  });

  originalLog.info = vi.fn().mockImplementation((...args) => {
    if (currentLevel <= LogLevel.INFO) console.info(...args);
  });

  originalLog.warn = vi.fn().mockImplementation((...args) => {
    if (currentLevel <= LogLevel.WARN) console.warn(...args);
  });

  originalLog.error = vi.fn().mockImplementation((...args) => {
    if (currentLevel <= LogLevel.ERROR) console.error(...args);
  });

  originalLog.setLevel = vi.fn().mockImplementation((level: originalLog.LogLevelNumbers) => {
    currentLevel = level;
  });

  originalLog.getLevel = vi.fn().mockImplementation(() => currentLevel);

  originalLog.methodFactory = vi.fn().mockImplementation((methodName) => {
    // 返回一个函数，该函数会调用对应的 console 方法
    if (methodName === 'trace')
      return (...args) => {
        if (currentLevel <= LogLevel.TRACE) console.trace(...args);
      };
    if (methodName === 'debug')
      return (...args) => {
        if (currentLevel <= LogLevel.DEBUG) console.debug(...args);
      };
    // 添加对 log 方法的支持
    if (methodName === 'log')
      return (...args) => {
        if (currentLevel <= LogLevel.DEBUG) console.debug(...args);
      };
    if (methodName === 'info')
      return (...args) => {
        if (currentLevel <= LogLevel.INFO) console.info(...args);
      };
    if (methodName === 'warn')
      return (...args) => {
        if (currentLevel <= LogLevel.WARN) console.warn(...args);
      };
    if (methodName === 'error')
      return (...args) => {
        if (currentLevel <= LogLevel.ERROR) console.error(...args);
      };
    return vi.fn();
  });

  originalLog.getLogger = vi.fn().mockImplementation((name: string) => {
    const logger = Object.create(originalLog);

    // 每个 logger 实例可以有自己的日志级别
    let loggerLevel = currentLevel;

    logger.trace = vi.fn().mockImplementation((...args) => {
      if (loggerLevel <= LogLevel.TRACE) console.trace(`[${name}]`, ...args);
    });

    logger.debug = vi.fn().mockImplementation((...args) => {
      if (loggerLevel <= LogLevel.DEBUG) console.debug(`[${name}]`, ...args);
    });

    // 添加 log 方法实现 - 映射到 debug
    logger.log = vi.fn().mockImplementation((...args) => {
      if (loggerLevel <= LogLevel.DEBUG) console.debug(`[${name}]`, ...args);
    });

    logger.info = vi.fn().mockImplementation((...args) => {
      if (loggerLevel <= LogLevel.INFO) console.info(`[${name}]`, ...args);
    });

    logger.warn = vi.fn().mockImplementation((...args) => {
      if (loggerLevel <= LogLevel.WARN) console.warn(`[${name}]`, ...args);
    });

    logger.error = vi.fn().mockImplementation((...args) => {
      if (loggerLevel <= LogLevel.ERROR) console.error(`[${name}]`, ...args);
    });

    logger.setLevel = vi.fn().mockImplementation((level: originalLog.LogLevelNumbers) => {
      loggerLevel = level;
    });

    logger.getLevel = vi.fn().mockImplementation(() => loggerLevel);

    // 命名 logger 不需要使用方法工厂
    logger.methodFactory = originalLog.methodFactory;
    return logger;
  });

  return { originalMethods, mockedLog: originalLog };
};

/**
 * 模拟 localStorage
 */
export const mockLocalStorage = () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  return localStorageMock;
};

/**
 * 模拟控制台方法
 */
export const mockConsole = () => {
  const consoleMethods = ['log', 'info', 'warn', 'error', 'debug', 'trace'];
  const mocks = {};

  consoleMethods.forEach((method) => {
    mocks[method] = vi.spyOn(console, method as keyof Console).mockImplementation(() => {});
  });

  // 初始化 mockLoglevel 以确保 loglevel 方法已连接到 console
  mockLoglevel();

  return mocks;
};
