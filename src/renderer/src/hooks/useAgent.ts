import { useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { melon } from '@/lib/melon-sdk';
import { IPC_CHANNELS } from '@shared/ipc';

export function useAgent() {
	const { dispatch } = useAppContext();

	useEffect(() => {
		const unsubs: (() => void)[] = [];

		unsubs.push(
			melon.on(IPC_CHANNELS.AGENT_MESSAGE_START, data => {
				dispatch({
					domain: 'chat',
					action: { type: 'ADD_MESSAGE', message: data.message },
				});
			})
		);

		unsubs.push(
			melon.on(IPC_CHANNELS.AGENT_MESSAGE_UPDATE, data => {
				dispatch({
					domain: 'chat',
					action: { type: 'UPDATE_LAST_ASSISTANT', content: data.message.content },
				});
			})
		);

		unsubs.push(
			melon.on(IPC_CHANNELS.AGENT_MESSAGE_END, () => {
				// 消息完成
			})
		);

		unsubs.push(
			melon.on(IPC_CHANNELS.AGENT_IDLE, () => {
				dispatch({ domain: 'chat', action: { type: 'SET_PROCESSING', value: false } });
			})
		);

		return () => unsubs.forEach(fn => fn());
	}, [dispatch]);
}
