import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@renderer/components/ui/tabs';
import { Bot, Brain, MessageSquare, LucideIcon } from 'lucide-react';
import { sites } from '@renderer/config/sites';

interface SidebarProps {
  children?: React.ReactNode;
  onTabChange?: (tab: string) => void;
}

// 为每个网站ID定义对应的图标
const SITE_ICONS: Record<string, LucideIcon> = {
  deepseek: Bot,
  tongyi: Brain,
  wenxin: MessageSquare,
};

export const Sidebar: React.FC<SidebarProps> = ({ onTabChange }) => {
  return (
    <div className="h-full bg-background border-r border-border/40 drag-region">
      <div className="flex flex-col h-full py-4">
        <div className="px-2 mb-2">
          <p className="px-2 text-sm text-muted-foreground">
            选择你想要使用的 AI 助手
          </p>
        </div>
        <Tabs defaultValue={sites[0].id} onValueChange={onTabChange} orientation="vertical" className="h-full">
          <TabsList className="flex flex-col h-auto space-y-1 bg-transparent px-2">
            {sites.map(site => {
              const Icon = SITE_ICONS[site.id] || Bot;
              return (
                <TabsTrigger
                  key={site.id}
                  value={site.id}
                  className="no-drag group relative justify-start gap-3 px-4 py-2.5 text-sm font-medium transition-all hover:bg-muted/50 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  <Icon
                    size={18}
                    className="shrink-0 transition-transform group-hover:scale-110 group-data-[state=active]:text-primary"
                  />
                  <span className="transition-colors group-hover:text-foreground/90">{site.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};
