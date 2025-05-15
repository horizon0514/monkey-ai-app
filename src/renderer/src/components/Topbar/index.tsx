import React from 'react';
import { SiteConfig } from '../../../../shared/types';
import { Button } from '@renderer/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@renderer/components/ThemeProvider';

interface TopbarProps {
  tab: SiteConfig;
}

export const Topbar: React.FC<TopbarProps> = ({ tab }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="h-12 w-full drag-region flex items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40"
    >
      <div className="flex items-center gap-2 px-2">
        <span className="text-sm font-medium">{tab.title}</span>
      </div>
      <div className="flex-1" />
      <div className="px-2 no-drag">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? (
            <Moon size={18} className="text-muted-foreground" />
          ) : (
            <Sun size={18} className="text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
};

