import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// Custom APIs for renderer
const api = {
  switchTab: (tab: string) => ipcRenderer.invoke('switch-tab', tab),
  getSiteConfigs: () => ipcRenderer.invoke('get-site-configs'),
  setSiteConfigs: (configs: unknown) => ipcRenderer.invoke('set-site-configs', configs),
  ipcRenderer: {
    send: (channel: string, data: unknown) => {
      ipcRenderer.send(channel, data)
    },
    on: (channel: string, func: (event: IpcRendererEvent, ...args: unknown[]) => void) => {
      ipcRenderer.on(channel, func)
    },
    removeListener: (channel: string, func: (event: IpcRendererEvent, ...args: unknown[]) => void) => {
      ipcRenderer.removeListener(channel, func)
    },
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = api
}
