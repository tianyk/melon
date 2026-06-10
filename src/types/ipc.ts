// IPC 通道类型定义

// 统一返回格式
export interface Result<T> {
  code: 0 | 1
  data?: T
  message?: string
}

// MCP 服务器配置
export interface McpConfig {
  id: string
  name: string
  command: string
  args: string[]
  env?: Record<string, string>
}

// MCP 服务器信息
export interface McpServerInfo {
  id: string
  name: string
  status: 'connected' | 'disconnected' | 'error'
  toolCount: number
}

// 会话元数据
export interface SessionMeta {
  id: string
  title: string
  updatedAt: string
  isActive: boolean
  hasBranches: boolean
}

// 用户设置（不含 API Key）
export interface Settings {
  language: 'zh-CN' | 'en-US'
  theme: 'light' | 'dark'
  model: string
  apiKeyConfigured: boolean
}

// 消息
export interface AgentMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

// 工具调用
export interface ToolCall {
  id: string
  name: string
  args: unknown
}

// Main → Renderer 事件类型
export type AgentEvent =
  | { type: 'agent:message-start'; message: AgentMessage }
  | { type: 'agent:message-update'; message: AgentMessage; event: unknown }
  | { type: 'agent:message-end'; message: AgentMessage }
  | { type: 'agent:tool-start'; toolCallId: string; name: string; args: unknown }
  | { type: 'agent:tool-end'; toolCallId: string; result: unknown; isError: boolean }
  | { type: 'agent:turn-end'; message: AgentMessage; toolResults: unknown[] }
  | { type: 'agent:idle' }
  | { type: 'session:tree-updated'; entries: unknown[]; leafId: string }
  | { type: 'mcp:status-changed'; serverId: string; status: string }

// IPC 通道名称
export const IPC_CHANNELS = {
  // Renderer → Main (invoke)
  HARNESS_PROMPT: 'harness:prompt',
  HARNESS_ABORT: 'harness:abort',
  HARNESS_SKILL: 'harness:skill',
  HARNESS_STEER: 'harness:steer',
  HARNESS_NAVIGATE: 'harness:navigate',
  HARNESS_COMPACT: 'harness:compact',
  SESSION_LIST: 'session:list',
  SESSION_CREATE: 'session:create',
  SESSION_SWITCH: 'session:switch',
  MCP_CONNECT: 'mcp:connect',
  MCP_DISCONNECT: 'mcp:disconnect',
  MCP_LIST: 'mcp:list',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  // Main → Renderer (send)
  AGENT_MESSAGE_START: 'agent:message-start',
  AGENT_MESSAGE_UPDATE: 'agent:message-update',
  AGENT_MESSAGE_END: 'agent:message-end',
  AGENT_TOOL_START: 'agent:tool-start',
  AGENT_TOOL_END: 'agent:tool-end',
  AGENT_TURN_END: 'agent:turn-end',
  AGENT_IDLE: 'agent:idle',
  SESSION_TREE_UPDATED: 'session:tree-updated',
  MCP_STATUS_CHANGED: 'mcp:status-changed',
} as const
