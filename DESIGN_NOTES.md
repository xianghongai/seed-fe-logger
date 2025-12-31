# DESIGN NOTES

> 本文档阐述 @seed-fe/logger 的设计动机、核心理念和架构选择，面向架构师、产品经理和技术决策者。

## 1. 背景与动机

### 1.1 前端日志调试的困境

在现代 Web 应用开发中，日志是理解应用运行状态、诊断问题的重要手段。然而，前端开发者面临着一些独特的挑战：

**开发环境的便利 vs 生产环境的盲区**

在开发环境中，开发者可以随意使用 `console.log()` 输出调试信息。但在生产环境：

- 大量的 console 输出会影响性能和用户体验
- 直接删除所有日志代码会导致调试困难
- 遇到问题时需要重新发布版本才能添加日志

**临时调试的困境**

当生产环境出现问题时，开发者的典型流程是：

1. 用户报告问题
2. 开发者无法复现，需要更多日志信息
3. 修改代码添加日志
4. 重新构建、部署
5. 等待用户再次遇到问题
6. 收集日志、分析问题
7. 修复后再次部署移除临时日志

这个流程效率低下，且用户体验差。

**模块化应用的日志管理**

在大型 Web 应用中，日志来自不同的模块：

- API 请求模块
- 状态管理模块
- UI 组件
- 业务逻辑

当所有日志混杂在一起时，很难快速定位特定模块的问题。

### 1.2 为什么需要这个库

**现有方案的局限性**

| 方案 | 局限性 |
|------|--------|
| 直接使用 `console` | 无日志级别控制，无法按环境调整 |
| 使用 `loglevel` 库 | 每个 logger 独立级别，管理复杂；无持久化能力 |
| 条件编译（如 webpack DefinePlugin） | 需要重新构建才能调整，不适合生产调试 |
| 远程日志系统（如 Sentry） | 重量级，主要用于错误追踪，不适合日常调试 |

**核心需求**

我们需要一个轻量级的日志库，它能够：

1. **在不修改代码的情况下调整日志级别** - 生产环境临时开启详细日志
2. **持久化配置** - 刷新页面后配置不丢失
3. **模块化日志区分** - 快速定位日志来源
4. **简单易用** - 学习成本低，API 直观
5. **轻量级** - 不增加显著的包体积

## 2. 核心设计理念

### 2.1 全局统一日志级别

**设计决策：所有 logger 共享一个全局日志级别**

这是本库最核心的设计决策之一。

**为什么选择全局而非独立？**

我们考虑了两种方案：

**方案 A：每个 logger 独立级别**

```
authLogger.setLevel('DEBUG');  // 只影响 auth 模块
apiLogger.setLevel('ERROR');   // 只影响 api 模块
```

优势：灵活，可以精细控制每个模块的日志
劣势：

- 需要记住每个 logger 的当前级别
- 临时调试时需要逐个设置
- 持久化需要管理多个状态
- 心智负担重

**方案 B：全局统一级别（本库选择）**

```
logger.setLevel('DEBUG');      // 影响所有 logger
authLogger.setLevel('ERROR');  // 也是修改全局，影响所有
```

优势：

- 简单直观，只需管理一个状态
- 临时调试一行搞定
- 持久化简单
- 符合 80% 的使用场景

劣势：

- 无法实现细粒度的模块级别控制

**权衡分析**

在前端日志调试场景中，开发者的典型需求是：

- "我要看所有日志" - 调试阶段
- "我只要看错误" - 生产环境
- "临时开启所有日志来排查问题" - 生产问题诊断

这些场景都不需要细粒度的模块级别控制。如果真的需要细粒度控制（比如"只看 API 模块的 DEBUG 日志"），应该：

1. 使用浏览器 DevTools 的 Console 过滤功能（搜索 `[api]`）
2. 或使用专业的日志聚合系统

**简化心智模型**

全局统一级别带来的最大价值是**简单的心智模型**：

开发者只需思考一个问题："当前全局日志级别是什么？"

而不是："auth 模块是 DEBUG，api 模块是 INFO，state 模块是 WARN，我要调试 auth 相关的 API 问题，我应该怎么设置？"

### 2.2 具名 Logger 的职责边界

**设计决策：具名 logger 只做前缀标记，不扩展其他能力**

```
const authLogger = logger.getLogger('auth');
authLogger.log('User login');  // 输出：[auth] User login
```

**为什么只做前缀？**

我们遵循**单一职责原则**：具名 logger 的唯一职责是**区分日志来源**。

**避免的诱惑**

在设计时，我们刻意避免了这些扩展：

❌ 独立的日志级别

```
authLogger.setLevel('TRACE');  // 这会让人困惑：是本地还是全局？
```

❌ 日志过滤

```
authLogger.filterBy(userId);  // 这是日志聚合系统的职责
```

❌ 远程上报

```
authLogger.sendToServer();  // 这应该由专门的错误追踪系统处理
```

**为什么不扩展？**

1. **职责清晰** - Logger 负责输出，过滤和聚合是其他工具的职责
2. **避免过度设计** - 保持库的轻量和专注
3. **可组合性** - 用户可以在此基础上构建自己的扩展

**命名层级支持**

虽然只做前缀，但支持嵌套命名：

```
const appLogger = logger.getLogger('app');
const authLogger = appLogger.getLogger('auth');
authLogger.log('test');  // 输出：[app:auth] test
```

这种设计让模块化日志管理既简单又灵活。

### 2.3 localStorage 持久化机制

**设计决策：支持可选的 localStorage 持久化，用于临时调试**

**临时调试的刚需场景**

```
// 生产环境突然出现 bug
// 开发者打开 Chrome DevTools Console：
__SEED_FE_LOGGER__.setLevel('TRACE', true);  // 持久化

// 用户刷新页面，日志级别仍然是 TRACE
// 更多信息被收集，问题被定位

// 修复后恢复：
__SEED_FE_LOGGER__.setLevel('ERROR');
```

**多层配置的灵活性**

持久化设计包含三个层次的控制：

1. **全局开关** - `enablePersistence: boolean`
   - 控制是否启用持久化机制
   - 可在应用初始化时配置

2. **单次控制** - `setLevel(level, persistent)`
   - `persistent: true` - 持久化到 localStorage
   - `persistent: false` - 仅本次会话生效

3. **完全禁用** - `storageKey: null`
   - 彻底关闭 localStorage 能力
   - 适用于不信任客户端存储的场景

**安全性考虑**

```typescript
try {
  localStorage.setItem(storageKey, level);
} catch (e) {
  // 静默失败，不影响应用运行
}
```

设计考虑：

- **隐私模式兼容** - incognito 模式下 localStorage 不可用
- **权限问题** - 某些浏览器环境可能禁用 localStorage
- **防守式编程** - 失败不会导致应用崩溃

**值规范化**

localStorage 中的值总是规范化为大写：

```
localStorage.setItem(key, 'DEBUG');  // 始终是 DEBUG，不是 debug
```

原因：

- localStorage 值可能被手动修改
- 统一格式便于读取和验证
- 非法值不会破坏应用，静默降级到默认值

### 2.4 基于 loglevel 的架构选择

**设计决策：在 loglevel 基础上扩展，而非从零实现**

**为什么不从零实现？**

| 维度 | 从零实现 | 基于 loglevel |
|------|---------|-------------|
| 包体积 | 可控 | ~4KB |
| 浏览器兼容性 | 需自行验证 | 已验证（IE6+）|
| 维护成本 | 高 | 低 |
| 社区验证 | 无 | 2M+ 下载量/周 |
| 扩展性 | 完全可控 | methodFactory 钩子足够 |

**loglevel 的核心优势**

1. **浏览器专注** - 为浏览器设计，不像 Winston/Pino 是 Node.js 优先
2. **零依赖** - 不引入依赖链污染
3. **轻量级** - 仅 ~1KB（minified + gzipped）
4. **稳定可靠** - 多年社区验证

**扩展点：methodFactory**

loglevel 提供的 `methodFactory` 钩子是关键的"杠杆点"：

```typescript
internalLogger.methodFactory = (methodName, level, loggerName) => {
  const rawMethod = originalFactory(methodName, level, loggerName);
  return (...args) => rawMethod(`[${name}]`, ...args);
};
```

这个钩子让我们可以：

- 注入前缀（具名 logger）
- 拦截日志调用
- 自定义输出格式

而无需修改 loglevel 核心代码。

**扩展而非重写的哲学**

我们的策略是：

- loglevel 负责核心日志输出和浏览器兼容性
- 我们的库负责配置管理、持久化、模块区分
- 各司其职，不重复造轮子

## 3. 关键设计决策

### 3.1 全局状态管理

**单一状态源（Single Source of Truth）**

```typescript
let currentLevel: LogLevelDesc = 'INFO';  // 全局唯一
```

所有 logger（默认 + 具名）都引用这个全局状态。

**同步机制**

当任何 logger 调用 `setLevel()` 时：

1. 更新全局 `currentLevel`
2. 同步到底层 loglevel
3. 可选地持久化到 localStorage

这保证了状态的一致性。

**访问控制**

为了封装全局状态，我们提供访问器：

- `getConfig()` - 读取配置
- `getCurrentLevel()` - 读取当前级别
- `setCurrentLevel()` - 更新级别

这让内部模块可以安全地访问全局状态，而不直接暴露变量。

**访问限制**

`currentLevel` 只通过本库的 API 更新：
- 启动时 `applyConfig()`
- 调用 `setLevel()` 时

**重要提示**：用户应只通过本库的 API 调整日志级别。如果直接调用 loglevel 的 API（如 `window.log.setLevel()`），会导致状态不一致。

### 3.2 API 设计哲学

**最小惊讶原则（Principle of Least Astonishment）**

API 的行为应该符合开发者的直觉：

```typescript
logger.setLevel('DEBUG');  // 符合直觉：设置全局级别
logger.getLevel();         // 符合直觉：获取全局级别
```

避免令人困惑的行为：

```typescript
// ❌ 不直观
authLogger.setLevel('DEBUG');  // 这是本地级别还是全局？
```

**渐进式增强（Progressive Enhancement）**

基础功能开箱即用，高级功能可选：

```typescript
// 基础用法
import logger from '@seed-fe/logger';
logger.log('Hello');

// 高级用法
import { configureLogger } from '@seed-fe/logger';
configureLogger({
  defaultLevel: 'ERROR',
  enablePersistence: false
});
```

**防守式编程（Defensive Programming）**

对可能失败的操作进行保护：

```typescript
try {
  localStorage.setItem(key, value);
} catch (e) {
  // 静默失败，不影响应用
}
```

对非法输入进行验证：

```typescript
const parsed = parseLevelFromString(value);
if (!parsed) return null;  // 非法值返回 null
```

### 3.3 模块化架构

**职责分离**

库被拆分为独立的模块，每个模块职责单一：

- `types.ts` - 类型定义
- `constants.ts` - 常量
- `level-converter.ts` - 日志级别转换（纯函数）
- `config.ts` - 配置管理和全局状态
- `create-logger.ts` - Logger 实例创建
- `index.ts` - 入口点（导入导出）

**单向依赖**

```
types → constants → level-converter → config → create-logger → index
```

严格的单向依赖链，避免循环依赖。

**易于测试**

每个模块都可以独立测试：

- 纯函数模块（如 level-converter）易于单元测试
- 状态管理模块（如 config）可以 Mock
- 依赖注入让集成测试简单

## 4. 用户场景与价值

### 4.1 典型使用场景

**场景 1：开发环境调试**

```typescript
if (isDevelopment) {
  logger.setLevel('TRACE');
}
```

价值：看到所有细节，快速定位问题。

**场景 2：生产环境性能优化**

```typescript
if (isProduction) {
  logger.setLevel('ERROR');  // 只记录错误
}
```

价值：减少 console 调用，提升性能。

**场景 3：生产环境临时诊断**

```
用户报告问题 →
开发者打开 Chrome DevTools →
__SEED_FE_LOGGER__.setLevel('TRACE', true) →
用户重现问题 →
收集详细日志 →
定位并修复
```

价值：无需重新发布，快速收集信息。

**场景 4：模块化日志管理**

```typescript
const apiLogger = logger.getLogger('api');
const stateLogger = logger.getLogger('state');

apiLogger.warn('Slow request');    // [api] Slow request
stateLogger.debug('State update'); // [state] State update
```

价值：快速定位日志来源，使用浏览器 Console 过滤。

### 4.2 解决的核心痛点

| 痛点 | 解决方案 | 价值 |
|------|---------|------|
| 修改代码才能调整日志 | 运行时配置 | 提升调试效率 |
| 刷新页面配置丢失 | localStorage 持久化 | 临时调试无缝 |
| 日志混杂难以定位 | 具名 logger 前缀 | 快速追踪来源 |
| 生产调试需要重新发布 | Console 全局变量 | 即时调试能力 |

### 4.3 设计权衡

**简洁 vs 灵活性**

选择：**简洁优先**

我们选择全局统一级别而非独立级别，因为 80% 的场景不需要细粒度控制。对于需要精细控制的场景，建议使用专业的日志聚合系统。

**全局 vs 细粒度**

选择：**全局统一**

虽然失去了模块级别的细粒度控制，但换来了：

- 简单的心智模型
- 易于使用的 API
- 低学习成本

**轻量 vs 功能丰富**

选择：**轻量专注**

我们刻意避免了这些功能：

- 远程日志上报（使用 Sentry 等专业工具）
- 日志格式化（使用浏览器 DevTools）
- 日志过滤（使用 Console 过滤功能）

保持库的核心职责：**本地日志级别管理**。

## 5. 设计原则与边界

### 5.1 核心设计原则

**1. 简单优先（Simplicity First）**

在功能和简洁之间，优先选择简洁。宁可少做一些，也要保持清晰。

**2. 单一职责（Single Responsibility）**

Logger 负责日志输出和级别控制，不承担其他职责（如过滤、上报）。

**3. 渐进增强（Progressive Enhancement）**

基础功能开箱即用，高级功能可选配置。

**4. 防守式设计（Defensive Design）**

对可能失败的操作（如 localStorage）进行保护，不影响应用稳定性。

**5. 最小惊讶（Least Astonishment）**

API 行为符合开发者直觉，避免令人困惑的设计。

### 5.2 适用边界

**适合的场景**

✅ Web 应用的日常开发调试
✅ 生产环境临时问题诊断
✅ 模块化日志管理
✅ 需要运行时调整日志级别的场景

**不适合的场景**

❌ 需要细粒度模块级别控制 → 使用专业日志系统
❌ 需要远程日志收集 → 使用 Sentry, LogRocket 等
❌ 需要复杂的日志过滤和聚合 → 使用 ELK 等日志平台
❌ Node.js 服务端日志 → 使用 Winston, Pino 等

**何时需要其他工具**

如果你需要：

- **远程错误追踪** → Sentry, Rollbar
- **用户行为分析** → LogRocket, FullStory
- **日志聚合分析** → ELK Stack, Splunk
- **APM 性能监控** → New Relic, Datadog

这些是专业工具的领域，@seed-fe/logger 不尝试替代它们。

**全局变量的副作用说明**

库在浏览器环境中自动挂载 `window.__SEED_FE_LOGGER__`（位于 `src/index.ts:14-23`），这是一个有意为之的顶层副作用，用于：
- 方便在生产环境通过 DevTools Console 临时调试
- 无需修改代码即可调整日志级别

副作用影响：
- 打包器无法完全 tree-shake 该模块
- 对包体积影响较小（库本身仅 ~4KB）
- 如果应用极度敏感于包体积，可通过打包器的 `sideEffects` 配置优化

这是在"开发体验"与"包体积"之间的权衡选择，符合库的设计哲学："实用胜于完美"。

## 6. 总结

### 6.1 这个库的价值

@seed-fe/logger 的核心价值在于：

**用最小的复杂度，解决了前端日志调试的最常见问题。**

具体体现：

- ✅ 轻量级（~4KB）- 不增加显著包体积
- ✅ 零学习成本 - API 与 console 一致
- ✅ 开箱即用 - 无需配置即可使用
- ✅ 生产友好 - 支持运行时调整和持久化
- ✅ 模块化 - 便于大型应用的日志管理

### 6.2 设计哲学

我们遵循的设计哲学可以总结为：

**简洁胜于复杂（Simplicity over Complexity）**

选择全局统一级别而非独立级别，因为简单的方案覆盖了 80% 的场景。

**专注胜于全能（Focus over Completeness）**

只做日志级别管理，不做日志聚合、上报、分析。让专业工具做专业的事。

**实用胜于完美（Pragmatism over Perfection）**

接受设计的局限性（如无法细粒度控制），因为这让库保持简单实用。

---

> 这个库不是为了替代所有日志工具，而是为了解决前端开发者日常调试中最常遇到的痛点。
>
> 它的成功不在于功能的丰富，而在于对核心问题的精准解决。
