import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@renderer/components/ui/tabs';

interface SidebarProps {
  children?: React.ReactNode;
  onTabChange?: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onTabChange }) => {
  return (
    <div className="p-4">
      <Tabs defaultValue="baidu" onValueChange={onTabChange}>
        <TabsList className="w-full">
          <TabsTrigger value="baidu" className="flex-1">百度</TabsTrigger>
          <TabsTrigger value="google" className="flex-1">谷歌</TabsTrigger>
          <TabsTrigger value="feishu" className="flex-1">飞书</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
