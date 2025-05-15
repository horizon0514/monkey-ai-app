import React from 'react';
import { cn } from '@renderer/lib/utils';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@renderer/components/ui/button';

// 声明 window.platform 类型
declare global {
  interface Window {
    platform: {
      os: string;
    };
  }
}

interface TitlebarProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Titlebar: React.FC<TitlebarProps> = ({ onToggleSidebar, isSidebarCollapsed }) => {
  const isMacOS = window.platform.os === 'darwin';

  return (
    <div
      className={cn(
        "h-12 flex items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40",
        isMacOS && !isSidebarCollapsed && "justify-center",
        isSidebarCollapsed ? "w-auto px-2" : "w-full"
      )}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {isMacOS && <div className="w-[78px]" />} {/* macOS traffic light 占位 */}
      <div className={cn(
        "flex items-center gap-2",
        !isSidebarCollapsed && "px-2"
      )}>
        {!isSidebarCollapsed && (
          <span className="text-sm font-medium">ChatMonkey</span>
        )}
      </div>
      <div className="no-drag">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="hover:bg-muted/80"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen size={18} className="text-muted-foreground" />
          ) : (
            <PanelLeftClose size={18} className="text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
};

