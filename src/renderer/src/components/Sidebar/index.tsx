import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@renderer/components/ui/tabs';
import { Bot, Brain, MessageSquare } from 'lucide-react';

interface SidebarProps {
  children?: React.ReactNode;
  onTabChange?: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onTabChange }) => {
  return (
    <div className="h-full bg-background border-r border-border">
      <div className="flex flex-col h-full py-2">
        <Tabs defaultValue="deepseek" onValueChange={onTabChange} orientation="vertical" className="h-full">
          <TabsList className="flex flex-col h-auto space-y-1 bg-transparent p-2">
            <TabsTrigger value="deepseek" className="justify-start gap-2 px-4 py-2">
              <Bot size={18} />
              <span>DeepSeek</span>
            </TabsTrigger>
            <TabsTrigger value="tongyi" className="justify-start gap-2 px-4 py-2">
              <Brain size={18} />
              <span>通义千问</span>
            </TabsTrigger>
            <TabsTrigger value="wenxin" className="justify-start gap-2 px-4 py-2">
              <MessageSquare size={18} />
              <span>文心一言</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};
