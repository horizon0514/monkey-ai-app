import { Layout } from '@renderer/components/Layout';
import { Sidebar } from '@renderer/components/Sidebar';
import { MainContent } from '@renderer/components/MainContent';
import { useEffect, useState } from 'react';
import { sites } from './config/sites';

function App() {
  const [selectedTab, setSelectedTab] = useState('deepseek');

  useEffect(() => {
    // 初始化时发送网站配置到主进程
    window.electron.setSiteConfigs(sites);
  }, []);

  return (
    <Layout
      sidebar={<Sidebar onTabChange={setSelectedTab} />}
    >
      <MainContent selectedTab={selectedTab} />
    </Layout>
  );
}

export default App;
