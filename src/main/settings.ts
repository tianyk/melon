import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { Settings } from '../types/ipc';

const MELON_DIR = path.join(os.homedir(), '.melon');
const SETTINGS_FILE = path.join(MELON_DIR, 'settings.json');

const DEFAULT_SETTINGS: Settings = {
	language: 'zh-CN',
	theme: 'light',
	model: 'claude-sonnet-4-20250514',
	apiKeyConfigured: false,
};

export function ensureDataDirectories(): void {
	const dirs = ['sessions', 'skills', 'cache', 'logs'];
	if (!fs.existsSync(MELON_DIR)) {
		fs.mkdirSync(MELON_DIR, { recursive: true });
	}
	for (const dir of dirs) {
		const fullPath = path.join(MELON_DIR, dir);
		if (!fs.existsSync(fullPath)) {
			fs.mkdirSync(fullPath, { recursive: true });
		}
	}
}

export function loadSettings(): Settings {
	try {
		if (fs.existsSync(SETTINGS_FILE)) {
			const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
			return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
		}
	} catch {
		// 文件损坏，用默认配置
	}
	return { ...DEFAULT_SETTINGS };
}

export function saveSettings(partial: Partial<Settings>): void {
	const current = loadSettings();
	const merged = { ...current, ...partial };
	// 确保 apiKey 不被写入 settings.json
	delete (merged as Record<string, unknown>).apiKey;
	ensureDataDirectories();
	fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf-8');
}

export { MELON_DIR };
