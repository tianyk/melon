import React, { useEffect } from 'react'
import { useAppContext } from '@/context/AppContext'
import { useAgent } from '@/hooks/useAgent'
import Layout from '@/components/layout/Layout'
import { melon } from '@/lib/melon-sdk'

export default function App() {
  const { state, dispatch } = useAppContext()

  // 注册 agent 事件监听
  useAgent()

  // 初始化：加载设置和会话列表
  useEffect(() => {
    async function init() {
      try {
        const settings = await melon.getSettings()
        dispatch({
          domain: 'settings',
          action: { type: 'SET_SETTINGS', settings },
        })

        const sessions = await melon.listSessions()
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
  const theme = state.settings.settings.theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return <Layout />
}
