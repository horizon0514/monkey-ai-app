export type Theme = 'light' | 'dark' | 'system';

declare global {
  interface Window {
    electron: {
      switchTab: (tab: string) => Promise<void>;
      getSiteConfigs: () => Promise<{ id: string; title: string; url: string; }[]>;
      setSiteConfigs: (configs: { id: string; title: string; url: string; }[]) => Promise<void>;
      openSettings: () => Promise<void>;
      closeSettings: () => Promise<void>;
      setTheme: (theme: Theme) => Promise<void>;
      getTheme: () => Promise<Theme>;
      getEffectiveTheme: () => Promise<'light' | 'dark'>;
      ipcRenderer: {
        send: (channel: string, data: unknown) => void;
        on: (channel: string, func: (event: unknown, ...args: unknown[]) => void) => void;
        removeListener: (channel: string, func: (event: unknown, ...args: unknown[]) => void) => void;
      };
    };
    platform: {
      os: string;
    };
  }
}
