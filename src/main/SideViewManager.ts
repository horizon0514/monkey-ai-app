import { BrowserWindow, WebContentsView, WebPreferences } from 'electron'
import Store from 'electron-store'
import { defaultSites } from '../shared/defaultSites'
import { SiteConfig } from '../shared/types'

export interface SideView {
  id: string
  view: WebContentsView
  title: string
  isLoaded: boolean
}

export class SideViewManager {
  private sideViews: Map<string, SideView> = new Map()
  private currentViewId: string | null = null
  private readonly TITLEBAR_HEIGHT = 48
  private readonly RESIZE_HANDLE_WIDTH = 1
  private sidebarWidth = 240
  private siteConfigs: Map<string, SiteConfig> = new Map()
  private store: Store
  private mainWindow: BrowserWindow

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.store = new Store()

    // 从存储中加载配置，如果没有则使用默认配置
    const savedConfigs = this.store.get('siteConfigs') as SiteConfig[] | undefined
    if (savedConfigs) {
      this.setSiteConfigs(savedConfigs)
    } else {
      this.setSiteConfigs(defaultSites)
    }
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
    // 保存到存储
    this.store.set('siteConfigs', configs)
  }

  getSiteConfigs(): SiteConfig[] {
    return Array.from(this.siteConfigs.values())
  }

  createSideView(id: string, title: string, options?: { webPreferences?: WebPreferences }): SideView {
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

    // 设置自定义用户代理
    const platform = process.platform === 'darwin' ? 'macOS' : 'Windows'
    const chromeVersion = '120.0.0.0'
    const userAgent = `Mozilla/5.0 (${platform === 'macOS' ? 'Macintosh; Intel Mac OS X 10_15_7' : 'Windows NT 10.0; Win64; x64'}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`

    view.webContents.setUserAgent(userAgent)

    // 拦截webRequest，修改请求头
    view.webContents.session.webRequest.onBeforeSendHeaders(
      { urls: ['*://*.deepseek.com/*', '*://*.deepseek.ai/*'] },
      (details, callback) => {
        const { requestHeaders } = details
        const newHeaders = {
          ...requestHeaders,
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': `"${platform}"`,
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1'
        }
        callback({ requestHeaders: newHeaders })
      }
    )

    // 注入脚本修改navigator
    view.webContents.on('did-finish-load', () => {
      const script = `
        try {
          const platform = '${platform}';
          const chromeVersion = '${chromeVersion}';
          const userAgent = '${userAgent}';

          Object.defineProperty(Object.getPrototypeOf(navigator), 'platform', {
            value: platform === 'macOS' ? 'MacIntel' : 'Win32',
            configurable: false,
            writable: false
          });

          Object.defineProperty(Object.getPrototypeOf(navigator), 'vendor', {
            value: 'Google Inc.',
            configurable: false,
            writable: false
          });

          Object.defineProperty(Object.getPrototypeOf(navigator), 'userAgent', {
            value: userAgent,
            configurable: false,
            writable: false
          });

          Object.defineProperty(Object.getPrototypeOf(navigator), 'appVersion', {
            value: userAgent.substring(8),
            configurable: false,
            writable: false
          });
        } catch (e) {
          console.error('Failed to modify navigator:', e);
        }
      `;

      view.webContents.executeJavaScript(script).catch(console.error);
    });

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
    const contentBounds = this.mainWindow.getContentBounds()

    // 确保宽度和高度至少为1，避免无效的尺寸
    const width = Math.max(1, contentBounds.width - this.sidebarWidth - this.RESIZE_HANDLE_WIDTH)
    const height = Math.max(1, contentBounds.height - this.TITLEBAR_HEIGHT)

    console.log('this.sidebarWidth', this.sidebarWidth)
    console.log('width', width)
    if (this.sidebarWidth === 0) {
      return {
        x: 0,
        y: this.TITLEBAR_HEIGHT,
        width: width + 1,
        height
      }
    }
    return {
      x: this.sidebarWidth + this.RESIZE_HANDLE_WIDTH,
      y: this.TITLEBAR_HEIGHT,
      width,
      height
    }
  }

  showSideView(id: string) {
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

  updateViewBounds() {
    if (!this.currentViewId) return

    const currentView = this.sideViews.get(this.currentViewId)
    if (currentView) {
      const bounds = this.calculateViewBounds()
      currentView.view.setBounds(bounds)
    }
  }
}
