import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Settings, MessageSquare } from 'lucide-react';
import { melon } from '@/lib/melon-sdk';

export default function SessionList() {
	const { state, dispatch } = useAppContext();
	const { sessions, activeSessionId } = state.session;
	const [search, setSearch] = useState('');
	const [settingsOpen, setSettingsOpen] = useState(false);

	const handleNewSession = async () => {
		try {
			const id = await melon.createSession();
			dispatch({ domain: 'session', action: { type: 'SET_ACTIVE_SESSION', id } });
			dispatch({ domain: 'chat', action: { type: 'CLEAR_MESSAGES' } });
			// 重新加载会话列表
			const sessions = await melon.listSessions();
			dispatch({ domain: 'session', action: { type: 'SET_SESSIONS', sessions } });
		} catch {
			// 静默处理
		}
	};

	const handleSwitchSession = async (id: string) => {
		try {
			await melon.switchSession(id);
			dispatch({ domain: 'session', action: { type: 'SET_ACTIVE_SESSION', id } });
			dispatch({ domain: 'chat', action: { type: 'CLEAR_MESSAGES' } });
			// 更新 isActive 状态
			const updated = sessions.map(s => ({ ...s, isActive: s.id === id }));
			dispatch({ domain: 'session', action: { type: 'SET_SESSIONS', sessions: updated } });
		} catch {
			// 静默处理
		}
	};

	const filteredSessions = sessions.filter(
		s => s.title.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<aside className="w-72 flex flex-col border-r border-border bg-card h-screen">
			{/* Header */}
			<div className="flex items-center justify-between px-4 h-14 border-b border-border">
				<div className="flex items-center gap-2">
					<MessageSquare className="w-5 h-5 text-primary" />
					<span className="font-semibold text-sm">西瓜 Melon</span>
				</div>
			</div>

			{/* New session + Search */}
			<div className="p-3 space-y-2">
				<Button variant="outline" className="w-full justify-start gap-2" onClick={handleNewSession}>
					<Plus className="w-4 h-4" />
					新建会话
				</Button>
				<div className="relative">
					<Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="搜索会话..."
						value={search}
						onChange={e => setSearch(e.target.value)}
						className="pl-8 h-8 text-sm"
					/>
				</div>
			</div>

			<Separator />

			{/* Session List */}
			<ScrollArea className="flex-1">
				<div className="p-2">
					{filteredSessions.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-8">
							{sessions.length === 0 ? '暂无会话，点击上方按钮创建' : '无匹配结果'}
						</p>
					) : (
						filteredSessions.map(session => (
							<button
								key={session.id}
								onClick={() => handleSwitchSession(session.id)}
								className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 transition-colors ${
									session.id === activeSessionId
										? 'bg-accent text-accent-foreground'
										: 'hover:bg-accent/50 text-foreground'
								}`}
							>
								<div className="flex items-center justify-between">
									<span className="truncate">{session.title}</span>
									{session.hasBranches && (
										<Badge variant="outline" className="text-[10px] px-1.5 py-0">
											分支
										</Badge>
									)}
								</div>
								<span className="text-[11px] text-muted-foreground">
									{formatDate(session.updatedAt)}
								</span>
							</button>
						))
					)}
				</div>
			</ScrollArea>

			<Separator />

			{/* Footer */}
			<div className="p-3">
				<Button
					variant="ghost"
					className="w-full justify-start gap-2"
					onClick={() => setSettingsOpen(!settingsOpen)}
				>
					<Settings className="w-4 h-4" />
					设置
				</Button>
			</div>

			{settingsOpen && (
				<SettingsPanel onClose={() => setSettingsOpen(false)} />
			)}
		</aside>
	);
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
	const { state, dispatch } = useAppContext();
	const { settings } = state.settings;
	const [apiKeyInput, setApiKeyInput] = useState('');

	const handleThemeChange = (theme: 'light' | 'dark') => {
		dispatch({ domain: 'settings', action: { type: 'UPDATE_SETTINGS', partial: { theme } } });
		void melon.setSettings({ theme });
	};

	const handleSaveApiKey = () => {
		if (apiKeyInput.trim()) {
			void melon.setSettings({ apiKeyConfigured: true });
			dispatch({
				domain: 'settings',
				action: { type: 'UPDATE_SETTINGS', partial: { apiKeyConfigured: true } },
			});
			setApiKeyInput('');
		}
	};

	return (
		<div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
			<div
				className="absolute right-0 top-0 h-full w-80 bg-card border-l border-border p-6 shadow-lg overflow-y-auto"
				onClick={e => e.stopPropagation()}
			>
				<h2 className="text-lg font-semibold mb-6">设置</h2>

				{/* API Key */}
				<div className="mb-6">
					<h3 className="text-sm font-medium mb-2">API 密钥</h3>
					<div className="flex gap-2 mb-2">
						<Input
							type="password"
							placeholder={settings.apiKeyConfigured ? '●●●●●●●●●●●●●●●●●●' : '输入 API Key'}
							value={apiKeyInput}
							onChange={e => setApiKeyInput(e.target.value)}
							className="text-sm"
						/>
						<Button size="sm" onClick={handleSaveApiKey} disabled={!apiKeyInput.trim()}>
							保存
						</Button>
					</div>
					<p className="text-xs text-muted-foreground">
						状态：{settings.apiKeyConfigured ? '✅ 已配置' : '❌ 未配置'}
					</p>
				</div>

				<Separator className="my-4" />

				{/* Theme */}
				<div className="mb-6">
					<h3 className="text-sm font-medium mb-2">外观</h3>
					<div className="flex gap-2">
						<Button
							variant={settings.theme === 'light' ? 'default' : 'outline'}
							size="sm"
							onClick={() => handleThemeChange('light')}
						>
							浅色
						</Button>
						<Button
							variant={settings.theme === 'dark' ? 'default' : 'outline'}
							size="sm"
							onClick={() => handleThemeChange('dark')}
						>
							深色
						</Button>
					</div>
				</div>

				<Separator className="my-4" />

				{/* Model */}
				<div className="mb-6">
					<h3 className="text-sm font-medium mb-2">模型</h3>
					<Input value={settings.model} disabled className="text-sm" />
				</div>

				<Separator className="my-4" />

				{/* Language */}
				<div>
					<h3 className="text-sm font-medium mb-2">语言</h3>
					<p className="text-sm text-muted-foreground">{settings.language === 'zh-CN' ? '简体中文' : 'English'}</p>
				</div>
			</div>
		</div>
	);
}

function formatDate(isoStr: string): string {
	try {
		const d = new Date(isoStr);
		const now = new Date();
		const diff = now.getTime() - d.getTime();
		if (diff < 86400000 && now.getDate() === d.getDate()) return '今天';
		if (diff < 172800000 && now.getDate() - d.getDate() === 1) return '昨天';
		return `${d.getMonth() + 1}月${d.getDate()}日`;
	} catch {
		return isoStr;
	}
}
