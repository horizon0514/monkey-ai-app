import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'monkey-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    // 初始化时获取当前有效主题
    window.electron.getEffectiveTheme().then(effectiveTheme => {
      setThemeState(effectiveTheme as Theme)
    })

    // 监听主题变化
    const themeChangedHandler = (_event: unknown, ...args: unknown[]) => {
      const newTheme = args[0] as Theme
      setThemeState(newTheme)
    }

    // 监听系统主题变化
    const systemThemeChangedHandler = (_event: unknown, ...args: unknown[]) => {
      const newTheme = args[0] as Theme
      setThemeState(newTheme)
    }

    window.electron.ipcRenderer.on('theme-changed', themeChangedHandler)
    window.electron.ipcRenderer.on(
      'system-theme-changed',
      systemThemeChangedHandler
    )

    return () => {
      window.electron.ipcRenderer.removeListener(
        'theme-changed',
        themeChangedHandler
      )
      window.electron.ipcRenderer.removeListener(
        'system-theme-changed',
        systemThemeChangedHandler
      )
    }
  }, [theme])

  // 当 theme 改变时更新 classList
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    if (theme !== 'system') {
      root.classList.add(theme)
    }
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme)
    setThemeState(newTheme)
    // 通知 electron 更新主题
    window.electron.setTheme(newTheme)
  }

  const value = {
    theme,
    setTheme
  }

  return (
    <ThemeProviderContext.Provider
      {...props}
      value={value}
    >
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
