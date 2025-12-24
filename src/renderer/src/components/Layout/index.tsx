import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@renderer/components/ui/resizable'
import { Titlebar } from '../Titlebar'

const MIN_SIDEBAR_WIDTH = 60 // 最小宽度（像素）- 图标模式
const MAX_SIDEBAR_WIDTH = 400 // 最大宽度（像素）
const DEFAULT_SIDEBAR_WIDTH = 240 // 默认宽度（像素）
const COLLAPSED_SIDEBAR_WIDTH = 60 // 折叠后宽度（像素）

// 自定义 ResizableHandle 组件 - 优化后的版本
const CustomResizeHandle = () => {
  return (
    <ResizableHandle className='group relative !w-1 !bg-transparent will-change-transform hover:!bg-transparent [&[data-panel-group-direction=vertical]>div]:!rotate-90'>
      {/* 扩大的交互区域 - 使用负 margin 扩大点击区域 */}
      <div className='absolute -inset-x-3 h-full cursor-col-resize' />
      {/* 可见的分隔线 - 更粗更明显 */}
      <div className='pointer-events-none absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 rounded-full bg-border/50 shadow-sm transition-all duration-200 group-hover:bg-border/80 group-data-[dragging=true]:bg-primary/80 group-data-[dragging=true]:shadow-md' />
      {/* 拖动手柄指示器 - 中间显示的小圆点 */}
      <div className='pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-data-[dragging=true]:opacity-100'>
        <div className='h-1 w-1 rounded-full bg-foreground/40' />
        <div className='h-1 w-1 rounded-full bg-foreground/40' />
      </div>
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const lastUpdateTime = useRef(0)
  const pendingUpdate = useRef<number | null>(null)
  const initialized = useRef(false)

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
      if (sizes[0] > 0) {
        // 如果正在折叠，不更新状态（防止从展开拖到折叠）
        if (
          isSidebarCollapsed &&
          sizes[0] <= pixelToPercentage(COLLAPSED_SIDEBAR_WIDTH) * 1.5
        ) {
          return
        }
        setSidebarSize(sizes[0])

        // 计算实际像素宽度并确保在边界内
        const sidebarWidth = Math.floor((window.innerWidth * sizes[0]) / 100)
        const boundedWidth = Math.max(
          isSidebarCollapsed ? COLLAPSED_SIDEBAR_WIDTH : MIN_SIDEBAR_WIDTH,
          Math.min(sidebarWidth, MAX_SIDEBAR_WIDTH)
        )

        // 使用节流发送更新
        sendUpdate(boundedWidth, isSidebarCollapsed)
      }
    },
    [isSidebarCollapsed, sendUpdate, pixelToPercentage]
  )

  // 清理 RAF
  useEffect(() => {
    return () => {
      if (pendingUpdate.current) {
        cancelAnimationFrame(pendingUpdate.current)
      }
    }
  }, [])

  // 初始化时从主进程获取存储的侧边栏宽度
  useEffect(() => {
    const initializeSidebarWidth = async () => {
      if (initialized.current) return
      initialized.current = true

      try {
        const stored = await window.electron.getSidebarWidth()
        if (stored.collapsed) {
          setIsSidebarCollapsed(true)
        } else {
          // 使用存储的宽度，确保在边界范围内
          const boundedWidth = Math.max(
            MIN_SIDEBAR_WIDTH,
            Math.min(stored.width || DEFAULT_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH)
          )
          setSidebarSize(pixelToPercentage(boundedWidth))
          setIsSidebarCollapsed(false)
        }
      } catch {
        // 如果获取失败，使用默认值
        setSidebarSize(pixelToPercentage(DEFAULT_SIDEBAR_WIDTH))
      }
    }
    initializeSidebarWidth()
  }, [pixelToPercentage])

  // 监听来自主进程的宽度更新（例如在其他窗口中调整后）
  useEffect(() => {
    const handleWidthUpdate = () => {
      window.electron
        .getSidebarWidth()
        .then(stored => {
          // 如果侧边栏折叠，不需要更新 sidebarSize
          if (stored.collapsed) {
            return
          }
          const boundedWidth = Math.max(
            MIN_SIDEBAR_WIDTH,
            Math.min(stored.width || DEFAULT_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH)
          )
          setSidebarSize(pixelToPercentage(boundedWidth))
        })
        .catch(() => {})
    }

    window.electron.ipcRenderer.on('sidebar-width-updated', handleWidthUpdate)
    return () => {
      window.electron.ipcRenderer.removeListener(
        'sidebar-width-updated',
        handleWidthUpdate as any
      )
    }
  }, [pixelToPercentage])

  // 处理折叠状态变化
  const handleToggleCollapse = useCallback(() => {
    const willCollapse = !isSidebarCollapsed
    setIsSidebarCollapsed(willCollapse)

    // 发送更新到主进程
    if (willCollapse) {
      sendUpdate(COLLAPSED_SIDEBAR_WIDTH, false)
    } else {
      // 恢复到上次保存的宽度
      const sidebarWidthPx = Math.floor((window.innerWidth * sidebarSize) / 100)
      const boundedWidth = Math.max(
        COLLAPSED_SIDEBAR_WIDTH,
        Math.min(sidebarWidthPx, MAX_SIDEBAR_WIDTH)
      )
      sendUpdate(boundedWidth, false)
    }
  }, [isSidebarCollapsed, sidebarSize, sendUpdate])

  // 暴露折叠状态变化的回调
  useEffect(() => {
    onSidebarCollapsedChange?.(isSidebarCollapsed)
  }, [isSidebarCollapsed, onSidebarCollapsedChange])

  // 计算侧边栏宽度
  const sidebarWidth = Math.floor(
    (window.innerWidth * (isSidebarCollapsed ? 0 : sidebarSize)) / 100
  )

  // 使用 key 强制在折叠状态改变时重新挂载 Panel
  // 这样 defaultSize 会重新应用，解决拖动后折叠再展开的错位问题
  const panelGroupKey = isSidebarCollapsed ? 'collapsed' : 'expanded'

  return (
    <div className='flex h-screen flex-col bg-muted'>
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
        key={panelGroupKey}
        direction='horizontal'
        className='flex-1 [&>div[role=separator]]:bg-transparent [&>div[role=separator]]:will-change-transform'
        onLayout={handleSidebarResize}
      >
        <ResizablePanel
          defaultSize={
            isSidebarCollapsed
              ? pixelToPercentage(COLLAPSED_SIDEBAR_WIDTH)
              : sidebarSize
          }
          minSize={
            isSidebarCollapsed
              ? pixelToPercentage(COLLAPSED_SIDEBAR_WIDTH)
              : pixelToPercentage(MIN_SIDEBAR_WIDTH)
          }
          maxSize={pixelToPercentage(MAX_SIDEBAR_WIDTH)}
          className='min-h-full'
        >
          <div className='flex h-full flex-col'>
            {sidebar && React.isValidElement(sidebar)
              ? React.cloneElement(sidebar as React.ReactElement<any>, {
                  isCollapsed: isSidebarCollapsed
                })
              : sidebar}
          </div>
        </ResizablePanel>
        {!isSidebarCollapsed && <CustomResizeHandle />}
        <ResizablePanel
          minSize={30}
          className='relative'
        >
          {children}
          {/* WebContentsView 容器 - 主进程会在此添加 WebContentsView */}
          <div
            id='webview-container'
            className='pointer-events-none absolute inset-0 overflow-hidden'
            aria-hidden='true'
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
