# 西瓜 Melon MVP 技术方案

## 一、产品定位

| 维度 | 决策 |
|------|------|
| 名称 | 中文「西瓜」/ 英文「Melon」 |
| 目标用户 | 普通办公用户（非程序员） |
| 核心价值 | 选一个技能 → agent 帮你完成，不用学 prompt |
| 平台 | macOS 优先，Windows 后续 |
| 定价 | 免费（用户自带 API Key） |

## 二、技术选型

| 层 | 选型 | 原因 |
|---|------|------|
| 桌面框架 | **Electron** | 跨平台，成熟生态 |
| UI 框架 | **React 18** + **TypeScript** | 组件化，生态丰富 |
| UI 组件库 | **shadcn/ui**（基于 Tailwind CSS） | 精致，主题可定制，零运行时 |
| 构建 | **Vite**（electron-vite） | 快，HMR 开发体验好 |
| Agent 引擎 | **@earendil-works/pi-agent-core** | 开源，内置 skill/session/compaction/branch |
| Agent 核心类 | **AgentHarness** | skill 调用、session 持久化、compaction 一键搞定 |
| MCP 客户端 | **@modelcontextprotocol/sdk** | MCP 标准，stdio transport |
| 状态管理 | **Jotai** / **Zustand** | 轻量，适合 Electron 主进程+渲染进程 |
| IPC | Electron **contextBridge** + **ipcMain/Renderer** | 安全隔离 |
| 会话存储 | 文件系统 **JSONL**（pi-agent-core 内置） | 兼容好，可导出 |
| 打包/分发 | **electron-builder** | macOS dmg + Windows exe |

## 三、架构设计

```
┌─ Renderer Process ──────────────────────────────────────┐
│  ┌─ Sidebar ───────┬─ Chat Area ───────────────────────┐│
│  │ Agent  ☰        │  有什么可以帮你的？                ││
│  │ ─────────────── │                                   ││
│  │ 会话            │  [翻译] [润色] [整理] [搜索]      ││
│  │ [+ 新建会话]    │                                   ││
│  │ 🔍 搜索...      │  用户消息气泡                     ││
│  │                 │     ← 助手回复                    ││
│  │ 今天            │     ┌ 工具调用 ────────┐         ││
│  │ ┌ 整理下载 ───┐ │     │ ✓ list_directory │         ││
│  │ └────────────┘ │     └──────────────────┘         ││
│  │ ┌ 翻译说明 ───┐ │                                   ││
│  │ └────────────┘ │                                   ││
│  │ 昨天            │                                   ││
│  │ ┌ 对比价格 ───┐ │  ────────────────────────────    ││
│  │ │    分支      │ │  [file-organize]  [+]  __ →     ││
│  │ └────────────┘ │  0 / 8000                         ││
│  │                 │                                   ││
│  │ ──────────────  │                                   ││
│  │ ⚙ 设置    ⌘,   │                                   ││
│  └────────────────┴───────────────────────────────────┘│
│                        ↕ IPC                            │
├─ Main Process ─────────────────────────────────────────┤
│  ┌─ AgentHarness ──────────────────────────────────┐   │
│  │  skills[] ← loadSkills()  tools[] ← MCP client │   │
│  │  session ← JsonlSessionRepo                     │   │
│  │  compaction → auto                              │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─ MCP Manager ───────────────────────────────────┐   │
│  │  stdio transport → listTools → convert AgentTool│   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─ File System ───────────────────────────────────┐   │
│  │  ~/.melon/sessions/   ~/.melon/skills/           │   │
│  │  ~/.melon/settings.json   ~/.melon/mcp.json      │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

## 四、IPC 通道设计

```
┌────────── Renderer → Main ──────────┐
├─────────────────────────────────────┤
│ harness:prompt        (text, images?) → void
│ harness:abort          → void
│ harness:skill          (name: string) → void
│ harness:steer          (text: string) → void
│ harness:navigate       (targetId: string) → void
│ harness:compact        (instructions?) → void
│ session:list           → { id, title, time }[]
│ session:create         → sessionId
│ session:switch         (sessionId: string) → void
│ mcp:connect            (config) → void
│ mcp:disconnect         (serverId: string) → void
│ mcp:list               → McpServerInfo[]
│ settings:get           → Settings
│ settings:set           (partial Settings) → void
├────────── Main → Renderer (event) ────┤
├─────────────────────────────────────┤
│ agent:message-start      (message)
│ agent:message-update     (message, event)
│ agent:message-end        (message)
│ agent:tool-start         (toolCallId, name, args)
│ agent:tool-update        (toolCallId, partialResult)
│ agent:tool-end           (toolCallId, result, isError)
│ agent:turn-end           (message, toolResults)
│ agent:idle               ()
│ session:tree-updated     (entries, leafId)
│ mcp:status-changed       (serverId, status)
```

## 五、功能设计

### MVP 核心功能

| 功能 | 描述 | 优先级 |
|------|------|--------|
| **流式对话** | 多轮对话，Markdown 渲染，助手消息流式展示 | P0 |
| **技能系统** | 6 个预装 skill，skill 面板点选触发，输入 / 触发 | P0 |
| **MCP 集成** | stdio transport，listTools 转 AgentTool，设置页管理 | P0 |
| **会话管理** | 新建/切换/搜索会话，会话列表 sidebar | P0 |
| **会话分叉** | navigateTree()，回到历史节点重新开始 | P1 |
| **Compaction** | 长对话自动压缩，避免超 context window | P1 |
| **设置** | API Key 配置、语言切换、外观主题 | P0 |
| **工具调用展示** | 折叠卡片，显示工具名/参数/结果/耗时 | P1 |

### MVP 预装技能（6个）

| 技能 | 依赖 MCP | 场景 |
|------|---------|------|
| 翻译文本 | 无 | 中英互译，多语种 |
| 润色文案 | 无 | 邮件、报告、朋友圈润色 |
| 整理文件 | Filesystem MCP | 按类型分类、清理临时文件 |
| 搜索信息 | Brave Search MCP | 网页搜索 + AI 总结 |
| 商品比价 | Puppeteer MCP | 多平台比价 |
| 批量重命名 | Filesystem MCP | 按规则批量重命名文件 |

### 明确不做（v1.1+）

- 用户登录/注册（纯本地，无需帐户）
- 浏览器自动化 UI（v1.1 通过 Puppeteer MCP 支持）
- 技能市场/分享
- 多模型对比
- 图片生成
- 联网搜索免 MCP 内置

## 六、开发阶段

| 阶段 | 内容 | 产出 |
|------|------|------|
| **W1-2: 骨架** | Electron + React 脚手架，两栏布局，shadcn 主题 | 窗口能跑，UI 空白但结构对 |
| **W3-4: Agent 闭环** | 集成 pi-agent-core AgentHarness，流式对话 | 能发消息、看到流式回复、多轮对话 |
| **W5: 会话** | 会话持久化、sidebar 会话列表、分叉 | 关闭重开能恢复 |
| **W6-7: Skill** | 技能加载系统、预装 6 个 skill、skill 面板 | 用户点选 skill 就能用 |
| **W8-9: MCP** | MCP 客户端、stdio transport、工具转换、设置管理 | 连接 MCP 服务器，agent 自动获得工具 |
| **W10: Compaction** | 长对话压缩 | 不会因对话太长而翻车 |
| **W11-12: 打磨** | 中文文案、交互细节、打包发布 | macOS dmg 可分发 |

## 七、数据存储策略

```
~/.melon/
├── sessions/                 # JSONL 格式会话记录
│   └── {uuid}.jsonl
├── skills/                   # 预装 + 用户安装的 skill
│   ├── translate/SKILL.md
│   ├── file-organize/SKILL.md
│   └── ...
├── settings.json             # 用户设置（明文，不包含密钥）
├── mcp-servers.json          # MCP 服务器配置
├── cache/                    # 模型响应缓存
└── logs/                     # 运行日志
```

加载 skill 时同时扫描 `~/.agents/skills/`（兼容行业标准），但对非办公场景的 skill 做过滤。

## 八、IPC 架构：Bridge + Preload + ContextBridge

借鉴 vte-desktop 项目的三层架构模式，实现安全、类型化的主进程与渲染进程通信。

### 目录结构

```
src/
├── main/
│   ├── main.ts              # 应用入口，创建窗口
│   ├── bridge.ts            # IPC 注册层（ipcMain.handle）
│   ├── preload.ts           # 暴露层（contextBridge.exposeInMainWorld）
│   ├── harness-manager.ts   # AgentHarness 生命周期管理
│   ├── mcp-manager.ts       # MCP 客户端管理
│   ├── settings.ts          # 配置读写
│   └── crypto.ts            # 密钥加解密
├── types/
│   └── ipc.ts               # IPC 通道类型定义
└── renderer/
    └── hooks/
        └── useAgent.ts      # 渲染进程侧 hooks（封装 window.Melon 调用）
```

### 主进程 Bridge 层 (`src/main/bridge.ts`)

所有 IPC 通道在 bridge.ts 中集中注册，处理函数用 `wrap()` 包裹，返回统一格式：

```typescript
import { ipcMain } from 'electron';
import type { HarnessManager } from './harness-manager';
import type { McpManager } from './mcp-manager';

// 统一返回格式
interface Result<T> {
  code: 0 | 1;
  data?: T;
  message?: string;
}

function wrap<T extends any[]>(
  fn: (...args: T) => Promise<any>
): (...args: T) => Promise<Result<any>> {
  return async (...args) => {
    try {
      const data = await fn(...args);
      return { code: 0, data };
    } catch (e) {
      return { code: 1, message: e instanceof Error ? e.message : String(e) };
    }
  };
}

// 注册所有 IPC 通道
export function registerIpcHandlers(
  harnessManager: HarnessManager,
  mcpManager: McpManager,
) {
  // ---- Agent ----
  ipcMain.handle('harness:prompt', wrap(async (_, text: string) => {
    return await harnessManager.harness.prompt(text);
  }));

  ipcMain.handle('harness:abort', wrap(async () => {
    harnessManager.harness.abort();
  }));

  ipcMain.handle('harness:skill', wrap(async (_, name: string) => {
    return await harnessManager.harness.skill(name);
  }));

  ipcMain.handle('harness:steer', wrap(async (_, text: string) => {
    await harnessManager.steer(text);
  }));

  ipcMain.handle('harness:navigate', wrap(async (_, targetId: string) => {
    return await harnessManager.harness.navigateTree(targetId);
  }));

  ipcMain.handle('harness:compact', wrap(async (_, instructions?: string) => {
    return await harnessManager.harness.compact(instructions);
  }));

  // ---- Session ----
  ipcMain.handle('session:list', wrap(async () => {
    return await harnessManager.listSessions();
  }));

  ipcMain.handle('session:create', wrap(async () => {
    return await harnessManager.createSession();
  }));

  ipcMain.handle('session:switch', wrap(async (_, id: string) => {
    await harnessManager.switchSession(id);
  }));

  // ---- MCP ----
  ipcMain.handle('mcp:connect', wrap(async (_, config: McpConfig) => {
    await mcpManager.connect(config);
  }));

  ipcMain.handle('mcp:disconnect', wrap(async (_, serverId: string) => {
    await mcpManager.disconnect(serverId);
  }));

  ipcMain.handle('mcp:list', wrap(async () => {
    return mcpManager.listServers();
  }));

  // ---- Settings ----
  ipcMain.handle('settings:get', wrap(async () => {
    return loadSettings();  // from settings.ts
  }));

  ipcMain.handle('settings:set', wrap(async (_, partial: Partial<Settings>) => {
    saveSettings(partial);  // from settings.ts
  }));
}
```

### Preload 层 (`src/main/preload.ts`)

使用 `contextBridge.exposeInMainWorld()` 暴露 API，`unwrap()` 去掉 Result 包装层：

```typescript
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type { AssistantMessageEvent } from './types/ipc';

// 去掉 Result 包装，直接返回数据或抛出错误
function unwrap<T>(result: { code: number; data?: T; message?: string }): T {
  if (result.code === 0) return result.data as T;
  throw new Error(result.message || 'Unknown error');
}

// 暴露到渲染进程 window.Melon
contextBridge.exposeInMainWorld('Melon', {
  // Agent
  prompt: (text: string) =>
    unwrap(ipcRenderer.invoke('harness:prompt', text)),

  abort: () =>
    unwrap(ipcRenderer.invoke('harness:abort')),

  skill: (name: string) =>
    unwrap(ipcRenderer.invoke('harness:skill', name)),

  steer: (text: string) =>
    unwrap(ipcRenderer.invoke('harness:steer', text)),

  navigate: (targetId: string) =>
    unwrap(ipcRenderer.invoke('harness:navigate', targetId)),

  compact: (instructions?: string) =>
    unwrap(ipcRenderer.invoke('harness:compact', instructions)),

  // Session
  listSessions: () =>
    unwrap(ipcRenderer.invoke('session:list')),

  createSession: () =>
    unwrap(ipcRenderer.invoke('session:create')),

  switchSession: (id: string) =>
    unwrap(ipcRenderer.invoke('session:switch', id)),

  // MCP
  connectMcp: (config: McpConfig) =>
    unwrap(ipcRenderer.invoke('mcp:connect', config)),

  disconnectMcp: (serverId: string) =>
    unwrap(ipcRenderer.invoke('mcp:disconnect', serverId)),

  listMcpServers: () =>
    unwrap(ipcRenderer.invoke('mcp:list')),

  // Settings
  getSettings: () =>
    unwrap(ipcRenderer.invoke('settings:get')),

  setSettings: (partial: Partial<Settings>) =>
    unwrap(ipcRenderer.invoke('settings:set', partial)),

  // 事件监听（Main → Renderer 推送）
  on: (channel: string, callback: (...args: any[]) => void) => {
    const listener = (_event: IpcRendererEvent, ...args: any[]) => callback(...args);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
});

// TypeScript 类型声明（global.d.ts）
// declare global {
//   interface Window {
//     Melon: typeof import('../main/preload').MelonAPI;
//   }
// }
```

### 渲染进程使用

```typescript
// React hook 示例
import { useEffect, useState } from 'react';

export function usePrompt() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    // 监听主进程推送的流式事件
    const unsub1 = window.Melon.on('agent:message-update', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    const unsub2 = window.Melon.on('agent:idle', () => {
      setStreaming(false);
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const submit = async (text: string) => {
    setStreaming(true);
    await window.Melon.prompt(text);
  };

  return { messages, streaming, submit };
}
```

### IPC 类型定义 (`src/types/ipc.ts`)

```typescript
import type { AssistantMessageEvent as AiEvent } from '@earendil-works/pi-ai';
import type { AgentMessage, SessionTreeEntry } from '@earendil-works/pi-agent-core';

export interface McpConfig {
  id: string;
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface McpServerInfo {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  toolCount: number;
}

export interface SessionMeta {
  id: string;
  title: string;
  updatedAt: string;
  isActive: boolean;
  hasBranches: boolean;
}

export interface Settings {
  language: 'zh-CN' | 'en-US';
  theme: 'light' | 'dark';
  model: string;
  apiKeyConfigured: boolean;
}

// Main → Renderer 事件类型
export type AgentEvent =
  | { type: 'agent:message-start'; message: AgentMessage }
  | { type: 'agent:message-update'; message: AgentMessage; event: AiEvent }
  | { type: 'agent:message-end'; message: AgentMessage }
  | { type: 'agent:tool-start'; toolCallId: string; name: string; args: unknown }
  | { type: 'agent:tool-end'; toolCallId: string; result: unknown; isError: boolean }
  | { type: 'agent:turn-end'; message: AgentMessage; toolResults: unknown[] }
  | { type: 'agent:idle' }
  | { type: 'session:tree-updated'; entries: SessionTreeEntry[]; leafId: string }
  | { type: 'mcp:status-changed'; serverId: string; status: string };
```

## 九、API 密钥安全方案

### 方案：Electron safeStorage + 独立加密文件

不将 API Key 存储在任何明文配置文件中，使用 Electron 的 `safeStorage` API 加密保存，底层自动对接操作系统原生密钥链。

```typescript
// src/main/crypto.ts
import { safeStorage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const MELON_DIR = path.join(os.homedir(), '.melon');
const CREDENTIALS_FILE = path.join(MELON_DIR, 'credentials.enc');

// 保存 API Key（加密写入）
export function saveApiKey(apiKey: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('系统不支持加密存储');
  }
  const encrypted = safeStorage.encryptString(apiKey);
  fs.mkdirSync(path.dirname(CREDENTIALS_FILE), { recursive: true });
  fs.writeFileSync(CREDENTIALS_FILE, encrypted);
}

// 读取 API Key（解密）
export function loadApiKey(): string | null {
  try {
    if (!safeStorage.isEncryptionAvailable()) return null;
    const encrypted = fs.readFileSync(CREDENTIALS_FILE);
    return safeStorage.decryptString(encrypted);
  } catch {
    return null;  // 文件不存在或解密失败
  }
}

// 删除 API Key
export function deleteApiKey(): void {
  try { fs.unlinkSync(CREDENTIALS_FILE); } catch { /* ignore */ }
}

// 检查是否已配置 API Key
export function hasApiKey(): boolean {
  return loadApiKey() !== null;
}
```

### 加密机制

| 平台 | 底层实现 | 安全级别 |
|------|---------|---------|
| **macOS** | Keychain Services（`SecKeychain`） | 绑定当前用户账户，进程沙箱隔离 |
| **Windows** | DPAPI（`CryptProtectData`） | 绑定当前用户 + 当前机器，AES-256 |
| **Linux** | libsecret（`secret-tool`） | 依赖 GNOME Keyring / KDE Wallet |

### 数据分离原则

```
~/.melon/
├── settings.json        # 明文 — 语言、主题、模型名
│   {
│     "language": "zh-CN",
│     "theme": "light",
│     "model": "claude-sonnet-4",
│     "apiKeyConfigured": true   ← 只存一个标志位
│   }
├── credentials.enc      # 加密二进制 — 只有 API Key
├── mcp-servers.json     # 明文 — MCP 配置（不含密钥）
└── sessions/            # 明文 JSONL — 会话记录
```

原则：**settings.json 不存密钥，credentials.enc 只存密钥**。渲染进程只能通过 IPC 调用 `settings:get` 拿到 `apiKeyConfigured: true/false`，永远碰不到真实的 API Key 字符串。

### 设置页 UI 行为

```
┌─ 设置 — API 密钥 ──────────────────────────┐
│                                          │
│  API 密钥                                │
│  ┌──────────────────────────────┐ [保存] │
│  │ ●●●●●●●●●●●●●●●●●●●●●●●●●●  │       │  ← 密文显示
│  └──────────────────────────────┘       │
│                                          │
│  状态：✅ 已配置（sk-ant-...xxxx）        │  ← 只显示后四位
│                                          │
│  [更换密钥]  [删除密钥]                  │
└──────────────────────────────────────────┘
```

- 首次输入：直接显示明文
- 已配置状态：显示圆点 + 后四位
- 点击「更换」：清空输入框，重新输入
- 删除：调用 `safeStorage.decryptString` 校验后删除文件

### AgentHarness 注入

```typescript
// src/main/harness-manager.ts
import { loadApiKey } from './crypto';

function createHarness(model: Model): AgentHarness {
  return new AgentHarness({
    env: new NodeExecutionEnv({ cwd: os.homedir() }),
    model,
    getApiKeyAndHeaders: async (model) => ({
      apiKey: loadApiKey() || '',
    }),
    // ...
  });
}
```

每次 agent 发起请求时，`getApiKeyAndHeaders` 动态从加密文件读取密钥，不在内存中长期保留。

### 安全边界

| 威胁模型 | 防护 |
|---------|------|
| 他人登录同台机器 | 密钥绑定用户账户，其他用户无法解密 |
| 磁盘被盗 | 文件加密存储，无法直接读取 |
| 恶意软件读取内存 | 不可防护（任何桌面应用都无法避免） |
| 用户主动导出 | 不提供导出功能 |
| settings.json 泄漏 | 文件不含密钥，泄漏无影响 |

## 十、目录结构总览

```
melon-desktop/
├── package.json
├── electron-builder.yml
├── tsconfig.json
├── tailwind.config.js
├── public/
│   └── index.html
├── assets/icon/
│   └── icon.png
├── skills/                        # 预装 skill
│   ├── translate/SKILL.md
│   ├── polish/SKILL.md
│   ├── file-organize/SKILL.md
│   ├── web-search/SKILL.md
│   ├── price-compare/SKILL.md
│   └── batch-rename/SKILL.md
├── src/
│   ├── types/
│   │   └── ipc.ts                 # IPC 类型定义
│   ├── main/
│   │   ├── main.ts                # 应用入口
│   │   ├── bridge.ts              # IPC 注册
│   │   ├── preload.ts             # contextBridge 暴露
│   │   ├── harness-manager.ts     # AgentHarness 管理
│   │   ├── mcp-manager.ts         # MCP 客户端管理
│   │   ├── settings.ts            # 配置读写
│   │   └── crypto.ts              # 密钥加解密
│   └── renderer/
│       ├── index.tsx
│       ├── app.tsx
│       ├── hooks/
│       │   └── useAgent.ts        # 封装 window.Melon
│       ├── components/
│       │   ├── sidebar/
│       │   │   ├── session-list.tsx
│       │   │   └── settings-entry.tsx
│       │   ├── chat/
│       │   │   ├── message-list.tsx
│       │   │   ├── user-bubble.tsx
│       │   │   ├── assistant-message.tsx
│       │   │   ├── tool-call-card.tsx
│       │   │   └── streaming-text.tsx
│       │   ├── input/
│       │   │   ├── chat-input.tsx
│       │   │   └── skill-chips.tsx
│       │   └── settings/
│       │       ├── settings-nav.tsx
│       │       ├── settings-api-keys.tsx
│       │       ├── settings-mcp.tsx
│       │       └── settings-general.tsx
│       └── pages/
│           ├── chat-view.tsx
│           └── settings-view.tsx
└── resources/
    └── ...
```
