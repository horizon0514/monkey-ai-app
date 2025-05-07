import { Layout } from '@renderer/components/Layout';
import { Sidebar } from '@renderer/components/Sidebar';
import { MainContent } from '@renderer/components/MainContent';
function App() {
  return (
    <Layout
      sidebar={<Sidebar />}
    >
      <MainContent>
        aaa
      </MainContent>
    </Layout>
  );
}

export default App;
