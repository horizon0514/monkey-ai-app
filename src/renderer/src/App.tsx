import Sidebar from '@renderer/components/Sidebar'

function App() {
  return (
    <div className="app">
      <Sidebar>
        <div className="flex-1 p-4">
          {/* 这里可以放置侧边栏的内容 */}
        </div>
      </Sidebar>
    </div>
  )
}

export default App
