import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Send, Square, X } from 'lucide-react'

const SKILL_LABELS: Record<string, string> = {
  translate: '翻译文本',
  polish: '润色文案',
  'file-organize': '整理文件',
  'web-search': '搜索信息',
  'price-compare': '商品比价',
  'batch-rename': '批量重命名',
}

interface ChatInputProps {
  onSend: (text: string) => void
  onAbort: () => void
  isProcessing: boolean
  currentSkill: string | null
  onClearSkill: () => void
}

export function ChatInput({ onSend, onAbort, isProcessing, currentSkill, onClearSkill }: ChatInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || isProcessing) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [text, isProcessing, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    // Auto-resize
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [])

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Skill badge + token count */}
      <div className="flex items-center justify-between mb-2">
        <div>
          {currentSkill && (
            <Badge variant="secondary" className="gap-1 pr-1">
              {SKILL_LABELS[currentSkill] || currentSkill}
              <button
                onClick={onClearSkill}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {text.length} / 8000
        </span>
      </div>

      {/* Input row */}
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
          className="flex-1 resize-none max-h-[200px]"
          rows={1}
          disabled={isProcessing}
        />
        {isProcessing ? (
          <Button variant="destructive" size="icon" onClick={onAbort} className="shrink-0">
            <Square className="w-4 h-4" />
          </Button>
        ) : (
          <Button size="icon" onClick={handleSend} disabled={!text.trim()} className="shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
