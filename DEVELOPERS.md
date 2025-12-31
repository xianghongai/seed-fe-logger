# DEVELOPERS.md

> 面向贡献者的开发者文档，帮助你理解 @seed-fe/logger 的技术栈、设计和实现细节

**目标受众**：想要贡献代码、理解内部实现、扩展功能的开发者

**与现有文档的区别**：
- [README.md](./README.md)：面向使用者（如何使用）
- [DESIGN_NOTES.md](./DESIGN_NOTES.md)：面向架构师（为什么这样设计）
- [CLAUDE.md](./CLAUDE.md)：面向 AI 助手（快速上手）
- [AGENTS.md](./AGENTS.md)：开发规范和约定
- **DEVELOPERS.md**（本文档）：面向贡献者（如何开发和扩展）

---

## 目录

- [1. 欢迎 & 快速开始](#1-欢迎--快速开始)
- [2. 项目技术栈](#2-项目技术栈)
- [3. 项目架构详解](#3-项目架构详解)
- [4. 核心实现机制](#4-核心实现机制)
- [5. 开发工作流](#5-开发工作流)
- [6. 扩展指南](#6-扩展指南)
- [7. 常见问题和陷阱](#7-常见问题和陷阱)
- [8. 发布和维护](#8-发布和维护)
- [9. 代码规范](#9-代码规范)
- [10. 贡献指南](#10-贡献指南)
- [11. 资源链接](#11-资源链接)

---

## 1. 欢迎 & 快速开始

感谢你对 @seed-fe/logger 的关注！无论你是想修复 bug、添加新功能，还是单纯想理解代码，这份文档都会帮助你快速上手。

### 前置要求

- **Node.js**：>= 18
- **包管理器**：pnpm（必须）
- **Git**：用于版本控制

### 快速启动

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/seed-fe-logger.git
cd seed-fe-logger

# 2. 安装依赖（必须使用 pnpm）
pnpm install

# 3. 运行测试
pnpm test

# 4. 构建产物
pnpm build

# 5. 代码质量检查
pnpm run check
```

### 第一次贡献指南

如果这是你第一次为本项目贡献代码：

1. **阅读文档**：先浏览 [README.md](./README.md) 和 [DESIGN_NOTES.md](./DESIGN_NOTES.md) 了解项目目标
2. **运行测试**：确保你的环境配置正确，所有测试都能通过
3. **选择任务**：从 [GitHub Issues](https://github.com/yourusername/seed-fe-logger/issues) 中选择标记为 `good first issue` 的任务
4. **提问**：如有疑问，在 Issue 中留言或发起 Discussion

---

## 2. 项目技术栈

### 核心依赖

#### loglevel

**版本**：^2.0.0

**选择理由**：
- 轻量级（~1KB minified+gzipped）
- 浏览器专注（不像 Winston/Pino 是 Node.js 优先）
- 零依赖（不引入依赖链污染）
- 稳定可靠（2M+ 下载量/周，多年社区验证）
- 提供 `methodFactory` 钩子用于扩展

**替代方案分析**：

| 方案 | 优势 | 劣势 | 选择结论 |
|------|------|------|---------|
| loglevel | 轻量、浏览器专注、稳定 | 功能简单 | ✅ 选择 |
| Winston | 功能丰富、插件生态 | 体积大、Node.js 优先 | ❌ 不适合浏览器 |
| Pino | 性能极高 | Node.js 优先、配置复杂 | ❌ 不适合浏览器 |
| 从零实现 | 完全可控 | 维护成本高、需处理兼容性 | ❌ 成本过高 |

### 开发工具链

#### TypeScript

**版本**：^5.0.0

**作用**：类型安全，提升开发体验和代码质量

**配置亮点**：
- `strict: true` - 启用所有严格类型检查
- `target: "ES2020"` - 现代浏览器支持
- `module: "ESNext"` - 支持 ESM

#### tsup

**版本**：^8.0.0

**作用**：打包工具，生成 CJS、ESM 和类型声明文件

**为什么选择 tsup 而非 Webpack/Rollup**：
- 零配置（基于 esbuild，速度极快）
- 专注库打包（不是应用打包）
- 自动生成类型声明文件
- 支持多种输出格式

**配置**（`tsup.config.ts`）：
```typescript
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
});
```

#### Vitest

**版本**：^2.0.0

**作用**：测试框架

**为什么选择 Vitest 而非 Jest**：
- 原生支持 ESM（无需额外配置）
- 与 Vite 生态集成良好
- 速度更快（基于 esbuild）
- API 与 Jest 兼容（低迁移成本）

**配置**（`vitest.config.ts`）：
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // 模拟浏览器环境
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
```

#### Biome

**版本**：^1.9.0

**作用**：代码质量工具（Linter + Formatter）

**为什么选择 Biome 而非 ESLint+Prettier**：
- 速度极快（Rust 实现）
- 零配置（开箱即用）
- 统一工具（Linter 和 Formatter 一体化）
- 现代化设计

**配置**（`biome.json`）：
```json
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space"
  }
}
```

### 包管理器

#### pnpm

**为什么强制要求 pnpm**：
- 节省磁盘空间（全局 content-addressable store）
- 安装速度快
- 严格的依赖管理（不会有幽灵依赖）
- Monorepo 友好（虽然本项目是单包）

**强制使用配置**（`.npmrc`）：
```
engine-strict=true
```

**package.json**：
```json
{
  "engines": {
    "node": ">=18",
    "pnpm": ">=8"
  }
}
```

---

## 3. 项目架构详解

### 3.1 文件结构与职责

```
seed-fe-logger/
├── src/
│   ├── types.ts              # 所有 TypeScript 类型定义
│   ├── constants.ts          # 全局常量（localStorage key）
│   ├── level-converter.ts    # 纯函数工具（级别转换）
│   ├── config.ts             # 全局状态管理 + 配置
│   ├── create-logger.ts      # Logger 实例创建（核心逻辑）
│   └── index.ts              # 公开 API 导出 + 全局变量注入
├── test/
│   ├── index.test.ts         # 主测试文件
│   └── helpers.ts            # 测试辅助函数（Mock）
├── dist/                     # 构建产物（不提交到 Git）
├── .github/
│   └── workflows/
│       └── release.yml       # 自动发布流程
├── DEVELOPERS.md             # 本文档
├── DESIGN_NOTES.md           # 设计文档
├── README.md                 # 用户文档
├── CLAUDE.md                 # AI 助手文档
├── AGENTS.md                 # 开发规范
├── package.json              # 项目配置
├── tsconfig.json             # TypeScript 配置
├── tsup.config.ts            # 打包配置
├── vitest.config.ts          # 测试配置
└── biome.json                # 代码质量配置
```

### 3.2 模块依赖图

```
types.ts (基础类型定义)
  ↓
constants.ts (全局常量)
  ↓
level-converter.ts (纯函数工具)
  ↓
config.ts (全局状态 + 配置管理)
  ↓
create-logger.ts (Logger 创建 + 全局同步)
  ↓
index.ts (API 导出 + 全局变量注入)
```

**设计原则**：严格的单向依赖链，避免循环依赖

### 3.3 数据流

#### 初始化流程

```
应用启动
  ↓
导入 @seed-fe/logger
  ↓
config.ts 执行
  ↓
applyConfig() 读取 localStorage
  ↓
currentLevel 初始化
  ↓
index.ts 导出默认 logger
  ↓
（可选）用户调用 configureLogger() 更新配置
```

#### setLevel 流程

```
用户调用 logger.setLevel('DEBUG', true)
  ↓
更新全局 currentLevel
  ↓
遍历 allLoggers Set
  ↓
调用每个 internalLogger.setLevel(level, false)
  ↓
（可选）持久化到 localStorage
```

### 3.4 核心模块详解

#### types.ts

**职责**：定义所有 TypeScript 类型

**导出**：
- `LogLevelDesc`：日志级别字符串类型
- `LoggerConfig`：用户配置接口
- `InternalLoggerConfig`：内部配置接口（所有字段必填）
- `Logger`：Logger 实例接口

**设计亮点**：
- 区分用户配置（可选字段）和内部配置（必填字段）
- 导出所有类型，便于用户扩展

#### constants.ts

**职责**：定义全局常量

**导出**：
- `DEFAULT_LOCAL_STORAGE_KEY`：默认的 localStorage 键名

#### level-converter.ts

**职责**：日志级别转换（纯函数）

**导出**：
- `levelEnumToString()`：枚举 → 字符串
- `levelStringToEnum()`：字符串 → 枚举
- `parseLevelFromString()`：解析并验证字符串

**设计亮点**：
- 纯函数，易于测试
- 处理大小写不敏感（`'debug'` → `'DEBUG'`）
- 验证非法值（返回 `null`）

#### config.ts

**职责**：全局状态管理 + 配置

**核心状态**：
```typescript
let config: InternalLoggerConfig = {
  defaultLevel: levelEnumToString(originalLog.getLevel()),
  storageKey: DEFAULT_LOCAL_STORAGE_KEY,
  enablePersistence: true,
};

let currentLevel: LogLevelDesc = config.defaultLevel;
```

**导出**：
- `configureLogger()`：更新配置
- `getConfig()`：读取配置
- `getCurrentLevel()`：读取当前级别
- `setCurrentLevel()`：更新当前级别

**设计亮点**：
- 单一状态源（Single Source of Truth）
- 访问器模式封装内部状态
- 启动时自动从 localStorage 恢复

#### create-logger.ts

**职责**：Logger 实例创建 + 全局同步

**核心逻辑**：
```typescript
// 维护所有 logger 实例
const allLoggers = new Set<originalLog.Logger>();

export const createLogger = (name = ''): Logger => {
  const loggerName = name || 'default';
  const internalLogger = name ? originalLog.getLogger(loggerName) : originalLog;

  // 加入集合
  allLoggers.add(internalLogger);

  // 初始化级别（禁用 loglevel 内置持久化）
  internalLogger.setLevel(
    levelStringToEnum(getCurrentLevel()) as originalLog.LogLevelNumbers,
    false
  );

  // 具名 logger 前缀注入
  if (name) {
    const originalFactory = internalLogger.methodFactory;
    internalLogger.methodFactory = (methodName, level, loggerName) => {
      const rawMethod = originalFactory(methodName, level, loggerName);
      return (...args) => rawMethod(`[${name}]`, ...args);
    };
    internalLogger.setLevel(internalLogger.getLevel(), false);
  }

  return {
    getLevel: () => getCurrentLevel(),
    setLevel: (levelStr: LogLevelDesc, persistent = true): void => {
      const numLevel = levelStringToEnum(levelStr);
      setCurrentLevel(levelStr);

      // 同步所有 logger
      for (const loggerInstance of allLoggers) {
        loggerInstance.setLevel(numLevel as originalLog.LogLevelNumbers, false);
      }

      // 持久化
      const config = getConfig();
      if (persistent && config.enablePersistence && config.storageKey && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(config.storageKey, levelEnumToString(numLevel));
        } catch (_e) {
          // 静默失败
        }
      }
    },
    getLogger: (childName: string) => createLogger(name ? `${name}:${childName}` : childName),
    trace: internalLogger.trace.bind(internalLogger),
    debug: internalLogger.debug.bind(internalLogger),
    log: internalLogger.log.bind(internalLogger),
    info: internalLogger.info.bind(internalLogger),
    warn: internalLogger.warn.bind(internalLogger),
    error: internalLogger.error.bind(internalLogger),
  };
};
```

**设计亮点**：
- `allLoggers` Set 确保全局级别同步
- `methodFactory` 钩子注入前缀
- 所有 loglevel `setLevel` 调用传 `false` 禁用内置持久化
- 防守式编程（localStorage 异常处理）

#### index.ts

**职责**：API 导出 + 全局变量注入

**导出**：
```typescript
export { configureLogger } from './config';
export { createLogger } from './create-logger';
export { LogLevel, type LogLevelDesc, type Logger, type LoggerConfig } from './types';

const logger = createLogger();
export default logger;

// 浏览器环境全局变量
if (typeof window !== 'undefined') {
  (window as any).__SEED_FE_LOGGER__ = logger;
}
```

**设计亮点**：
- 默认导出 + 具名导出
- 全局变量用于生产调试
- 防守式检查（`typeof window !== 'undefined'`）

---

## 4. 核心实现机制

### 4.1 全局级别同步机制

#### 问题

如何确保所有 logger（包括具名 logger）共享同一个日志级别？

#### 挑战

loglevel 库中每个 logger 实例（通过 `log.getLogger(name)` 创建）都有独立的级别：

```typescript
import log from 'loglevel';

const logger1 = log.getLogger('module1');
const logger2 = log.getLogger('module2');

logger1.setLevel('DEBUG');
logger2.setLevel('ERROR');

console.log(logger1.getLevel()); // DEBUG
console.log(logger2.getLevel()); // ERROR - 独立的
```

但我们的需求是**全局统一级别**。

#### 解决方案

维护一个 `allLoggers` Set，存储所有创建的 loglevel 实例。每次调用 `setLevel` 时遍历所有实例同步级别。

**实现代码**（`src/create-logger.ts`）：

```typescript
// 维护所有创建的 loglevel logger 实例，用于全局级别同步
const allLoggers = new Set<originalLog.Logger>();

export const createLogger = (name = ''): Logger => {
  const loggerName = name || 'default';
  const internalLogger = name ? originalLog.getLogger(loggerName) : originalLog;

  // 关键：将 logger 加入集合
  allLoggers.add(internalLogger);

  // 初始化 logger 的日志级别为当前全局级别
  // 禁用 loglevel 的内置持久化（传 false），由自己的逻辑控制
  internalLogger.setLevel(
    levelStringToEnum(getCurrentLevel()) as originalLog.LogLevelNumbers,
    false
  );

  // ...

  return {
    // ...
    setLevel: (levelStr: LogLevelDesc, persistent = true): void => {
      const numLevel = levelStringToEnum(levelStr);
      setCurrentLevel(levelStr);

      // 关键：遍历所有 logger 实例同步级别
      for (const loggerInstance of allLoggers) {
        loggerInstance.setLevel(numLevel as originalLog.LogLevelNumbers, false);
      }

      // 持久化到 localStorage（由自己的逻辑控制）
      const config = getConfig();
      if (persistent && config.enablePersistence && config.storageKey && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(config.storageKey, levelEnumToString(numLevel));
        } catch (_e) {
          // 忽略本地存储访问错误
        }
      }
    },
    // ...
  };
};
```

**关键点**：

1. `allLoggers` Set 存储所有 loglevel 实例（包括默认 logger 和具名 logger）
2. 创建 logger 时立即加入 Set
3. 每次 `setLevel` 遍历 Set 并调用每个实例的 `setLevel(level, false)`
4. `false` 参数禁用 loglevel 的内置持久化，由我们自己控制

**验证**：

```typescript
// 测试代码（test/index.test.ts）
it('具名 logger 的 setLevel 应该同步全局级别', () => {
  // 设置全局级别为 WARN
  logger.setLevel('WARN', false);
  expect(logger.getLevel()).toBe('WARN');

  // 创建具名 logger
  const authLogger = logger.getLogger('auth');
  expect(authLogger.getLevel()).toBe('WARN'); // 继承全局

  // 具名 logger 修改级别
  authLogger.setLevel('TRACE', false);

  // 验证全局级别也被修改
  expect(logger.getLevel()).toBe('TRACE');
  expect(authLogger.getLevel()).toBe('TRACE');

  // 创建新的 logger 也应该继承新的全局级别
  const apiLogger = logger.getLogger('api');
  expect(apiLogger.getLevel()).toBe('TRACE');
});
```

### 4.2 具名 Logger 前缀注入

#### 问题

如何在不修改 loglevel 核心代码的情况下为具名 logger 添加前缀？

#### 需求

```typescript
const authLogger = logger.getLogger('auth');
authLogger.log('User login');
// 期望输出：[auth] User login
```

#### 解决方案

利用 loglevel 的 `methodFactory` 钩子。

**什么是 methodFactory？**

loglevel 提供了一个钩子函数 `methodFactory`，用于自定义日志方法的创建：

```typescript
interface Logger {
  methodFactory: (
    methodName: string,        // 方法名（'trace', 'debug', 'info', ...）
    level: number,             // 当前级别
    loggerName: string | symbol // Logger 名称
  ) => (...args: any[]) => void;
}
```

**实现代码**（`src/create-logger.ts`）：

```typescript
if (name) {
  // 保存原始 methodFactory
  const originalFactory = internalLogger.methodFactory;

  // 覆盖 methodFactory
  internalLogger.methodFactory = (methodName, level, loggerName) => {
    // 调用原始 factory 获取原始方法
    const rawMethod = originalFactory(methodName, level, loggerName);

    // 返回包装后的方法（注入前缀）
    return (...args) => {
      rawMethod(`[${name}]`, ...args);
    };
  };

  // 应用方法工厂更改（触发方法重建）
  internalLogger.setLevel(internalLogger.getLevel(), false);
}
```

**工作原理**：

1. 保存 loglevel 的原始 `methodFactory`
2. 覆盖 `methodFactory`，返回包装后的方法
3. 包装方法在参数前注入 `[name]` 前缀
4. 调用 `setLevel` 触发 loglevel 重建日志方法

**为什么需要调用 `setLevel`？**

loglevel 只在调用 `setLevel` 时才会调用 `methodFactory` 重建方法。因此修改 `methodFactory` 后需要手动触发一次。

**嵌套前缀支持**：

```typescript
const appLogger = logger.getLogger('app');
const authLogger = appLogger.getLogger('auth');
authLogger.log('test');
// 输出：[app:auth] test
```

实现原理：

```typescript
getLogger: (childName: string) => createLogger(name ? `${name}:${childName}` : childName)
```

### 4.3 localStorage 持久化的三层控制

#### 三层控制

1. **全局开关**：`configureLogger({ enablePersistence: false })`
2. **单次控制**：`setLevel('DEBUG', false)` - 第二个参数
3. **完全禁用**：`configureLogger({ storageKey: null })`

#### 实现逻辑

**层级 1：全局开关**

```typescript
configureLogger({
  enablePersistence: false, // 禁用持久化
});

logger.setLevel('DEBUG', true); // 第二个参数无效，不会写入 localStorage
```

**层级 2：单次控制**

```typescript
configureLogger({
  enablePersistence: true, // 允许持久化
});

logger.setLevel('DEBUG', false); // 不持久化，仅本次会话生效
logger.setLevel('ERROR', true);  // 持久化到 localStorage
```

**层级 3：完全禁用**

```typescript
configureLogger({
  storageKey: null, // 完全禁用 localStorage 能力
});

logger.setLevel('DEBUG', true); // 不会写入（storageKey 为 null）
```

**实现代码**（`src/create-logger.ts`）：

```typescript
setLevel: (levelStr: LogLevelDesc, persistent = true): void => {
  const numLevel = levelStringToEnum(levelStr);
  setCurrentLevel(levelStr);

  // 同步到所有 logger 实例
  for (const loggerInstance of allLoggers) {
    loggerInstance.setLevel(numLevel as originalLog.LogLevelNumbers, false);
  }

  // 持久化到 localStorage（三层控制）
  const config = getConfig();
  if (
    persistent &&                     // 层级 2：单次控制
    config.enablePersistence &&       // 层级 1：全局开关
    config.storageKey &&              // 层级 3：完全禁用检查
    typeof localStorage !== 'undefined' // 环境检查（SSR）
  ) {
    try {
      localStorage.setItem(config.storageKey, levelEnumToString(numLevel));
    } catch (_e) {
      // 静默失败：隐私模式、权限问题等不会导致崩溃
    }
  }
}
```

**防守式编程**：

- `typeof localStorage !== 'undefined'`：检查 localStorage 是否存在（SSR 环境）
- `try-catch`：捕获异常（隐私模式、权限错误、存储满）
- 失败静默，不影响应用运行

### 4.4 禁用 loglevel 内置持久化

#### 问题

loglevel 有自己的 localStorage 持久化机制：

```typescript
// loglevel 内部实现
logger.setLevel('DEBUG', true); // 第二个参数为 true 时会写入 localStorage
```

但我们需要自己控制持久化逻辑（三层控制）。

#### 解决方案

所有调用 loglevel 的 `setLevel` 时都传 `false`，禁用其内置持久化。

**所有调用点**：

1. **config.ts**：初始化时

```typescript
// src/config.ts
originalLog.setLevel(
  levelStringToEnum(currentLevel) as originalLog.LogLevelNumbers,
  false // 禁用 loglevel 的内置持久化
);
```

2. **create-logger.ts**：创建 logger 时

```typescript
// src/create-logger.ts
internalLogger.setLevel(
  levelStringToEnum(getCurrentLevel()) as originalLog.LogLevelNumbers,
  false // 禁用 loglevel 的内置持久化
);
```

3. **create-logger.ts**：前缀注入后

```typescript
// src/create-logger.ts
if (name) {
  // ... methodFactory 覆盖
  internalLogger.setLevel(internalLogger.getLevel(), false); // 禁用
}
```

4. **create-logger.ts**：全局同步时

```typescript
// src/create-logger.ts
for (const loggerInstance of allLoggers) {
  loggerInstance.setLevel(numLevel as originalLog.LogLevelNumbers, false); // 禁用
}
```

**验证**：

```typescript
// 测试代码（test/index.test.ts）
it('当 persistent=false 时不应该将日志级别保存到 localStorage', () => {
  logger.setLevel('DEBUG', false);
  expect(localStorage.setItem).not.toHaveBeenCalled();
});

it('当 persistent=true 时应该将日志级别保存到 localStorage', () => {
  logger.setLevel('DEBUG', true);
  expect(localStorage.setItem).toHaveBeenCalledWith('@seed-fe/logger:level', 'DEBUG');
});
```

---

## 5. 开发工作流

### 5.1 常见开发任务

#### 添加新功能

```bash
# 1. 创建新分支
git checkout -b feature/your-feature-name

# 2. 修改代码
# 编辑 src/ 文件

# 3. 添加测试
# 编辑 test/index.test.ts

# 4. 运行测试
pnpm test

# 5. 代码质量检查
pnpm run check

# 6. 构建验证
pnpm build

# 7. 提交代码
git add .
git commit -m "feat: add your feature"

# 8. 推送并创建 PR
git push origin feature/your-feature-name
```

#### 修复 Bug

**TDD 流程（推荐）**：

```bash
# 1. 编写失败的测试用例（复现 bug）
# 编辑 test/index.test.ts

# 2. 运行测试确认失败
pnpm test

# 3. 修复代码
# 编辑 src/ 文件

# 4. 运行测试确认修复
pnpm test

# 5. 提交
git add .
git commit -m "fix: resolve issue with ..."
```

#### 更新文档

```bash
# 1. 编辑文档
# 编辑 README.md, DESIGN_NOTES.md, 或 DEVELOPERS.md

# 2. 确保代码示例正确
# 运行示例代码验证

# 3. 提交
git add .
git commit -m "docs: update documentation for ..."
```

### 5.2 调试技巧

#### 调试测试

**运行特定测试**：

```bash
# 运行包含 "具名 logger" 的测试
pnpm test -- -t "具名 logger"

# 运行特定文件的测试
pnpm test test/index.test.ts
```

**Watch 模式**：

```bash
# 文件修改时自动重新运行测试
pnpm test:watch
```

**覆盖率报告**：

```bash
# 生成覆盖率报告
pnpm test:coverage

# 查看 HTML 报告
open coverage/index.html
```

#### 调试源码

**方法 1：console.log**

```typescript
// src/create-logger.ts
setLevel: (levelStr: LogLevelDesc, persistent = true): void => {
  console.log('[DEBUG] setLevel called:', { levelStr, persistent, allLoggersSize: allLoggers.size });
  // ...
}
```

**方法 2：调试器（VS Code）**

创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["test"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

#### 调试打包产物

```bash
# 1. 构建
pnpm build

# 2. 检查产物
ls -lh dist/

# 3. 测试 CJS 产物
node -e "const logger = require('./dist/index.cjs'); logger.log('test')"

# 4. 测试 ESM 产物（需要 package.json 设置 "type": "module"）
node --input-type=module -e "import logger from './dist/index.js'; logger.log('test')"
```

### 5.3 常用命令

```bash
# 开发
pnpm dev              # 构建并 watch（如果配置）
pnpm test             # 运行测试
pnpm test:watch       # Watch 模式运行测试
pnpm test:coverage    # 生成覆盖率报告

# 代码质量
pnpm run check        # Biome 检查
pnpm run format       # Biome 格式化

# 构建
pnpm build            # 构建产物
pnpm build:types      # 仅生成类型声明（如果单独配置）

# 发布
pnpm version patch    # 更新补丁版本（1.0.0 -> 1.0.1）
pnpm version minor    # 更新次版本（1.0.0 -> 1.1.0）
pnpm version major    # 更新主版本（1.0.0 -> 2.0.0）
git push --follow-tags # 推送标签触发 CI/CD
```

---

## 6. 扩展指南

### 6.1 添加新的配置项

#### 场景

添加一个 `logPrefix` 配置项，允许用户自定义全局前缀。

#### 步骤

**1. 修改类型定义（`src/types.ts`）**

```typescript
export interface LoggerConfig {
  defaultLevel?: LogLevelDesc;
  storageKey?: string | null;
  enablePersistence?: boolean;
  logPrefix?: string; // 新增
}

export interface InternalLoggerConfig {
  defaultLevel: LogLevelDesc;
  storageKey: string | null;
  enablePersistence: boolean;
  logPrefix: string | null; // 新增
}
```

**2. 修改配置管理（`src/config.ts`）**

```typescript
let config: InternalLoggerConfig = {
  defaultLevel: levelEnumToString(originalLog.getLevel()),
  storageKey: DEFAULT_LOCAL_STORAGE_KEY,
  enablePersistence: true,
  logPrefix: null, // 默认值
};

export const configureLogger = (customConfig: LoggerConfig): void => {
  config = {
    ...config,
    defaultLevel: customConfig.defaultLevel ?? config.defaultLevel,
    storageKey: customConfig.storageKey !== undefined ? customConfig.storageKey : config.storageKey,
    enablePersistence: customConfig.enablePersistence ?? config.enablePersistence,
    logPrefix: customConfig.logPrefix !== undefined ? customConfig.logPrefix : config.logPrefix, // 新增
  };

  applyConfig();
};
```

**3. 修改 Logger 创建逻辑（`src/create-logger.ts`）**

```typescript
// 在 methodFactory 中使用 logPrefix
const config = getConfig();

if (config.logPrefix || name) {
  const originalFactory = internalLogger.methodFactory;
  internalLogger.methodFactory = (methodName, level, loggerName) => {
    const rawMethod = originalFactory(methodName, level, loggerName);
    return (...args) => {
      const prefix = [config.logPrefix, name].filter(Boolean).join(':');
      rawMethod(`[${prefix}]`, ...args);
    };
  };
  internalLogger.setLevel(internalLogger.getLevel(), false);
}
```

**4. 添加测试（`test/index.test.ts`）**

```typescript
describe('全局前缀配置', () => {
  it('应该支持自定义全局前缀', () => {
    configureLogger({ logPrefix: 'APP' });
    const testLogger = createLogger('auth');

    vi.spyOn(testLogger, 'log').mockImplementation(() => {});
    testLogger.log('test');

    // 期望输出：[APP:auth] test
    expect(testLogger.log).toHaveBeenCalledWith('test');
  });
});
```

**5. 更新文档（`README.md`）**

```markdown
### 配置全局前缀

```typescript
import { configureLogger } from '@seed-fe/logger';

configureLogger({
  logPrefix: 'MyApp',
});

const authLogger = logger.getLogger('auth');
authLogger.log('test'); // 输出：[MyApp:auth] test
```
```

### 6.2 如何扩展日志方法

#### 场景

添加一个 `critical()` 方法，表示比 `error` 更严重的日志。

#### 限制

由于依赖 loglevel，无法添加新的日志级别。loglevel 固定为 6 个级别：

- TRACE (0)
- DEBUG (1)
- INFO (2)
- WARN (3)
- ERROR (4)
- SILENT (5)

#### 替代方案 1：使用 `error()` 并添加标记

```typescript
logger.error('[CRITICAL]', '严重错误信息');
```

#### 替代方案 2：包装 `error()` 方法

**修改 `src/types.ts`**：

```typescript
export interface Logger {
  // ... 现有方法
  critical: (...args: unknown[]) => void; // 新增
}
```

**修改 `src/create-logger.ts`**：

```typescript
return {
  // ... 现有方法
  critical: (...args: unknown[]) => {
    internalLogger.error('[CRITICAL]', ...args);
  },
};
```

**使用**：

```typescript
logger.critical('数据库连接失败');
// 输出：[CRITICAL] 数据库连接失败
```

---

## 7. 常见问题和陷阱

### 7.1 为什么不能独立设置具名 logger 的日志级别？

#### 用户预期

```typescript
const authLogger = logger.getLogger('auth');
authLogger.setLevel('DEBUG'); // 只影响 auth 模块？
```

#### 实际行为

修改**全局级别**，影响所有 logger（包括默认 logger 和其他具名 logger）。

#### 设计理由

详见 [DESIGN_NOTES.md#2.1 全局统一日志级别](./DESIGN_NOTES.md#21-全局统一日志级别)：

- **简化心智模型**：只需管理一个全局状态
- **覆盖 80% 场景**：大多数情况不需要细粒度控制
- **替代方案**：使用浏览器 DevTools Console 过滤（搜索 `[auth]`）

#### 如果真的需要细粒度控制？

**方案 1：浏览器 Console 过滤**

```
1. 打开 Chrome DevTools Console
2. 点击 "Filter" 输入框
3. 输入：/\[auth\]/
4. 只会显示包含 [auth] 的日志
```

**方案 2：使用专业日志系统**

如果需要复杂的模块级别控制、日志聚合、远程上报等功能，建议使用：

- **Sentry**：错误追踪
- **LogRocket**：用户会话回放
- **ELK Stack**：日志聚合分析

### 7.2 localStorage 在隐私模式下会发生什么？

#### 行为

- `localStorage.setItem()` 抛出 `DOMException`
- 代码通过 `try-catch` 捕获，静默失败
- 日志级别仍然生效，只是不会持久化

#### 实现

```typescript
// src/create-logger.ts
try {
  localStorage.setItem(config.storageKey, levelEnumToString(numLevel));
} catch (_e) {
  // 静默失败，不影响应用运行
}
```

#### 其他可能失败的场景

- **隐私模式**：Safari/Firefox 隐私模式禁用 localStorage
- **存储满**：localStorage 有配额限制（通常 5-10MB）
- **权限问题**：某些浏览器环境可能禁用 localStorage
- **SSR**：服务端渲染环境没有 localStorage

#### 验证

```typescript
// 测试代码（test/index.test.ts）
it('localStorage 失败时不应该影响应用运行', () => {
  // Mock localStorage.setItem 抛出异常
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('QuotaExceededError');
  });

  // 应该不会抛出异常
  expect(() => {
    logger.setLevel('DEBUG', true);
  }).not.toThrow();

  // 级别应该正常设置
  expect(logger.getLevel()).toBe('DEBUG');
});
```

### 7.3 为什么全局变量是必要的？

#### 原因

生产环境临时调试的核心场景：

```
用户报告问题 →
开发者打开 Chrome DevTools →
__SEED_FE_LOGGER__.setLevel('TRACE', true) →
用户重现问题 →
收集详细日志 →
定位并修复
```

无需重新构建、发布即可临时调整日志级别。

#### 代价

- 打包器无法完全 tree-shake 该模块
- 包体积影响较小（库本身仅 ~4KB）

#### 实现

```typescript
// src/index.ts
if (typeof window !== 'undefined') {
  (window as any).__SEED_FE_LOGGER__ = logger;
}
```

#### 如何禁用？

如果你的应用极度敏感于包体积，可以：

**方案 1：配置打包器的 `sideEffects`**

```json
// package.json
{
  "sideEffects": false
}
```

**方案 2：手动移除全局变量（Fork 项目）**

编辑 `src/index.ts`，删除全局变量注入代码。

### 7.4 为什么选择 loglevel 而不从零实现？

详见 [DESIGN_NOTES.md#2.4 基于 loglevel 的架构选择](./DESIGN_NOTES.md#24-基于-loglevel-的架构选择)。

#### 简短回答

| 维度 | 从零实现 | 基于 loglevel |
|------|---------|--------------|
| 包体积 | 可控 | ~1KB（可接受）|
| 浏览器兼容性 | 需自行验证 | 已验证（IE6+）|
| 维护成本 | 高 | 低 |
| 社区验证 | 无 | 2M+ 下载量/周 |
| 扩展性 | 完全可控 | `methodFactory` 足够 |

#### loglevel 的核心优势

1. **浏览器专注**：为浏览器设计，不像 Winston/Pino 是 Node.js 优先
2. **零依赖**：不引入依赖链污染
3. **轻量级**：~1KB（minified + gzipped）
4. **稳定可靠**：多年社区验证
5. **扩展点**：`methodFactory` 钩子满足需求

### 7.5 如何处理 SSR 环境？

#### 问题

服务端渲染（SSR）环境没有 `window` 和 `localStorage`。

#### 解决方案

**检查环境**：

```typescript
// src/index.ts
if (typeof window !== 'undefined') {
  (window as any).__SEED_FE_LOGGER__ = logger;
}

// src/create-logger.ts
if (
  persistent &&
  config.enablePersistence &&
  config.storageKey &&
  typeof localStorage !== 'undefined' // 关键：检查 localStorage 是否存在
) {
  try {
    localStorage.setItem(config.storageKey, levelEnumToString(numLevel));
  } catch (_e) {
    // ...
  }
}
```

**SSR 框架集成**：

```typescript
// Next.js 示例
import logger from '@seed-fe/logger';

// 仅在客户端执行
if (typeof window !== 'undefined') {
  logger.setLevel('DEBUG');
}
```

### 7.6 为什么 `setLevel` 的第二个参数默认是 `true`？

#### 设计决策

```typescript
setLevel: (level: LogLevelDesc, persistent = true) => void
```

默认持久化（`persistent = true`）。

#### 理由

生产环境临时调试是核心场景：

```javascript
// Chrome DevTools Console
__SEED_FE_LOGGER__.setLevel('TRACE'); // 默认持久化，刷新后仍生效
```

如果默认是 `false`，用户需要记住传 `true`，体验较差：

```javascript
// 不好的体验
__SEED_FE_LOGGER__.setLevel('TRACE', true); // 每次都要记得传 true
```

#### 如何临时调试（不持久化）？

```javascript
__SEED_FE_LOGGER__.setLevel('TRACE', false); // 仅本次会话
```

---

## 8. 发布和维护

### 8.1 版本发布流程

#### 自动发布（推荐）

```bash
# 1. 确保所有测试通过
pnpm test && pnpm build && pnpm run check

# 2. 更新版本号并创建 Git 标签
pnpm version patch  # 1.0.1 -> 1.0.2（Bug 修复）
pnpm version minor  # 1.0.2 -> 1.1.0（新功能）
pnpm version major  # 1.1.0 -> 2.0.0（破坏性变更）

# 3. 推送标签触发 CI/CD
git push --follow-tags

# 4. GitHub Actions 自动发布到 npm
# 查看 https://github.com/yourusername/seed-fe-logger/actions
```

#### 手动发布

```bash
# 1. 登录 npm
npm login

# 2. 确保所有测试通过
pnpm test && pnpm build && pnpm run check

# 3. 发布
pnpm publish

# 4. 推送标签到 GitHub
git push --follow-tags
```

### 8.2 版本标签规则

#### 语义化版本（Semantic Versioning）

- **MAJOR（主版本）**：不兼容的 API 变更
- **MINOR（次版本）**：向下兼容的新功能
- **PATCH（补丁版本）**：向下兼容的 Bug 修复

#### npm 标签

- `latest`：稳定版本（默认）
- `alpha`：内部测试版
- `beta`：公开测试版
- `rc`（Release Candidate）：候选版本

#### 发布预发布版本

**Alpha 版本**：

```bash
# 发布 1.0.0-alpha.0
pnpm version prerelease --preid=alpha
git push --follow-tags

# 发布到 npm 的 alpha 标签
pnpm publish --tag alpha
```

**Beta 版本**：

```bash
# 发布 1.0.0-beta.0
pnpm version prerelease --preid=beta
git push --follow-tags

# 发布到 npm 的 beta 标签
pnpm publish --tag beta
```

**安装预发布版本**：

```bash
# 安装 alpha 版本
pnpm add @seed-fe/logger@alpha

# 安装 beta 版本
pnpm add @seed-fe/logger@beta

# 安装特定版本
pnpm add @seed-fe/logger@1.0.0-beta.0
```

### 8.3 CI/CD 流程

#### 触发条件

推送标签（如 `v1.0.2`）。

#### 流程

1. **安装依赖**：`pnpm install`
2. **运行测试**：`pnpm test`
3. **代码检查**：`pnpm run check`
4. **构建产物**：`pnpm build`
5. **发布到 npm**：`npm publish`

#### 配置文件

`.github/workflows/release.yml`：

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test

      - name: Run checks
        run: pnpm run check

      - name: Build
        run: pnpm build

      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

#### 配置 npm Token

1. 登录 [npmjs.com](https://www.npmjs.com/)
2. 点击头像 → "Access Tokens"
3. 生成 "Automation" 类型的 Token
4. 在 GitHub 仓库设置中添加 Secret：`NPM_TOKEN`

### 8.4 变更日志（CHANGELOG）

#### 手动维护

创建 `CHANGELOG.md`：

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2024-01-15

### Fixed
- Fixed global level synchronization issue

## [1.0.0] - 2024-01-01

### Added
- Initial release
- Global unified log level
- Named logger with prefix
- localStorage persistence
```

#### 自动生成（推荐）

使用 [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog)：

```bash
# 安装
pnpm add -D conventional-changelog-cli

# 生成 CHANGELOG
pnpm exec conventional-changelog -p angular -i CHANGELOG.md -s

# 添加到 package.json
{
  "scripts": {
    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s"
  }
}
```

---

## 9. 代码规范

### 9.1 TypeScript 编码风格

#### 类型定义

- 使用 `interface` 定义公开 API 类型
- 使用 `type` 定义联合类型和工具类型
- 导出所有公开类型（便于使用者扩展）
- 内部类型使用 `Internal` 前缀

**示例**：

```typescript
// 公开类型
export interface Logger {
  getLevel: () => LogLevelDesc;
  setLevel: (level: LogLevelDesc, persistent?: boolean) => void;
}

// 联合类型
export type LogLevelDesc = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SILENT';

// 内部类型
interface InternalLoggerConfig {
  defaultLevel: LogLevelDesc;
  storageKey: string | null;
  enablePersistence: boolean;
}
```

#### 类型导出

```typescript
// 导出类型
export type { Logger, LoggerConfig, LogLevelDesc };

// 导出值
export { LogLevel, configureLogger, createLogger };
```

### 9.2 命名约定

- **变量/函数**：`camelCase`
  - 示例：`currentLevel`, `createLogger`, `getConfig`
- **类型/接口**：`PascalCase`
  - 示例：`Logger`, `LoggerConfig`, `LogLevelDesc`
- **常量**：`SCREAMING_SNAKE_CASE`
  - 示例：`DEFAULT_LOCAL_STORAGE_KEY`
- **私有状态**：`let` + 模块作用域
  - 示例：`let config`, `let currentLevel`

### 9.3 注释规范

#### JSDoc 注释

公开 API 必须有 JSDoc 注释：

```typescript
/**
 * 创建日志记录器
 *
 * @param name 日志记录器名称，默认为空字符串
 * @returns Logger 实例
 *
 * @example
 * ```typescript
 * const authLogger = createLogger('auth');
 * authLogger.log('User login');
 * // 输出：[auth] User login
 * ```
 */
export const createLogger = (name = ''): Logger => {
  // ...
};
```

#### 内部注释

- **功能说明**：简短的功能描述

```typescript
// 维护所有创建的 loglevel logger 实例，用于全局级别同步
const allLoggers = new Set<originalLog.Logger>();
```

- **复杂逻辑**：解释"为什么"而不是"做什么"

```typescript
// 禁用 loglevel 的内置持久化（传 false），由自己的逻辑控制
internalLogger.setLevel(numLevel as originalLog.LogLevelNumbers, false);
```

### 9.4 Commit 规范

#### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### 类型（type）

- `feat`：新功能
- `fix`：Bug 修复
- `docs`：文档更新
- `style`：代码格式（不影响功能）
- `refactor`：重构
- `test`：测试相关
- `build`：构建系统或依赖更新
- `ci`：CI/CD 配置
- `chore`：其他杂项

#### 范围（scope）

可选，表示影响的模块：

- `logger`
- `config`
- `types`
- `test`
- `docs`

#### 主题（subject）

- 简短描述（不超过 50 字符）
- 动词开头，小写
- 不加句号

#### 正文（body）

可选，详细描述变更内容。

#### 脚注（footer）

可选，包含：

- **BREAKING CHANGE**：破坏性变更
- **Closes**：关闭的 Issue

#### 示例

**基本示例**：

```
feat(logger): add support for custom log prefix

- Add logPrefix config option
- Update createLogger to inject prefix
- Add tests for prefix functionality
```

**破坏性变更**：

```
refactor(logger)!: change setLevel API signature

BREAKING CHANGE: setLevel now requires level parameter to be uppercase.

Before:
  logger.setLevel('debug')

After:
  logger.setLevel('DEBUG')

Closes #123
```

**Bug 修复**：

```
fix(config): prevent localStorage access in SSR environment

Add typeof localStorage !== 'undefined' check before accessing localStorage.

Fixes #456
```

---

## 10. 贡献指南

### 10.1 如何提交 PR

1. **Fork 仓库**

   访问 [GitHub 仓库](https://github.com/yourusername/seed-fe-logger)，点击 "Fork"。

2. **克隆你的 Fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/seed-fe-logger.git
   cd seed-fe-logger
   ```

3. **创建特性分支**

   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **进行更改**

   编辑代码、添加测试、更新文档。

5. **运行检查**

   ```bash
   pnpm test
   pnpm run check
   pnpm build
   ```

6. **提交更改**

   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

7. **推送到分支**

   ```bash
   git push origin feature/amazing-feature
   ```

8. **创建 Pull Request**

   访问你的 Fork，点击 "Compare & pull request"。

### 10.2 PR 检查清单

提交 PR 前确保：

- [ ] 代码通过 `pnpm test`（所有测试通过）
- [ ] 代码通过 `pnpm run check`（无 Biome 警告）
- [ ] 代码通过 `pnpm build`（成功构建）
- [ ] 添加了相应的测试
- [ ] 更新了相关文档（README、DESIGN_NOTES、DEVELOPERS 等）
- [ ] Commit 信息符合规范
- [ ] PR 描述清晰（说明了"是什么"和"为什么"）

### 10.3 代码审查标准

#### 逻辑正确性

- 代码实现符合需求
- 没有明显的 bug
- 边界条件处理正确

#### 测试覆盖率

- 新功能有相应的测试
- Bug 修复有回归测试
- 关键路径覆盖率 > 80%

#### 代码可读性

- 变量/函数命名清晰
- 复杂逻辑有注释
- 代码结构清晰

#### 性能影响

- 没有性能回退
- 避免不必要的计算
- 合理使用缓存

#### 向后兼容性

- 不破坏现有 API（除非 MAJOR 版本）
- 新增可选参数使用默认值
- 标记废弃 API（`@deprecated`）

#### 文档完整性

- 公开 API 有 JSDoc 注释
- README 更新（如需要）
- CHANGELOG 更新（如需要）

### 10.4 行为准则

- 尊重他人
- 建设性反馈
- 欢迎新手
- 开放讨论

---

## 11. 资源链接

### 项目资源

- **源码仓库**：[GitHub](https://github.com/yourusername/seed-fe-logger)
- **npm 包**：[npmjs.com](https://www.npmjs.com/package/@seed-fe/logger)
- **问题追踪**：[GitHub Issues](https://github.com/yourusername/seed-fe-logger/issues)
- **讨论区**：[GitHub Discussions](https://github.com/yourusername/seed-fe-logger/discussions)

### 依赖文档

- **loglevel**：[GitHub](https://github.com/pimterry/loglevel) | [npm](https://www.npmjs.com/package/loglevel)
- **TypeScript**：[官方文档](https://www.typescriptlang.org/)
- **Vitest**：[官方文档](https://vitest.dev/)
- **tsup**：[官方文档](https://tsup.egoist.dev/)
- **Biome**：[官方文档](https://biomejs.dev/)
- **pnpm**：[官方文档](https://pnpm.io/)

### 相关标准

- **语义化版本**：[Semantic Versioning](https://semver.org/)
- **Conventional Commits**：[conventionalcommits.org](https://www.conventionalcommits.org/)
- **Keep a Changelog**：[keepachangelog.com](https://keepachangelog.com/)

### 学习资源

- **JavaScript**：[MDN Web Docs](https://developer.mozilla.org/)
- **TypeScript 深入**：[TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- **测试最佳实践**：[JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## 附录

### A. 常见问题速查

| 问题 | 解决方案 |
|------|---------|
| 为什么 `pnpm install` 失败？ | 检查 Node.js 版本（>= 18）和 pnpm 版本（>= 8） |
| 为什么测试失败？ | 运行 `pnpm test -- --no-coverage` 查看详细错误 |
| 为什么构建失败？ | 运行 `pnpm run check` 检查代码质量 |
| 如何调试测试？ | 使用 `pnpm test:watch` 或 VS Code 调试器 |
| 如何查看覆盖率？ | 运行 `pnpm test:coverage` 并打开 `coverage/index.html` |
| 如何发布新版本？ | 运行 `pnpm version [patch|minor|major]` 然后 `git push --follow-tags` |

### B. 术语表

- **Logger**：日志记录器，提供日志输出方法
- **Log Level**：日志级别，控制哪些日志被输出
- **Named Logger**：具名 Logger，输出时带有 `[name]` 前缀
- **Persistence**：持久化，将配置保存到 localStorage
- **methodFactory**：loglevel 提供的钩子函数，用于自定义日志方法
- **Tree-shaking**：打包器的优化技术，移除未使用的代码

---

**感谢你的贡献！**

如有任何问题，欢迎在 [GitHub Issues](https://github.com/yourusername/seed-fe-logger/issues) 或 [Discussions](https://github.com/yourusername/seed-fe-logger/discussions) 中提问。
