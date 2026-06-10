# 西瓜 Melon

AI 办公助手桌面应用。选一个技能 → agent 帮你完成，不用学 prompt。

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

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装与运行

```bash
# 安装依赖
pnpm install

# 启动开发环境
pnpm dev

# 构建生产版本
pnpm build

# 打包 macOS 应用
pnpm package:mac
```

### 配置

首次启动后在设置页（侧边栏底部 ⚙ 图标）输入你的 API Key。

API Key 通过系统原生密钥链加密存储（macOS Keychain / Windows DPAPI），不会以明文形式写入任何配置文件。

## 项目结构

```
melon/
├── src/
│   ├── types/ipc.ts              # IPC 类型定义、通道常量
│   ├── main/
│   │   ├── main.ts               # Electron 入口
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
│           ├── hooks/            # useAgent 等自定义 hooks
│           ├── components/
│           │   ├── ui/           # shadcn 风格基础组件
│           │   ├── layout/       # 两栏布局
│           │   ├── sidebar/      # 侧边栏（会话列表、设置）
│           │   ├── chat/         # 消息列表、消息气泡
│           │   └── input/        # 输入框、技能快捷按钮
│           ├── pages/            # 页面级组件
│           ├── styles/           # Tailwind v4 + 主题变量
│           └── lib/              # 工具函数
├── skills/                       # 6 个预装技能
│   ├── translate/SKILL.md        # 翻译文本
│   ├── polish/SKILL.md           # 润色文案
│   ├── file-organize/SKILL.md    # 整理文件
│   ├── web-search/SKILL.md       # 搜索信息
│   ├── price-compare/SKILL.md    # 商品比价
│   └── batch-rename/SKILL.md     # 批量重命名
├── resources/                    # 应用图标
└── 配置文件（electron-vite, TS, Tailwind, electron-builder）
```

## 数据存储

所有用户数据存储在 `~/.melon/` 目录：

```
~/.melon/
├── sessions/          # JSONL 会话记录
├── skills/            # 用户安装的技能
├── settings.json      # 用户设置（不含 API Key）
├── credentials.enc    # API Key 加密存储
├── mcp-servers.json   # MCP 服务器配置
├── cache/             # 模型响应缓存
└── logs/              # 运行日志
```

## IPC 架构

采用 Bridge + Preload + ContextBridge 三层架构：

- **Bridge** (`src/main/bridge.ts`)：集中注册所有 `ipcMain.handle`，`wrap()` 捕获异常并包装为统一 `Result<T>` 格式
- **Preload** (`src/main/preload.ts`)：`contextBridge.exposeInMainWorld('Melon', ...)`，`unwrap()` 解包 `Result<T>` 直接返回数据或抛出错误
- **Renderer**：通过 `window.Melon.prompt()` / `window.Melon.getSettings()` 等 API 调用

## 开发

```bash
# TypeScript 类型检查
pnpm lint

# 构建
pnpm build

# 一键打包
pnpm package:mac
```
