import { createLogger } from './create-logger';
import type { Logger } from './types';

// 导出默认的日志记录器实例
const logger = createLogger();

export default logger;

export { configureLogger } from './config';
export { createLogger } from './create-logger';
// 导出类型和工具函数，方便使用者扩展
export { Logger, LoggerConfig, LogLevel, LogLevelName } from './types';

// 在浏览器环境中自动暴露到全局，方便 DevTools Console 调试
if (typeof window !== 'undefined') {
  window.__SEED_FE_LOGGER__ = logger;
}

// 声明全局类型（方便 TypeScript 用户）
declare global {
  interface Window {
    __SEED_FE_LOGGER__?: Logger;
  }
}
