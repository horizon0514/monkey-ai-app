import { Layout } from '@renderer/components/Layout';
import { Sidebar } from '@renderer/components/Sidebar';
import { MainContent } from '@renderer/components/MainContent';
import { useEffect, useState } from 'react';
import { defaultSites } from './config/sites';
import { SiteConfig } from '../../shared/types';
import { Topbar } from './components/Topbar';

function App() {
  const [sites, setSites] = useState<SiteConfig[]>(defaultSites);
  const [selectedTab, setSelectedTab] = useState(defaultSites[0].id);

  useEffect(() => {
    // 初始化时发送网站配置到主进程
    window.electron.setSiteConfigs(defaultSites);

    // 监听站点配置变化
    const handleSiteConfigsChange = async () => {
      const configs = await window.electron.getSiteConfigs();
      setSites(configs);

      // 如果当前选中的站点被禁用，切换到第一个启用的站点
      const currentSite = configs.find(site => site.id === selectedTab);
      if (!currentSite?.enabled) {
        const firstEnabledSite = configs.find(site => site.enabled);
        if (firstEnabledSite) {
          setSelectedTab(firstEnabledSite.id);
        }
      }
    };

    // 初始加载配置
    handleSiteConfigsChange();

    // 监听配置变化
    window.electron.ipcRenderer.on('site-configs-changed', handleSiteConfigsChange);
    return () => {
      window.electron.ipcRenderer.removeListener('site-configs-changed', handleSiteConfigsChange);
    };
  }, [selectedTab]);

  // 过滤出启用的站点
  const enabledSites = sites.filter(site => site.enabled);

  return (
    <>
      <Layout
        sidebar={
          <Sidebar
            value={selectedTab}
            onTabChange={setSelectedTab}
            sites={enabledSites}
          />
        }
        topbar={<Topbar tab={enabledSites.find(site => site.id === selectedTab) || enabledSites[0]} />}
      >
        <MainContent selectedTab={selectedTab} />
      </Layout>
    </>
  );
}

export default App;
