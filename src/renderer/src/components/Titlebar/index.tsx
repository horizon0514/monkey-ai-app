import React from 'react';
import { ChevronRightIcon, ChevronLeftIcon } from '@radix-ui/react-icons';

interface TitlebarProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export const Titlebar: React.FC<TitlebarProps> = ({ onToggleSidebar, isSidebarCollapsed }) => {
  return (
    <div className="h-12 flex items-center justify-end bg-background border-b border-border" style={{
      WebkitAppRegion: 'drag',
    }}>
      <button
        onClick={onToggleSidebar}
        className="p-1 hover:bg-accent hover:text-accent-foreground rounded-sm mx-2 transition-colors"
      >
        {isSidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </button>
    </div>
  );
};

