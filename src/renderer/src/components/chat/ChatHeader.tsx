import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  collapsed: boolean
  onToggle: () => void
}

export function ChatHeader({ collapsed, onToggle }: ChatHeaderProps) {
	return (
		<div
			className="flex items-center shrink-0 border-b border-border"
			style={{ paddingLeft: '70px', height: 'env(titlebar-area-height, 38px)' }}
		>
			<div className="flex items-center gap-3">
				<motion.button
					layoutId="sidebar-toggle"
					onClick={onToggle}
					className={cn(
						'inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors',
						'w-8 h-8',
						collapsed ? '' : 'invisible',
					)}
				>
					<ChevronRight className="w-4 h-4" />
				</motion.button>
				<span className="text-sm text-muted-foreground">有什么可以帮你的？</span>
			</div>
		</div>
	);
}
