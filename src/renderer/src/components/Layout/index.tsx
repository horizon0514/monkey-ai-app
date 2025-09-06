import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@renderer/components/ui/resizable'
import { Titlebar } from '../Titlebar'
import { cn } from '@renderer/lib/utils'

const MIN_SIDEBAR_WIDTH = 200 // 最小宽度（像素）
const MAX_SIDEBAR_WIDTH = 400 // 最大宽度（像素）
const DEFAULT_SIDEBAR_WIDTH = 240 // 默认宽度（像素）

// 自定义 ResizableHandle 组件
const CustomResizeHandle = () => {
  return (
    <ResizableHandle className='group relative border-r-2 border-border/40 !bg-background'>
      {/* 实际的分隔线 */}
      <div className='absolute left-1/2 top-0 h-full w-[1px] -translate-x-1/2 transform' />
      {/* 扩大的交互区域 */}
      <div className='absolute left-1/2 top-0 h-full w-4 -translate-x-1/2 transform cursor-col-resize transition-colors hover:bg-accent/10' />
    </ResizableHandle>
  )
}

interface LayoutProps {
  sidebar?: React.ReactNode
  topbar?: React.ReactNode
  children?: React.ReactNode
  onSidebarCollapsedChange?: (collapsed: boolean) => void
}

export const Layout: React.FC<LayoutProps> = ({
  sidebar,
  topbar,
  children,
  onSidebarCollapsedChange
}) => {
  // Convert pixel width to percentage based on window width
  const pixelToPercentage = useCallback((pixels: number) => {
    return (pixels / window.innerWidth) * 100
  }, [])

  const [sidebarSize, setSidebarSize] = useState(
    pixelToPercentage(DEFAULT_SIDEBAR_WIDTH)
  )
  const [lastSidebarSize, setLastSidebarSize] = useState(
    pixelToPercentage(DEFAULT_SIDEBAR_WIDTH)
  )
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const lastUpdateTime = useRef(0)
  const pendingUpdate = useRef<number | null>(null)

  // 使用节流发送更新
  const sendUpdate = useCallback((width: number, isCollapsed: boolean) => {
    const now = Date.now()
    if (now - lastUpdateTime.current >= 16) {
      // 约一帧的时间
      const mainWidth = window.innerWidth - (isCollapsed ? 0 : width)
      window.electron.ipcRenderer.send('layout-resize', {
        sidebarWidth: isCollapsed ? 0 : width,
        mainWidth
      })
      lastUpdateTime.current = now
    } else if (!pendingUpdate.current) {
      pendingUpdate.current = requestAnimationFrame(() => {
        const mainWidth = window.innerWidth - (isCollapsed ? 0 : width)
        window.electron.ipcRenderer.send('layout-resize', {
          sidebarWidth: isCollapsed ? 0 : width,
          mainWidth
        })
        lastUpdateTime.current = Date.now()
        pendingUpdate.current = null
      })
    }
  }, [])

  // 处理侧边栏大小变化
  const handleSidebarResize = useCallback(
    (sizes: number[]) => {
      if (!isSidebarCollapsed && sizes[0] > 0) {
        setSidebarSize(sizes[0])
        setLastSidebarSize(sizes[0])

        // 计算实际像素宽度并确保在边界内
        const sidebarWidth = Math.floor((window.innerWidth * sizes[0]) / 100)
        const boundedWidth = Math.max(
          MIN_SIDEBAR_WIDTH,
          Math.min(sidebarWidth, MAX_SIDEBAR_WIDTH)
        )

        // 使用节流发送更新
        sendUpdate(boundedWidth, isSidebarCollapsed)
      }
    },
    [isSidebarCollapsed, sendUpdate]
  )

  // 清理 RAF
  useEffect(() => {
    return () => {
      if (pendingUpdate.current) {
        cancelAnimationFrame(pendingUpdate.current)
      }
    }
  }, [])

  // 处理折叠状态变化
  const handleToggleCollapse = useCallback(() => {
    const willCollapse = !isSidebarCollapsed

    if (willCollapse) {
      // 折叠：保存当前宽度并发送 0 宽度到主进程
      setLastSidebarSize(sidebarSize)
      setSidebarSize(0)
      sendUpdate(0, true)
    } else {
      // 展开：恢复上次宽度并同步到主进程
      setSidebarSize(lastSidebarSize)
      const sidebarWidthPx = Math.floor(
        (window.innerWidth * lastSidebarSize) / 100
      )
      const boundedWidth = Math.max(
        MIN_SIDEBAR_WIDTH,
        Math.min(sidebarWidthPx, MAX_SIDEBAR_WIDTH)
      )
      sendUpdate(boundedWidth, false)
    }

    setIsSidebarCollapsed(willCollapse)
  }, [isSidebarCollapsed, sidebarSize, lastSidebarSize, sendUpdate])

  // 暴露折叠状态变化的回调
  useEffect(() => {
    onSidebarCollapsedChange?.(isSidebarCollapsed)
  }, [isSidebarCollapsed, onSidebarCollapsedChange])

  // 计算侧边栏宽度
  const sidebarWidth = Math.floor(
    (window.innerWidth * (isSidebarCollapsed ? 0 : sidebarSize)) / 100
  )

  return (
    <div className='flex h-screen flex-col bg-background'>
      <div className='flex w-full'>
        {/* Titlebar 和 Topbar 区域 */}
        <div className='flex w-full'>
          {!isSidebarCollapsed && (
            <div
              style={{ width: `${sidebarWidth}px` }}
              className='shrink-0'
            >
              <Titlebar
                onToggleSidebar={handleToggleCollapse}
                isSidebarCollapsed={isSidebarCollapsed}
              />
            </div>
          )}
          <div className='flex-1'>
            {isSidebarCollapsed ? (
              <div className='flex w-full'>
                <Titlebar
                  onToggleSidebar={handleToggleCollapse}
                  isSidebarCollapsed={isSidebarCollapsed}
                />
                <div className='flex-1'>{topbar}</div>
              </div>
            ) : (
              topbar
            )}
          </div>
        </div>
      </div>
      <ResizablePanelGroup
        key={isSidebarCollapsed ? 'collapsed' : 'expanded'}
        direction='horizontal'
        className='flex-1 [&>div[role=separator]]:w-2 [&>div[role=separator]]:bg-transparent [&>div[role=separator]]:transition-colors [&>div[role=separator]]:hover:bg-accent/10'
        onLayout={handleSidebarResize}
      >
        <ResizablePanel
          defaultSize={isSidebarCollapsed ? 0 : sidebarSize}
          minSize={
            isSidebarCollapsed ? 0 : pixelToPercentage(MIN_SIDEBAR_WIDTH)
          }
          maxSize={
            isSidebarCollapsed ? 0 : pixelToPercentage(MAX_SIDEBAR_WIDTH)
          }
          className={cn('min-h-full', isSidebarCollapsed && 'hidden')}
        >
          <div className='flex h-full flex-col'>{sidebar}</div>
        </ResizablePanel>
        {!isSidebarCollapsed && <CustomResizeHandle />}
        <ResizablePanel
          defaultSize={isSidebarCollapsed ? 100 : 100 - sidebarSize}
          minSize={30}
        >
          {children}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
