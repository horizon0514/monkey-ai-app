import React, { useEffect, useState, useCallback } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@renderer/components/ui/resizable';
import { Titlebar } from '../Titlebar';
import { cn } from '@renderer/lib/utils';

const MIN_SIDEBAR_WIDTH = 200; // 最小宽度（像素）
const MAX_SIDEBAR_WIDTH = 400; // 最大宽度（像素）
const DEFAULT_SIDEBAR_WIDTH = 240; // 默认宽度（像素）

interface LayoutProps {
  sidebar?: React.ReactNode;
  topbar?: React.ReactNode;
  children?: React.ReactNode;
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
}

export const Layout: React.FC<LayoutProps> = ({ sidebar, topbar, children, onSidebarCollapsedChange }) => {
  // Convert pixel width to percentage based on window width
  const pixelToPercentage = useCallback((pixels: number) => {
    return (pixels / window.innerWidth) * 100;
  }, []);

  const [sidebarSize, setSidebarSize] = useState(pixelToPercentage(DEFAULT_SIDEBAR_WIDTH));
  const [lastSidebarSize, setLastSidebarSize] = useState(pixelToPercentage(DEFAULT_SIDEBAR_WIDTH));
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
    // Ensure the width is within bounds
    const boundedWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(sidebarWidth, MAX_SIDEBAR_WIDTH));
    const mainWidth = window.innerWidth - (isSidebarCollapsed ? 0 : boundedWidth);

    // 通知主进程更新侧边栏和主内容区域的宽度
    window.electron.ipcRenderer.send('layout-resize', {
      sidebarWidth: isSidebarCollapsed ? 0 : boundedWidth,
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
          minSize={isSidebarCollapsed ? 0 : pixelToPercentage(MIN_SIDEBAR_WIDTH)}
          maxSize={isSidebarCollapsed ? 0 : pixelToPercentage(MAX_SIDEBAR_WIDTH)}
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
