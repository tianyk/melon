import { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../types/ipc';
import type { MelonEventChannel, MelonEventPayloadMap, SessionMeta } from '../types/ipc';

const SKILLS = [
	{ name: 'translate', label: '翻译文本', description: '中英互译，多语种', icon: 'Languages' },
	{ name: 'polish', label: '润色文案', description: '邮件、报告、朋友圈润色', icon: 'PenTool' },
	{ name: 'file-organize', label: '整理文件', description: '按类型分类、清理临时文件', icon: 'FolderTree' },
	{ name: 'web-search', label: '搜索信息', description: '网页搜索 + AI 总结', icon: 'Search' },
	{ name: 'price-compare', label: '商品比价', description: '多平台比价', icon: 'DollarSign' },
	{ name: 'batch-rename', label: '批量重命名', description: '按规则批量重命名文件', icon: 'FileEdit' },
];

// 桩实现 — 后续替换为真实的 AgentHarness
export class HarnessManager {
	private mainWindow: BrowserWindow;
	private sessionCounter = 0;
	private sessions: SessionMeta[] = [];
	private activeSessionId: string | null = null;

	constructor(mainWindow: BrowserWindow) {
		this.mainWindow = mainWindow;
	}

	get skills() {
		return SKILLS;
	}

	async prompt(text: string): Promise<void> {
		if (!this.activeSessionId) {
			await this.createSession();
		}

		const msgId = crypto.randomUUID();

		// 发送 assistant 消息开始的信号
		this.emit(IPC_CHANNELS.AGENT_MESSAGE_START, {
			message: { id: msgId, role: 'assistant', content: '' },
		});

		// 模拟流式输出
		const response = `你发送了: **${text}**\n\n> 这是一个桩响应。集成 pi-agent-core 后将替换为真实的 Agent 回复。\n\n当前可用技能：${SKILLS.map(s => `\`${s.label}\``).join('、')}`;

		// 模拟逐字输出
		const chars = response.split('');
		let accumulated = '';
		for (let i = 0; i < chars.length; i++) {
			accumulated += chars[i];
			this.emit(IPC_CHANNELS.AGENT_MESSAGE_UPDATE, {
				message: { id: msgId, role: 'assistant', content: accumulated },
				event: { chunk: chars[i], index: i },
			});
			await delay(15 + Math.random() * 25);
		}

		this.emit(IPC_CHANNELS.AGENT_MESSAGE_END, {
			message: { id: msgId, role: 'assistant', content: accumulated },
		});

		this.emit(IPC_CHANNELS.AGENT_IDLE, {});
	}

	async abort(): Promise<void> {
		this.emit(IPC_CHANNELS.AGENT_IDLE, {});
	}

	async skill(name: string): Promise<void> {
		await this.prompt(`使用"${name}"技能帮我处理`);
	}

	async steer(text: string): Promise<void> {
		await this.prompt(text);
	}

	async navigateTree(_targetId: string): Promise<void> {
		// stub: 暂不实现分支导航
	}

	async compact(_instructions?: string): Promise<void> {
		// stub: 暂不实现 compaction
	}

	// Session 管理

	async listSessions(): Promise<SessionMeta[]> {
		return this.sessions;
	}

	async createSession(): Promise<string> {
		const id = crypto.randomUUID();
		this.sessionCounter++;
		const session: SessionMeta = {
			id,
			title: `会话 ${this.sessionCounter}`,
			updatedAt: new Date().toISOString(),
			isActive: true,
			hasBranches: false,
		};

		// 取消之前的活跃状态
		if (this.activeSessionId) {
			const prev = this.sessions.find(s => s.id === this.activeSessionId);
			if (prev) prev.isActive = false;
		}

		this.sessions.unshift(session);
		this.activeSessionId = id;

		this.emit(IPC_CHANNELS.SESSION_TREE_UPDATED, { entries: this.sessions, leafId: id });
		return id;
	}

	async switchSession(id: string): Promise<void> {
		if (this.activeSessionId) {
			const prev = this.sessions.find(s => s.id === this.activeSessionId);
			if (prev) prev.isActive = false;
		}
		const next = this.sessions.find(s => s.id === id);
		if (next) {
			next.isActive = true;
			this.activeSessionId = id;
		}
		this.emit(IPC_CHANNELS.SESSION_TREE_UPDATED, { entries: this.sessions, leafId: id });
	}

	// 事件推送
	private emit<K extends MelonEventChannel>(
		channel: K,
		data: MelonEventPayloadMap[K]
	): void {
		if (!this.mainWindow.isDestroyed()) {
			this.mainWindow.webContents.send(channel, data);
		}
	}
}

function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}
