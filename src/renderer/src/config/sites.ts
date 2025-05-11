import { SiteConfig } from '../../../shared/types';

export const defaultSites: SiteConfig[] = [
  {
    id: 'deepseek',
    title: 'DeepSeek',
    url: 'https://chat.deepseek.com/',
    enabled: true
  },
  {
    id: 'tongyi',
    title: '通义千问',
    url: 'https://tongyi.aliyun.com/',
    enabled: true
  },
  {
    id: 'wenxin',
    title: '文心一言',
    url: 'https://yiyan.baidu.com/',
    enabled: true
  }
];
