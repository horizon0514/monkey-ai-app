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
    const savedConfigs = this.store.get('siteConfigs') as SiteConfig[] | undefined
    if (savedConfigs) {
      this.setSiteConfigs(savedConfigs)
    } else {
      this.setSiteConfigs(defaultSites)
    }

    // 监听窗口大小变化
    mainWindow.on('resize', () => {
      this.sideViewManager.updateViewBounds()
    })
  }

  // 创建或显示设置窗口
  createOrShowSettingsWindow(): BrowserWindow {
    let settingsWindow = this.windows.get(WindowType.SETTINGS)

    if (settingsWindow) {
      settingsWindow.show()
      return settingsWindow
    }

    const config: WindowConfig = {
      width: 480,
      height: 500,
      titleBarStyle: 'hidden',
      resizable: false,
      minimizable: false,
      maximizable: false,
      alwaysOnTop: true,
      backgroundColor: nativeTheme.shouldUseDarkColors ? '#1e1e2a' : '#ffffff',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        nodeIntegration: true,
        contextIsolation: true,
      }
    }

    settingsWindow = this.createWindow(WindowType.SETTINGS, config)

    settingsWindow.on('closed', () => {
      this.windows.delete(WindowType.SETTINGS)
    })

    // 加载设置页面
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      settingsWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/settings.html`)
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
        preload: join(__dirname, '../preload/index.js'),
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
    this.store.set('siteConfigs', configs)
    this.sideViewManager.setSiteConfigs(configs)
  }

  getSiteConfigs(): SiteConfig[] {
    return this.sideViewManager.getSiteConfigs()
  }

  createSideView(id: string, title: string, options?: { webPreferences?: WebPreferences }) {
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

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }
}
