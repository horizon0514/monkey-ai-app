/// <reference types="vite/client" />
import { Theme, ColorTheme } from './types/theme'
import { SiteConfig, LlmSettings } from '../../../shared/types'

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
      setColorTheme: (palette: ColorTheme) => Promise<void>
      getColorTheme: () => Promise<ColorTheme>
      hideQuickWindow: () => void
      openExternalUrl: (url: string) => Promise<void>
      getNavigationState: () => Promise<{
        canGoBack: boolean
        canGoForward: boolean
      }>
      goBack: () => Promise<void>
      goForward: () => Promise<void>
      getCurrentUrl: () => Promise<string | null>
      hideCurrentView: () => Promise<void>
      getLocalApiBase: () => Promise<string>
      getLlmSettings: () => Promise<LlmSettings>
      setLlmSettings: (settings: LlmSettings) => Promise<void>
      // Chat DB APIs
      listConversations: () => Promise<
        | {
            ok: true
            data: Array<{
              id: string
              title: string
              createdAt: number
              updatedAt: number
            }>
          }
        | { ok: false; error: string }
      >
      createConversation: (
        title?: string
      ) => Promise<
        | {
            ok: true
            data: {
              id: string
              title: string
              createdAt: number
              updatedAt: number
            }
          }
        | { ok: false; error: string }
      >
      deleteConversation: (
        id: string
      ) => Promise<{ ok: true } | { ok: false; error: string }>
      getConversationMessages: (
        id: string
      ) => Promise<
        | {
            ok: true
            data: {
              id: string
              messages: Array<{ id: string; role: string; text: string }>
            }
          }
        | { ok: false; error: string }
      >
      saveConversationMessages: (
        id: string,
        messages: Array<{ id: string; role: string; text: string }>
      ) => Promise<{ ok: true } | { ok: false; error: string }>
      fetchOpenRouterModels: () => Promise<
        | { ok: true; models: unknown[] }
        | { ok: false; error: string; detail?: string }
      >
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

// remove legacy ai/react declaration; using @ai-sdk/react
