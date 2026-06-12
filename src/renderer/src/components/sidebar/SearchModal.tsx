import React, { useState, useCallback, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { melon } from '@/lib/melon-sdk';

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
	if (!isOpen) return null;
	return <SearchModalInner onClose={onClose} />;
}

function SearchModalInner({ onClose }: { onClose: () => void }) {
	const { state, dispatch } = useAppContext();
	const { sessions } = state.session;
	const [query, setQuery] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);

	const filtered = sessions.filter(
		s => s.title.toLowerCase().includes(query.toLowerCase()),
	);

	const handleSelect = useCallback(async (id: string) => {
		await melon.switchSession(id);
		dispatch({ domain: 'session', action: { type: 'SET_ACTIVE_SESSION', id } });
		dispatch({ domain: 'chat', action: { type: 'CLEAR_MESSAGES' } });
		const updated = sessions.map(s => ({ ...s, isActive: s.id === id }));
		dispatch({ domain: 'session', action: { type: 'SET_SESSIONS', sessions: updated } });
		onClose();
	}, [sessions, dispatch, onClose]);

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setSelectedIndex(i => Math.max(i - 1, 0));
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (filtered[selectedIndex]) {
				handleSelect(filtered[selectedIndex].id);
			}
		} else if (e.key === 'Escape') {
			onClose();
		}
	}, [filtered, selectedIndex, handleSelect, onClose]);

	// auto focus input on mount
	const inputCallbackRef = useCallback((el: HTMLInputElement | null) => {
		(inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
		setTimeout(() => el?.focus(), 50);
	}, []);

	return (
		<div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
			<div
				className="absolute left-1/2 top-[20%] -translate-x-1/2 w-[480px] max-w-[90vw] bg-card border border-border rounded-lg shadow-2xl overflow-hidden"
				onClick={e => e.stopPropagation()}
				onKeyDown={handleKeyDown}
			>
				<div className="flex items-center gap-2 px-4 h-12 border-b border-border">
					<Search className="w-4 h-4 text-muted-foreground shrink-0" />
					<Input
						ref={inputCallbackRef}
						placeholder="搜索会话..."
						value={query}
						onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
						className="border-0 bg-transparent h-full text-sm shadow-none focus-visible:ring-0 px-0"
					/>
				</div>
				<ScrollArea className="max-h-[320px]">
					{filtered.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-8">
							{query ? '无匹配结果' : '输入关键词搜索'}
						</p>
					) : (
						<div className="p-1">
							{filtered.map((s, i) => (
								<button
									key={s.id}
									onClick={() => handleSelect(s.id)}
									className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
										i === selectedIndex
											? 'bg-accent text-accent-foreground'
											: 'hover:bg-accent/50 text-foreground'
									}`}
								>
									{s.title}
								</button>
							))}
						</div>
					)}
				</ScrollArea>
			</div>
		</div>
	);
}
