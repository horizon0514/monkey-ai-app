import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// 删除对 navigator 的原型修改，避免 Illegal invocation 错误

// Custom APIs for renderer
const api = {
  switchTab: (tab: string) => ipcRenderer.invoke('switch-tab', tab),
  getSiteConfigs: () => ipcRenderer.invoke('get-site-configs'),
  setSiteConfigs: (configs: unknown) =>
    ipcRenderer.invoke('set-site-configs', configs),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  closeSettings: () => ipcRenderer.invoke('close-settings'),
  setTheme: (theme: 'light' | 'dark' | 'system') =>
    ipcRenderer.invoke('set-theme', theme),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  getEffectiveTheme: () => ipcRenderer.invoke('get-effective-theme'),
  hideQuickWindow: () => ipcRenderer.send('hide-quick-window'),
  openExternalUrl: (url: string) =>
    ipcRenderer.invoke('open-external-url', url),
  getNavigationState: () => ipcRenderer.invoke('get-navigation-state'),
  goBack: () => ipcRenderer.invoke('go-back'),
  goForward: () => ipcRenderer.invoke('go-forward'),
  getCurrentUrl: () => ipcRenderer.invoke('get-current-url'),
  hideCurrentView: () => ipcRenderer.invoke('hide-current-view'),
  getLocalApiBase: () => ipcRenderer.invoke('get-local-api-base'),
  // Chat history
  listConversations: () => ipcRenderer.invoke('db-list-conversations'),
  getMessages: (conversationId: string) =>
    ipcRenderer.invoke('db-get-messages', conversationId),
  deleteConversation: (conversationId: string) =>
    ipcRenderer.invoke('db-delete-conversation', conversationId),
  // LLM settings
  getLlmSettings: () => ipcRenderer.invoke('get-llm-settings'),
  setLlmSettings: (settings: unknown) =>
    ipcRenderer.invoke('set-llm-settings', settings),
  fetchOpenRouterModels: () => ipcRenderer.invoke('fetch-openrouter-models'),
  ipcRenderer: {
    send: (channel: string, data: unknown) => {
      ipcRenderer.send(channel, data)
    },
    on: (
      channel: string,
      func: (event: IpcRendererEvent, ...args: unknown[]) => void
    ) => {
      ipcRenderer.on(channel, func)
    },
    removeListener: (
      channel: string,
      func: (event: IpcRendererEvent, ...args: unknown[]) => void
    ) => {
      ipcRenderer.removeListener(channel, func)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', api)
    contextBridge.exposeInMainWorld('platform', {
      os: process.platform
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = api
}
