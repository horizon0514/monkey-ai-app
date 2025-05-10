import React from 'react';
import { cn } from '@renderer/lib/utils';

// 声明 window.platform 类型
declare global {
  interface Window {
    platform: {
      os: string;
    };
  }
}

interface TitlebarProps {
}

export const Titlebar: React.FC<TitlebarProps> = () => {
  const isMacOS = window.platform.os === 'darwin';

  return (
    <div
      className={cn(
        "h-12 w-full flex items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40",
        isMacOS && "justify-center"
      )}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {isMacOS && <div className="w-[78px]" />} {/* macOS traffic light 占位 */}
      <div className="flex items-center gap-2 px-2">
        {/* <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10 transition-all hover:bg-primary/20 hover:scale-105">
          <Sparkles size={14} className="text-primary transition-transform hover:scale-110" />
        </div> */}
        <span className="text-sm font-medium">ChatMonkey</span>
      </div>
    </div>
  );
};

