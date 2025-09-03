import React, { useEffect, useState } from 'react'
import { cn } from '@renderer/lib/utils'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Theme } from '@renderer/types/theme'
import { SiteConfig } from '../../../shared/types'
import { defaultSites } from '../../../shared/defaultSites'

export const SettingsModal: React.FC = () => {
  const isMacOS = window.platform.os === 'darwin'
  const [currentTheme, setCurrentTheme] = useState<Theme>('system')
  const [sites, setSites] = useState<SiteConfig[]>(defaultSites)

  // 获取当前主题
  useEffect(() => {
    window.electron.getTheme().then((theme: Theme) => {
      setCurrentTheme(theme)
    })
  }, [])

  // 获取站点配置
  useEffect(() => {
    window.electron.getSiteConfigs().then((configs: SiteConfig[]) => {
      setSites(
        defaultSites.map(site => ({
          ...site,
          enabled: configs.some(
            config => config.id === site.id && config.enabled
          )
        }))
      )
    })
  }, [])

  // 按 ESC 关闭弹窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.electron.closeSettings()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 切换主题
  const handleThemeChange = async (theme: Theme) => {
    await window.electron.setTheme(theme)
    setCurrentTheme(theme)
  }

  // 切换站点启用状态
  const handleSiteToggle = async (siteId: string) => {
    const newSites = sites.map(site =>
      site.id === siteId ? { ...site, enabled: !site.enabled } : site
    )
    await window.electron.setSiteConfigs(newSites)
    setSites(newSites)
  }

  return (
    <div className='flex h-full w-full flex-col bg-background'>
      <div className='flex h-12 shrink-0 items-center border-b border-border/40 bg-background drag-region'>
        <div className='flex flex-1 items-center justify-center'>
          <span className='text-sm font-medium'>设置</span>
        </div>
        {!isMacOS && <div className='w-[78px]' />}
      </div>
      <div className='min-h-0 flex-1 overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2'>
        <div className='flex flex-col space-y-6 p-6'>
          <div className='space-y-3'>
            <h3
              className={cn(
                'font-medium leading-none',
                isMacOS ? 'text-sm' : 'text-base'
              )}
            >
              主题
            </h3>
            <p className='text-sm text-muted-foreground'>
              选择你喜欢的主题外观。
            </p>
            <div className='flex items-center space-x-2'>
              <button
                onClick={() => handleThemeChange('light')}
                className={cn(
                  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                  isMacOS ? 'h-8 px-3 py-1.5' : 'h-9 px-4 py-2',
                  currentTheme === 'light' && 'bg-accent text-accent-foreground'
                )}
              >
                <Sun size={16} />
                浅色
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={cn(
                  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                  isMacOS ? 'h-8 px-3 py-1.5' : 'h-9 px-4 py-2',
                  currentTheme === 'dark' && 'bg-accent text-accent-foreground'
                )}
              >
                <Moon size={16} />
                深色
              </button>
              <button
                onClick={() => handleThemeChange('system')}
                className={cn(
                  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                  isMacOS ? 'h-8 px-3 py-1.5' : 'h-9 px-4 py-2',
                  currentTheme === 'system' &&
                    'bg-accent text-accent-foreground'
                )}
              >
                <Monitor size={16} />
                跟随系统
              </button>
            </div>
          </div>

          <div className='space-y-3'>
            <h3
              className={cn(
                'font-medium leading-none',
                isMacOS ? 'text-sm' : 'text-base'
              )}
            >
              AI 助手
            </h3>
            <p className='text-sm text-muted-foreground'>
              选择要启用的 AI 助手。
            </p>
            <div className='space-y-2'>
              {sites.map(site => (
                <label
                  key={site.id}
                  className='flex items-center space-x-3 py-2'
                >
                  <input
                    type='checkbox'
                    checked={site.enabled}
                    onChange={() => handleSiteToggle(site.id)}
                    className='h-4 w-4 rounded border-border text-primary focus:ring-primary'
                  />
                  <span className='text-sm font-medium'>{site.title}</span>
                </label>
              ))}
            </div>
          </div>

          <div className='space-y-3'>
            <h3
              className={cn(
                'font-medium leading-none',
                isMacOS ? 'text-sm' : 'text-base'
              )}
            >
              关于
            </h3>
            <p className='text-sm text-muted-foreground'>版本 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}
