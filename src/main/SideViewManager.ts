import { BrowserWindow, WebContentsView, WebPreferences } from 'electron'
import Store from 'electron-store'
import { defaultSites } from '../shared/defaultSites'
import { SiteConfig } from '../shared/types'

// Constants
const UI_CONSTANTS = {
  TITLEBAR_HEIGHT: 48,
  RESIZE_HANDLE_WIDTH: 1,
  DEFAULT_SIDEBAR_WIDTH: 240,
  MIN_SIDEBAR_WIDTH: 200,
  MAX_SIDEBAR_WIDTH: 400
} as const

// Store keys
const STORE_KEYS = {
  SITE_CONFIGS: 'siteConfigs',
  SIDEBAR_WIDTH: 'sidebarWidth',
  SIDEBAR_COLLAPSED: 'sidebarCollapsed'
} as const

// Browser configuration
const BROWSER_CONFIG = {
  CHROME_VERSION: '120.0.0.0',
  getUserAgent: (platform: string) => {
    const osString =
      platform === 'macOS'
        ? 'Macintosh; Intel Mac OS X 10_15_7'
        : 'Windows NT 10.0; Win64; x64'
    return `Mozilla/5.0 (${osString}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${BROWSER_CONFIG.CHROME_VERSION} Safari/537.36`
  },
  getHeaders: (userAgent: string, platform: string) => ({
    'User-Agent': userAgent,
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
    'Sec-Ch-Ua':
      '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': `"${platform}"`,
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  })
} as const

export interface SideView {
  id: string
  view: WebContentsView
  title: string
  isLoaded: boolean
  error?: Error
}

export class SideViewManager {
  private sideViews: Map<string, SideView> = new Map()
  private currentViewId: string | null = null
  private sidebarWidth: number
  private lastSidebarWidth: number
  private isCollapsed: boolean
  private siteConfigs: Map<string, SiteConfig> = new Map()
  private readonly mainWindow: BrowserWindow
  private readonly store: Store

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.store = new Store()

    // 初始化侧边栏状态
    this.lastSidebarWidth = this.store.get(
      STORE_KEYS.SIDEBAR_WIDTH,
      UI_CONSTANTS.DEFAULT_SIDEBAR_WIDTH
    ) as number
    this.isCollapsed = this.store.get(
      STORE_KEYS.SIDEBAR_COLLAPSED,
      false
    ) as boolean
    this.sidebarWidth = this.isCollapsed ? 0 : this.lastSidebarWidth

    this.initializeConfigs()
  }

  private initializeConfigs() {
    const savedConfigs = this.store.get(STORE_KEYS.SITE_CONFIGS) as
      | SiteConfig[]
      | undefined
    this.setSiteConfigs(savedConfigs || defaultSites)
  }

  updateSidebarWidth(width: number) {
    // 确保宽度在有效范围内
    if (width > 0) {
      width = Math.max(
        UI_CONSTANTS.MIN_SIDEBAR_WIDTH,
        Math.min(width, UI_CONSTANTS.MAX_SIDEBAR_WIDTH)
      )
      this.lastSidebarWidth = width
      this.store.set(STORE_KEYS.SIDEBAR_WIDTH, width)
    }

    this.sidebarWidth = width
    this.isCollapsed = width === 0
    this.store.set(STORE_KEYS.SIDEBAR_COLLAPSED, this.isCollapsed)

    this.updateViewBounds()
  }

  getSidebarWidth(): number {
    return this.sidebarWidth
  }

  getLastSidebarWidth(): number {
    return this.lastSidebarWidth
  }

  isCollapsedSidebar(): boolean {
    return this.isCollapsed
  }

  toggleSidebar() {
    if (this.isCollapsed) {
      // 展开时恢复到上次的宽度
      this.updateSidebarWidth(this.lastSidebarWidth)
    } else {
      // 折叠时保存当前宽度并设置为0
      this.updateSidebarWidth(0)
    }
  }

  setSiteConfigs(configs: SiteConfig[]) {
    this.siteConfigs.clear()
    for (const config of configs) {
      this.siteConfigs.set(config.id, config)
    }
    this.store.set(STORE_KEYS.SITE_CONFIGS, configs)
  }

  getSiteConfigs(): SiteConfig[] {
    return Array.from(this.siteConfigs.values())
  }

  createSideView(
    id: string,
    title: string,
    options?: { webPreferences?: WebPreferences }
  ): SideView {
    try {
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
          partition: `persist:${id}`,
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

      // 配置浏览器环境
      this.configureBrowserEnvironment(view, id)

      return newView
    } catch (error) {
      const errorView: SideView = {
        id,
        view: null as any,
        title,
        isLoaded: false,
        error: error as Error
      }
      this.sideViews.set(id, errorView)
      return errorView
    }
  }

  private configureBrowserEnvironment(view: WebContentsView, id: string) {
    const platform = process.platform === 'darwin' ? 'macOS' : 'Windows'
    const userAgent = BROWSER_CONFIG.getUserAgent(platform)

    view.webContents.setUserAgent(userAgent)

    // 配置请求头
    this.configureRequestHeaders(view, userAgent, platform)

    // 配置浏览器环境
    this.configureNavigator(view, platform, userAgent)

    // 加载URL
    this.loadUrl(view, id)
  }

  private configureRequestHeaders(
    view: WebContentsView,
    userAgent: string,
    platform: string
  ) {
    view.webContents.session.webRequest.onBeforeSendHeaders(
      { urls: ['*://*.deepseek.com/*', '*://*.deepseek.ai/*'] },
      (details, callback) => {
        const { requestHeaders } = details
        callback({
          requestHeaders: {
            ...requestHeaders,
            ...BROWSER_CONFIG.getHeaders(userAgent, platform)
          }
        })
      }
    )
  }

  private configureNavigator(
    view: WebContentsView,
    platform: string,
    userAgent: string
  ) {
    const script = `
      try {
        const navigatorProps = {
          platform: '${platform === 'macOS' ? 'MacIntel' : 'Win32'}',
          vendor: 'Google Inc.',
          userAgent: '${userAgent}',
          appVersion: '${userAgent.substring(8)}'
        };

        for (const [key, value] of Object.entries(navigatorProps)) {
          Object.defineProperty(Object.getPrototypeOf(navigator), key, {
            value,
            configurable: false,
            writable: false
          });
        }
      } catch (e) {
        console.error('Failed to modify navigator:', e);
      }
    `

    view.webContents.on('did-finish-load', () => {
      view.webContents.executeJavaScript(script).catch(console.error)
    })
  }

  private loadUrl(view: WebContentsView, id: string) {
    const url = this.getUrlForId(id)
    if (url) {
      view.webContents
        .loadURL(url)
        .then(() => {
          const sideView = this.sideViews.get(id)
          if (sideView) {
            sideView.isLoaded = true
          }
        })
        .catch(error => {
          const sideView = this.sideViews.get(id)
          if (sideView) {
            sideView.error = error
          }
        })
    }
  }

  private getUrlForId(id: string): string {
    const config = this.siteConfigs.get(id)
    return config?.url || ''
  }

  private calculateViewBounds(): {
    x: number
    y: number
    width: number
    height: number
  } {
    const contentBounds = this.mainWindow.getContentBounds()

    // 确保宽度和高度至少为1，避免无效的尺寸
    const width = Math.max(
      1,
      contentBounds.width - this.sidebarWidth - UI_CONSTANTS.RESIZE_HANDLE_WIDTH
    )
    const height = Math.max(
      1,
      contentBounds.height - UI_CONSTANTS.TITLEBAR_HEIGHT
    )

    if (this.isCollapsed) {
      return {
        x: 0,
        y: UI_CONSTANTS.TITLEBAR_HEIGHT,
        width: contentBounds.width,
        height
      }
    }

    return {
      x: this.sidebarWidth + UI_CONSTANTS.RESIZE_HANDLE_WIDTH,
      y: UI_CONSTANTS.TITLEBAR_HEIGHT,
      width,
      height
    }
  }

  showSideView(id: string) {
    const sideView = this.sideViews.get(id)
    if (!sideView) {
      console.error(`Side view ${id} not found`)
      return
    }

    // 即使有错误也显示视图，让用户看到错误页面
    if (sideView.error) {
      console.warn(
        `Side view ${id} has error, but still showing:`,
        sideView.error
      )
    }

    try {
      // 如果点击的是当前已显示的视图，直接返回（不做任何操作）
      if (this.currentViewId === id) {
        return
      }

      // 若已有其他视图显示，先移除
      if (this.currentViewId) {
        const currentView = this.sideViews.get(this.currentViewId)
        if (currentView) {
          try {
            this.mainWindow.contentView.removeChildView(currentView.view)
          } catch (error) {
            // Ignore removal errors
          }
        }
      }

      // 显示新视图
      this.mainWindow.contentView.addChildView(sideView.view)
      const bounds = this.calculateViewBounds()
      sideView.view.setBounds(bounds)
      this.currentViewId = id

      // 首次加载时装载 URL
      if (!sideView.isLoaded) {
        this.loadUrl(sideView.view, id)
      }
    } catch (error) {
      console.error(`Error showing side view ${id}:`, error)
      sideView.error = error as Error
    }
  }

  hideCurrentView() {
    if (!this.currentViewId) return
    const currentView = this.sideViews.get(this.currentViewId)
    if (!currentView) {
      this.currentViewId = null
      return
    }
    try {
      this.mainWindow.contentView.removeChildView(currentView.view)
    } catch (error) {
      // Ignore removal errors
    }
    this.currentViewId = null
  }

  closeSideView(id: string) {
    const sideView = this.sideViews.get(id)
    if (!sideView) return

    try {
      if (this.currentViewId === id) {
        try {
          this.mainWindow.contentView.removeChildView(sideView.view)
        } catch (error) {
          // Ignore removal errors
        }
        this.currentViewId = null
      }

      if (!sideView.error) {
        sideView.view.webContents.close()
      }
      this.sideViews.delete(id)
    } catch (error) {
      console.error(`Error closing side view ${id}:`, error)
    }
  }

  getAllSideViews(): SideView[] {
    return Array.from(this.sideViews.values())
  }

  getCurrentView(): SideView | null {
    return this.currentViewId
      ? this.sideViews.get(this.currentViewId) || null
      : null
  }

  updateViewBounds() {
    if (!this.currentViewId) return

    const currentView = this.sideViews.get(this.currentViewId)

    if (currentView) {
      const bounds = this.calculateViewBounds()
      currentView.view.setBounds(bounds)
    }
  }
}
