import { WebContents } from 'electron'
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
      this.injectBaselineCss(webContents)
      this.injectPerDomainTweaks(webContents)
      this.injectCleaner(webContents)
    }

    webContents.on('did-frame-finish-load', injectAll)
    webContents.on('did-navigate-in-page', injectAll)
  }

  private getConfigForHost(host: string) {
    const normalized = host.replace(/^www\./, '')
    const wildcard = this.rules['*'] || {}
    const site = this.rules[normalized] || this.rules[host] || {}
    return {
      hide: [...(wildcard.hide || []), ...(site.hide || [])],
      cssVars: { ...(wildcard.cssVars || {}), ...(site.cssVars || {}) },
      extraCSS: [...(wildcard.extraCSS || []), ...(site.extraCSS || [])],
      flags: { ...(wildcard.flags || {}), ...(site.flags || {}) }
    }
  }

  private async injectBaselineCss(wc: WebContents) {
    try {
      await wc.insertCSS(BASELINE_CSS)
    } catch (e) {
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

