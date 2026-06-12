import { safeStorage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { MELON_DIR } from './settings';

const CREDENTIALS_FILE = path.join(MELON_DIR, 'credentials.enc');

export function saveApiKey(apiKey: string): void {
	if (!safeStorage.isEncryptionAvailable()) {
		throw new Error('系统不支持加密存储');
	}
	const encrypted = safeStorage.encryptString(apiKey);
	if (!fs.existsSync(path.dirname(CREDENTIALS_FILE))) {
		fs.mkdirSync(path.dirname(CREDENTIALS_FILE), { recursive: true });
	}
	fs.writeFileSync(CREDENTIALS_FILE, encrypted);
}

export function loadApiKey(): string | null {
	try {
		if (!safeStorage.isEncryptionAvailable()) return null;
		if (!fs.existsSync(CREDENTIALS_FILE)) return null;
		const encrypted = fs.readFileSync(CREDENTIALS_FILE);
		return safeStorage.decryptString(encrypted);
	} catch {
		return null;
	}
}

export function deleteApiKey(): void {
	try {
		fs.unlinkSync(CREDENTIALS_FILE);
	} catch {
		/* ignore */
	}
}

export function hasApiKey(): boolean {
	return loadApiKey() !== null;
}
