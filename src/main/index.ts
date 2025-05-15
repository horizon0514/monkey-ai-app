import { app, shell, BrowserWindow, ipcMain, nativeTheme, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createMenu } from './menu'
import { WindowManager, WindowType } from './windowManager'
import { bootup } from './bootup'
import { SiteConfig } from '../shared/types'
import Store from 'electron-store'

// 初始化 electron-store
Store.initRenderer()

let mainWindow: BrowserWindow | null = null
let windowManager: WindowManager | null = null

// 创建配置存储实例
const store = new Store({
  name: 'site-configs',
  defaults: {
    sites: []
  }
})

// 添加启动时间监控
const startupTime = Date.now()

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

  mainWindow.webContents.setWindowOpenHandler((details) => {
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

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  createWindow()

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
    const quickShortcut = process.platform === 'darwin' ? 'Command+Shift+Space' : 'Control+Shift+Space'
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
  setupIpcHandlers()
})

// 将 IPC 处理程序移到单独的函数中
function setupIpcHandlers() {
  ipcMain.handle('switch-tab', async (_, tab: string) => {
    if (!windowManager) return

    const siteConfig = windowManager.getSiteConfigs().find(config => config.id === tab)
    if (siteConfig) {
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
    console.log('get-site-configs', windowManager.getSiteConfigs())
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
    windowManager?.createOrShowSettingsWindow()
  })

  // 关闭设置窗口
  ipcMain.handle('close-settings', () => {
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

  // 监听主题变化
  nativeTheme.on('updated', () => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      window.webContents.send('system-theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
    });
  });

  // 监听布局变化
  ipcMain.on('layout-resize', (_, data: { sidebarWidth: number; mainWidth: number }) => {
    if (windowManager) {
      windowManager.updateLayout(data.sidebarWidth, data.mainWidth);
    }
  });
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




