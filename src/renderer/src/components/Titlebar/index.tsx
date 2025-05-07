import React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
interface TitlebarProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export const Titlebar: React.FC<TitlebarProps> = ({ onToggleSidebar, isSidebarCollapsed }) => {
  return (
    <div
      className="h-12 w-full flex items-center bg-background border-b border-border"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="w-[78px]" /> {/* macOS traffic light 占位 */}
      <button
        onClick={onToggleSidebar}
        className="p-0.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {isSidebarCollapsed ? (
          <PanelLeftOpen size={20} />
        ) : (
          <PanelLeftClose size={20} />
        )}
      </button>
    </div>
  );
};

