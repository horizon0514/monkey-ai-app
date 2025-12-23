import { SiteConfig } from './types'

export const defaultSites: SiteConfig[] = [
  {
    id: 'deepseek',
    title: 'DeepSeek',
    url: 'https://chat.deepseek.com/',
    enabled: true,
    icon: 'Bot'
  },
  {
    id: 'tongyi',
    title: '通义千问',
    url: 'https://tongyi.com/',
    enabled: true,
    icon: 'Brain'
  },
  {
    id: 'wenxin',
    title: '文心一言',
    url: 'https://yiyan.baidu.com/',
    enabled: true,
    icon: 'MessageSquare'
  },
  {
    id: 'yuanbao',
    title: '腾讯元宝',
    url: 'https://yuanbao.tencent.com/chat',
    enabled: true,
    icon: 'Sparkles'
  },
  {
    id: 'doubao',
    title: '豆包',
    url: 'https://www.doubao.com/chat/',
    enabled: true,
    icon: 'Coffee'
  }
]
