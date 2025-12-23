import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Input } from '../ui/input'
import * as LucideIcons from 'lucide-react'
import { cn } from '@renderer/lib/utils'

// 常用图标列表
const COMMON_ICONS = [
  'Bot',
  'Brain',
  'MessageSquare',
  'MessageCircle',
  'Sparkles',
  'Coffee',
  'Cpu',
  'Zap',
  'Globe',
  'Heart',
  'Star',
  'Flame',
  'Box',
  'Layers',
  'Code',
  'GitBranch',
  'Terminal',
  'Wrench',
  'Rocket',
  'Settings',
  'Loader',
  'Atom',
  'Bolt',
  'Circle',
  'Diamond',
  'Eye',
  'Feather',
  'Gem',
  'Hexagon',
  'Key',
  'Lightbulb',
  'Moon',
  'Pen',
  'Target',
  'Triangle'
]

type IconComponent = React.ComponentType<any>

function getIconComponent(iconName: string): IconComponent {
  const icons = LucideIcons as unknown as Record<string, IconComponent>
  const icon = icons[iconName]
  return icon
}

type IconPickerProps = {
  value?: string
  onChange: (icon: string) => void
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const CurrentIcon = value ? getIconComponent(value) : null

  const filteredIcons = search
    ? COMMON_ICONS.filter(name =>
        name.toLowerCase().includes(search.toLowerCase())
      )
    : COMMON_ICONS

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className='h-10 w-full justify-start gap-2'
        >
          {CurrentIcon ? (
            <>
              <CurrentIcon
                size={16}
                className='shrink-0'
              />
              <span className='truncate'>{value}</span>
            </>
          ) : (
            <span className='text-muted-foreground'>选择图标</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-72 p-0'
        align='start'
      >
        <div className='p-3'>
          <Input
            placeholder='搜索图标...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            className='mb-3'
          />
          <div className='grid max-h-64 grid-cols-6 gap-1 overflow-y-auto'>
            {filteredIcons.map(iconName => {
              const Icon = getIconComponent(iconName)
              const isActive = value === iconName
              return (
                <button
                  key={iconName}
                  onClick={() => {
                    onChange(iconName)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-accent',
                    isActive &&
                      'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                  title={iconName}
                >
                  <Icon size={18} />
                </button>
              )
            })}
          </div>
          {filteredIcons.length === 0 && (
            <p className='py-8 text-center text-sm text-muted-foreground'>
              没有找到匹配的图标
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
