import React, { useCallback } from 'react'
import { useAppContext } from '@/context/AppContext'
import { SkillChips } from '@/components/input/SkillChips'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/input/ChatInput'
import { melon } from '@/lib/melon-sdk'

export function ChatView() {
  const { state, dispatch } = useAppContext()
  const { messages, isProcessing, currentSkill } = state.chat

  const handleSend = useCallback(async (text: string) => {
    dispatch({ domain: 'chat', action: { type: 'SET_PROCESSING', value: true } })

    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: text,
      timestamp: Date.now(),
    }
    dispatch({ domain: 'chat', action: { type: 'ADD_MESSAGE', message: userMsg } })

    try {
      if (currentSkill) {
        await melon.skill(currentSkill)
        dispatch({ domain: 'chat', action: { type: 'SET_SKILL', name: null } })
      } else {
        await melon.prompt(text)
      }
    } catch {
      dispatch({ domain: 'chat', action: { type: 'SET_PROCESSING', value: false } })
    }
  }, [currentSkill, dispatch])

  const handleAbort = useCallback(async () => {
    await melon.abort()
    dispatch({ domain: 'chat', action: { type: 'SET_PROCESSING', value: false } })
  }, [dispatch])

  const handleSelectSkill = useCallback((name: string) => {
    dispatch({ domain: 'chat', action: { type: 'SET_SKILL', name } })
  }, [dispatch])

  const handleClearSkill = useCallback(() => {
    dispatch({ domain: 'chat', action: { type: 'SET_SKILL', name: null } })
  }, [dispatch])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-center px-6 h-14 border-b border-border shrink-0">
        <h1 className="text-sm text-muted-foreground">有什么可以帮你的？</h1>
      </div>

      {/* Skill Panel */}
      <div className="px-6 py-3 border-b border-border shrink-0">
        <SkillChips onSelect={handleSelectSkill} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border shrink-0">
        <ChatInput
          onSend={handleSend}
          onAbort={handleAbort}
          isProcessing={isProcessing}
          currentSkill={currentSkill}
          onClearSkill={handleClearSkill}
        />
      </div>
    </div>
  )
}
