import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import type { Result } from '../types/ipc'

function unwrap<T>(result: Result<T>): T {
  if (result.code === 0) return result.data as T
  throw new Error(result.message || 'Unknown error')
}

const MelonAPI = {
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
  connectMcp: (config: unknown) =>
    unwrap(ipcRenderer.invoke('mcp:connect', config)),

  disconnectMcp: (serverId: string) =>
    unwrap(ipcRenderer.invoke('mcp:disconnect', serverId)),

  listMcpServers: () =>
    unwrap(ipcRenderer.invoke('mcp:list')),

  // Settings
  getSettings: () =>
    unwrap(ipcRenderer.invoke('settings:get')),

  setSettings: (partial: Record<string, unknown>) =>
    unwrap(ipcRenderer.invoke('settings:set', partial)),

  // 事件监听（Main → Renderer 推送）
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const listener = (_event: IpcRendererEvent, ...args: unknown[]) => callback(...args)
    ipcRenderer.on(channel, listener)
    return () => {
      ipcRenderer.removeListener(channel, listener)
    }
  },
}

contextBridge.exposeInMainWorld('Melon', MelonAPI)

export type MelonAPI = typeof MelonAPI
