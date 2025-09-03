/// <reference types="vite/client" />
import { Theme } from './types/theme'
import { SiteConfig } from '../../../shared/types'

declare global {
  interface Window {
    electron: {
      switchTab: (tab: string) => Promise<void>
      getSiteConfigs: () => Promise<SiteConfig[]>
      setSiteConfigs: (configs: SiteConfig[]) => Promise<void>
      openSettings: () => Promise<void>
      closeSettings: () => Promise<void>
      setTheme: (theme: Theme) => Promise<void>
      getTheme: () => Promise<Theme>
      getEffectiveTheme: () => Promise<'light' | 'dark'>
      hideQuickWindow: () => void
      openExternalUrl: (url: string) => Promise<void>
      ipcRenderer: {
        send: (channel: string, data: unknown) => void
        on: (
          channel: string,
          func: (event: unknown, ...args: unknown[]) => void
        ) => void
        removeListener: (
          channel: string,
          func: (event: unknown, ...args: unknown[]) => void
        ) => void
      }
    }
    platform: {
      os: string
    }
  }
}
