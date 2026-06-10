import React, { useEffect } from 'react'
import { useAppContext } from '@/context/AppContext'
import { useAgent } from '@/hooks/useAgent'
import type { Settings, SessionMeta } from '../../../../types/ipc'
import Layout from '@/components/layout/Layout'

export default function App() {
  const { dispatch } = useAppContext()

  // 注册 agent 事件监听
  useAgent()

  // 初始化：加载设置和会话列表
  useEffect(() => {
    async function init() {
      try {
        const settings = await window.Melon.getSettings() as Settings
        dispatch({
          domain: 'settings',
          action: { type: 'SET_SETTINGS', settings },
        })

        const sessions = await window.Melon.listSessions() as SessionMeta[]
        dispatch({
          domain: 'session',
          action: { type: 'SET_SESSIONS', sessions },
        })
      } catch {
        // 静默处理初始化错误
      }
    }
    init()
  }, [dispatch])

  // 应用主题
  const theme = useAppContext().state.settings.settings.theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return <Layout />
}
