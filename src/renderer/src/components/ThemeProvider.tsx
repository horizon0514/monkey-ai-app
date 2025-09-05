import { createContext, useContext, useEffect, useState } from 'react'
import type { ColorTheme } from '@renderer/types/theme'
import { getAllPalettes } from '@renderer/theme/palettes'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  colorTheme: ColorTheme
  setColorTheme: (palette: ColorTheme) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  colorTheme: 'default',
  setColorTheme: () => null
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
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('default')

  useEffect(() => {
    // 初始化时获取当前有效主题
    window.electron.getEffectiveTheme().then(effectiveTheme => {
      setThemeState(effectiveTheme as Theme)
    })

    // 初始化色板
    window.electron.getColorTheme().then((palette: any) => {
      setColorThemeState((palette as ColorTheme) || 'default')
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

    const colorThemeChangedHandler = (_event: unknown, ...args: unknown[]) => {
      const newPalette = (args[0] as ColorTheme) || 'default'
      setColorThemeState(newPalette)
    }

    window.electron.ipcRenderer.on('theme-changed', themeChangedHandler)
    window.electron.ipcRenderer.on(
      'system-theme-changed',
      systemThemeChangedHandler
    )
    window.electron.ipcRenderer.on(
      'color-theme-changed',
      colorThemeChangedHandler
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
      window.electron.ipcRenderer.removeListener(
        'color-theme-changed',
        colorThemeChangedHandler
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

  // 当 colorTheme 改变时更新选择器
  useEffect(() => {
    const root = window.document.documentElement
    // 兼容旧的 class 方案
    const all = getAllPalettes().map(p => `theme-${p.id}`)
    root.classList.remove(...all)
    root.classList.add(`theme-${colorTheme}`)
    // 新的 data-theme 方案
    root.setAttribute('data-theme', colorTheme)
  }, [colorTheme])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme)
    setThemeState(newTheme)
    // 通知 electron 更新主题
    window.electron.setTheme(newTheme)
  }

  const setColorTheme = (palette: ColorTheme) => {
    setColorThemeState(palette)
    window.electron.setColorTheme(palette)
  }

  const value = {
    theme,
    setTheme,
    colorTheme,
    setColorTheme
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
