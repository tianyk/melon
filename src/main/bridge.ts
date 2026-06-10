import { ipcMain } from 'electron'
import type { HarnessManager } from './harness-manager'
import type { McpManager } from './mcp-manager'
import { loadSettings, saveSettings } from './settings'
import type { Result, McpConfig } from '../types/ipc'

function wrap<T extends unknown[]>(
  fn: (...args: T) => Promise<unknown>
): (...args: T) => Promise<Result<unknown>> {
  return async (...args) => {
    try {
      const data = await fn(...args)
      return { code: 0, data }
    } catch (e) {
      return { code: 1, message: e instanceof Error ? e.message : String(e) }
    }
  }
}

export function registerIpcHandlers(
  harnessManager: HarnessManager,
  mcpManager: McpManager,
): void {
  // ---- Agent ----
  ipcMain.handle('harness:prompt', wrap(async (_e, text: string) => {
    await harnessManager.prompt(text)
  }))

  ipcMain.handle('harness:abort', wrap(async () => {
    await harnessManager.abort()
  }))

  ipcMain.handle('harness:skill', wrap(async (_e, name: string) => {
    await harnessManager.skill(name)
  }))

  ipcMain.handle('harness:steer', wrap(async (_e, text: string) => {
    await harnessManager.steer(text)
  }))

  ipcMain.handle('harness:navigate', wrap(async (_e, targetId: string) => {
    await harnessManager.navigateTree(targetId)
  }))

  ipcMain.handle('harness:compact', wrap(async (_e, instructions?: string) => {
    await harnessManager.compact(instructions)
  }))

  // ---- Session ----
  ipcMain.handle('session:list', wrap(async () => {
    return await harnessManager.listSessions()
  }))

  ipcMain.handle('session:create', wrap(async () => {
    return await harnessManager.createSession()
  }))

  ipcMain.handle('session:switch', wrap(async (_e, id: string) => {
    await harnessManager.switchSession(id)
  }))

  // ---- MCP ----
  ipcMain.handle('mcp:connect', wrap(async (_e, config: McpConfig) => {
    await mcpManager.connect(config)
  }))

  ipcMain.handle('mcp:disconnect', wrap(async (_e, serverId: string) => {
    await mcpManager.disconnect(serverId)
  }))

  ipcMain.handle('mcp:list', wrap(async () => {
    return mcpManager.listServers()
  }))

  // ---- Settings ----
  ipcMain.handle('settings:get', wrap(async () => {
    return loadSettings()
  }))

  ipcMain.handle('settings:set', wrap(async (_e, partial: Record<string, unknown>) => {
    saveSettings(partial as Partial<import('../types/ipc').Settings>)
  }))
}
