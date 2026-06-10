import { useEffect } from 'react'
import { useAppContext } from '@/context/AppContext'
import type { AgentMessage } from '../../../../types/ipc'

export function useAgent() {
  const { dispatch } = useAppContext()

  useEffect(() => {
    const unsubs: (() => void)[] = []

    unsubs.push(
      window.Melon.on('agent:message-start', (data: unknown) => {
        const d = data as { message: AgentMessage }
        dispatch({
          domain: 'chat',
          action: { type: 'ADD_MESSAGE', message: d.message },
        })
      })
    )

    unsubs.push(
      window.Melon.on('agent:message-update', (data: unknown) => {
        const d = data as { message: AgentMessage }
        dispatch({
          domain: 'chat',
          action: { type: 'UPDATE_LAST_ASSISTANT', content: d.message.content },
        })
      })
    )

    unsubs.push(
      window.Melon.on('agent:message-end', () => {
        // 消息完成
      })
    )

    unsubs.push(
      window.Melon.on('agent:idle', () => {
        dispatch({ domain: 'chat', action: { type: 'SET_PROCESSING', value: false } })
      })
    )

    return () => unsubs.forEach(fn => fn())
  }, [dispatch])
}
