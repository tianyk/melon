import { IPC_CHANNELS } from '@shared/ipc'
import type {
  AgentMessage,
  McpConfig,
  McpServerInfo,
  MelonApi,
  MelonEventCallback,
  MelonEventChannel,
  MelonEventPayloadMap,
  SessionMeta,
  Settings,
} from '@shared/ipc'

const DEFAULT_SETTINGS: Settings = {
  language: 'zh-CN',
  theme: 'light',
  model: 'claude-sonnet-4-20250514',
  apiKeyConfigured: false,
}

export function createMelonDevMock(): MelonApi {
  let sessions: SessionMeta[] = []
  let activeSessionId: string | null = null
  let settings: Settings = { ...DEFAULT_SETTINGS }
  const mcpServers = new Map<string, McpServerInfo>()
  const listeners = new Map<MelonEventChannel, Set<(data: unknown) => void>>()

  function emit<K extends MelonEventChannel>(
    channel: K,
    data: MelonEventPayloadMap[K]
  ): void {
    listeners.get(channel)?.forEach(listener => listener(data))
  }

  async function ensureSession(): Promise<string> {
    if (activeSessionId) return activeSessionId
    return api.createSession()
  }

  function setActiveSession(id: string): void {
    sessions = sessions.map(session => ({ ...session, isActive: session.id === id }))
    activeSessionId = id
    emit(IPC_CHANNELS.SESSION_TREE_UPDATED, { entries: sessions, leafId: id })
  }

  async function streamMockReply(text: string): Promise<void> {
    await ensureSession()

    const message: AgentMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }
    const content = [
      `开发模式回复：${text}`,
      '',
      '当前前端以 renderer-only 模式运行，数据来自本地 mock。',
    ].join('\n')

    emit(IPC_CHANNELS.AGENT_MESSAGE_START, { message })

    let accumulated = ''
    for (const char of content) {
      accumulated += char
      emit(IPC_CHANNELS.AGENT_MESSAGE_UPDATE, {
        message: { ...message, content: accumulated },
        event: { chunk: char, mock: true },
      })
      await delay(8)
    }

    emit(IPC_CHANNELS.AGENT_MESSAGE_END, {
      message: { ...message, content: accumulated },
    })
    emit(IPC_CHANNELS.AGENT_IDLE, {})
  }

  const api: MelonApi = {
    async prompt(text: string) {
      await streamMockReply(text)
    },

    async abort() {
      emit(IPC_CHANNELS.AGENT_IDLE, {})
    },

    async skill(name: string) {
      await streamMockReply(`使用 ${name} 技能处理当前任务`)
    },

    async steer(text: string) {
      await streamMockReply(text)
    },

    async navigate() {
      emit(IPC_CHANNELS.AGENT_IDLE, {})
    },

    async compact() {
      emit(IPC_CHANNELS.AGENT_IDLE, {})
    },

    async listSessions() {
      return sessions
    },

    async createSession() {
      const id = crypto.randomUUID()
      const session: SessionMeta = {
        id,
        title: `开发会话 ${sessions.length + 1}`,
        updatedAt: new Date().toISOString(),
        isActive: true,
        hasBranches: false,
      }
      sessions = [
        session,
        ...sessions.map(item => ({ ...item, isActive: false })),
      ]
      activeSessionId = id
      emit(IPC_CHANNELS.SESSION_TREE_UPDATED, { entries: sessions, leafId: id })
      return id
    },

    async switchSession(id: string) {
      if (sessions.some(session => session.id === id)) {
        setActiveSession(id)
      }
    },

    async connectMcp(config: McpConfig) {
      const server: McpServerInfo = {
        id: config.id,
        name: config.name,
        status: 'connected',
        toolCount: 0,
      }
      mcpServers.set(config.id, server)
      emit(IPC_CHANNELS.MCP_STATUS_CHANGED, {
        serverId: config.id,
        status: server.status,
      })
    },

    async disconnectMcp(serverId: string) {
      const server = mcpServers.get(serverId)
      if (!server) return
      const next: McpServerInfo = { ...server, status: 'disconnected' }
      mcpServers.set(serverId, next)
      emit(IPC_CHANNELS.MCP_STATUS_CHANGED, {
        serverId,
        status: next.status,
      })
    },

    async listMcpServers() {
      return Array.from(mcpServers.values())
    },

    async getSettings() {
      return settings
    },

    async setSettings(partial: Partial<Settings>) {
      settings = { ...settings, ...partial }
    },

    on<K extends MelonEventChannel>(channel: K, callback: MelonEventCallback<K>) {
      if (!listeners.has(channel)) {
        listeners.set(channel, new Set())
      }
      const listener = callback as (data: unknown) => void
      listeners.get(channel)?.add(listener)
      return () => {
        listeners.get(channel)?.delete(listener)
      }
    },
  }

  return api
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
