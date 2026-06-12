# Summary

## Architecture Invariants
- IPC 三层：Bridge(wrap) → Preload(unwrap) → Renderer(window.Melon)
- 密钥仅 safeStorage 加密存储，settings.json 只存 apiKeyConfigured flag
- 主进程不写 React，渲染进程不调 Node API
- 状态管理只用 React Context + useReducer，禁外部库

## Current Pitfalls
- pi-agent-core 未集成，harness-manager 当前为 stub（echo 响应）
- MCP 客户端未集成，mcp-manager 当前为 stub
- 预装技能仅有 SKILL.md 占位，无实际执行逻辑

## Stable Decisions
- pnpm 为唯一包管理器
- Tailwind CSS v4（CSS-first @theme 配置）
- shadcn/ui 风格组件（非 Ant Design）
- 组件 PascalCase，hook camelCase(use前缀)，工具 kebab-case
- Renderer 原生能力调用应收敛到 Melon SDK facade，避免业务组件直接依赖 window.Melon

## Active Repo Conventions
- 类型定义在 src/types/ipc.ts，通道常量在 IPC_CHANNELS
- 所有 IPC handler 集中 bridge.ts + wrap() 包装
- UI 状态三域：chat / session / settings，统一 AppContext
