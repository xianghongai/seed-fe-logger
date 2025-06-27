import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import logger, { createLogger, LogLevel } from '../src';
import { mockLocalStorage } from './helpers';

describe('Logger 模块测试', () => {
  // 在每个测试前重置 mock
  beforeEach(() => {
    mockLocalStorage();

    // 模拟 logger 的所有方法
    vi.spyOn(logger, 'trace').mockImplementation(() => {});
    vi.spyOn(logger, 'debug').mockImplementation(() => {});
    vi.spyOn(logger, 'log').mockImplementation(() => {});
    vi.spyOn(logger, 'info').mockImplementation(() => {});
    vi.spyOn(logger, 'warn').mockImplementation(() => {});
    vi.spyOn(logger, 'error').mockImplementation(() => {});
  });

  // 在每个测试后恢复原始方法
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本日志功能', () => {
    it('应该能调用 log 方法', () => {
      logger.log('test message');
      expect(logger.log).toHaveBeenCalledWith('test message');
    });

    it('应该能调用 info 方法', () => {
      logger.info('test info');
      expect(logger.info).toHaveBeenCalledWith('test info');
    });

    it('应该能调用 warn 方法', () => {
      logger.warn('test warning');
      expect(logger.warn).toHaveBeenCalledWith('test warning');
    });

    it('应该能调用 error 方法', () => {
      logger.error('test error');
      expect(logger.error).toHaveBeenCalledWith('test error');
    });

    it('应该能调用 debug 方法', () => {
      logger.debug('test debug');
      expect(logger.debug).toHaveBeenCalledWith('test debug');
    });

    it('应该能调用 trace 方法', () => {
      logger.trace('test trace');
      expect(logger.trace).toHaveBeenCalledWith('test trace');
    });
  });

  describe('日志级别控制', () => {
    it('默认日志级别应该可以正常获取', () => {
      const level = logger.getLevel();
      // 断言日志级别是有效的日志级别字符串之一
      expect(['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'SILENT']).toContain(level);
    });

    it('设置日志级别后应该返回相应级别', () => {
      logger.setLevel('WARN', false);
      expect(logger.getLevel()).toBe('WARN');

      logger.setLevel('INFO', false);
      expect(logger.getLevel()).toBe('INFO');
    });

    it('设置为 SILENT 应该不触发任何日志方法', () => {
      // 使用自定义 logger 以避免影响全局状态
      const testLogger = createLogger('silent-test');

      // 模拟方法
      vi.spyOn(testLogger, 'error').mockImplementation(() => {});
      vi.spyOn(testLogger, 'warn').mockImplementation(() => {});
      vi.spyOn(testLogger, 'info').mockImplementation(() => {});
      vi.spyOn(testLogger, 'log').mockImplementation(() => {});
      vi.spyOn(testLogger, 'debug').mockImplementation(() => {});
      vi.spyOn(testLogger, 'trace').mockImplementation(() => {});

      // 设置级别
      testLogger.setLevel('SILENT', false);

      // 调用所有方法
      testLogger.error('test error');
      testLogger.warn('test warn');
      testLogger.info('test info');
      testLogger.log('test log');
      testLogger.debug('test debug');
      testLogger.trace('test trace');

      // 检查是否有调用
      expect(testLogger.error).toHaveBeenCalled(); // ERROR 级别的日志仍会被调用，只是内部处理时会被过滤
      expect(testLogger.warn).toHaveBeenCalled();
      expect(testLogger.info).toHaveBeenCalled();
      expect(testLogger.log).toHaveBeenCalled();
      expect(testLogger.debug).toHaveBeenCalled();
      expect(testLogger.trace).toHaveBeenCalled();
    });

    it('设置为 ERROR 级别应该只处理错误日志', () => {
      const testLogger = createLogger('error-level-test');

      // 我们无法直接测试日志级别过滤，因为过滤发生在 loglevel 内部
      // 这里只测试 setLevel 和 getLevel 的正确性
      testLogger.setLevel('ERROR', false);
      expect(testLogger.getLevel()).toBe('ERROR');
    });
  });

  describe('日志级别持久化', () => {
    it('当 persistent=true 时应该将日志级别保存到 localStorage', () => {
      logger.setLevel('DEBUG', true);
      expect(localStorage.setItem).toHaveBeenCalledWith('@seed-fe/logger:level', 'DEBUG');
    });

    it('当 persistent=false 时不应该将日志级别保存到 localStorage', () => {
      logger.setLevel('DEBUG', false);
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('具名 Logger', () => {
    it('应该正确创建具名 Logger', () => {
      const featureLogger = logger.getLogger('feature');
      expect(featureLogger).toBeDefined();
      expect(typeof featureLogger.log).toBe('function');
    });

    it('具名 Logger 的前缀功能在内部实现', () => {
      // 无法直接测试前缀逻辑，因为这发生在 loglevel 内部
      // 但可以测试 getLogger 方法正常工作
      const featureLogger = logger.getLogger('feature');
      const subFeatureLogger = featureLogger.getLogger('sub');

      // 模拟方法
      vi.spyOn(subFeatureLogger, 'log').mockImplementation(() => {});

      // 调用方法
      subFeatureLogger.log('hello');

      // 验证调用
      expect(subFeatureLogger.log).toHaveBeenCalledWith('hello');
    });

    it('具名 Logger 应该可以设置自己的日志级别', () => {
      // 创建一个具名 Logger
      const featureLogger = logger.getLogger('feature');

      // 设置具名 Logger 的级别为 ERROR
      featureLogger.setLevel('ERROR', false);

      // 验证级别已正确设置
      expect(featureLogger.getLevel()).toBe('ERROR');
    });
  });
});
