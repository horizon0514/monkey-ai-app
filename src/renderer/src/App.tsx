import { Layout } from '@renderer/components/Layout';
import { Sidebar } from '@renderer/components/Sidebar';
import { MainContent } from '@renderer/components/MainContent';
import { useState } from 'react';

function App() {
  const [selectedTab, setSelectedTab] = useState('baidu');

  return (
    <Layout
      sidebar={<Sidebar onTabChange={setSelectedTab} />}
    >
      <MainContent selectedTab={selectedTab} />
    </Layout>
  );
}

export default App;
