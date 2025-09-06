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
      '--max-width': '100%'
    },
    extraCSS: [
      '.unify-container{max-width:var(--max-width);margin:0 auto;padding:var(--space-3)}',
      '@layer app-base {html,body{font-family:var(--font-family);font-size:var(--font-size-base);line-height:var(--line-height);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}}',
      '@layer app-tweaks {img,video{max-width:100%;height:auto}}'
    ],
    flags: { darkModeFix: true, compact: true, baselineCss: false }
  },
  'chat.deepseek.com': {
    hide: ['header, nav, footer', '.banner, .promo, .gdpr, .upgrade', 'aside'],
    extraCSS: [
    ],
    classTweaks: [
      { selector: 'main', add: ['unify-container'] }
    ]
  },
  'tongyi.com': {
    hide: ['.aliyun-nav, .aliyun-footer, .cookie, .banner, [role=banner]', '#new-nav-tab-wrapper, [class*="navTab"], tongyiDI-view-container'],
    extraCSS: [
    ],
    classTweaks: [
    ],
    styleTweaks: [
      { selector: '#ice-container>div', styles: { 'background': 'none' }, important: true },
      { selector: '#tongyi-content-wrapper', styles: { 'margin': '0', 'border-radius': '0' }, important: true }
    ]
  },
  'yiyan.baidu.com': {
    hide: ['header, nav, footer', '.banner, .cookie, .toast, .promo'],
    extraCSS: [],
    classTweaks: [
    ]
  },
  'yuanbao.tencent.com': {
    hide: ['.global-header, .t-header, footer, .cookie, .banner, .promo', '.t-popup, .agent-dialogue__tool, [data-item-title="Download Yuanbao Desktop"],[class*="index_pc_download"]'],
    extraCSS: [
    ],
    classTweaks: [
    ]
  },
  'www.doubao.com': {
    hide: ['[data-testid="sidebar_download_desktop_btn"]'],
    extraCSS: [],
    classTweaks: [
      { selector: 'main', add: ['unify-container'] }
    ]
  }
}

