/// <reference types="vite/client" />
import { Theme } from './types/theme'
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

// Minimal module declaration for ai/react to satisfy TS in this setup
declare module 'ai/react' {
  export type UseChatOptions = {
    api: string
    streamMode?: 'text'
    body?: Record<string, unknown>
  }
  export function useChat(opts: UseChatOptions): {
    messages: Array<{ id: string; role: 'user' | 'assistant'; content: unknown }>
    input: string
    handleInputChange: (e: any) => void
    handleSubmit: (e: any) => void
    isLoading: boolean
    stop: () => void
  }
}
