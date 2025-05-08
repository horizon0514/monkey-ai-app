/// <reference types="vite/client" />

interface Window {
  electron: {
    switchTab: (tab: string) => Promise<void>;
    getSiteConfigs: () => Promise<Array<{ id: string; title: string; url: string; }>>;
    setSiteConfigs: (configs: Array<{ id: string; title: string; url: string; }>) => Promise<void>;
    ipcRenderer: {
      send: (channel: string, data: unknown) => void;
      on: (channel: string, func: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) => void;
      removeListener: (channel: string, func: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) => void;
    };
  };
}
