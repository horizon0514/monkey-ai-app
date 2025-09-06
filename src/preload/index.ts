import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// 删除对 navigator 的原型修改，避免 Illegal invocation 错误

// Custom APIs for renderer
const api = {
  switchTab: (tab: string) => ipcRenderer.invoke('switch-tab', tab),
  getSiteConfigs: () => ipcRenderer.invoke('get-site-configs'),
  setSiteConfigs: (configs: unknown) =>
    ipcRenderer.invoke('set-site-configs', configs),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  closeSettings: () => ipcRenderer.invoke('close-settings'),
  setTheme: (theme: 'light' | 'dark' | 'system') =>
    ipcRenderer.invoke('set-theme', theme),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  getEffectiveTheme: () => ipcRenderer.invoke('get-effective-theme'),
  // Color theme (palette)
  setColorTheme: (palette: string) =>
    ipcRenderer.invoke('set-color-theme', palette),
  getColorTheme: () => ipcRenderer.invoke('get-color-theme'),
  hideQuickWindow: () => ipcRenderer.send('hide-quick-window'),
  openExternalUrl: (url: string) =>
    ipcRenderer.invoke('open-external-url', url),
  getNavigationState: () => ipcRenderer.invoke('get-navigation-state'),
  goBack: () => ipcRenderer.invoke('go-back'),
  goForward: () => ipcRenderer.invoke('go-forward'),
  getCurrentUrl: () => ipcRenderer.invoke('get-current-url'),
  hideCurrentView: () => ipcRenderer.invoke('hide-current-view'),
  getLocalApiBase: () => ipcRenderer.invoke('get-local-api-base'),
  // LLM settings
  getLlmSettings: () => ipcRenderer.invoke('get-llm-settings'),
  setLlmSettings: (settings: unknown) =>
    ipcRenderer.invoke('set-llm-settings', settings),
  fetchOpenRouterModels: () => ipcRenderer.invoke('fetch-openrouter-models'),
  ipcRenderer: {
    send: (channel: string, data: unknown) => {
      ipcRenderer.send(channel, data)
    },
    on: (
      channel: string,
      func: (event: IpcRendererEvent, ...args: unknown[]) => void
    ) => {
      ipcRenderer.on(channel, func)
    },
    removeListener: (
      channel: string,
      func: (event: IpcRendererEvent, ...args: unknown[]) => void
    ) => {
      ipcRenderer.removeListener(channel, func)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
// 早期设置 data-theme，尽可能在文档开始阶段避免闪烁
try {
  const arg = process.argv.find(a => a.startsWith('--appTheme='))
  const theme = arg ? arg.split('=')[1] : ''
  if (theme === 'light' || theme === 'dark') {
    try {
      document.documentElement.setAttribute('data-theme', theme)
    } catch {}
  }
  // 早期注入 CSS（隐藏/额外CSS）
  const earlyCssArg = process.argv.find(a => a.startsWith('--earlyCSS='))
  if (earlyCssArg) {
    const css = decodeURIComponent(earlyCssArg.slice('--earlyCSS='.length))
    if (css) {
      try {
        const style = document.createElement('style')
        style.textContent = css
        document.documentElement.appendChild(style)
      } catch {}
    }
  }
  // 早期注入 CSS 变量
  const cssVarsArg = process.argv.find(a => a.startsWith('--cssVars='))
  if (cssVarsArg) {
    try {
      const vars = JSON.parse(
        decodeURIComponent(cssVarsArg.slice('--cssVars='.length))
      )
      for (const [k, v] of Object.entries(vars)) {
        try {
          document.documentElement.style.setProperty(k, v as string)
        } catch {}
      }
    } catch {}
  }
  // 早期 classTweaks
  const classTweaksArg = process.argv.find(a => a.startsWith('--classTweaks='))
  if (classTweaksArg) {
    try {
      const tweaks = JSON.parse(
        decodeURIComponent(classTweaksArg.slice('--classTweaks='.length))
      )
      const apply = () => {
        for (const t of tweaks) {
          try {
            document.querySelectorAll(t.selector).forEach(el => {
              if (t.remove) el.classList.remove(...t.remove)
              if (t.add) el.classList.add(...t.add)
            })
          } catch {}
        }
      }
      apply()
      new MutationObserver(apply).observe(document.documentElement, {
        childList: true,
        subtree: true
      })
    } catch {}
  }
  // 早期 styleTweaks
  const styleTweaksArg = process.argv.find(a => a.startsWith('--styleTweaks='))
  if (styleTweaksArg) {
    try {
      const tweaks = JSON.parse(
        decodeURIComponent(styleTweaksArg.slice('--styleTweaks='.length))
      )
      const apply = () => {
        for (const t of tweaks) {
          try {
            document.querySelectorAll(t.selector).forEach(el => {
              for (const [k, v] of Object.entries(t.styles || {})) {
                const imp = t.important ? 'important' : ''
                if (
                  el &&
                  (el as HTMLElement).style &&
                  typeof (el as HTMLElement).style.setProperty === 'function'
                ) {
                  ;(el as HTMLElement).style.setProperty(k, v as string, imp)
                } else if (
                  el &&
                  typeof (el as Element).getAttribute === 'function' &&
                  typeof (el as Element).setAttribute === 'function'
                ) {
                  const prev = (el as Element).getAttribute('style') || ''
                  const decl = k + ': ' + v + (imp ? ' !important' : '') + ';'
                  ;(el as Element).setAttribute(
                    'style',
                    prev ? prev + ' ' + decl : decl
                  )
                }
              }
            })
          } catch {}
        }
      }
      apply()
      new MutationObserver(apply).observe(document.documentElement, {
        childList: true,
        subtree: true
      })
    } catch {}
  }
} catch {}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', api)
    contextBridge.exposeInMainWorld('platform', {
      os: process.platform
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = api
}
