import React from 'react'
import { Tabs, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Bot, Brain, MessageSquare, LucideIcon, Settings } from 'lucide-react'
import { SiteConfig } from '../../../../shared/types'

interface SidebarProps {
  children?: React.ReactNode
  onTabChange?: (tab: string) => void
  value: string
  sites: SiteConfig[]
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
  value,
  sites
}) => {
  const currentValue = sites.some(s => s.id === value)
    ? value
    : sites[0]?.id || ''
  const handleSettingsClick = () => {
    window.electron.openSettings()
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
            {sites.map(site => {
              const Icon = SITE_ICONS[site.id] || Bot
              return (
                <TabsTrigger
                  key={site.id}
                  value={site.id}
                  className='group relative justify-start gap-3 px-4 py-2.5 text-sm font-medium transition-all no-drag hover:bg-muted/50 data-[state=active]:bg-primary/10 data-[state=active]:text-primary'
                >
                  <Icon
                    size={18}
                    className='shrink-0 transition-transform group-hover:scale-110 group-data-[state=active]:text-primary'
                  />
                  <span className='transition-colors group-hover:text-foreground/90'>
                    {site.title}
                  </span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </div>
      <div className='p-2'>
        <button
          onClick={handleSettingsClick}
          className='flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium text-muted-foreground no-drag hover:bg-muted/50 hover:text-foreground/90'
        >
          <Settings
            size={18}
            className='shrink-0'
          />
          设置
        </button>
      </div>
    </div>
  )
}
