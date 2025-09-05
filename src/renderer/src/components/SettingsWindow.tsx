import React, { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@renderer/lib/utils'
import {
  Sun,
  Moon,
  Monitor,
  Bot,
  Info,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  X
} from 'lucide-react'
import { Theme, ColorTheme } from '@renderer/types/theme'
import { getAllPalettes } from '@renderer/theme/palettes'
import { SiteConfig, LlmSettings } from '../../../shared/types'
import { defaultSites } from '../../../shared/defaultSites'
import { Button } from './ui/button'

type SettingsProps = {
  inline?: boolean
  onClose?: () => void
}

export const SettingsModal: React.FC<SettingsProps> = ({
  inline = false,
  onClose
}) => {
  const isMacOS = window.platform.os === 'darwin'
  const [currentTheme, setCurrentTheme] = useState<Theme>('system')
  const [colorTheme, setColorTheme] = useState<ColorTheme>('default')
  const [sites, setSites] = useState<SiteConfig[]>(defaultSites)
  const [activeSection, setActiveSection] = useState<
    'appearance' | 'assistants' | 'about'
  >('appearance')
  const [search, setSearch] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [addingDraft, setAddingDraft] = useState<{
    title: string
    url: string
    external: boolean
  }>({ title: '', url: '', external: false })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<{
    title: string
    url: string
    external: boolean
  }>({ title: '', url: '', external: false })

  // LLM 配置
  const [, setLlmSettings] = useState<LlmSettings | null>(null)
  const [llmDraft, setLlmDraft] = useState<{
    apiKey: string
    baseUrl: string
  }>({ apiKey: '', baseUrl: 'https://openrouter.ai/api/v1' })
  const [models, setModels] = useState<any[]>([])
  const [isFetchingModels, setIsFetchingModels] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)

  const appearanceRef = useRef<HTMLDivElement | null>(null)
  const assistantsRef = useRef<HTMLDivElement | null>(null)
  const aboutRef = useRef<HTMLDivElement | null>(null)

  // 获取当前主题
  useEffect(() => {
    window.electron.getTheme().then((theme: Theme) => {
      setCurrentTheme(theme)
    })
    window.electron.getColorTheme().then((palette: ColorTheme) => {
      setColorTheme(palette)
    })
  }, [])

  // 获取站点配置
  useEffect(() => {
    window.electron.getSiteConfigs().then((configs: SiteConfig[]) => {
      const list = (configs && configs.length > 0 ? configs : defaultSites).map(
        s => ({ ...s })
      )
      setSites(list)
    })
  }, [])

  // 读取 LLM 配置
  useEffect(() => {
    window.electron.getLlmSettings().then((settings: LlmSettings) => {
      setLlmSettings(settings)
      const apiKey = settings?.openrouter?.apiKey || ''
      const baseUrl =
        settings?.openrouter?.baseUrl || 'https://openrouter.ai/api/v1'
      setLlmDraft({ apiKey, baseUrl })
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

  const handleColorThemeChange = async (palette: ColorTheme) => {
    await window.electron.setColorTheme(palette)
    setColorTheme(palette)
  }

  // 保存到主进程并更新本地
  const commitSites = async (newSites: SiteConfig[]) => {
    await window.electron.setSiteConfigs(newSites)
    setSites(newSites)
  }

  // 切换站点启用状态
  const handleSiteToggle = async (siteId: string) => {
    const newSites = sites.map(site =>
      site.id === siteId ? { ...site, enabled: !site.enabled } : site
    )
    await commitSites(newSites)
  }

  // 生成 id（slug）
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

  // URL 基础校验
  const isValidUrl = (url: string) => /^https?:\/\//i.test(url.trim())

  // 新增助手
  const handleAdd = () => {
    setIsAdding(true)
    setAddingDraft({ title: '', url: '', external: false })
  }

  const handleAddSave = async () => {
    const title = addingDraft.title.trim()
    const url = addingDraft.url.trim()
    if (!title || !isValidUrl(url)) return
    const idBase = slugify(title) || 'assistant'
    let id = idBase
    let i = 1
    const existingIds = new Set(sites.map(s => s.id))
    while (existingIds.has(id)) {
      id = `${idBase}-${i++}`
    }
    const newSite: SiteConfig = {
      id,
      title,
      url,
      enabled: true,
      external: addingDraft.external
    }
    const newSites = [...sites, newSite]
    await commitSites(newSites)
    setIsAdding(false)
  }

  const handleAddCancel = () => {
    setIsAdding(false)
  }

  // 编辑助手
  const startEdit = (site: SiteConfig) => {
    setEditingId(site.id)
    setEditingDraft({
      title: site.title,
      url: site.url,
      external: Boolean(site.external)
    })
  }

  const handleEditSave = async (siteId: string) => {
    const title = editingDraft.title.trim()
    const url = editingDraft.url.trim()
    if (!title || !isValidUrl(url)) return
    const newSites = sites.map(s =>
      s.id === siteId
        ? { ...s, title, url, external: editingDraft.external }
        : s
    )
    await commitSites(newSites)
    setEditingId(null)
  }

  const handleEditCancel = () => {
    setEditingId(null)
  }

  // 删除助手
  const handleDelete = async (siteId: string) => {
    const newSites = sites.filter(s => s.id !== siteId)
    await commitSites(newSites)
  }

  // 排序（上移/下移）
  const moveUp = async (index: number) => {
    if (index <= 0) return
    const newSites = [...sites]
    ;[newSites[index - 1], newSites[index]] = [
      newSites[index],
      newSites[index - 1]
    ]
    await commitSites(newSites)
  }

  const moveDown = async (index: number) => {
    if (index >= sites.length - 1) return
    const newSites = [...sites]
    ;[newSites[index + 1], newSites[index]] = [
      newSites[index],
      newSites[index + 1]
    ]
    await commitSites(newSites)
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
          <div className='mb-2 px-2 text-xs text-muted-foreground'>
            偏好设置
          </div>
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
          <div
            ref={appearanceRef}
            className='scroll-mt-6 space-y-3'
          >
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
                  currentTheme === 'system' &&
                    'bg-accent text-accent-foreground'
                )}
              >
                <Monitor size={16} /> 跟随系统
              </button>
            </div>

            {/* 颜色主题 */}
            <div className='mt-4'>
              <div className={cn('mb-2 font-medium leading-none', isMacOS ? 'text-sm' : 'text-base')}>配色</div>
              <div className='grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4'>
                {getAllPalettes().map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleColorThemeChange(p.id)}
                    className={cn(
                      'group flex items-center justify-between rounded-md border border-input bg-background p-2 text-left text-sm hover:bg-accent',
                      colorTheme === p.id && 'ring-1 ring-ring'
                    )}
                    title={p.label}
                  >
                    <div className='flex items-center gap-2'>
                      <span className='inline-block h-5 w-5 rounded-full bg-primary ring-2 ring-ring' />
                      <span>{p.label}</span>
                    </div>
                    {colorTheme === p.id && (
                      <span className='text-xs text-muted-foreground'>已选</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI 助手 */}
          <div
            ref={assistantsRef}
            className='mt-8 scroll-mt-6 space-y-3'
          >
            <h3
              className={cn(
                'font-medium leading-none',
                isMacOS ? 'text-sm' : 'text-base'
              )}
            >
              AI 助手
            </h3>
            <p className='text-sm text-muted-foreground'>
              自定义你想要使用的助手（名称、URL、启用状态、顺序）。
            </p>

            {/* LLM Provider 设置 */}
            <div className='rounded-md border border-border/60 p-3'>
              <div className='mb-2 text-sm font-medium'>
                LLM 配置（OpenRouter）
              </div>
              <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs text-muted-foreground'>
                    Provider
                  </label>
                  <input
                    value={'OpenRouter'}
                    disabled
                    className='rounded-md border border-input bg-muted/30 px-3 py-2 text-sm outline-none'
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs text-muted-foreground'>
                    Base URL
                  </label>
                  <input
                    value={llmDraft.baseUrl}
                    onChange={e =>
                      setLlmDraft(d => ({ ...d, baseUrl: e.target.value }))
                    }
                    placeholder='https://openrouter.ai/api/v1'
                    className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring'
                  />
                </div>
                <div className='flex flex-col gap-1.5 md:col-span-2'>
                  <label className='text-xs text-muted-foreground'>
                    API Key
                  </label>
                  <input
                    type='password'
                    value={llmDraft.apiKey}
                    onChange={e =>
                      setLlmDraft(d => ({ ...d, apiKey: e.target.value }))
                    }
                    placeholder='sk-or-v1-...'
                    className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring'
                  />
                </div>
              </div>
              <div className='mt-3 flex items-center gap-2'>
                <button
                  onClick={async () => {
                    const newSettings: LlmSettings = {
                      provider: 'openrouter',
                      openrouter: {
                        apiKey: llmDraft.apiKey.trim(),
                        baseUrl:
                          llmDraft.baseUrl.trim() ||
                          'https://openrouter.ai/api/v1'
                      }
                    }
                    await window.electron.setLlmSettings(newSettings)
                    setLlmSettings(newSettings)
                  }}
                  className='inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground'
                >
                  保存
                </button>
                <button
                  onClick={async () => {
                    setIsFetchingModels(true)
                    setModelsError(null)
                    setModels([])
                    const res = await window.electron.fetchOpenRouterModels()
                    setIsFetchingModels(false)
                    if (!res.ok) {
                      setModelsError(res.error)
                    } else {
                      setModels(res.models)
                    }
                  }}
                  className='inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground'
                >
                  获取模型列表
                </button>
                {isFetchingModels && (
                  <span className='text-xs text-muted-foreground'>
                    正在加载模型…
                  </span>
                )}
                {modelsError && (
                  <span className='text-xs text-destructive'>
                    加载失败：{modelsError}
                  </span>
                )}
                {models.length > 0 && (
                  <span className='text-xs text-muted-foreground'>
                    已获取 {models.length} 个模型
                  </span>
                )}
              </div>
            </div>

            {/* 新增按钮 */}
            {!isAdding ? (
              <div className='mb-2'>
                <button
                  onClick={handleAdd}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Plus size={14} /> 新增助手
                </button>
              </div>
            ) : (
              <div className='mb-3 rounded-md border border-border/60 p-3'>
                <div className='mb-2 text-sm font-medium'>新增助手</div>
                <div className='flex gap-2'>
                  <input
                    value={addingDraft.title}
                    onChange={e =>
                      setAddingDraft(d => ({ ...d, title: e.target.value }))
                    }
                    placeholder='名称（必填）'
                    className='flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring'
                  />
                  <input
                    value={addingDraft.url}
                    onChange={e =>
                      setAddingDraft(d => ({ ...d, url: e.target.value }))
                    }
                    placeholder='https://example.com/'
                    className='flex-[2] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring'
                  />
                </div>
                <div className='mt-2 flex items-center gap-2'>
                  <input
                    id='adding-external'
                    type='checkbox'
                    checked={addingDraft.external}
                    onChange={e =>
                      setAddingDraft(d => ({
                        ...d,
                        external: e.target.checked
                      }))
                    }
                    className='h-4 w-4 rounded border-border text-primary focus:ring-primary'
                  />
                  <label
                    htmlFor='adding-external'
                    className='text-sm text-muted-foreground'
                  >
                    在外部浏览器中打开（适用于不支持内嵌登录的站点，如 Google）
                  </label>
                </div>
                <div className='mt-2 flex justify-end gap-2'>
                  <button
                    onClick={handleAddCancel}
                    className='inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground'
                  >
                    <X size={14} /> 取消
                  </button>
                  <button
                    onClick={handleAddSave}
                    className='inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90'
                  >
                    <Save size={14} /> 保存
                  </button>
                </div>
              </div>
            )}

            {/* 列表 */}
            <div className='space-y-2'>
              {filteredSites.map((site, idx) => {
                const isEditing = editingId === site.id
                return (
                  <div
                    key={site.id}
                    className='rounded-md border border-transparent px-2 py-2 hover:border-border/60'
                  >
                    {!isEditing ? (
                      <div className='flex items-center gap-2'>
                        <div className='flex items-center gap-3'>
                          <input
                            type='checkbox'
                            checked={site.enabled}
                            onChange={() => handleSiteToggle(site.id)}
                            className='h-4 w-4 rounded border-border text-primary focus:ring-primary'
                          />
                        </div>
                        <div className='min-w-0 flex-1'>
                          <div className='truncate text-sm font-medium'>
                            {site.title}
                          </div>
                          <div className='truncate text-xs text-muted-foreground'>
                            {site.url}
                          </div>
                        </div>
                        <div className='flex items-center gap-1'>
                          <button
                            onClick={() => moveUp(idx)}
                            className='rounded-md p-1 hover:bg-accent/60'
                            title='上移'
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            onClick={() => moveDown(idx)}
                            className='rounded-md p-1 hover:bg-accent/60'
                            title='下移'
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            onClick={() => startEdit(site)}
                            className='rounded-md p-1 hover:bg-accent/60'
                            title='编辑'
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(site.id)}
                            className='rounded-md p-1 hover:bg-destructive/10'
                            title='删除'
                          >
                            <Trash2
                              size={16}
                              className='text-destructive'
                            />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className='flex items-center gap-2'>
                        <div className='min-w-0 flex-1'>
                          <div className='flex gap-2'>
                            <input
                              value={editingDraft.title}
                              onChange={e =>
                                setEditingDraft(d => ({
                                  ...d,
                                  title: e.target.value
                                }))
                              }
                              placeholder='名称（必填）'
                              className='flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring'
                            />
                            <input
                              value={editingDraft.url}
                              onChange={e =>
                                setEditingDraft(d => ({
                                  ...d,
                                  url: e.target.value
                                }))
                              }
                              placeholder='https://example.com/'
                              className='flex-[2] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring'
                            />
                          </div>
                          <div className='mt-2 flex items-center gap-2'>
                            <input
                              id={`external-${site.id}`}
                              type='checkbox'
                              checked={editingDraft.external}
                              onChange={e =>
                                setEditingDraft(d => ({
                                  ...d,
                                  external: e.target.checked
                                }))
                              }
                              className='h-4 w-4 rounded border-border text-primary focus:ring-primary'
                            />
                            <label
                              htmlFor={`external-${site.id}`}
                              className='text-sm text-muted-foreground'
                            >
                              在外部浏览器中打开
                            </label>
                          </div>
                        </div>
                        <div className='flex items-center gap-1'>
                          <button
                            onClick={handleEditCancel}
                            className='rounded-md p-1 hover:bg-accent/60'
                            title='取消'
                          >
                            <X size={16} />
                          </button>
                          <button
                            onClick={() => handleEditSave(site.id)}
                            className='rounded-md p-1 hover:bg-accent/60'
                            title='保存'
                          >
                            <Save size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              {filteredSites.length === 0 && (
                <div className='py-6 text-center text-sm text-muted-foreground'>
                  没有匹配的助手
                </div>
              )}
            </div>
          </div>

          {/* 关于 */}
          <div
            ref={aboutRef}
            className='mt-8 scroll-mt-6 space-y-3'
          >
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
          <div className='sticky -bottom-6 border-t border-border/40 bg-gradient-to-t from-background to-background/70 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <div className='flex items-center justify-end gap-2'>
              <Button
                onClick={async () => {
                  // 导出 JSON
                  const blob = new Blob([JSON.stringify(sites, null, 2)], {
                    type: 'application/json'
                  })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'assistants.json'
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                size='sm'
              >
                导出
              </Button>
              <Button
                onClick={async () => {
                  // 导入 JSON
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'application/json'
                  input.onchange = async () => {
                    if (!input.files || input.files.length === 0) return
                    const file = input.files[0]
                    try {
                      const text = await file.text()
                      const list = JSON.parse(text) as SiteConfig[]
                      if (!Array.isArray(list)) return
                      // 简单过滤
                      const cleaned = list
                        .filter(it => it && it.id && it.title && it.url)
                        .map(it => ({
                          id: String(it.id),
                          title: String(it.title),
                          url: String(it.url),
                          enabled: Boolean(it.enabled)
                        }))
                      await commitSites(cleaned)
                    } catch (e) {
                      console.error('Import failed', e)
                    }
                  }
                  input.click()
                }}
                size='sm'
              >
                导入
              </Button>
              <Button
                onClick={handleResetDefaults}
                size='sm'
              >
                恢复默认
              </Button>
              <Button
                onClick={() =>
                  onClose ? onClose() : window.electron.closeSettings()
                }
                size='sm'
                variant='outline'
              >
                关闭
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
