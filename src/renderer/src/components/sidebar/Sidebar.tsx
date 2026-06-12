import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Settings, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { melon } from '@/lib/melon-sdk';
import { SearchModal } from './SearchModal';
import { SettingsPanel } from './SettingsPanel';

interface SidebarProps {
  onToggle: () => void
}

export function Sidebar({ onToggle }: SidebarProps) {
	const { state, dispatch } = useAppContext();
	const { sessions, activeSessionId } = state.session;
	const [searchOpen, setSearchOpen] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);

	const handleNewSession = useCallback(async () => {
		try {
			const id = await melon.createSession();
			dispatch({ domain: 'session', action: { type: 'SET_ACTIVE_SESSION', id } });
			dispatch({ domain: 'chat', action: { type: 'CLEAR_MESSAGES' } });
			const sessions = await melon.listSessions();
			dispatch({ domain: 'session', action: { type: 'SET_SESSIONS', sessions } });
		} catch {
			// 静默处理
		}
	}, [dispatch]);

	const handleSwitchSession = useCallback(async (id: string) => {
		try {
			await melon.switchSession(id);
			dispatch({ domain: 'session', action: { type: 'SET_ACTIVE_SESSION', id } });
			dispatch({ domain: 'chat', action: { type: 'CLEAR_MESSAGES' } });
			const updated = sessions.map(s => ({ ...s, isActive: s.id === id }));
			dispatch({ domain: 'session', action: { type: 'SET_SESSIONS', sessions: updated } });
		} catch {
			// 静默处理
		}
	}, [sessions, dispatch]);

	return (
		<div className="flex flex-col h-full">
			{/* 顶部：折叠按钮，与红绿灯同行 */}
			<div className="flex items-center shrink-0" style={{ paddingLeft: '70px', height: 'env(titlebar-area-height, 38px)' }}>
				<motion.button
					layoutId="sidebar-toggle"
					onClick={onToggle}
					className={cn(
						'inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors',
						'w-8 h-8',
					)}
				>
					<ChevronLeft className="w-4 h-4" />
				</motion.button>
			</div>

			{/* 内容区：新对话 + 搜索 */}
			<div className="px-3 py-2 space-y-1 shrink-0">
				<Button variant="ghost" className="w-full justify-start gap-3 h-9" onClick={handleNewSession}>
					<Plus className="w-4 h-4" />
					<span className="text-sm">新对话</span>
				</Button>
				<Button
					variant="ghost"
					className="w-full justify-start gap-3 h-9"
					onClick={() => setSearchOpen(true)}
				>
					<Search className="w-4 h-4" />
					<span className="text-sm">搜索</span>
				</Button>
			</div>

			<Separator />

			{/* 会话列表 */}
			<ScrollArea className="flex-1">
				<div className="p-2">
					{sessions.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-8">
							暂无会话，点击上方按钮创建
						</p>
					) : (
						sessions.map(session => (
							<button
								key={session.id}
								onClick={() => handleSwitchSession(session.id)}
								className={cn(
									'w-full text-left px-3 py-2 rounded-md text-sm mb-1 transition-colors',
									session.id === activeSessionId
										? 'bg-accent text-accent-foreground'
										: 'hover:bg-accent/50 text-foreground',
								)}
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

			{/* 底部：设置 */}
			<div className="p-3 shrink-0">
				<Button
					variant="ghost"
					className="w-full justify-start gap-3 h-9"
					onClick={() => setSettingsOpen(true)}
				>
					<Settings className="w-4 h-4" />
					<span className="text-sm">设置</span>
				</Button>
			</div>

			{/* Modals */}
			<SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
			{settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
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
