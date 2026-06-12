import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AgentMessage } from '@shared/ipc';

interface MessageListProps {
  messages: AgentMessage[]
}

export function MessageList({ messages }: MessageListProps) {
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	if (messages.length === 0) {
		return (
			<div className="flex items-center justify-center h-full text-muted-foreground text-sm">
				选择一个技能或输入消息开始对话
			</div>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="max-w-3xl mx-auto px-6 py-4 space-y-4">
				{messages.map(msg => (
					<div
						key={msg.id}
						className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
					>
						<div
							className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
								msg.role === 'user'
									? 'bg-secondary text-secondary-foreground'
									: 'bg-card border border-border'
							}`}
						>
							{msg.role === 'assistant' ? (
								<div
									className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-md [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_blockquote]:border-l-2 [&_blockquote]:border-muted [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground"
									dangerouslySetInnerHTML={{ __html: simpleMarkdown(msg.content) }}
								/>
							) : (
								<p className="whitespace-pre-wrap">{msg.content}</p>
							)}
						</div>
					</div>
				))}
				<div ref={bottomRef} />
			</div>
		</ScrollArea>
	);
}

// 简易 Markdown 渲染（后续用 react-markdown 替代）
function simpleMarkdown(text: string): string {
	return text
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.+?)\*/g, '<em>$1</em>')
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
		.replace(/\n\n/g, '</p><p>')
		.replace(/^(.+)$/gm, (_, p) =>
			p.startsWith('<') ? p : `<p>${p}</p>`
		);
}
