# 开发文档

## 技术栈

| 层 | 选型 |
|---|------|
| 桌面框架 | Electron + electron-vite |
| UI | React 18 + TypeScript + Tailwind CSS v4 + shadcn/ui |
| 状态管理 | React Context + useReducer |
| Agent 引擎 | @earendil-works/pi-agent-core（当前为 stub） |
| MCP 客户端 | @modelcontextprotocol/sdk（当前为 stub） |
| 打包分发 | electron-builder（macOS dmg / Windows exe） |

## 快速开始

```bash
# 环境要求：Node.js >= 18, pnpm >= 8

pnpm install
pnpm dev        # 启动开发环境
pnpm build      # 构建
pnpm lint       # TypeScript 类型检查
pnpm package:mac  # 打包 macOS dmg
```

## 项目结构

```
melon/
├── src/
│   ├── types/ipc.ts              # IPC 类型定义、通道常量
│   ├── main/
│   │   ├── main.ts               # Electron 入口（窗口、生命周期）
│   │   ├── bridge.ts             # IPC 注册（wrap 统一错误处理）
│   │   ├── preload.ts            # contextBridge → window.Melon
│   │   ├── harness-manager.ts    # AgentHarness 管理
│   │   ├── mcp-manager.ts        # MCP 客户端管理
│   │   ├── settings.ts           # 配置读写
│   │   └── crypto.ts             # 密钥加解密（safeStorage）
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── main.tsx          # React 入口
│           ├── App.tsx           # 根组件
│           ├── context/          # Context + useReducer
│           ├── hooks/            # 自定义 hooks
│           ├── components/
│           │   ├── ui/           # shadcn 风格基础组件
│           │   ├── layout/       # 两栏布局
│           │   ├── sidebar/      # 侧边栏
│           │   ├── chat/         # 消息列表
│           │   └── input/        # 输入框、技能按钮
│           ├── pages/            # 页面级组件
│           ├── styles/           # Tailwind + 主题变量
│           └── lib/              # 工具函数
├── skills/                       # 预装技能 SKILL.md
├── resources/                    # 应用图标
├── docs/
│   ├── melon-mvp-tech-plan.md    # 完整技术方案
│   └── development.md            # 本文档
└── AGENTS.md                     # AI Agent 代码约束规则
```

## IPC 架构

采用 Bridge + Preload + ContextBridge 三层架构：

```text
Renderer（window.Melon.xxx()）
  → Preload（unwrap → ipcRenderer.invoke）
    → Bridge（wrap → ipcMain.handle）
      → Manager（harness/mcp/settings）
        → Storage / Agent / MCP Server
          → Main → Renderer（webContents.send）
            → Preload（Melon.on）
              → Renderer（callback）
```

- **Bridge**（`src/main/bridge.ts`）：集中注册所有 `ipcMain.handle`，`wrap()` 捕获异常并包装为统一 `{ code, data, message }` 格式
- **Preload**（`src/main/preload.ts`）：`contextBridge.exposeInMainWorld('Melon', ...)`，`unwrap()` 解包 Result，直接返回数据或抛出错误
- **Renderer**：通过 `window.Melon` API 调用，事件通过 `window.Melon.on(channel, callback)` 订阅

## 数据存储

所有用户数据在 `~/.melon/`：

```
~/.melon/
├── sessions/          # JSONL 会话记录
├── skills/            # 用户技能
├── settings.json      # 明文配置（语言、主题、模型，不含 API Key）
├── credentials.enc    # API Key（Electron safeStorage 加密）
├── mcp-servers.json   # MCP 服务器配置
├── cache/             # 模型缓存
└── logs/              # 日志
```

## 密钥安全

- API Key 通过 Electron `safeStorage` API 加密写入 `credentials.enc`
- 底层在 macOS 使用 Keychain，Windows 使用 DPAPI
- `settings.json` 只存 `apiKeyConfigured: boolean` 标志
- 渲染进程永远接触不到真实的 API Key 字符串
- 每次 agent 请求时动态解密，不在内存中保留

## 新增功能指南

实现新功能时严格按顺序：

1. **类型定义**（`src/types/ipc.ts`）— 新增类型和 IPC 通道常量
2. **Main Process** — Manager 业务逻辑 → Bridge 注册 handler → Preload 暴露 API
3. **Renderer Process** — Context state/action → hook 封装 → 页面/组件实现

禁止从 UI 组件开始实现后补 IPC 和业务逻辑。

## 更多信息

- 完整技术方案：[docs/melon-mvp-tech-plan.md](melon-mvp-tech-plan.md)
- AI Agent 代码约束：[AGENTS.md](../AGENTS.md)
