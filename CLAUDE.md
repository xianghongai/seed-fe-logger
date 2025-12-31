# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

@seed-fe/logger 是一个基于 loglevel 封装的前端日志库，提供分级日志输出能力、localStorage 持久化和具名 logger 支持。

## 开发命令

```bash
# 安装依赖（必须使用 pnpm）
pnpm install

# 开发模式（tsup watch）
pnpm dev

# 生产构建
pnpm build

# 运行测试
pnpm test              # 单次运行
pnpm test:watch       # 监听模式
pnpm test:coverage    # 生成覆盖率报告

# 代码质量检查
pnpm format           # Biome 格式化
pnpm check            # Biome 检查并自动修复
```

## 核心架构

### 源码结构

代码已模块化拆分为以下文件：

- **src/types.ts**: 类型定义（Logger、LoggerConfig、LogLevel 等）
- **src/constants.ts**: 常量定义（DEFAULT_LOCAL_STORAGE_KEY）
- **src/level-converter.ts**: 日志级别转换工具（字符串 ↔ 枚举）
- **src/config.ts**: 配置管理和全局状态（configureLogger、getCurrentLevel 等）
- **src/create-logger.ts**: Logger 实例创建（createLogger、全局级别同步逻辑）
- **src/index.ts**: 入口点（导入导出、全局变量暴露）

### 依赖关系

```
types → constants → level-converter → config → create-logger → index
```

严格的单向依赖链，避免循环依赖。

### 测试文件

- **test/index.test.ts**: 完整的测试套件
- **test/helpers.ts**: 测试 Mock 工具（mockLoglevel、mockLocalStorage、mockConsole）

### 关键设计模式

**1. 全局统一日志级别**

```typescript
// 全局唯一的日志级别变量
let currentLevel: LogLevelDesc = 'INFO';
```

**核心设计**：所有 logger（默认 + 具名）共享同一个全局日志级别。

- `getLevel()`: 直接返回 `currentLevel`
- `setLevel()`: 修改 `currentLevel` 并同步所有 logger 实例
- 任何 logger（包括具名 logger）调用 `setLevel()` 都会影响全局

**2. 日志级别转换**

- 内部使用数字枚举（loglevel 的 0-5）
- 对外 API 使用字符串（'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SILENT'）
- 关键函数：`levelStringToEnum()`、`levelEnumToString()`、`parseLevelFromString()`

**3. localStorage 持久化**

- `applyConfig()`: 初始化时从 localStorage 读取配置（仅当 `enablePersistence: true` 时）
- `setLevel()` 的 `persistent` 参数（默认 `true`）控制是否持久化
- `configureLogger()` 可通过 `storageKey: null` 或 `enablePersistence: false` 关闭持久化
- 持久化的字符串始终规范化为大写（使用 `levelEnumToString()`）

**4. 具名 Logger 实现**

通过 loglevel 的 `methodFactory` 注入前缀：

```typescript
factory: (methodName, logLevel, loggerName) => {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);
  return (...args) => rawMethod(`[${name}]`, ...args);
}
```

**重要**：具名 logger 只用于区分模块输出（添加前缀），不扩展其他能力。所有 logger 共享全局级别。

### 全局调试支持

在浏览器环境中，库会自动暴露 `window.__SEED_FE_LOGGER__` 全局变量，方便在 Chrome DevTools Console 中调试：

- 只在浏览器环境暴露（`typeof window !== 'undefined'`）
- 不影响 SSR 和 Node.js 环境
- TypeScript 用户可以使用类型 `window.__SEED_FE_LOGGER__`

**使用示例**：
```js
// 在 Chrome Console 中
__SEED_FE_LOGGER__.setLevel('TRACE', false)  // 临时开启调试
__SEED_FE_LOGGER__.getLevel()                 // 查看当前级别
```

### 主要导出 API

```typescript
// 默认 logger 实例
export default logger

// 工具函数
export { createLogger, configureLogger }

// 类型导出
export { Logger, LogLevel, LogLevelDesc }
```

## 测试指南

### 测试环境

- 框架：Vitest + jsdom（模拟浏览器环境）
- Mock 工具：`test/helpers.ts` 提供 loglevel、localStorage、console 的完整 Mock

### 测试覆盖范围

测试套件验证以下功能：
- 基本日志方法（trace/debug/log/info/warn/error）
- 日志级别控制（getLevel/setLevel）
- 全局级别同步（具名 logger setLevel 影响全局）
- 持久化行为（localStorage 读写、enablePersistence 控制）
- 持久化字符串规范化（始终为大写）
- 具名 logger（创建、前缀、共享全局级别）
- 配置功能（configureLogger）

### 运行单个测试

```bash
# 使用 Vitest 的 -t 标志匹配测试名称
pnpm test -t "basic logging methods"
pnpm test -t "named loggers"
```

## 发布流程

- 触发方式：推送 `v*` 格式的 Git 标签
- CI/CD：`.github/workflows/release.yml` 自动构建并发布到 npm
- 版本标签规则：
  - `v1.0.0-alpha.x` → `npm publish --tag alpha`
  - `v1.0.0-beta.x` → `npm publish --tag beta`
  - `v1.0.0-rc.x` → `npm publish --tag rc`
  - `v1.0.0` → `npm publish --tag latest`

## 代码规范

- 使用 Biome 进行格式化和 Linting
- 风格：2 空格缩进、单引号、120 字符行宽
- 命名：camelCase（变量/函数）、PascalCase（类型）、SCREAMING_SNAKE_CASE（常量）
- 提交信息：遵循 Conventional Commits 规范（如 `feat:`, `fix:`, `build(ci):`）

## 重要约束

1. **包管理器**：必须使用 pnpm（在 package.json 中强制）
2. **构建输出**：同时提供 CJS 和 ESM 格式 + TypeScript 类型定义
3. **浏览器兼容性**：依赖 localStorage API，需浏览器环境或 jsdom 模拟
4. **错误处理**：localStorage 操作需要 try-catch 包裹（在 incognito 模式下可能失败）
