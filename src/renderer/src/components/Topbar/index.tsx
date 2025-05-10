import React from 'react';
import { SiteConfig } from '@renderer/config/sites';

interface TopbarProps {
  tab: SiteConfig;
}

export const Topbar: React.FC<TopbarProps> = ({ tab }) => {
  return (
    <div
      className="h-12 w-full flex items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 px-2">
        <span className="text-sm font-medium">{tab.title}</span>
      </div>
    </div>
  );
};

