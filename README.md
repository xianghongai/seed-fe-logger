# @seed-fe/logger

## 安装

```bash
# npm
npm install @seed-fe/logger

# yarn
yarn add @seed-fe/logger

# pnpm (推荐)
pnpm add @seed-fe/logger
```

## 简介

提供分级日志输出能力，可以在项目中自行决定在什么环境输出什么级别的日志。

日志级别从低到高如下：

* `trace`
* `debug/log`
* `info`
* `warn`
* `error`

## `trace()/debug()/log()/info()/warn()/error()`

* 接口：`(...args: unknown[]) => void`
* 参数：`args`: 需要输出的内容
* 返回：无
* 用法：同 `console.trace/debug/log/info/warn/error`，例如 `logger.log('hello')` 将输出 `hello`

## `getLevel()`

获取当前日志输出等级；

* 接口：`() => LogLevelDesc`
* 参数：无
* 返回：当前日志级别 `'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SILENT'` 中的一个
* 用法：`const currentLevel = logger.getLevel()`

## `setLevel()`

设置当前日志输出等级，一般用于生产环境临时开启日志输出；

* 接口：`(level: LogLevelDesc, persistent?: boolean) => void`
* 参数：
  * `level`: 日志级别 `'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SILENT'` 中的一个，`SILENT` 不输出任何日志
  * `persistent`: 是否持久化，默认为 `true`。如果为 `true`，则日志级别会持久化到本地存储中，下次打开页面时会自动恢复，传 `false` 则只在本次会话生效
* 返回：无
* **重要**：所有 logger（包括默认 logger 和具名 logger）共享全局日志级别，任何 logger 调用 setLevel 都会影响全局
* 用法：

  ```typescript
  import logger, { LogLevelDesc } from '@seed-fe/logger';

  // 默认持久化
  logger.setLevel('DEBUG');

  // 显式持久化
  logger.setLevel('DEBUG', true);

  // 不持久化（仅本次会话）
  logger.setLevel('DEBUG', false);
  ```

## `getLogger`

获取一个新的具名 Logger，所有具名 Logger 的输出前面都会带上该 Logger 的名称，一般用于区分不同模块的日志输出；

* 接口：`(name: string) => Logger`
* 参数：`name`: 具名 Logger 的名称
* 返回：新的 Logger 对象
* 用法：`const featureLogger = logger.getLogger('feature')`，例如 `featureLogger.log('hello')` 将输出 `[feature] hello`

**重要**：所有 logger（包括默认 logger 和具名 logger）共享全局日志级别。具名 logger 只是在输出时添加前缀以区分模块，日志级别控制是全局统一的。

## 不同环境下的日志级别

```typescript
import logger from '@seed-fe/logger';

if (isDevelopment) {
  logger.setLevel('TRACE');
} else {
  logger.setLevel('ERROR');
}
```

## 在 Chrome DevTools Console 中调试

本库在浏览器环境中会自动暴露 `__SEED_FE_LOGGER__` 全局变量，你可以在 Chrome DevTools Console 中直接使用：

```js
// 打开 Chrome DevTools Console (F12)

// 查看当前日志级别
__SEED_FE_LOGGER__.getLevel()

// 临时开启所有日志（不持久化，刷新后恢复）
__SEED_FE_LOGGER__.setLevel('TRACE', false)

// 开启所有日志并持久化（刷新后仍生效）
__SEED_FE_LOGGER__.setLevel('TRACE', true)

// 只看错误日志
__SEED_FE_LOGGER__.setLevel('ERROR')

// 关闭所有日志
__SEED_FE_LOGGER__.setLevel('SILENT')
```
