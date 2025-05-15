import React, { useEffect, useState, useCallback } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@renderer/components/ui/resizable';
import { Titlebar } from '../Titlebar';
import { cn } from '@renderer/lib/utils';

const MIN_SIDEBAR_SIZE = 15; // 最小宽度百分比
const DEFAULT_SIDEBAR_SIZE = 18; // 默认宽度百分比

interface LayoutProps {
  sidebar?: React.ReactNode;
  topbar?: React.ReactNode;
  children?: React.ReactNode;
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
}

export const Layout: React.FC<LayoutProps> = ({ sidebar, topbar, children, onSidebarCollapsedChange }) => {
  const [sidebarSize, setSidebarSize] = useState(DEFAULT_SIDEBAR_SIZE);
  const [lastSidebarSize, setLastSidebarSize] = useState(DEFAULT_SIDEBAR_SIZE);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // 处理侧边栏大小变化
  const handleSidebarResize = useCallback((sizes: number[]) => {
    if (!isSidebarCollapsed && sizes[0] > 0) {
      setSidebarSize(sizes[0]);
      setLastSidebarSize(sizes[0]);
    }
  }, [isSidebarCollapsed]);

  // 当侧边栏大小改变时通知主进程
  useEffect(() => {
    const sidebarWidth = Math.floor((window.innerWidth * sidebarSize) / 100);
    const mainWidth = window.innerWidth - (isSidebarCollapsed ? 0 : sidebarWidth);

    // 通知主进程更新侧边栏和主内容区域的宽度
    window.electron.ipcRenderer.send('layout-resize', {
      sidebarWidth: isSidebarCollapsed ? 0 : sidebarWidth,
      mainWidth
    });
  }, [sidebarSize, isSidebarCollapsed]);

  // 处理折叠状态变化
  const handleToggleCollapse = () => {
    if (!isSidebarCollapsed) {
      // 折叠时保存当前宽度
      setLastSidebarSize(sidebarSize);
      setSidebarSize(0);
    } else {
      // 展开时恢复到上次的宽度
      setSidebarSize(lastSidebarSize);
    }
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // 暴露折叠状态变化的回调
  useEffect(() => {
    onSidebarCollapsedChange?.(isSidebarCollapsed);
  }, [isSidebarCollapsed, onSidebarCollapsedChange]);

  // 计算侧边栏宽度
  const sidebarWidth = Math.floor((window.innerWidth * (isSidebarCollapsed ? 0 : sidebarSize)) / 100);

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex w-full">
        {/* Titlebar 和 Topbar 区域 */}
        <div className="flex w-full">
          {!isSidebarCollapsed && (
            <div
              style={{ width: `${sidebarWidth}px` }}
              className="shrink-0"
            >
              <Titlebar onToggleSidebar={handleToggleCollapse} isSidebarCollapsed={isSidebarCollapsed} />
            </div>
          )}
          <div className="flex-1">
            {isSidebarCollapsed ? (
              <div className="flex w-full">
                <Titlebar onToggleSidebar={handleToggleCollapse} isSidebarCollapsed={isSidebarCollapsed} />
                <div className="flex-1">
                  {topbar}
                </div>
              </div>
            ) : (
              topbar
            )}
          </div>
        </div>
      </div>
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1"
        onLayout={handleSidebarResize}
      >
        <ResizablePanel
          defaultSize={isSidebarCollapsed ? 0 : sidebarSize}
          minSize={isSidebarCollapsed ? 0 : MIN_SIDEBAR_SIZE}
          maxSize={isSidebarCollapsed ? 0 : 30}
          className={cn("min-h-full", isSidebarCollapsed && "hidden")}
        >
          <div className="flex h-full flex-col">
            {sidebar}
          </div>
        </ResizablePanel>
        {!isSidebarCollapsed && <ResizableHandle />}
        <ResizablePanel
          defaultSize={isSidebarCollapsed ? 100 : 100 - sidebarSize}
          minSize={30}
        >
          {children}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
