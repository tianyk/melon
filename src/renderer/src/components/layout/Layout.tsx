import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatView } from '@/pages/ChatView';

const SIDEBAR_WIDTH = 256;
const DURATION = 0.25;

export default function Layout() {
	const { state, dispatch } = useAppContext();
	const collapsed = state.ui.sidebarCollapsed;

	const handleToggle = useCallback(() => {
		dispatch({ domain: 'ui', action: { type: 'TOGGLE_SIDEBAR' } });
	}, [dispatch]);

	return (
		<div className="flex flex-row h-screen overflow-hidden bg-background">
			{/* Sidebar：absolute 定位，z-0 底层 */}
			<motion.aside
				className="absolute left-0 top-0 h-full z-0 overflow-hidden bg-card border-r border-border"
				animate={{ width: collapsed ? 0 : SIDEBAR_WIDTH }}
				transition={{ duration: DURATION, ease: 'easeInOut' }}
			>
				<div style={{ width: SIDEBAR_WIDTH }}>
					<Sidebar onToggle={handleToggle} />
				</div>
			</motion.aside>

			{/* Main：z-10 上层，margin-left 动画产生盖住效果 */}
			<motion.main
				className="flex-1 flex flex-col z-10 bg-background relative"
				style={{
					boxShadow: collapsed ? 'none' : '-4px 0 20px -8px rgba(0,0,0,0.12)',
				}}
				animate={{ marginLeft: collapsed ? 0 : SIDEBAR_WIDTH }}
				transition={{ duration: DURATION, ease: 'easeInOut' }}
			>
				<ChatHeader collapsed={collapsed} onToggle={handleToggle} />
				<ChatView />
			</motion.main>
		</div>
	);
}
