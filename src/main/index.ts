import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  nativeTheme,
  globalShortcut
} from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createMenu } from './menu'
import { WindowManager, WindowType } from './windowManager'
import { bootup } from './bootup'
import { SiteConfig, LlmSettings } from '../shared/types'
import { HonoServer } from './honoServer'
import Store from 'electron-store'
import {
  initDb,
  listConversations,
  createConversation,
  deleteConversation,
  getConversationMessages,
  upsertMessages,
  ensureConversation
} from './db'

// 初始化 electron-store
Store.initRenderer()

// 降低/关闭 Chromium 控制台噪声（需在 app ready 之前设置）
app.commandLine.appendSwitch('disable-logging')
app.commandLine.appendSwitch('log-level', '3') // 仅 Error 及以上

let mainWindow: BrowserWindow | null = null
let windowManager: WindowManager | null = null
let honoServer: HonoServer | null = null
let ipcHandlersRegistered = false

// 全局错误处理，避免未捕获的 Promise 抛出警告并便于排查
process.on('unhandledRejection', reason => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection:', reason)
})
process.on('uncaughtException', error => {
  // eslint-disable-next-line no-console
  console.error('Uncaught Exception:', error)
})

// 创建配置存储实例
const store = new Store({
  name: 'site-configs',
  defaults: {
    sites: [],
    llm: {
      provider: 'openrouter',
      openrouter: {
        apiKey: '',
        baseUrl: 'https://openrouter.ai/api/v1'
      }
    } as LlmSettings,
    ui: {
      colorTheme: 'default'
    }
  }
})

// 添加启动时间监控
const startupTime = Date.now()

// 确保应用单实例运行，避免使用同一分区导致 IndexedDB LOCK
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 15 },
    ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1e1e2a' : '#ffffff',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: true,
      // 移除不必要的实验性功能和配置
      defaultEncoding: 'UTF-8'
    }
  })

  windowManager = new WindowManager(mainWindow)

  // 从存储中加载站点配置
  const savedSites = store.get('sites')
  if (savedSites && savedSites.length > 0) {
    windowManager.setSiteConfigs(savedSites)
  }

  // Create application menu
  createMenu(mainWindow, windowManager)

  // 优化窗口显示时机
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.webContents.addListener(
    '-add-new-contents' as any,
    (_event, url) => {
      console.log('did-create-window', url)
    }
  )

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  console.log(`App ready time: ${Date.now() - startupTime}ms`)

  bootup()

  // Initialize local SQLite database
  try {
    initDb()
  } catch (e) {
    console.error('Failed to init DB:', e)
  }

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  createWindow()

  // Start local Hono server for chat API
  honoServer = new HonoServer(3399)
  honoServer.start()

  // 监控窗口加载完成时间
  const mainWindow = windowManager?.getWindow(WindowType.MAIN)
  mainWindow?.webContents.once('did-finish-load', () => {
    const loadTime = Date.now() - startupTime
    console.log(`Window loaded time: ${loadTime}ms`)
    // 发送到渲染进程以便记录
    mainWindow?.webContents.send('startup-time', loadTime)
  })

  // 延迟执行非关键操作
  setTimeout(() => {
    // 注册全局快捷键
    const quickShortcut =
      process.platform === 'darwin'
        ? 'Command+Shift+Space'
        : 'Control+Shift+Space'
    globalShortcut.register(quickShortcut, () => {
      windowManager?.toggleQuickWindow()
    })

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })
  }, 1000)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // Setup IPC handlers
  if (!ipcHandlersRegistered) {
    setupIpcHandlers()
    ipcHandlersRegistered = true
  }
})

// 将 IPC 处理程序移到单独的函数中
function setupIpcHandlers() {
  // 防止开发时热重载导致重复注册：先清理已存在的 handler/listener
  const handleChannels = [
    'switch-tab',
    'get-site-configs',
    'set-site-configs',
    'open-settings',
    'close-settings',
    'open-external-url',
    'get-navigation-state',
    'go-back',
    'go-forward',
    'get-current-url',
    'get-local-api-base',
    'hide-current-view',
    'get-llm-settings',
    'set-llm-settings',
    'fetch-openrouter-models',
    'set-theme',
    'get-theme',
    'get-effective-theme',
    'set-color-theme',
    'get-color-theme',
    'db-list-conversations',
    'db-create-conversation',
    'db-delete-conversation',
    'db-get-messages',
    'db-save-messages'
  ] as const
  const onChannels = [
    'sidebar-resize',
    'layout-resize',
    'hide-quick-window'
  ] as const

  for (const ch of handleChannels) {
    try {
      ipcMain.removeHandler(ch as any)
    } catch (e) {
      // ignore
    }
  }
  for (const ch of onChannels) {
    try {
      ipcMain.removeAllListeners(ch)
    } catch (e) {
      // ignore
    }
  }
  ipcMain.handle('switch-tab', async (_, tab: string) => {
    if (!windowManager) return

    const siteConfig = windowManager
      .getSiteConfigs()
      .find(config => config.id === tab)
    if (siteConfig) {
      // 如果标记为外部打开，则在系统浏览器中打开 URL 并不创建内嵌视图
      if (siteConfig.external) {
        if (siteConfig.url) {
          await shell.openExternal(siteConfig.url)
        }
        // 同时隐藏当前视图，避免挡住主界面
        windowManager.hideCurrentView()
        return
      }

      windowManager.createSideView(siteConfig.id, siteConfig.title, {
        webPreferences: {
          contextIsolation: true
        }
      })
      windowManager.showSideView(siteConfig.id)
    }
  })

  // 监听侧边栏大小变化
  ipcMain.on('sidebar-resize', (_, width: number) => {
    if (windowManager) {
      windowManager.updateSidebarWidth(width)
    }
  })

  // 处理网站配置
  ipcMain.handle('get-site-configs', () => {
    if (!windowManager) return []
    return windowManager.getSiteConfigs()
  })

  ipcMain.handle('set-site-configs', (_, configs: SiteConfig[]) => {
    if (!windowManager) return
    windowManager.setSiteConfigs(configs)
    // 保存到存储
    store.set('sites', configs)
    // 通知所有窗口配置已更改
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('site-configs-changed')
    })
  })

  // 打开设置窗口
  ipcMain.handle('open-settings', () => {
    // 内嵌设置模式：隐藏当前 WebContentsView，由渲染进程展示设置页
    windowManager?.hideCurrentView()
  })

  // 关闭设置窗口
  ipcMain.handle('close-settings', () => {
    // 兼容：如果存在独立设置窗口则关闭；内嵌模式无需处理
    windowManager?.closeWindow(WindowType.SETTINGS)
  })

  // 隐藏快捷窗口
  ipcMain.on('hide-quick-window', () => {
    windowManager?.closeWindow(WindowType.QUICK)
  })

  // 打开外部URL
  ipcMain.handle('open-external-url', async (_, url: string) => {
    await shell.openExternal(url)
  })

  // 导航控制
  ipcMain.handle('get-navigation-state', () => {
    return windowManager?.getNavigationState()
  })
  ipcMain.handle('go-back', () => {
    windowManager?.goBackCurrent()
  })
  ipcMain.handle('go-forward', () => {
    windowManager?.goForwardCurrent()
  })
  ipcMain.handle('get-current-url', () => {
    return windowManager?.getCurrentUrl()
  })

  // 返回本地 API 基地址
  ipcMain.handle('get-local-api-base', () => {
    return honoServer?.getBaseURL() || 'http://127.0.0.1:3399'
  })

  // 隐藏当前内嵌视图（用于展示内置 Chat/设置 等界面）
  ipcMain.handle('hide-current-view', () => {
    windowManager?.hideCurrentView()
  })

  // LLM provider settings
  ipcMain.handle('get-llm-settings', () => {
    return store.get('llm') as LlmSettings
  })

  ipcMain.handle('set-llm-settings', (_evt, settings: LlmSettings) => {
    store.set('llm', settings)
    // 通知所有窗口 LLM 设置已更改（如需）
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('llm-settings-changed')
    })
  })

  // UI color theme (palette)
  ipcMain.handle('set-color-theme', (_evt, palette: string) => {
    store.set('ui.colorTheme', palette)
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('color-theme-changed', palette)
    })
  })
  ipcMain.handle('get-color-theme', () => {
    return (store.get('ui.colorTheme') as string) || 'default'
  })

  // Conversations DB
  ipcMain.handle('db-list-conversations', () => {
    try {
      return { ok: true, data: listConversations() }
    } catch (e: any) {
      return { ok: false, error: String(e?.message || e) }
    }
  })

  ipcMain.handle('db-create-conversation', (_evt, title?: string) => {
    try {
      const row = createConversation(title)
      return { ok: true, data: row }
    } catch (e: any) {
      return { ok: false, error: String(e?.message || e) }
    }
  })

  ipcMain.handle('db-delete-conversation', (_evt, id: string) => {
    try {
      deleteConversation(id)
      return { ok: true }
    } catch (e: any) {
      return { ok: false, error: String(e?.message || e) }
    }
  })

  ipcMain.handle('db-get-messages', (_evt, id: string) => {
    try {
      const conv = ensureConversation(id)
      const msgs = getConversationMessages(conv.id)
      return { ok: true, data: { id: conv.id, messages: msgs } }
    } catch (e: any) {
      return { ok: false, error: String(e?.message || e) }
    }
  })

  ipcMain.handle(
    'db-save-messages',
    (
      _evt,
      id: string,
      messages: Array<{ id: string; role: string; text: string }>
    ) => {
      try {
        upsertMessages(id, messages as any)
        return { ok: true }
      } catch (e: any) {
        return { ok: false, error: String(e?.message || e) }
      }
    }
  )

  ipcMain.handle('fetch-openrouter-models', async () => {
    const llm = (store.get('llm') as LlmSettings) || {
      provider: 'openrouter'
    }
    const apiKey = llm.openrouter?.apiKey || ''
    const baseUrl = (
      llm.openrouter?.baseUrl || 'https://openrouter.ai/api/v1'
    ).replace(/\/$/, '')

    if (!apiKey) {
      return { ok: false, error: 'MISSING_API_KEY' }
    }

    try {
      const res = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      })
      if (!res.ok) {
        const text = await res.text()
        return { ok: false, error: `HTTP_${res.status}`, detail: text }
      }
      const data = await res.json()
      // OpenRouter returns { data: Model[] }
      const models = Array.isArray(data?.data) ? data.data : []
      return { ok: true, models }
    } catch (error: any) {
      return {
        ok: false,
        error: 'NETWORK_ERROR',
        detail: String(error?.message || error)
      }
    }
  })

  // User custom CSS/JS injections
  interface UserInjection {
    css?: string
    js?: string
    enabled?: boolean
  }

  ipcMain.handle('get-user-injection', (_evt, siteId: string) => {
    const key = `userInjection.${siteId}`
    return (
      (store.get(key) as UserInjection) || { css: '', js: '', enabled: false }
    )
  })

  ipcMain.handle(
    'set-user-injection',
    (_evt, siteId: string, injection: UserInjection) => {
      const key = `userInjection.${siteId}`
      store.set(key, injection)

      // Notify windows to reload if the site is currently active
      BrowserWindow.getAllWindows().forEach(window => {
        window.webContents.send('user-injection-changed', { siteId, injection })
      })

      return { ok: true }
    }
  )

  ipcMain.handle('clear-user-injection', (_evt, siteId: string) => {
    const key = `userInjection.${siteId}`
    ;(store as any).delete(key)

    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('user-injection-changed', {
        siteId,
        injection: null
      })
    })

    return { ok: true }
  })

  ipcMain.handle('list-user-injections', () => {
    // Return all user injections
    const all = store.store
    const injections: Record<string, UserInjection> = {}
    for (const key in all) {
      if (key.startsWith('userInjection.')) {
        const siteId = key.replace('userInjection.', '')
        injections[siteId] = all[key] as UserInjection
      }
    }
    return injections
  })

  // 监听主题变化
  nativeTheme.on('updated', () => {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach(window => {
      window.webContents.send(
        'system-theme-changed',
        nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
      )
    })
  })

  // 监听布局变化
  ipcMain.on(
    'layout-resize',
    (_, data: { sidebarWidth: number; mainWidth: number }) => {
      if (windowManager) {
        windowManager.updateLayout(data.sidebarWidth)
      }
    }
  )
}

// 应用退出前注销所有快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
