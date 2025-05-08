/**
 * Window Manager
 * Manages multiple side views that can be switched from a left panel
 */

import { BrowserWindow, WebContentsView, WebPreferences } from 'electron'

interface SiteConfig {
  id: string
  title: string
  url: string
}

interface SideView {
  id: string
  view: WebContentsView
  title: string
  isLoaded: boolean
}

export class WindowManager {
  private mainWindow: BrowserWindow | null = null
  private sideViews: Map<string, SideView> = new Map()
  private currentViewId: string | null = null
  private readonly TITLEBAR_HEIGHT = 0
  private readonly RESIZE_HANDLE_WIDTH = 1
  private sidebarWidth = 240
  private siteConfigs: Map<string, SiteConfig> = new Map()

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow

    // 监听窗口大小变化
    mainWindow.on('resize', () => {
      this.updateViewBounds()
    })
  }

  updateSidebarWidth(width: number) {
    this.sidebarWidth = width
    this.updateViewBounds()
  }

  setSiteConfigs(configs: SiteConfig[]) {
    this.siteConfigs.clear()
    for (const config of configs) {
      this.siteConfigs.set(config.id, config)
    }
  }

  getSiteConfigs(): SiteConfig[] {
    return Array.from(this.siteConfigs.values())
  }

  createSideView(id: string, title: string, options?: { webPreferences?: WebPreferences }): SideView {
    if (!this.mainWindow) throw new Error('Main window not initialized')

    // 如果视图已存在，直接返回
    const existingView = this.sideViews.get(id)
    if (existingView) {
      return existingView
    }

    // 创建新的视图
    const view = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        ...options?.webPreferences
      }
    })

    const newView: SideView = {
      id,
      view,
      title,
      isLoaded: false
    }

    this.sideViews.set(id, newView)

    // 加载对应的URL
    const url = this.getUrlForId(id)
    if (url) {
      view.webContents.loadURL(url).then(() => {
        newView.isLoaded = true
      })
    }

    return newView
  }

  private getUrlForId(id: string): string {
    const config = this.siteConfigs.get(id)
    return config?.url || ''
  }

  private calculateViewBounds(): { x: number; y: number; width: number; height: number } {
    if (!this.mainWindow) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    const contentBounds = this.mainWindow.getContentBounds()

    // 确保宽度和高度至少为1，避免无效的尺寸
    const width = Math.max(1, contentBounds.width - this.sidebarWidth - this.RESIZE_HANDLE_WIDTH)
    const height = Math.max(1, contentBounds.height - this.TITLEBAR_HEIGHT)

    return {
      x: this.sidebarWidth + this.RESIZE_HANDLE_WIDTH,
      y: this.TITLEBAR_HEIGHT,
      width,
      height
    }
  }

  showSideView(id: string) {
    if (!this.mainWindow) return

    const sideView = this.sideViews.get(id)
    if (sideView) {
      // 移除当前视图的显示（但不销毁）
      if (this.currentViewId) {
        const currentView = this.sideViews.get(this.currentViewId)
        if (currentView) {
          this.mainWindow.contentView.removeChildView(currentView.view)
        }
      }

      // 显示选中的视图
      this.mainWindow.contentView.addChildView(sideView.view)
      const bounds = this.calculateViewBounds()
      sideView.view.setBounds(bounds)
      this.currentViewId = id

      // 如果还没有加载过，重新加载一次
      if (!sideView.isLoaded) {
        const url = this.getUrlForId(id)
        if (url) {
          sideView.view.webContents.loadURL(url).then(() => {
            sideView.isLoaded = true
          })
        }
      }
    }
  }

  closeSideView(id: string) {
    if (!this.mainWindow) return

    const sideView = this.sideViews.get(id)
    if (sideView) {
      if (this.currentViewId === id) {
        this.mainWindow.contentView.removeChildView(sideView.view)
        this.currentViewId = null
      }
      sideView.view.webContents.close()
      this.sideViews.delete(id)
    }
  }

  getAllSideViews(): SideView[] {
    return Array.from(this.sideViews.values())
  }

  getCurrentView(): SideView | null {
    return this.currentViewId ? this.sideViews.get(this.currentViewId) || null : null
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  updateViewBounds() {
    if (!this.mainWindow || !this.currentViewId) return

    const currentView = this.sideViews.get(this.currentViewId)
    if (currentView) {
      const bounds = this.calculateViewBounds()
      currentView.view.setBounds(bounds)
    }
  }
}
