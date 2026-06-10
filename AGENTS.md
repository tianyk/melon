# AGENTS.md

本文件定义 melon 项目代码生成与修改的强约束规则。
若违反，生成结果视为错误实现。

> **[保护约束]** 未经用户明确批准，任何 Agent 禁止修改本文件（`AGENTS.md`）。若任务涉及修改本文件，必须先向用户确认并获得明确许可，否则视为违规操作。

## Workspace Layout

```text
src/main/      Electron 主进程（Node.js 运行时）
src/renderer/  React 渲染进程（浏览器运行时）
src/types/     主进程与渲染进程共享类型定义
skills/        预装技能 SKILL.md
resources/     应用图标等静态资源
```

---

## 0. 决策优先级

```text
AGENTS.md
> docs/melon-mvp-tech-plan.md
> README.md + 关键配置文件
> existing code
```

当规范与现有代码冲突：
- 不要模仿旧代码
- 按本文件生成新实现
- 同一迭代中修正旧代码

文档职责约束：
- `docs/melon-mvp-tech-plan.md` 属于技术方案文档，不得在普通功能实现、缺陷修复中直接修改
- 如需调整技术选型、架构决策、产品定位，必须更新 `docs/melon-mvp-tech-plan.md`
- 预装技能的行为描述归属 `skills/<name>/SKILL.md`，不得写入其他文档

### 0.1 Agent Memory Protocol（REQUIRED）

违反视为任务未完成。

目标不是维护知识库，而是维护"小而有效的工作记忆"。

Memory 分三层：
1. Daily（事件记忆）
2. Summary（工作记忆）
3. Playbooks（复用套路）

原则：
- Memory 是 cache，不是仓库
- update > append
- 少而精优先
- 若新增记忆价值不足，应选择不写入，而不是勉强写入

#### A. Daily（必做）

每次任务结束，最后一步必须追加：

```text
.memory/daily/{YYYY-MM-DD}.md
```

格式：

```markdown
## {HH:MM} [{agent_name}]
- 完成：一句话结果
- 决策：关键选择及原因（可省略）
- 待办：阻塞项（可省略）
```

要求：
- 只记录结果与关键决策，不写过程
- "决策"必须写明 why（为什么）
- 追加，不覆盖
- 一次任务一条记录，不合并
- 时间格式 HH:MM，东八区
- agent_name，例如：claude-code

禁止：
- 跳过 Daily
- 修改历史条目
- 写成流水账

#### B. Summary（按需更新）

若任务产生长期仍相关的重要模式，更新：

```text
.memory/SUMMARY.md
```

用途：

维护"当前工作集认知"，不是永久知识库。

仅允许记录：

- Architecture Invariants
- Current Pitfalls
- Stable Decisions
- Active Repo Conventions

限制：

- 总量 ≤20 条
- ≤500–800 tokens
- 每项尽量单行表达

更新方式：

默认重写 / 合并：

```text
update > append
```

写入条件（满足任一即可）：

- 同类问题重复出现 ≥2 次
- 属于长期有效规则
- 未来大概率影响其它任务
- 属于高价值踩坑经验

禁止写入：

- 一次性任务记录
- 临时 TODO
- 与单次提交强绑定的细节

说明：

Summary 是 working set，会被替换，不追求积累。

#### C. Playbooks（仅高门槛提炼）

路径：

```text
.memory/PLAYBOOKS.md
```

用途：

沉淀可复用检查清单或标准套路。

只允许：

- Review checklist
- Debug flow
- Workflow template

提炼条件（至少满足 2 条）：

- 同类问题出现 ≥3 次
- 可形成 ≥3 条检查项
- 明显会复用
- 不强绑定具体文件

预算：

- 总量 ≤7（硬上限 10）
- 默认优先更新旧 Playbook
- update > create

禁止：

- 一次性经验提炼 Playbook
- 普通编码技巧进入 Playbook
- 为数量而创建 Playbook

原则：

少而精。

#### D. Retrieval（任务开始前）

开始任务前：
1. 看最近 3 条 Daily
2. 看相关 Summary
3. 如适用，看相关 Playbook

原则：

先检索，再行动。

Memory 必须被读取，不只是被写入。

#### E. Task End Reflection（必做判断）

任务结束：

```text
Task Complete
→ Update Daily
→ Evaluate Summary?
→ Evaluate Playbook?
→ End
```

不是每次任务都更新 Summary 或 Playbook。

#### F. Memory Compaction（必须执行）

每累计 20 条 Daily，或每月至少一次：

执行一次记忆压缩：

- 删除失效记忆
- 合并重复项
- 压缩表达
- 压缩 Summary
- 清理低复用 Playbook

目标：

保持小 working set。

原则：

```text
Memory budget > Memory growth
```

#### G. Version Control

以下目录必须纳入版本控制：

```text
.memory/daily/
.memory/SUMMARY.md
.memory/PLAYBOOKS.md
```

不得加入 `.gitignore`

---

## 1. Workspace Constraints

REQUIRED
- 依赖安装/新增/移除/升级必须使用 `pnpm`
- 锁文件以 `pnpm-lock.yaml` 为唯一基准
- 主进程代码放在 `src/main/`
- 渲染进程代码放在 `src/renderer/src/`
- 主进程与渲染进程共享类型放在 `src/types/`
- `src/types/` 中的类型不得依赖 Electron 或 React 类型

FORBIDDEN
- `npm install` / `npm i` / `yarn add` / `yarn install`
- 在渲染进程中直接使用 Node.js API（`fs`, `path`, `os`, `child_process` 等）
- 在主进程中直接操作 DOM 或使用浏览器 API
- 在 `src/types/` 中 import Electron 或 React 类型
- 在根目录堆放业务代码

---

## 2. Runtime & Framework Constraints

### 2.1 Main Process（src/main/）

仅允许以下技术路径（禁止替代实现）：

```text
Runtime:     Node.js (Electron 42)
Language:    TypeScript 5
Build:       electron-vite
IPC:         ipcMain.handle + contextBridge
Agent:       AgentHarness（当前 stub，后续 @earendil-works/pi-agent-core）
MCP:         @modelcontextprotocol/sdk（当前 stub）
Storage:     JSONL 文件（pi-agent-core 内置 JsonlSessionRepo）
Crypto:      Electron safeStorage API
Config:      文件系统 JSON（~/.melon/）
Module:      ESM
Package:     pnpm
```

REQUIRED
- IPC handler 必须在 `bridge.ts` 中集中注册
- 每个 handler 必须用 `wrap()` 包装以统一错误处理
- 返回格式统一 `{ code: 0 | 1; data?: T; message?: string }`
- `code: 0` 表示成功，`code: 1` 表示失败
- Agent 相关逻辑集中在 `harness-manager.ts`
- MCP 相关逻辑集中在 `mcp-manager.ts`
- 配置读写集中在 `settings.ts`
- 密钥操作集中在 `crypto.ts`
- 应用入口 `main.ts` 只负责窗口创建与生命周期，不承载业务逻辑
- 新增 main process 模块时按职责拆分，不堆在 `main.ts`

FORBIDDEN
- 在 `ipcMain.handle` 回调中直接 throw（必须用 `wrap()` 包装）
- 在 `settings.json` 中存储 API Key 或其他密钥字段
- API Key 明文传递到渲染进程
- 在主进程 `src/main/` 中写 React / JSX 代码
- 在 handler 中手动构造 `{ code, data, message }` 响应（wrap 自动完成）

### 2.2 Renderer Process（src/renderer/）

仅允许以下技术路径（禁止替代实现）：

```text
Frontend:    React 18
Language:    TypeScript 5
Build:       Vite（electron-vite）
UI:          shadcn/ui（基于 Tailwind CSS v4）
Style:       Tailwind CSS v4（CSS-first config，@theme 指令）
State:       React Context + useReducer
Icons:       lucide-react
Module:      ESM
Package:     pnpm
```

REQUIRED
- 组件文件使用 PascalCase
- hook 文件使用 camelCase，并以 `use` 开头
- 非组件文件（utils, api, types, constants）使用 kebab-case
- 所有组件通过 `@/` 别名引用 `src/renderer/src/`
- IPC 调用统一通过 `window.Melon` API，不得直接使用 `ipcRenderer`
- 事件监听必须返回 cleanup 函数或通过 useEffect return 取消订阅
- 页面至少覆盖 loading / empty / error 三类状态
- 全局状态通过 `useAppContext()` 访问，按 domain dispatch action
- 样式优先使用 Tailwind 工具类；复杂主题变量写入 `globals.css` 的 `@theme` 块
- 类名合并使用 `cn()` 工具函数

FORBIDDEN
- 在渲染进程中 `import` 主进程模块或 Node.js API
- 在组件文件中使用 kebab-case 命名
- 在非组件文件中使用 PascalCase 命名
- 引入 Redux / Zustand / MobX 等外部状态管理库（除非用户明确要求）
- 引入 Ant Design / MUI / Next.js 等替代 UI 框架
- 绕过 `window.Melon` 直接使用 `ipcRenderer.invoke`
- 在 IPC 调用中硬编码通道字符串（必须用 `IPC_CHANNELS` 常量）
- 在组件中直接操作 `document.documentElement` 或 `localStorage`
- 在 JSX 中内联手写 `<svg>...</svg>` 图标；图标统一从 `lucide-react` 选取

### 2.3 Compatibility Boundary

以下目录属于兼容保留范围：

- `skills/` — 预装技能 SKILL.md
- `resources/` — 应用图标等静态资源

ALLOWED
- 修改现有 SKILL.md 的技能描述
- 新增预装技能
- 替换应用图标

DEFAULT
- 未明确说明时，新增技能统一放在 `skills/<name>/SKILL.md`

---

## 3. IPC Lifecycle Contract

```text
Renderer（window.Melon.xxx()）
  → Preload（unwrap → ipcRenderer.invoke）
    → Bridge（wrap → ipcMain.handle）
      → Manager（harness / mcp / settings）
        → Storage / Agent / MCP Server
          → Main → Renderer（webContents.send）
            → Preload（Melon.on）
              → Renderer（callback）
```

REQUIRED
- Bridge 层只做转发 + 错误包装，不写业务逻辑
- Preload 层只做 unwrap + invoke 透传，不写业务逻辑
- Manager 承载全部业务逻辑（harness-manager, mcp-manager, settings）
- settings.ts / crypto.ts 是纯工具模块，只负责读写
- 主进程推送到渲染进程的事件必须通过 `webContents.send`

FORBIDDEN
- 在 Bridge 中写 Agent / MCP / Settings 的具体逻辑
- 在 Preload 中做数据转换或业务判断
- 绕过 Manager 直接在 Bridge 中操作文件或调用外部 API
- 在渲染进程中监听 IPC 事件但不清理（内存泄漏）

---

## 4. File Placement Rules

### 4.1 Main Process（Authoritative）

新增 main process 模块时按以下路径落位：

```text
src/main/main.ts            应用入口（窗口、生命周期）
src/main/bridge.ts           IPC 注册（集中注册所有 handler）
src/main/preload.ts          contextBridge 暴露 API
src/main/harness-manager.ts  Agent 管理
src/main/mcp-manager.ts      MCP 客户端管理
src/main/settings.ts         配置读写
src/main/crypto.ts           密钥加解密
```

FORBIDDEN
- 新建 main process 顶层目录（如 `src/main/services/`、`src/main/utils/`）
- 在 `src/main/` 之外创建 main process 文件
- 把无关职责合并到单个文件中

### 4.2 Renderer Process（Authoritative）

新增 React 页面或组件时按以下路径落位：

```text
src/renderer/src/pages/        路由级页面
src/renderer/src/components/   UI 组件
   components/ui/              shadcn 风格基础组件（button, input 等）
   components/layout/          布局组件（Layout, Sidebar）
   components/chat/            聊天相关（MessageList, MessageBubble）
   components/sidebar/         侧边栏相关（SessionList）
   components/input/           输入相关（ChatInput, SkillChips）
   components/settings/        设置相关
src/renderer/src/context/      React Context（AppContext）
src/renderer/src/hooks/        自定义 hooks
src/renderer/src/lib/          工具函数
src/renderer/src/styles/       Tailwind 样式
src/renderer/src/types/        渲染进程类型声明
```

REQUIRED
- 页面级功能放入 `pages/`
- 可复用组件放入 `components/` 对应子目录
- 自定义 hook 放入 `hooks/`
- 工具函数放入 `lib/`
- 全局类型声明放入 `types/`

FORBIDDEN
- 在 `pages/` 之外堆放整页实现
- 在 `components/ui/` 中放置业务组件
- 在组件文件中直接散落重复的 IPC 调用代码

### 4.3 File Naming Rules

| 位置 | 规则 | 示例 |
|------|------|------|
| `src/main/` | kebab-case | `harness-manager.ts`, `mcp-manager.ts` |
| `src/types/` | kebab-case | `ipc.ts` |
| 页面文件 | PascalCase | `ChatView.tsx` |
| 组件文件 | PascalCase | `ChatInput.tsx`, `MessageList.tsx` |
| hook 文件 | camelCase，use 开头 | `useAgent.ts` |
| API / utils / types / constants | kebab-case | `utils.ts`, `global.d.ts` |
| 样式文件 | kebab-case | `globals.css` |

FORBIDDEN
- 在 `src/main/` 中使用 PascalCase 或 camelCase 文件名
- React 组件使用 kebab-case 或 camelCase 文件名
- 在同一语义下混用 `ChatInput.tsx` 与 `chat-input.tsx`
- 使用无语义命名如 `utils.ts`、`helper.ts`、`common.ts`、`temp.ts`

---

## 5. Implementation Protocol（必须遵循顺序）

实现新功能时严格按顺序：

1. **类型定义**（`src/types/ipc.ts`）— 如需新类型、新 IPC 通道常量
2. **Main Process** — Manager 业务逻辑 → Bridge 注册 handler → Preload 暴露 API
3. **Renderer Process** — Context state/action → hook 封装 → 页面/组件实现
4. **样式** — 主题变量 → Tailwind 类名 → 组件样式

禁止从 UI 组件开始实现后补 IPC 和业务逻辑。

---

## 6. IPC Channel Rules

### 6.1 通道命名

```text
Renderer → Main（invoke）:  domain:action    例：harness:prompt
Main → Renderer（send）:    domain:event     例：agent:message-update
```

### 6.2 通道注册

- 所有通道常量定义在 `src/types/ipc.ts` 的 `IPC_CHANNELS` 对象中
- 所有 `ipcMain.handle` 注册集中在 `src/main/bridge.ts`
- 所有 `contextBridge.exposeInMainWorld` 暴露在 `src/main/preload.ts`

### 6.3 事件推送

- Main → Renderer 事件通过 `webContents.send(channel, data)` 推送
- Renderer 通过 `window.Melon.on(channel, callback)` 订阅
- 订阅返回 unsubscribe 函数，组件卸载时必须调用

---

## 7. IPC Contract

Main Process handler 返回统一格式：

```typescript
interface Result<T> {
  code: 0 | 1    // 0 = 成功，1 = 失败
  data?: T       // 成功时的数据
  message?: string // 失败时的错误描述
}
```

Preload unwrap 规则：
- `code === 0` → 返回 `data`
- `code === 1` → throw `Error(message)`

Renderer 调用规则：
- 返回值通过 `unwrap` 自动解包，调用方拿到的是 `T` 而非 `Result<T>`
- 调用方用 try/catch 处理异常

---

## 8. Security Contract

### 8.1 API Key 存储

```text
~/.melon/settings.json   → 明文 — 只存 apiKeyConfigured: boolean
~/.melon/credentials.enc → 加密 — Electron safeStorage 加密的 API Key
```

REQUIRED
- 密钥仅通过 `safeStorage.encryptString()` 加密写入 `credentials.enc`
- 读取时通过 `safeStorage.decryptString()` 动态解密，不在内存中长期保留
- `settings.json` 只包含 `apiKeyConfigured` 标志位，不含密钥本身
- 每次 agent 发起请求时动态调用 `loadApiKey()`，用完即弃
- 渲染进程只能通过 `settings:get` 拿到 `apiKeyConfigured: boolean`，永远接触不到真实密钥字符串

FORBIDDEN
- API Key 明文存储在 `settings.json`、环境变量、代码常量中
- 通过 IPC 将解密后的 API Key 传递给渲染进程
- 在日志、错误信息中打印 API Key
- 将 `credentials.enc` 加入版本控制（已在 `.gitignore` 中排除）

### 8.2 Process Isolation

- 渲染进程运行在 `sandbox: true` + `contextIsolation: true` 模式下
- `nodeIntegration: false`
- 所有文件系统操作必须通过 IPC 委托主进程执行

---

## 9. Error Handling Contract

### 9.1 Main Process

REQUIRED

```typescript
// bridge.ts — wrap() 自动完成
ipcMain.handle('harness:prompt', wrap(async (_e, text: string) => {
  await harnessManager.prompt(text)
}))
```

- 所有 IPC handler 通过 `wrap()` 自动捕获异常
- Manager 层直接 throw Error 即可
- 禁止在 handler 中手动 try/catch + 返回错误对象

FORBIDDEN

```typescript
// 禁止手动构造错误响应
ipcMain.handle('xxx', async () => {
  try {
    return { code: 0, data: ... }
  } catch (e) {
    return { code: 1, message: ... }
  }
})
```

### 9.2 Renderer Process

REQUIRED
- IPC 调用必须 try/catch 处理可能的异常
- 页面至少覆盖 loading / success / error 三类状态
- 异常状态必须有用户可见的反馈（错误提示、空态指引等）

FORBIDDEN
- 吞掉异常且无状态反馈
- 伪造与服务端/主进程不一致的成功结果

---

## 10. Storage Contract

### 10.1 Session 存储

```text
~/.melon/sessions/{uuid}.jsonl
```

- 由 pi-agent-core 的 `JsonlSessionRepo` 管理
- 当前 stub 阶段由 `harness-manager.ts` 模拟
- 会话元数据（SessionMeta）通过 `session:list` IPC 获取

### 10.2 数据目录初始化

- 应用启动时 `main.ts` 调用 `ensureDataDirectories()` 确保目录存在
- 目录结构：`sessions/`, `skills/`, `cache/`, `logs/`, `settings.json`

---

## 11. Frontend Contract

仅适用于 `src/renderer/`：

REQUIRED
- 新增页面默认使用 React 18 + TypeScript
- 使用 shadcn/ui 风格组件作为基础 UI 体系
- 使用 Tailwind CSS v4 进行界面组织（`@theme` 指令管理主题变量）
- 页面负责路由编排与状态协调
- 可复用逻辑优先抽为 hook 或 Context
- 页面布局层默认自行实现，使用原生标签与 `div` 组织页面骨架
- Tailwind 默认承担布局、留白、背景和响应式职责
- shadcn 风格组件（Button, Input, ScrollArea, Separator 等）承担交互型组件职责
- 文本排版默认使用 `p`、`span`、`strong`、`code` 与 Tailwind 组合实现
- 中文文案使用简体中文，UI 标签与提示使用中文
- 中文字体栈：`-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`
- 页面信息层级必须围绕核心任务组织；消息列表、输入区、技能面板权重分明
- 前端关键 UI 逻辑、状态同步和数据转换必须添加简洁行内注释

### 11.1 组件命名规则

REQUIRED
- React 组件文件使用 PascalCase
- 页面文件使用 PascalCase
- hook 文件使用 camelCase，并以 `use` 开头
- 非组件文件统一使用 kebab-case

Examples
- 页面：`ChatView.tsx`
- 组件：`ChatInput.tsx`、`MessageList.tsx`、`SkillChips.tsx`
- hook：`useAgent.ts`
- 工具：`utils.ts`
- 类型声明：`global.d.ts`
- 样式：`globals.css`

FORBIDDEN
- 在 React 组件文件中使用 kebab-case 或 camelCase
- 在非组件文件中使用 PascalCase
- 在同一项目内混用 `ChatInput.tsx` 与 `chat-input.tsx`

---

## 12. Task → Docs Mapping

执行任务前必须阅读对应文档：

| Task | Read |
|------|------|
| 了解产品定位 / 技术选型 | `docs/melon-mvp-tech-plan.md` |
| 新增 IPC 通道 | `src/types/ipc.ts` → `src/main/bridge.ts` → `src/main/preload.ts` |
| 新增 main process 模块 | `src/main/bridge.ts` + `src/main/preload.ts` |
| 新增 React 页面 | `src/renderer/src/pages/` → `src/renderer/src/context/AppContext.tsx` |
| 新增 UI 组件 | `src/renderer/src/components/ui/` → `src/renderer/src/lib/utils.ts` |
| 新增技能 | `skills/<name>/SKILL.md` |
| 修改样式主题 | `src/renderer/src/styles/globals.css` |
| 密钥相关 | `src/main/crypto.ts` → `docs/melon-mvp-tech-plan.md#九` |
| 打包分发 | `electron-builder.config.js` → `electron.vite.config.ts` |
| IPC 架构理解 | `docs/melon-mvp-tech-plan.md#八` → `src/main/bridge.ts` → `src/main/preload.ts` |

---

## 13. Acceptance Checklist

### 13.1 新 IPC 通道必须满足

- 通道常量定义在 `IPC_CHANNELS` 中
- Bridge 注册 handler 并使用 `wrap()` 包装
- Preload 暴露调用方法并使用 `unwrap()` 解包
- 类型定义在 `src/types/ipc.ts` 中
- 两端类型一致

### 13.2 新 UI 组件必须满足

- 文件命名符合 PascalCase
- 使用 shadcn 风格 + Tailwind 类名
- 类名合并使用 `cn()`
- 覆盖 loading / empty / error 状态（如适用）
- 事件监听在 useEffect return 中清理

### 13.3 全局必须满足

- `pnpm lint`（tsc --noEmit）通过
- `pnpm build` 通过
- 密钥安全约束未被破坏
- 不影响已有功能
