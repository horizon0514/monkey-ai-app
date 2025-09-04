import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// 修改 navigator 属性
const modifyNavigator = () => {
  const platform = process.platform === 'darwin' ? 'macOS' : 'Windows'
  const chromeVersion = '120.0.0.0'
  const userAgent = `Mozilla/5.0 (${platform === 'macOS' ? 'Macintosh; Intel Mac OS X 10_15_7' : 'Windows NT 10.0; Win64; x64'}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`

  try {
    Object.defineProperties(navigator, {
      userAgent: {
        value: userAgent,
        configurable: false,
        writable: false
      },
      appVersion: {
        value: userAgent.substring(8),
        configurable: false,
        writable: false
      },
      platform: {
        value: platform === 'macOS' ? 'MacIntel' : 'Win32',
        configurable: false,
        writable: false
      },
      vendor: {
        value: 'Google Inc.',
        configurable: false,
        writable: false
      }
    })

    // 修改 navigator.userAgentData
    if (!(navigator as any).userAgentData) {
      Object.defineProperty(navigator, 'userAgentData', {
        value: {
          brands: [
            { brand: 'Chromium', version: chromeVersion.split('.')[0] },
            { brand: 'Google Chrome', version: chromeVersion.split('.')[0] },
            { brand: 'Not=A?Brand', version: '24' }
          ],
          mobile: false,
          platform: platform
        },
        configurable: false,
        writable: false
      })
    }
  } catch (e) {
    console.error('Failed to modify navigator properties:', e)
  }
}

// 在页面加载完成后执行修改
document.addEventListener('DOMContentLoaded', modifyNavigator)

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
