import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import logger, { configureLogger, type LogLevelName } from '../src';
import { mockLocalStorage } from './helpers';

describe('Logger 模块测试', () => {
  let consoleSpies: Record<string, ReturnType<typeof vi.spyOn>>;

  beforeEach(() => {
    mockLocalStorage();

    consoleSpies = {
      trace: vi.spyOn(console, 'trace').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };

    configureLogger({
      defaultLevel: 'ERROR',
      storageKey: '@seed-fe/logger:level',
      enablePersistence: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ERROR 级别下只输出 error', () => {
    logger.setLevel('ERROR', false);

    logger.warn('warn');
    logger.error('error');

    expect(consoleSpies.warn).not.toHaveBeenCalled();
    expect(consoleSpies.error).toHaveBeenCalledWith('error');
  });

  describe('日志级别持久化', () => {
    it('setLevel 默认等同于传 true（会写入 storageKey）', () => {
      logger.setLevel('DEBUG');
      expect(localStorage.setItem).toHaveBeenCalledWith('@seed-fe/logger:level', 'DEBUG');
    });

    it('当 persistent=false 时不应该将日志级别保存到 localStorage', () => {
      logger.setLevel('DEBUG', false);
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('不会触发 loglevel 内置持久化（避免写入 localStorage["loglevel*"]）', () => {
      const authLogger = logger.getLogger('auth');

      logger.setLevel('TRACE');
      authLogger.info('hello');

      expect((localStorage as unknown as Record<string, unknown>).loglevel).toBeUndefined();
      expect((localStorage as unknown as Record<string, unknown>)['loglevel:auth']).toBeUndefined();
    });
  });

  describe('具名 Logger', () => {
    it('应该正确创建具名 Logger', () => {
      const featureLogger = logger.getLogger('feature');
      expect(featureLogger).toBeDefined();
      expect(typeof featureLogger.log).toBe('function');
    });

    it('具名 logger 输出应带前缀，且与全局级别同步过滤', () => {
      const authLogger = logger.getLogger('auth');

      logger.setLevel('SILENT', false);
      authLogger.error('boom');
      expect(consoleSpies.error).not.toHaveBeenCalled();

      logger.setLevel('ERROR', false);
      authLogger.error('boom');
      expect(consoleSpies.error).toHaveBeenCalledWith('[auth]', 'boom');
    });
  });

  describe('配置功能', () => {
    it('configureLogger 应该可以更新默认日志级别', () => {
      const targetLevel: LogLevelName = 'INFO';

      configureLogger({ defaultLevel: targetLevel });
      expect(logger.getLevel()).toBe(targetLevel);
    });

    it('enablePersistence=false 时不读也不写 localStorage', () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockClear();
      (localStorage.setItem as ReturnType<typeof vi.fn>).mockClear();
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('TRACE');

      configureLogger({
        defaultLevel: 'ERROR',
        enablePersistence: false,
      });

      expect(localStorage.getItem).not.toHaveBeenCalled();
      expect(logger.getLevel()).toBe('ERROR');

      logger.setLevel('DEBUG');
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('storageKey=null 时不读也不写 localStorage', () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockClear();
      (localStorage.setItem as ReturnType<typeof vi.fn>).mockClear();
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('TRACE');

      configureLogger({
        defaultLevel: 'ERROR',
        storageKey: null,
      });

      expect(localStorage.getItem).not.toHaveBeenCalled();
      expect(logger.getLevel()).toBe('ERROR');

      logger.setLevel('DEBUG');
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
