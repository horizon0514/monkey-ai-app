import { DomainToUnifyRules } from './types'

export const unifyRules: DomainToUnifyRules = {
  '*': {
    hide: [
      '[role=banner]',
      '[id*=cookie i]',
      '.cookie, .cookies, .consent',
      '.announcement, .tooltip, .toast, .promo, .upgrade',
      'iframe[title*=ad i]'
    ],
    cssVars: {
      '--font-family': 'Inter, Noto Sans SC, system-ui, -apple-system, Segoe UI, Arial, sans-serif',
      '--font-size-base': '14px',
      '--line-height': '1.5',
      '--radius-md': '10px',
      '--space-1': '8px',
      '--space-2': '12px',
      '--space-3': '16px',
      '--max-width': '1080px'
    },
    extraCSS: [
      '.unify-container{max-width:var(--max-width);margin:0 auto;padding:var(--space-3)}',
      '@layer app-base {html,body{font-family:var(--font-family);font-size:var(--font-size-base);line-height:var(--line-height);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}}',
      '@layer app-tweaks {img,video{max-width:100%;height:auto}}'
    ],
    flags: { darkModeFix: true, compact: true }
  },
  'chat.deepseek.com': {
    hide: ['header, nav, footer', '.banner, .promo, .gdpr, .upgrade', 'aside'],
    extraCSS: [
      '.chat, .container, main{max-width:var(--max-width);margin:0 auto}'
    ]
  },
  'tongyi.aliyun.com': {
    hide: ['.aliyun-nav, .aliyun-footer, .cookie, .banner, [role=banner]'],
    extraCSS: [
      '[class*=chat], main{max-width:var(--max-width);margin:0 auto}'
    ]
  },
  'yiyan.baidu.com': {
    hide: ['header, nav, footer', '.banner, .cookie, .toast, .promo'],
    extraCSS: ['.chat, main{max-width:var(--max-width);margin:0 auto}']
  },
  'yuanbao.tencent.com': {
    hide: ['.global-header, .t-header, footer, .cookie, .banner, .promo'],
    extraCSS: [
      '[class*=chat], main{max-width:var(--max-width);margin:0 auto}'
    ]
  },
  'www.doubao.com': {
    hide: ['header, nav, footer', '.cookie, .banner, .modal[aria-label*=upgrade i]'],
    extraCSS: ['.chat, main{max-width:var(--max-width);margin:0 auto}']
  }
}

