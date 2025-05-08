/**
 * Window Manager
 * Manages multiple side views that can be switched from a left panel
 */

import { BrowserWindow, WebContentsView, WebPreferences } from 'electron'
import { join } from 'path'

interface SideView {
  id: string
  view: WebContentsView
  title: string
}

export class WindowManager {
  private mainWindow: BrowserWindow | null = null
  private sideViews: Map<string, SideView> = new Map()
  private currentViewId: string | null = null

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
  }

  createSideView(id: string, title: string, options?: { webPreferences?: WebPreferences }): SideView {
    if (!this.mainWindow) throw new Error('Main window not initialized')

    // Create side view
    const sideView = new WebContentsView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, '../preload/index.js'),
        ...options?.webPreferences
      }
    })

    const newView: SideView = {
      id,
      view: sideView,
      title
    }

    this.sideViews.set(id, newView)
    return newView
  }

  showSideView(id: string) {
    if (!this.mainWindow) return

    const sideView = this.sideViews.get(id)
    if (sideView) {
      // Remove current view if exists
      if (this.currentViewId) {
        const currentView = this.sideViews.get(this.currentViewId)
        if (currentView) {
          const currentBrowserView = this.mainWindow.getBrowserView()
          if (currentBrowserView) {
            currentBrowserView.webContents.close()
            this.mainWindow.setBrowserView(null)
          }
        }
      }

      // Show selected view
      const contentBounds = this.mainWindow.getContentBounds()
      const viewWidth = 800 // 可以根据需要调整
      sideView.view.setBounds({
        x: contentBounds.width - viewWidth,
        y: 0,
        width: viewWidth,
        height: contentBounds.height
      })

      this.mainWindow.setContentView(sideView.view)
      this.currentViewId = id
    }
  }

  closeSideView(id: string) {
    if (!this.mainWindow) return

    const sideView = this.sideViews.get(id)
    if (sideView) {
      if (this.currentViewId === id) {
        // Remove the view from the window
        this.mainWindow.setContentView(new WebContentsView({}))
        this.currentViewId = null
      }
      // Close the webContents
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

  // 当主窗口大小改变时调用此方法
  updateViewBounds() {
    if (!this.mainWindow || !this.currentViewId) return

    const currentView = this.sideViews.get(this.currentViewId)
    if (currentView) {
      const contentBounds = this.mainWindow.getContentBounds()
      const viewWidth = 800 // 保持与创建时相同的宽度
      currentView.view.setBounds({
        x: contentBounds.width - viewWidth,
        y: 0,
        width: viewWidth,
        height: contentBounds.height
      })
    }
  }
}
