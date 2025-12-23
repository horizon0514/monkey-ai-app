/**
 * Window Manager
 * Manages multiple side views that can be switched from a left panel
 */

import { BrowserWindow, WebPreferences, screen, nativeTheme } from 'electron'
import Store from 'electron-store'
import { defaultSites } from '../shared/defaultSites'
import { SiteConfig } from '../shared/types'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { SideViewManager } from './SideViewManager'
import icon from '../../resources/icon.png?asset'

export enum WindowType {
  MAIN = 'main',
  SETTINGS = 'settings',
  QUICK = 'quick'
}

interface WindowConfig {
  width: number
  height: number
  titleBarStyle?: 'hidden' | 'default'
  frame?: boolean
  transparent?: boolean
  resizable?: boolean
  alwaysOnTop?: boolean
  minimizable?: boolean
  maximizable?: boolean
  backgroundColor?: string
  webPreferences?: WebPreferences
}

export class WindowManager {
  private windows: Map<WindowType, BrowserWindow> = new Map()
  private sideViewManager: SideViewManager
  private mainWindow: BrowserWindow | null = null
  private store: Store

  constructor(mainWindow: BrowserWindow) {
    this.windows.set(WindowType.MAIN, mainWindow)
    this.mainWindow = mainWindow
    this.store = new Store()
    this.sideViewManager = new SideViewManager(mainWindow)

    // 从存储中加载配置，如果没有则使用默认配置
    // 注意：使用与 main/index.ts 一致的 'sites' key
    const savedConfigs = this.store.get('sites') as SiteConfig[] | undefined
    if (savedConfigs) {
      this.setSiteConfigs(savedConfigs)
    } else {
      this.setSiteConfigs(defaultSites)
    }

    // 监听窗口大小变化
    mainWindow.on('resize', () => {
      this.sideViewManager.updateViewBounds()
    })

    // 可选：如需减少启动期磁盘访问，暂时不预热站点视图
    // mainWindow.webContents.once('did-finish-load', () => {
    //   this.prewarmEnabledSiteViews()
    // })
  }

  // 创建或显示设置窗口
  createOrShowSettingsWindow(): BrowserWindow {
    let settingsWindow = this.windows.get(WindowType.SETTINGS)

    if (settingsWindow) {
      settingsWindow.show()
      return settingsWindow
    }

    const config: WindowConfig = {
      width: 1040,
      height: 720,
      titleBarStyle: 'hidden',
      resizable: true,
      minimizable: false,
      maximizable: true,
      alwaysOnTop: false,
      backgroundColor: nativeTheme.shouldUseDarkColors ? '#1e1e2a' : '#ffffff',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        nodeIntegration: true,
        contextIsolation: true
      }
    }

    settingsWindow = this.createWindow(WindowType.SETTINGS, config)

    settingsWindow.on('closed', () => {
      this.windows.delete(WindowType.SETTINGS)
    })

    // 加载设置页面
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      settingsWindow.loadURL(
        `${process.env['ELECTRON_RENDERER_URL']}/settings.html`
      )
    } else {
      settingsWindow.loadFile(join(__dirname, '../renderer/settings.html'))
    }

    // 等待窗口加载完成后显示
    settingsWindow.once('ready-to-show', () => {
      settingsWindow?.show()
    })

    return settingsWindow
  }

  // 创建或显示快捷窗口
  createOrShowQuickWindow(): BrowserWindow {
    let quickWindow = this.windows.get(WindowType.QUICK)

    if (quickWindow) {
      this.centerQuickWindow(quickWindow)
      quickWindow.show()
      return quickWindow
    }

    const config: WindowConfig = {
      width: 600,
      height: 400,
      frame: false,
      transparent: true,
      resizable: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js')
      }
    }

    quickWindow = this.createWindow(WindowType.QUICK, config)

    quickWindow.on('blur', () => {
      quickWindow?.hide()
    })

    quickWindow.on('closed', () => {
      this.windows.delete(WindowType.QUICK)
    })

    // 加载快捷窗口页面
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      quickWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/quick.html`)
    } else {
      quickWindow.loadFile(join(__dirname, '../renderer/quick.html'))
    }

    // 等待窗口加载完成后显示
    quickWindow.once('ready-to-show', () => {
      quickWindow?.show()
    })

    return quickWindow
  }

  // 居中显示快捷窗口
  private centerQuickWindow(window: BrowserWindow) {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize

    window.setPosition(
      Math.round(width / 2 - 300),
      Math.round(height / 2 - 200)
    )
  }

  // 创建通用窗口的方法
  private createWindow(type: WindowType, config: WindowConfig): BrowserWindow {
    const window = new BrowserWindow({
      ...config,
      show: false,
      ...(process.platform === 'linux' ? { icon } : {}),
      trafficLightPosition: { x: 15, y: 15 },
      ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {})
    })

    this.windows.set(type, window)
    return window
  }

  // 获取指定类型的窗口
  getWindow(type: WindowType): BrowserWindow | undefined {
    return this.windows.get(type)
  }

  // 关闭指定类型的窗口
  closeWindow(type: WindowType) {
    const window = this.windows.get(type)
    if (window) {
      window.hide()
    }
  }

  // 切换快捷窗口显示状态
  toggleQuickWindow() {
    const quickWindow = this.windows.get(WindowType.QUICK)
    if (quickWindow?.isVisible()) {
      quickWindow.hide()
    } else {
      this.createOrShowQuickWindow()
    }
  }

  // SideView related methods - delegating to SideViewManager
  updateSidebarWidth(width: number) {
    this.sideViewManager.updateSidebarWidth(width)
  }

  getSidebarWidth(): number {
    return this.sideViewManager.getSidebarWidth()
  }

  getLastSidebarWidth(): number {
    return this.sideViewManager.getLastSidebarWidth()
  }

  isCollapsedSidebar(): boolean {
    return this.sideViewManager.isCollapsedSidebar()
  }

  toggleSidebar() {
    this.sideViewManager.toggleSidebar()
  }

  updateLayout(sidebarWidth: number) {
    this.sideViewManager.updateSidebarWidth(sidebarWidth)
  }

  setSiteConfigs(configs: SiteConfig[]) {
    // 对比旧配置，关闭被删除、被禁用或 URL 变更的视图
    const oldConfigs = this.getSiteConfigs()
    const oldMap = new Map(oldConfigs.map(cfg => [cfg.id, cfg]))
    const newMap = new Map(configs.map(cfg => [cfg.id, cfg]))

    // 关闭删除或禁用的
    for (const oldCfg of oldConfigs) {
      const newCfg = newMap.get(oldCfg.id)
      if (!newCfg || newCfg.enabled === false) {
        try {
          this.closeSideView(oldCfg.id)
        } catch {
          // ignore
        }
      }
    }

    // URL 变化的也关闭以便重建
    for (const newCfg of configs) {
      const oldCfg = oldMap.get(newCfg.id)
      if (oldCfg && oldCfg.url !== newCfg.url) {
        try {
          this.closeSideView(newCfg.id)
        } catch {
          // ignore
        }
      }
    }

    // 存储到统一位置（使用 'sites' key 与 main/index.ts 保持一致）
    this.store.set('sites', configs)
    // 更新到 SideViewManager（不再重复存储）
    this.sideViewManager.setSiteConfigs(configs)

    // 配置变更后按需延迟预热，避免频繁触发 IndexedDB
    // this.prewarmEnabledSiteViews()
  }

  getSiteConfigs(): SiteConfig[] {
    return this.sideViewManager.getSiteConfigs()
  }

  createSideView(
    id: string,
    title: string,
    options?: { webPreferences?: WebPreferences }
  ) {
    return this.sideViewManager.createSideView(id, title, options)
  }

  showSideView(id: string) {
    this.sideViewManager.showSideView(id)
  }

  closeSideView(id: string) {
    this.sideViewManager.closeSideView(id)
  }

  getAllSideViews() {
    return this.sideViewManager.getAllSideViews()
  }

  getCurrentView() {
    return this.sideViewManager.getCurrentView()
  }

  hideCurrentView() {
    this.sideViewManager.hideCurrentView()
  }

  getNavigationState() {
    return this.sideViewManager.getNavigationState()
  }

  goBackCurrent() {
    this.sideViewManager.goBackCurrent()
  }

  goForwardCurrent() {
    this.sideViewManager.goForwardCurrent()
  }

  getCurrentUrl() {
    return this.sideViewManager.getCurrentUrl()
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  // 预热启用站点（按需启用）：如需减少启动期磁盘访问，可以保持禁用
  // private prewarmEnabledSiteViews() {
  //   const configs = this.getSiteConfigs().filter(site => site.enabled)
  //   for (const site of configs) {
  //     const existing = this.getAllSideViews().find(v => v.id === site.id)
  //     if (!existing) {
  //       this.createSideView(site.id, site.title, {
  //         webPreferences: {
  //           contextIsolation: true
  //         }
  //       })
  //     }
  //   }
  // }
}
