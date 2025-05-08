export interface SiteConfig {
  id: string;
  title: string;
  url: string;
}

export const sites: SiteConfig[] = [
  {
    id: 'deepseek',
    title: 'DeepSeek',
    url: 'https://chat.deepseek.com/'
  },
  {
    id: 'tongyi',
    title: '通义千问',
    url: 'https://tongyi.aliyun.com/'
  },
  {
    id: 'wenxin',
    title: '文心一言',
    url: 'https://yiyan.baidu.com/'
  }
];
