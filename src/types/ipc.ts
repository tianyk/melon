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
} as const;

// Main → Renderer 事件 payload
export interface MelonEventPayloadMap {
  [IPC_CHANNELS.AGENT_MESSAGE_START]: { message: AgentMessage }
  [IPC_CHANNELS.AGENT_MESSAGE_UPDATE]: { message: AgentMessage; event: unknown }
  [IPC_CHANNELS.AGENT_MESSAGE_END]: { message: AgentMessage }
  [IPC_CHANNELS.AGENT_TOOL_START]: { toolCallId: string; name: string; args: unknown }
  [IPC_CHANNELS.AGENT_TOOL_END]: { toolCallId: string; result: unknown; isError: boolean }
  [IPC_CHANNELS.AGENT_TURN_END]: { message: AgentMessage; toolResults: unknown[] }
  [IPC_CHANNELS.AGENT_IDLE]: Record<string, never>
  [IPC_CHANNELS.SESSION_TREE_UPDATED]: { entries: SessionMeta[]; leafId: string }
  [IPC_CHANNELS.MCP_STATUS_CHANGED]: { serverId: string; status: McpServerInfo['status'] }
}

export type MelonEventChannel = keyof MelonEventPayloadMap

export type MelonEventCallback<K extends MelonEventChannel> = (
  data: MelonEventPayloadMap[K]
) => void

// Main → Renderer 事件类型
export type AgentEvent = {
  [K in MelonEventChannel]: { type: K } & MelonEventPayloadMap[K]
}[MelonEventChannel]

export interface MelonApi {
  prompt(text: string): Promise<void>
  abort(): Promise<void>
  skill(name: string): Promise<void>
  steer(text: string): Promise<void>
  navigate(targetId: string): Promise<void>
  compact(instructions?: string): Promise<void>

  listSessions(): Promise<SessionMeta[]>
  createSession(): Promise<string>
  switchSession(id: string): Promise<void>

  connectMcp(config: McpConfig): Promise<void>
  disconnectMcp(serverId: string): Promise<void>
  listMcpServers(): Promise<McpServerInfo[]>

  getSettings(): Promise<Settings>
  setSettings(partial: Partial<Settings>): Promise<void>

  on<K extends MelonEventChannel>(
    channel: K,
    callback: MelonEventCallback<K>
  ): () => void
}
