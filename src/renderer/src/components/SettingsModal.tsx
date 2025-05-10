import React, { useEffect, useState } from 'react';
import { cn } from '@renderer/lib/utils';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Theme } from '@renderer/types/electron';

// 扩展 window.electron 的类型声明
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
      ipcRenderer: {
        send: (channel: string, data: unknown) => void;
        on: (channel: string, func: (event: unknown, ...args: unknown[]) => void) => void;
        removeListener: (channel: string, func: (event: unknown, ...args: unknown[]) => void) => void;
      };
    };
  }
}

export const SettingsModal: React.FC = () => {
  const isMacOS = window.platform.os === 'darwin';
  const [currentTheme, setCurrentTheme] = useState<Theme>('system');

  // 获取当前主题
  useEffect(() => {
    window.electron.getTheme().then((theme: Theme) => {
      setCurrentTheme(theme);
    });
  }, []);

  // 按 ESC 关闭弹窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.electron.closeSettings();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 切换主题
  const handleThemeChange = async (theme: Theme) => {
    await window.electron.setTheme(theme);
    setCurrentTheme(theme);
  };

  return (
    <div className="w-full h-full bg-background">
      <div className="flex flex-col h-full">
        <div className="flex h-12 items-center border-b border-border/40 drag-region">
          <div className="flex-1 flex items-center justify-center">
            <span className="text-sm font-medium">设置</span>
          </div>
          {!isMacOS && <div className="w-[78px]" />} {/* Windows/Linux 对称占位 */}
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto">
            <div className="flex flex-col space-y-6 p-6">
              <div className="space-y-3">
                <h3 className={cn(
                  "font-medium leading-none",
                  isMacOS ? "text-sm" : "text-base"
                )}>主题</h3>
                <p className="text-sm text-muted-foreground">
                  选择你喜欢的主题外观。
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                      isMacOS ? "h-8 px-3 py-1.5" : "h-9 px-4 py-2",
                      currentTheme === 'light' && "bg-accent text-accent-foreground"
                    )}>
                    <Sun size={16} />
                    浅色
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                      isMacOS ? "h-8 px-3 py-1.5" : "h-9 px-4 py-2",
                      currentTheme === 'dark' && "bg-accent text-accent-foreground"
                    )}>
                    <Moon size={16} />
                    深色
                  </button>
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                      isMacOS ? "h-8 px-3 py-1.5" : "h-9 px-4 py-2",
                      currentTheme === 'system' && "bg-accent text-accent-foreground"
                    )}>
                    <Monitor size={16} />
                    跟随系统
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className={cn(
                  "font-medium leading-none",
                  isMacOS ? "text-sm" : "text-base"
                )}>关于</h3>
                <p className="text-sm text-muted-foreground">
                  版本 1.0.0
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
