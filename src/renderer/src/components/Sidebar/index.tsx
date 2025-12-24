import React from 'react'
import { Button } from '@renderer/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Bot, Settings, MessageCircle } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { SiteConfig } from '../../../../shared/types'

interface SidebarProps {
  children?: React.ReactNode
  onTabChange?: (tab: string) => void
  onTabClick?: (tab: string) => void
  value: string
  sites: SiteConfig[]
  onOpenSettings?: () => void
  isCollapsed?: boolean
}

// 从 SiteConfig 的 icon 字段动态获取图标组件
type IconComponent = React.ComponentType<any>

function getIconComponent(iconName?: string): IconComponent {
  if (!iconName) return Bot

  // 尝试从 lucide-react 获取图标
  const icons = LucideIcons as unknown as Record<string, IconComponent>
  const icon = icons[iconName]
  if (icon) return icon

  // 默认返回 Bot
  return Bot
}

export const Sidebar: React.FC<SidebarProps> = ({
  onTabChange,
  onTabClick,
  value,
  sites,
  onOpenSettings,
  isCollapsed
}) => {
  const items: Array<{ id: string; title: string; icon: IconComponent }> = [
    { id: 'chat', title: 'Chat', icon: MessageCircle as IconComponent },
    ...sites.map(s => ({
      id: s.id,
      title: s.title,
      icon: getIconComponent(s.icon)
    }))
  ]

  const currentValue = items.some(s => s.id === value)
    ? value
    : items[0]?.id || ''
  const handleSettingsClick = () => {
    if (onOpenSettings) {
      onOpenSettings()
    } else {
      window.electron.openSettings()
    }
  }

  return (
    <div className='bg-sidebar flex h-full flex-col justify-between drag-region'>
      <div className='flex flex-col py-4'>
        {!isCollapsed && (
          <div className='mb-2 px-2'>
            <p className='text-sidebar-foreground/60 px-2 text-sm'>
              选择 AI 助手
            </p>
          </div>
        )}
        <Tabs
          value={currentValue}
          onValueChange={onTabChange}
          orientation='vertical'
          className='h-full'
        >
          <TabsList className='flex h-auto flex-col space-y-1 bg-transparent px-2'>
            {items.map(item => {
              const Icon = item.icon
              return (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  onClick={() => onTabClick?.(item.id)}
                  className={cn(
                    'group relative justify-center gap-3 px-3 py-2.5 text-sm font-medium transition-all no-drag',
                    isCollapsed ? 'w-full' : 'w-auto',
                    currentValue === item.id
                      ? 'bg-sidebar-accent/80 text-sidebar-accent-foreground shadow-sm'
                      : 'hover:bg-sidebar-accent/50 data-[state=active]:bg-sidebar-accent/80 data-[state=active]:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon
                    size={20}
                    className={cn(
                      'shrink-0 transition-all duration-200',
                      currentValue === item.id
                        ? 'text-sidebar-accent-foreground scale-110'
                        : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground group-hover:scale-110'
                    )}
                  />
                  {!isCollapsed && (
                    <span
                      className={cn(
                        'transition-colors duration-200',
                        currentValue === item.id
                          ? 'text-sidebar-accent-foreground font-medium'
                          : 'text-sidebar-foreground/80 group-hover:text-sidebar-foreground'
                      )}
                    >
                      {item.title}
                    </span>
                  )}
                  {/* 悬浮提示 */}
                  <div className='absolute left-full z-50 ml-2 hidden rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block'>
                    {item.title}
                  </div>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </div>
      <div className='app-region-no-drag p-2'>
        <Button
          variant='ghost'
          className={cn(
            'app-region-no-drag flex items-center justify-center gap-3 px-3 py-2.5 text-sm font-medium transition-all',
            isCollapsed ? 'w-full' : 'w-auto justify-start',
            'hover:bg-sidebar-accent/50'
          )}
          onClick={handleSettingsClick}
        >
          <Settings
            size={20}
            className='text-sidebar-foreground/60 group-hover:text-sidebar-foreground shrink-0 transition-all duration-200 group-hover:scale-110'
          />
          {!isCollapsed && (
            <span className='text-sidebar-foreground/80 group-hover:text-sidebar-foreground transition-colors duration-200'>
              设置
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
