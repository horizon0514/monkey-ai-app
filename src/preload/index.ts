import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// 暴露 IPC 通信接口到渲染进程
contextBridge.exposeInMainWorld('electron', {
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
  },
})
