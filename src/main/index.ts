import { app, nativeTheme, BaseWindow, WebContentsView } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import theme from './bootup/theme'
import { createMenu } from './menu'

theme()

let mainWindow: BaseWindow | null = null

function createWindow() {
  // Create the base window
  mainWindow = new BaseWindow({
    width: 1200,
    height: 800,
    ...(process.platform === 'linux' ? { icon } : {}),
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 10, y: 15 },
    ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
    transparent: true,
    backgroundColor: '#00000000',
    useContentSize: false,
    show: false,
  })

  // Create the main web contents view
  const mainView = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),
    }
  })

  // Set the main view as the window's content
  mainWindow.setContentView(mainView)

  // Create application menu
  createMenu(mainWindow)

  // Load the content
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainView.webContents.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainView.webContents.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Listen for the webContents to be ready
  mainView.webContents.once('did-finish-load', () => {
    mainWindow?.show()
    // 初始化时发送当前主题
    const isDark = nativeTheme.shouldUseDarkColors
    mainView.webContents.send('theme-changed', isDark ? 'dark' : 'light')
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    mainWindow = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BaseWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)






