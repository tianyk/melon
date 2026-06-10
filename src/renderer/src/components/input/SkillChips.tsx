import React from 'react'
import { Button } from '@/components/ui/button'
import { Languages, PenTool, FolderTree, Search, DollarSign, FileEdit } from 'lucide-react'

const SKILLS = [
  { key: 'translate', label: '翻译文本', icon: Languages },
  { key: 'polish', label: '润色文案', icon: PenTool },
  { key: 'file-organize', label: '整理文件', icon: FolderTree },
  { key: 'web-search', label: '搜索信息', icon: Search },
  { key: 'price-compare', label: '商品比价', icon: DollarSign },
  { key: 'batch-rename', label: '批量重命名', icon: FileEdit },
]

interface SkillChipsProps {
  onSelect: (name: string) => void
}

export function SkillChips({ onSelect }: SkillChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SKILLS.map(skill => (
        <Button
          key={skill.key}
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => onSelect(skill.key)}
        >
          <skill.icon className="w-3.5 h-3.5" />
          {skill.label}
        </Button>
      ))}
    </div>
  )
}
