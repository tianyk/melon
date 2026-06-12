import { ipcMain } from 'electron';
import type { HarnessManager } from './harness-manager';
import type { McpManager } from './mcp-manager';
import { loadSettings, saveSettings } from './settings';
import { IPC_CHANNELS } from '../types/ipc';
import type { Result, McpConfig, Settings } from '../types/ipc';

function wrap<T extends unknown[]>(
	fn: (...args: T) => Promise<unknown>
): (...args: T) => Promise<Result<unknown>> {
	return async (...args) => {
		try {
			const data = await fn(...args);
			return { code: 0, data };
		} catch (e) {
			return { code: 1, message: e instanceof Error ? e.message : String(e) };
		}
	};
}

export function registerIpcHandlers(
	harnessManager: HarnessManager,
	mcpManager: McpManager,
): void {
	// ---- Agent ----
	ipcMain.handle(IPC_CHANNELS.HARNESS_PROMPT, wrap(async (_e, text: string) => {
		await harnessManager.prompt(text);
	}));

	ipcMain.handle(IPC_CHANNELS.HARNESS_ABORT, wrap(async () => {
		await harnessManager.abort();
	}));

	ipcMain.handle(IPC_CHANNELS.HARNESS_SKILL, wrap(async (_e, name: string) => {
		await harnessManager.skill(name);
	}));

	ipcMain.handle(IPC_CHANNELS.HARNESS_STEER, wrap(async (_e, text: string) => {
		await harnessManager.steer(text);
	}));

	ipcMain.handle(IPC_CHANNELS.HARNESS_NAVIGATE, wrap(async (_e, targetId: string) => {
		await harnessManager.navigateTree(targetId);
	}));

	ipcMain.handle(IPC_CHANNELS.HARNESS_COMPACT, wrap(async (_e, instructions?: string) => {
		await harnessManager.compact(instructions);
	}));

	// ---- Session ----
	ipcMain.handle(IPC_CHANNELS.SESSION_LIST, wrap(async () => {
		return await harnessManager.listSessions();
	}));

	ipcMain.handle(IPC_CHANNELS.SESSION_CREATE, wrap(async () => {
		return await harnessManager.createSession();
	}));

	ipcMain.handle(IPC_CHANNELS.SESSION_SWITCH, wrap(async (_e, id: string) => {
		await harnessManager.switchSession(id);
	}));

	// ---- MCP ----
	ipcMain.handle(IPC_CHANNELS.MCP_CONNECT, wrap(async (_e, config: McpConfig) => {
		await mcpManager.connect(config);
	}));

	ipcMain.handle(IPC_CHANNELS.MCP_DISCONNECT, wrap(async (_e, serverId: string) => {
		await mcpManager.disconnect(serverId);
	}));

	ipcMain.handle(IPC_CHANNELS.MCP_LIST, wrap(async () => {
		return mcpManager.listServers();
	}));

	// ---- Settings ----
	ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, wrap(async () => {
		return loadSettings();
	}));

	ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, wrap(async (_e, partial: Partial<Settings>) => {
		saveSettings(partial);
	}));
}
