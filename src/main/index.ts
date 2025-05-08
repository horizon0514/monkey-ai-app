import { app, shell, BrowserWindow, ipcMain, WebContentsView } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createMenu } from './menu'
import { WindowManager } from './windowManager'

let mainWindow: BrowserWindow | null = null
let windowManager: WindowManager | null = null

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 10, y: 15 },
    ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
    transparent: true,
    backgroundColor: '#00000000',
    useContentSize: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: true
    }
  })

  windowManager = new WindowManager(mainWindow)

  // Create application menu
  createMenu(mainWindow, windowManager)

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

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
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // Setup IPC handlers
  ipcMain.handle('switch-tab', async (_, tab: string) => {
    if (!windowManager) return

    switch (tab) {
      case 'deepseek':
        windowManager.createSideView('deepseek', 'DeepSeek', {
          webPreferences: {
            contextIsolation: true
          }
        })
        windowManager.showSideView('deepseek')
        break
      case 'tongyi':
        windowManager.createSideView('tongyi', '通义千问', {
          webPreferences: {
            contextIsolation: true
          }
        })
        windowManager.showSideView('tongyi')
        break
      case 'wenxin':
        windowManager.createSideView('wenxin', '文心一言', {
          webPreferences: {
            contextIsolation: true
          }
        })
        windowManager.showSideView('wenxin')
        break
    }
  })

  // 监听侧边栏大小变化
  ipcMain.on('sidebar-resize', (_, width: number) => {
    if (windowManager) {
      windowManager.updateSidebarWidth(width)
    }
  })
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






