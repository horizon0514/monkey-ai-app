import { Layout } from '@renderer/components/Layout'
import { Sidebar } from '@renderer/components/Sidebar'
import { MainContent } from '@renderer/components/MainContent'
import { useEffect, useState } from 'react'
import { defaultSites } from '../../shared/defaultSites'
import { SiteConfig } from '../../shared/types'
import { Topbar } from './components/Topbar'
import { SettingsModal } from './components/SettingsWindow'

function App() {
  const [sites, setSites] = useState<SiteConfig[]>(defaultSites)
  const [selectedTab, setSelectedTab] = useState(defaultSites[0].id)
  const [, setIsSidebarCollapsed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    // 监听站点配置变化
    const handleSiteConfigsChange = async () => {
      const configs = await window.electron.getSiteConfigs()
      setSites(configs)

      // 如果当前选中的站点被禁用，切换到第一个启用的站点
      const currentSite = configs.find(site => site.id === selectedTab)
      if (!currentSite?.enabled) {
        const firstEnabledSite = configs.find(site => site.enabled)
        if (firstEnabledSite) {
          setSelectedTab(firstEnabledSite.id)
          window.electron.switchTab(firstEnabledSite.id)
        }
      }
    }

    // 初始加载配置
    handleSiteConfigsChange()

    // 监听配置变化
    window.electron.ipcRenderer.on(
      'site-configs-changed',
      handleSiteConfigsChange
    )
    return () => {
      window.electron.ipcRenderer.removeListener(
        'site-configs-changed',
        handleSiteConfigsChange
      )
    }
  }, [selectedTab])

  // 过滤出启用的站点
  const enabledSites = sites.filter(site => site.enabled)

  return (
    <Layout
      sidebar={
        <Sidebar
          value={selectedTab}
          onTabChange={tab => {
            setSelectedTab(tab)
            window.electron.switchTab(tab)
          }}
          sites={enabledSites}
          onOpenSettings={() => {
            window.electron.openSettings()
            setShowSettings(true)
          }}
        />
      }
      topbar={
        showSettings ? (
          <Topbar title='设置' />
        ) : (
          <Topbar
            tab={
              enabledSites.find(site => site.id === selectedTab) ||
              enabledSites[0]
            }
          />
        )
      }
      onSidebarCollapsedChange={setIsSidebarCollapsed}
    >
      {showSettings ? (
        <SettingsModal inline onClose={() => setShowSettings(false)} />
      ) : (
        <MainContent selectedTab={selectedTab} />
      )}
    </Layout>
  )
}

export default App
