import React from 'react'
import { Button } from '@renderer/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import {
  Bot,
  Brain,
  MessageSquare,
  LucideIcon,
  Settings,
  MessageCircle
} from 'lucide-react'
import { SiteConfig } from '../../../../shared/types'

interface SidebarProps {
  children?: React.ReactNode
  onTabChange?: (tab: string) => void
  onTabClick?: (tab: string) => void
  value: string
  sites: SiteConfig[]
  onOpenSettings?: () => void
}

// 为每个网站ID定义对应的图标
const SITE_ICONS: Record<string, LucideIcon> = {
  deepseek: Bot,
  tongyi: Brain,
  wenxin: MessageSquare,
  yuanbao: Bot,
  doubao: Bot
}

export const Sidebar: React.FC<SidebarProps> = ({
  onTabChange,
  onTabClick,
  value,
  sites,
  onOpenSettings
}) => {
  const items: Array<{ id: string; title: string; icon: LucideIcon }> = [
    { id: 'chat', title: 'Chat', icon: MessageCircle }
  ].concat(
    sites.map(s => ({
      id: s.id,
      title: s.title,
      icon: SITE_ICONS[s.id] || Bot
    }))
  )

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
    <div className='flex h-full flex-col justify-between border-r border-border/40 bg-background drag-region'>
      <div className='flex flex-col py-4'>
        <div className='mb-2 px-2'>
          <p className='px-2 text-sm text-muted-foreground'>
            选择你想要使用的 AI 助手
          </p>
        </div>
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
                  className='group relative justify-start gap-3 px-4 py-2.5 text-sm font-medium transition-all no-drag hover:bg-muted/50 data-[state=active]:bg-primary/10 data-[state=active]:text-primary'
                >
                  <Icon
                    size={18}
                    className='shrink-0 transition-transform group-hover:scale-110 group-data-[state=active]:text-primary'
                  />
                  <span className='transition-colors group-hover:text-foreground/90'>
                    {item.title}
                  </span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </div>
      <div className='app-region-no-drag p-2'>
        <Button
          variant='ghost'
          className='app-region-no-drag flex w-full items-center justify-start gap-3 px-4 py-2.5 text-sm font-medium'
          onClick={handleSettingsClick}
        >
          <Settings
            size={18}
            className='shrink-0'
          />
          设置
        </Button>
      </div>
    </div>
  )
}
