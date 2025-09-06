import { WebContents, nativeTheme } from 'electron'
import { DomainToUnifyRules } from '../shared/types'

const BASELINE_CSS = `
@layer app-reset, app-base, app-tweaks;
@layer app-base {
  :root { color-scheme: light dark; }
  html, body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  * { scrollbar-width: thin }
  *::-webkit-scrollbar { width: 10px; height: 10px }
  *::-webkit-scrollbar-thumb { border-radius: 8px }
}
@layer app-tweaks {
  .unify-container { max-width: var(--max-width, 1080px); margin: 0 auto; padding: 16px }
  img, video { max-width: 100%; height: auto }
}`

export class UnifyInjector {
  private rules: DomainToUnifyRules

  constructor(rules: DomainToUnifyRules) {
    this.rules = rules
  }

  attach(webContents: WebContents) {
    // 注入时机：导航完成后
    const injectAll = () => {
      this.injectThemeAttr(webContents)
      this.injectBaselineCss(webContents)
      this.injectPerDomainTweaks(webContents)
      this.injectCleaner(webContents)
    }

    webContents.on('did-frame-finish-load', injectAll)
    webContents.on('did-navigate-in-page', injectAll)

    // 跟随应用/系统主题变化更新 data-theme
    const onThemeUpdated = () => this.injectThemeAttr(webContents)
    nativeTheme.on('updated', onThemeUpdated)
    webContents.on('destroyed', () => {
      nativeTheme.off('updated', onThemeUpdated)
    })
  }

  private getConfigForHost(host: string) {
    const normalized = host.replace(/^www\./, '')
    const wildcard = this.rules['*'] || {}
    const site = this.rules[normalized] || this.rules[host] || {}
    return {
      hide: [...(wildcard.hide || []), ...(site.hide || [])],
      cssVars: { ...(wildcard.cssVars || {}), ...(site.cssVars || {}) },
      extraCSS: [...(wildcard.extraCSS || []), ...(site.extraCSS || [])],
      classTweaks: [
        ...(wildcard.classTweaks || []),
        ...(site.classTweaks || [])
      ],
      styleTweaks: [
        ...(wildcard.styleTweaks || []),
        ...(site.styleTweaks || [])
      ],
      flags: { ...(wildcard.flags || {}), ...(site.flags || {}) }
    }
  }

  private async injectBaselineCss(wc: WebContents) {
    try {
      const url = wc.getURL() || ''
      const host = new URL(url).host
      const cfg = this.getConfigForHost(host)
      if (cfg.flags?.baselineCss) {
        await wc.insertCSS(BASELINE_CSS)
      }
    } catch (e) {
      // ignore
    }
  }

  private async injectThemeAttr(wc: WebContents) {
    try {
      const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
      const script = `(() => { try { document.documentElement.setAttribute('data-theme', '${theme}'); } catch {} })();`
      await wc.executeJavaScript(script, true)
    } catch {
      // ignore
    }
  }

  private async injectPerDomainTweaks(wc: WebContents) {
    try {
      const url = wc.getURL() || ''
      const host = new URL(url).host
      const cfg = this.getConfigForHost(host)

      // css vars
      if (cfg.cssVars && Object.keys(cfg.cssVars).length > 0) {
        const varScript = `(() => { const vars = ${JSON.stringify(
          cfg.cssVars
        )}; for (const [k,v] of Object.entries(vars)) document.documentElement.style.setProperty(k, v); })();`
        await wc.executeJavaScript(varScript, true)
      }

      // extra css
      if (cfg.extraCSS && cfg.extraCSS.length > 0) {
        const cssText = cfg.extraCSS.join('\n')
        await wc.insertCSS(cssText)
      }

      // class tweaks
      if (cfg.classTweaks && cfg.classTweaks.length > 0) {
        const script = `(() => {
          const tweaks = ${JSON.stringify(cfg.classTweaks)};
          for (const t of tweaks) {
            try {
              document.querySelectorAll(t.selector).forEach(el => {
                if (t.remove) el.classList.remove(...t.remove);
                if (t.add) el.classList.add(...t.add);
              });
            } catch {}
          }
          const mo = new MutationObserver(() => {
            for (const t of tweaks) {
              try {
                document.querySelectorAll(t.selector).forEach(el => {
                  if (t.remove) el.classList.remove(...t.remove);
                  if (t.add) el.classList.add(...t.add);
                });
              } catch {}
            }
          });
          mo.observe(document.documentElement, { childList: true, subtree: true });
        })();`
        await wc.executeJavaScript(script, true)
      }

      // style tweaks
      if (cfg.styleTweaks && cfg.styleTweaks.length > 0) {
        const script = `(() => {
          const tweaks = ${JSON.stringify(cfg.styleTweaks)};
          console.log(tweaks);
          function apply() {
            for (const t of tweaks) {
              try {
                document.querySelectorAll(t.selector).forEach(el => {
                  for (const [k,v] of Object.entries(t.styles || {})) {
                    const imp = t.important ? 'important' : '';
                    if (el && el.style && typeof el.style.setProperty === 'function') {
                      el.style.setProperty(k, v, imp);
                    } else if (el && typeof el.getAttribute === 'function' && typeof el.setAttribute === 'function') {
                      const prev = el.getAttribute('style') || '';
                      const decl = k + ': ' + v + (imp ? ' !important' : '') + ';';
                      el.setAttribute('style', prev ? (prev + ' ' + decl) : decl);
                    }
                  }
                });
              }
            } catch {}
          }
          apply();
          const mo = new MutationObserver(apply);
          mo.observe(document.documentElement, { childList: true, subtree: true });
        })();`
        await wc.executeJavaScript(script, true)
      }
    } catch {
      // ignore
    }
  }

  private async injectCleaner(wc: WebContents) {
    try {
      const url = wc.getURL() || ''
      const host = new URL(url).host
      const cfg = this.getConfigForHost(host)
      const selectors = cfg.hide || []
      const script = `(() => {
        const selectors = ${JSON.stringify(selectors)};
        function hideOnce() {
          for (const sel of selectors) {
            try {
              document.querySelectorAll(sel).forEach(el => el && el.style && el.style.setProperty('display','none','important'));
            } catch {}
          }
        }
        hideOnce();
        const mo = new MutationObserver(hideOnce);
        mo.observe(document.documentElement, { childList: true, subtree: true });
      })();`
      await wc.executeJavaScript(script, true)
    } catch {
      // ignore
    }
  }
}
