import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { IPC_CHANNELS } from '../types/ipc'
import type {
  MelonApi,
  MelonEventCallback,
  MelonEventChannel,
  McpConfig,
  Result,
  Settings,
} from '../types/ipc'

function unwrap<TArgs extends unknown[], TData>(
  fn: (...args: TArgs) => Promise<Result<TData>>
): (...args: TArgs) => Promise<TData> {
  return async (...args) => {
    const result = await fn(...args)
    if (result.code === 0) return result.data as TData
    throw new Error(result.message || 'Unknown error')
  }
}

const MelonAPI: MelonApi = {
  // Agent
  prompt: unwrap((text: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.HARNESS_PROMPT, text)
  ),

  abort: unwrap(() =>
    ipcRenderer.invoke(IPC_CHANNELS.HARNESS_ABORT)
  ),

  skill: unwrap((name: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.HARNESS_SKILL, name)
  ),

  steer: unwrap((text: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.HARNESS_STEER, text)
  ),

  navigate: unwrap((targetId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.HARNESS_NAVIGATE, targetId)
  ),

  compact: unwrap((instructions?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.HARNESS_COMPACT, instructions)
  ),

  // Session
  listSessions: unwrap(() =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_LIST)
  ),

  createSession: unwrap(() =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_CREATE)
  ),

  switchSession: unwrap((id: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SESSION_SWITCH, id)
  ),

  // MCP
  connectMcp: unwrap((config: McpConfig) =>
    ipcRenderer.invoke(IPC_CHANNELS.MCP_CONNECT, config)
  ),

  disconnectMcp: unwrap((serverId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.MCP_DISCONNECT, serverId)
  ),

  listMcpServers: unwrap(() =>
    ipcRenderer.invoke(IPC_CHANNELS.MCP_LIST)
  ),

  // Settings
  getSettings: unwrap(() =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET)
  ),

  setSettings: unwrap((partial: Partial<Settings>) =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, partial)
  ),

  // 事件监听（Main → Renderer 推送）
  on: <K extends MelonEventChannel>(channel: K, callback: MelonEventCallback<K>) => {
    const listener = (_event: IpcRendererEvent, data: unknown) => {
      callback(data as Parameters<MelonEventCallback<K>>[0])
    }
    ipcRenderer.on(channel, listener)
    return () => {
      ipcRenderer.removeListener(channel, listener)
    }
  },
}

contextBridge.exposeInMainWorld('Melon', MelonAPI)

export type MelonAPI = typeof MelonAPI
