import { app, nativeTheme } from 'electron'

export default function () {
  app.whenReady().then(() => {
    // 强制使用浅色主题
    nativeTheme.themeSource = 'light'
  })
}
