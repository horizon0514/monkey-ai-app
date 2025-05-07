import React, { useEffect, useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@renderer/components/ui/resizable';
import { Titlebar } from '../Titlebar';
import { cn } from '@renderer/lib/utils';

const MIN_SIDEBAR_SIZE = 15; // 最小宽度百分比
const DEFAULT_SIDEBAR_SIZE = 20; // 默认宽度百分比
const COLLAPSED_SIZE = 0; // 折叠时的宽度

interface LayoutProps {
  sidebar?: React.ReactNode;
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ sidebar, children }) => {
  const [sidebarSize, setSidebarSize] = useState(DEFAULT_SIDEBAR_SIZE);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [prevSize, setPrevSize] = useState(DEFAULT_SIDEBAR_SIZE);
  const [isResizing, setIsResizing] = useState(false);

  // 当侧边栏大小改变时通知主进程
  useEffect(() => {
    const sidebarWidth = Math.floor((window.innerWidth * sidebarSize) / 100);
    window.electron.ipcRenderer.send('sidebar-resize', { width: sidebarWidth });
  }, [sidebarSize]);

  const handleResize = (sizes: number[]) => {
    if (!isSidebarCollapsed && sizes[0] > 0) {
      setPrevSize(sizes[0]);
      setSidebarSize(sizes[0]);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    setSidebarSize(isSidebarCollapsed ? prevSize : COLLAPSED_SIZE);
  };

  return (
    <div className="h-screen flex flex-col">
      <div
        className={cn(
          "absolute top-0 left-0 z-10",
          isSidebarCollapsed ? "w-full" : "w-[var(--sidebar-width)]"
        )}
        style={
          !isSidebarCollapsed
            ? { '--sidebar-width': `${Math.floor((window.innerWidth * sidebarSize) / 100)}px` } as React.CSSProperties
            : undefined
        }
      >
        <Titlebar
          onToggleSidebar={handleToggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
        />
      </div>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={handleResize}
        className="flex-1"
        onDragStart={() => setIsResizing(true)}
        onDragEnd={() => setIsResizing(false)}
      >
        {!isSidebarCollapsed && (
          <>
            <ResizablePanel
              key={`sidebar-${sidebarSize}`}
              defaultSize={sidebarSize}
              minSize={MIN_SIDEBAR_SIZE}
              maxSize={40}
              className="min-h-full bg-background pt-8"
            >
              <div className="flex h-full flex-col">
                <div className="overflow-hidden">
                  {sidebar}
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}
        <ResizablePanel
          key={`main-${isSidebarCollapsed ? 100 : 100 - sidebarSize}`}
          defaultSize={isSidebarCollapsed ? 100 : 100 - sidebarSize}
          minSize={30}
        >
          <div className="h-full bg-background">
            {children}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
