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

提供分级日志输出能力，默认生产环境只输出 `ERROR` 级别日志，开发环境输出所有级别的日志；

日志级别从低到高如下：

* `trace`
* `debug/log`
* `info`
* `warn`
* `error`

## `trace()/debug()/log()/info()/warn()/error()`

* 接口：`(...msg: any[]) => never`
* 参数：`msg`: 需要输出的内容
* 返回：无
* 用法：同 `console.trace/debug/log/info/warn/error`，例如 `logger.log('hello')` 将输出 `hello`

## `getLevel()`

获取当前日志输出等级；

* 接口：`() => string`
* 参数：无
* 返回：当前日志级别 `TRACE/DEBUG/INFO/WARN/ERROR` 中的一个
* 用法：`const currentLevel = logger.getLevel()`

## `setLevel()`

设置当前日志输出等级，一般用于生产环境临时开启日志输出；

* 接口：`(level: LogLevelString, persistent?: boolean) => void`
* 参数：
  * `level`: 日志级别 `'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SILENT'` 中的一个，`SILENT` 不输出任何日志
  * `persistent`: 是否持久化，如果为 `true`，则日志级别会持久化到本地存储中，下次打开页面时会自动恢复，否则刷新页面后将变回默认级别
* 返回：无
* 用法：

  ```typescript
  import logger, { LogLevelDesc } from '@seed-fe/logger';

  // 常规使用
  logger.setLevel('DEBUG', true);

  // 使用类型提示来查看所有可用的日志级别
  const level: LogLevelDesc = 'INFO';
  logger.setLevel(level);
  ```

## `getLogger`

获取一个新的具名 Logger，所有具名 Logger 的输出前面都会带上该 Logger 的名称，一般用于区分不同模块的日志输出；

* 接口：`(name: string) => Logger`
* 参数：`name`: 具名 Logger 的名称
* 返回：新的 Logger 对象
* 用法：`const featureLogger = logger.getLogger('feature')`，例如 `featureLogger.log('hello')` 将输出 `[feature] hello`

通过 `logger.getLogger()` 获得的 Logger 将会继承全局的 log level 设置。

## 不同环境下的日志级别

```typescript
import logger from '@seed-fe/logger';

if (isDevelopment) {
  logger.setLevel('TRACE');
} else {
  logger.setLevel('ERROR');
}
```
