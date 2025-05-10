import { app, nativeTheme, ipcMain, BrowserWindow } from 'electron'

// 主题类型
type Theme = 'light' | 'dark' | 'system'

// 保存当前主题
let currentTheme: Theme = 'system'

// 更新主题
function updateTheme(theme: Theme) {
  currentTheme = theme
  switch (theme) {
    case 'light':
      nativeTheme.themeSource = 'light'
      break
    case 'dark':
      nativeTheme.themeSource = 'dark'
      break
    case 'system':
      nativeTheme.themeSource = 'system'
      break
  }

  // 同步主题状态到所有窗口
  const windows = BrowserWindow.getAllWindows()
  windows.forEach(window => {
    if (theme === 'system') {
      window.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
    } else {
      window.webContents.send('theme-changed', theme)
    }
  })
}

export default function () {
  app.whenReady().then(() => {
    // 设置主题
    ipcMain.handle('set-theme', (_, theme: Theme) => {
      updateTheme(theme)
    })

    // 获取当前主题
    ipcMain.handle('get-theme', () => {
      return currentTheme
    })

    // 获取当前实际主题（考虑系统主题）
    ipcMain.handle('get-effective-theme', () => {
      return currentTheme === 'system' ? (nativeTheme.shouldUseDarkColors ? 'dark' : 'light') : currentTheme
    })

    // 初始化为系统主题
    updateTheme('system')
  })
}
