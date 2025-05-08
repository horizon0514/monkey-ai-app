import React from 'react';
import { Sparkles } from 'lucide-react';

interface TitlebarProps {
}

export const Titlebar: React.FC<TitlebarProps> = () => {
  return (
    <div
      className="h-12 w-full flex items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="w-[78px]" /> {/* macOS traffic light 占位 */}
      <div className="flex items-center gap-2 px-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10">
          <Sparkles size={14} className="text-primary" />
        </div>
        <span className="text-sm font-medium">AI 助手</span>
      </div>
    </div>
  );
};

