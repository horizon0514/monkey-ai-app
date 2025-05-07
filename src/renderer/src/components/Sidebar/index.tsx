import React, { useEffect, useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@renderer/components/ui/resizable';


const MIN_SIDEBAR_SIZE = 15; // 最小宽度百分比
const DEFAULT_SIDEBAR_SIZE = 20; // 默认宽度百分比

const Sidebar: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [sidebarSize, setSidebarSize] = useState(DEFAULT_SIDEBAR_SIZE);

  // 当侧边栏大小改变时通知主进程
  useEffect(() => {
    const sidebarWidth = Math.floor((window.innerWidth * sidebarSize) / 100);
    window.electron.ipcRenderer.send('sidebar-resize', { width: sidebarWidth });
  }, [sidebarSize]);

  const handleResize = (sizes: number[]) => {
    setSidebarSize(sizes[0]);
  };

  return (
    <ResizablePanelGroup
      direction="horizontal"
      onLayout={handleResize}
      className="min-h-screen h-full"
    >
      <ResizablePanel
        defaultSize={DEFAULT_SIDEBAR_SIZE}
        minSize={MIN_SIDEBAR_SIZE}
        className="min-h-full bg-background"
      >
        <div className="flex h-full flex-col">
          {children}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel minSize={30}>
        <div className="h-full bg-background" />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Sidebar;