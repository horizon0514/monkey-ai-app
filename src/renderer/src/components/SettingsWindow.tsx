import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { Theme, ColorTheme } from '@renderer/types/theme'
import { SiteConfig, LlmSettings } from '../../../shared/types'
import { defaultSites } from '../../../shared/defaultSites'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { cn } from '@renderer/lib/utils'

// Sub-components
import { SettingsSidebar } from './SettingsWindow/SettingsSidebar'
import { AppearanceSection } from './SettingsWindow/AppearanceSection'
import { LlmConfigSection } from './SettingsWindow/LlmConfigSection'
import {
  AssistantForm,
  type AssistantFormDraft
} from './SettingsWindow/AssistantForm'
import { AssistantList } from './SettingsWindow/AssistantList'
import { AboutSection } from './SettingsWindow/AboutSection'
import { SettingsFooter } from './SettingsWindow/SettingsFooter'

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
  const [addingDraft, setAddingDraft] = useState<AssistantFormDraft>({
    title: '',
    url: '',
    external: false
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<AssistantFormDraft>({
    title: '',
    url: '',
    external: false
  })

  // LLM 配置
  const [, setLlmSettings] = useState<LlmSettings | null>(null)
  const [llmDraft, setLlmDraft] = useState<{
    apiKey: string
    baseUrl: string
  }>({ apiKey: '', baseUrl: 'https://openrouter.ai/api/v1' })

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
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={handleScrollTo}
        />

        {/* 右侧内容区 */}
        <section className='min-w-0 flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/40 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2'>
          {/* 搜索 */}
          <div className='mb-6'>
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='搜索助手…'
              className='h-9'
            />
          </div>

          {/* 外观 */}
          <div
            ref={appearanceRef}
            className='scroll-mt-6'
          >
            <AppearanceSection
              currentTheme={currentTheme}
              colorTheme={colorTheme}
              onThemeChange={handleThemeChange}
              onColorThemeChange={handleColorThemeChange}
              isMacOS={isMacOS}
            />
          </div>

          {/* AI 助手 */}
          <div
            ref={assistantsRef}
            className='mt-10 scroll-mt-6 space-y-4'
          >
            <div>
              <h3
                className={cn(
                  'font-medium leading-none',
                  isMacOS ? 'text-sm' : 'text-base'
                )}
              >
                AI 助手
              </h3>
              <p className='mt-1.5 text-sm text-muted-foreground'>
                自定义你想要使用的助手（名称、URL、启用状态、顺序）。
              </p>
            </div>

            {/* LLM Provider 设置 */}
            <LlmConfigSection
              llmDraft={llmDraft}
              onLlmDraftChange={setLlmDraft}
              onSave={async settings => {
                await window.electron.setLlmSettings(settings)
                setLlmSettings(settings)
              }}
            />

            {/* 新增按钮 */}
            {!isAdding && !editingId && (
              <div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleAdd}
                  className='gap-2'
                >
                  <Plus size={14} /> 新增助手
                </Button>
              </div>
            )}

            {/* 新增表单 */}
            {isAdding && (
              <AssistantForm
                mode='add'
                draft={addingDraft}
                onDraftChange={setAddingDraft}
                onSave={handleAddSave}
                onCancel={handleAddCancel}
              />
            )}

            {/* 编辑表单 */}
            {editingId && (
              <AssistantForm
                mode='edit'
                editId={editingId}
                draft={editingDraft}
                onDraftChange={setEditingDraft}
                onSave={() => handleEditSave(editingId)}
                onCancel={handleEditCancel}
              />
            )}

            {/* 列表 */}
            <AssistantList
              sites={filteredSites}
              editingId={editingId}
              onToggle={handleSiteToggle}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
              onEdit={startEdit}
              onDelete={handleDelete}
            />
          </div>

          {/* 关于 */}
          <div
            ref={aboutRef}
            className='mt-10 scroll-mt-6'
          >
            <AboutSection isMacOS={isMacOS} />
          </div>

          {/* 底部操作条 */}
          <div className='-mx-6 mt-8'>
            <SettingsFooter
              sites={sites}
              onExport={async () => {
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
              onImport={async () => {
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
                    const cleaned = list
                      .filter(it => it && it.id && it.title && it.url)
                      .map(it => ({
                        id: String(it.id),
                        title: String(it.title),
                        url: String(it.url),
                        enabled: Boolean(it.enabled),
                        external: Boolean(it.external)
                      }))
                    await commitSites(cleaned)
                  } catch (e) {
                    console.error('Import failed', e)
                  }
                }
                input.click()
              }}
              onResetDefaults={handleResetDefaults}
              onClose={
                onClose
                  ? () => onClose()
                  : () => window.electron.closeSettings()
              }
            />
          </div>
        </section>
      </div>
    </div>
  )
}
