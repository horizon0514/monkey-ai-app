import { Layout } from '@renderer/components/Layout';
import { Sidebar } from '@renderer/components/Sidebar';
import { MainContent } from '@renderer/components/MainContent';
import { useEffect, useState } from 'react';
import { sites } from './config/sites';
import { Topbar } from './components/Topbar';

function App() {
  const [selectedTab, setSelectedTab] = useState(sites[0].id);

  useEffect(() => {
    // 初始化时发送网站配置到主进程
    window.electron.setSiteConfigs(sites);
  }, []);

  return (
    <>
      <Layout
        sidebar={
          <Sidebar
            value={selectedTab}
            onTabChange={setSelectedTab}
          />
        }
        topbar={<Topbar tab={sites.find(site => site.id === selectedTab) || sites[0]} />}
      >
        <MainContent selectedTab={selectedTab} />
      </Layout>
    </>
  );
}

export default App;
