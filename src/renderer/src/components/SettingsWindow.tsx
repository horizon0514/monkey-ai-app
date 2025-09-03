import React, { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@renderer/lib/utils'
import { Sun, Moon, Monitor, Bot, Info } from 'lucide-react'
import { Theme } from '@renderer/types/theme'
import { SiteConfig } from '../../../shared/types'
import { defaultSites } from '../../../shared/defaultSites'

type SettingsProps = {
  inline?: boolean
  onClose?: () => void
}

export const SettingsModal: React.FC<SettingsProps> = ({ inline = false, onClose }) => {
  const isMacOS = window.platform.os === 'darwin'
  const [currentTheme, setCurrentTheme] = useState<Theme>('system')
  const [sites, setSites] = useState<SiteConfig[]>(defaultSites)
  const [activeSection, setActiveSection] = useState<'appearance' | 'assistants' | 'about'>('appearance')
  const [search, setSearch] = useState('')

  const appearanceRef = useRef<HTMLDivElement | null>(null)
  const assistantsRef = useRef<HTMLDivElement | null>(null)
  const aboutRef = useRef<HTMLDivElement | null>(null)

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

  // 按 ESC 关闭（仅独立窗口模式）
  useEffect(() => {
    if (inline) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.electron.closeSettings()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [inline])

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

  const filteredSites = useMemo(() => {
    if (!search.trim()) return sites
    const q = search.trim().toLowerCase()
    return sites.filter(site => site.title.toLowerCase().includes(q))
  }, [sites, search])

  const handleScrollTo = (section: 'appearance' | 'assistants' | 'about') => {
    setActiveSection(section)
    const map = {
      appearance: appearanceRef.current,
      assistants: assistantsRef.current,
      about: aboutRef.current
    }
    const el = map[section]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleResetDefaults = async () => {
    // 恢复主题为系统
    await window.electron.setTheme('system')
    setCurrentTheme('system')
    // 恢复站点为默认
    await window.electron.setSiteConfigs(defaultSites)
    setSites(defaultSites)
  }

  return (
    <div className='flex h-full w-full flex-col bg-background'>
      {!inline && (
        <div className='flex h-12 shrink-0 items-center border-b border-border/40 bg-background drag-region'>
          <div className='flex flex-1 items-center justify-center'>
            <span className='text-sm font-medium'>设置</span>
          </div>
          {!isMacOS && <div className='w-[78px]' />}
        </div>
      )}

      <div className='flex min-h-0 flex-1'>
        {/* 左侧分组导航 */}
        <aside className='w-56 shrink-0 border-r border-border/40 p-3'>
          <div className='mb-2 px-2 text-xs text-muted-foreground'>偏好设置</div>
          <nav className='flex flex-col space-y-1'>
            <button
              onClick={() => handleScrollTo('appearance')}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/50',
                activeSection === 'appearance' && 'bg-primary/10 text-primary'
              )}
            >
              <Sun size={16} /> 外观
            </button>
            <button
              onClick={() => handleScrollTo('assistants')}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/50',
                activeSection === 'assistants' && 'bg-primary/10 text-primary'
              )}
            >
              <Bot size={16} /> AI 助手
            </button>
            <div className='mt-3 px-2 text-xs text-muted-foreground'>关于</div>
            <button
              onClick={() => handleScrollTo('about')}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/50',
                activeSection === 'about' && 'bg-primary/10 text-primary'
              )}
            >
              <Info size={16} /> 关于
            </button>
          </nav>
        </aside>

        {/* 右侧内容区 */}
        <section className='min-w-0 flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2'>
          {/* 搜索 */}
          <div className='mb-4'>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='搜索设置或助手…'
              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-1 focus:ring-ring'
            />
          </div>

          {/* 外观 */}
          <div ref={appearanceRef} className='space-y-3 scroll-mt-6'>
            <h3
              className={cn(
                'font-medium leading-none',
                isMacOS ? 'text-sm' : 'text-base'
              )}
            >
              主题
            </h3>
            <p className='text-sm text-muted-foreground'>选择你喜欢的主题外观。</p>
            <div className='flex items-center space-x-2'>
              <button
                onClick={() => handleThemeChange('light')}
                className={cn(
                  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                  isMacOS ? 'h-8 px-3 py-1.5' : 'h-9 px-4 py-2',
                  currentTheme === 'light' && 'bg-accent text-accent-foreground'
                )}
              >
                <Sun size={16} /> 浅色
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={cn(
                  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                  isMacOS ? 'h-8 px-3 py-1.5' : 'h-9 px-4 py-2',
                  currentTheme === 'dark' && 'bg-accent text-accent-foreground'
                )}
              >
                <Moon size={16} /> 深色
              </button>
              <button
                onClick={() => handleThemeChange('system')}
                className={cn(
                  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                  isMacOS ? 'h-8 px-3 py-1.5' : 'h-9 px-4 py-2',
                  currentTheme === 'system' && 'bg-accent text-accent-foreground'
                )}
              >
                <Monitor size={16} /> 跟随系统
              </button>
            </div>
          </div>

          {/* AI 助手 */}
          <div ref={assistantsRef} className='mt-8 space-y-3 scroll-mt-6'>
            <h3
              className={cn(
                'font-medium leading-none',
                isMacOS ? 'text-sm' : 'text-base'
              )}
            >
              AI 助手
            </h3>
            <p className='text-sm text-muted-foreground'>选择要启用的 AI 助手。</p>
            <div className='space-y-2'>
              {filteredSites.map(site => (
                <label
                  key={site.id}
                  className='flex items-center justify-between rounded-md border border-transparent px-2 py-2 hover:border-border/60'
                >
                  <div className='flex items-center space-x-3'>
                    <input
                      type='checkbox'
                      checked={site.enabled}
                      onChange={() => handleSiteToggle(site.id)}
                      className='h-4 w-4 rounded border-border text-primary focus:ring-primary'
                    />
                    <span className='text-sm font-medium'>{site.title}</span>
                  </div>
                </label>
              ))}
              {filteredSites.length === 0 && (
                <div className='py-6 text-center text-sm text-muted-foreground'>没有匹配的助手</div>
              )}
            </div>
          </div>

          {/* 关于 */}
          <div ref={aboutRef} className='mt-8 space-y-3 scroll-mt-6'>
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

          {/* 底部操作条 */}
          <div className='sticky bottom-0 mt-10 -mx-6 border-t border-border/40 bg-gradient-to-t from-background to-background/70 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <div className='flex items-center justify-end gap-2'>
              <button
                onClick={handleResetDefaults}
                className={cn(
                  'inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                )}
              >
                恢复默认
              </button>
              <button
                onClick={() => (onClose ? onClose() : window.electron.closeSettings())}
                className={cn(
                  'inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                )}
              >
                关闭
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
