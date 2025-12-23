import { WebContents, nativeTheme } from 'electron'
import { DomainToUnifyRules, SiteUnifyRule } from '../shared/types'
import * as h from './injectionHelpers'

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
}
`

/**
 * Simplified injection system with support for:
 * - Flexible config (string or array for hide/css)
 * - Direct JS injection
 * - User-defined custom injections
 */
export class UnifyInjector {
  constructor(private rules: DomainToUnifyRules) {}

  attach(webContents: WebContents) {
    const injectAll = () => this.injectAll(webContents)

    webContents.on('did-frame-finish-load', injectAll)
    webContents.on('did-navigate-in-page', injectAll)

    // Update theme on system theme change
    const onThemeUpdated = () => this.injectThemeAttr(webContents)
    nativeTheme.on('updated', onThemeUpdated)
    webContents.on('destroyed', () => {
      nativeTheme.off('updated', onThemeUpdated)
    })
  }

  private async injectAll(wc: WebContents) {
    try {
      const config = this.getConfigForUrl(wc.getURL())

      // Inject everything
      await Promise.all([
        this.injectThemeAttr(wc),
        this.injectCSS(wc, config),
        this.injectJS(wc, config)
      ])
    } catch (e) {
      console.error('Injection error:', e)
    }
  }

  private async injectThemeAttr(wc: WebContents) {
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    const script = `(() => { try { document.documentElement.setAttribute('data-theme', '${theme}'); } catch {} })();`
    await wc.executeJavaScript(script, true)
  }

  private async injectCSS(wc: WebContents, config: MergedConfig) {
    const cssParts: string[] = []

    // Baseline CSS if enabled
    if (config.flags?.baselineCss) {
      cssParts.push(BASELINE_CSS)
    }

    // CSS variables (from both vars and cssVars)
    if (config.cssVars && Object.keys(config.cssVars).length > 0) {
      cssParts.push(h.setVar(config.cssVars))
    }

    // Hide elements via CSS
    if (config.hideSelectors.length > 0) {
      cssParts.push(h.hide(...config.hideSelectors))
    }

    // Extra CSS (from both css and extraCSS)
    if (config.css) {
      cssParts.push(config.css)
    }

    // User custom CSS
    if (config.userEnabled && config.userCss) {
      cssParts.push(config.userCss)
    }

    // Class tweaks - convert to CSS
    if (config.classTweaks?.length) {
      cssParts.push(this.buildClassTweaksCSS(config.classTweaks))
    }

    // Style tweaks - convert to CSS
    if (config.styleTweaks?.length) {
      cssParts.push(this.buildStyleTweaksCSS(config.styleTweaks))
    }

    const combinedCSS = cssParts.filter(Boolean).join('\n\n')
    if (combinedCSS) {
      await wc.insertCSS(combinedCSS)
    }
  }

  private async injectJS(wc: WebContents, config: MergedConfig) {
    const jsParts: string[] = []

    // Hide elements via JS (for dynamic content)
    if (config.hideSelectors.length > 0) {
      jsParts.push(this.buildHideJS(config.hideSelectors))
    }

    // Class tweaks (for dynamic content)
    if (config.classTweaks?.length) {
      jsParts.push(this.buildClassTweaksJS(config.classTweaks))
    }

    // Style tweaks (for dynamic content)
    if (config.styleTweaks?.length) {
      jsParts.push(this.buildStyleTweaksJS(config.styleTweaks))
    }

    // Custom JS
    if (config.js) {
      jsParts.push(config.js)
    }

    // User custom JS
    if (config.userEnabled && config.userJs) {
      jsParts.push(config.userJs)
    }

    if (jsParts.length === 0) return

    const combinedJS = `
      (() => {
        try {
          ${jsParts.join('\n\n')}
        } catch (e) {
          console.error('Injection JS error:', e);
        }
      })();
    `
    await wc.executeJavaScript(combinedJS, true)
  }

  private buildHideJS(selectors: string[]): string {
    return h.observeMutations(`
      for (const sel of ${JSON.stringify(selectors)}) {
        document.querySelectorAll(sel).forEach(el => {
          el.style.setProperty('display', 'none', 'important');
        });
      }
    `)
  }

  private buildClassTweaksCSS(tweaks: SiteUnifyRule['classTweaks']): string {
    if (!tweaks) return ''
    return tweaks
      .map(t => {
        const parts: string[] = []
        if (t.add) parts.push(`.${t.add.join('.')} {}`) // Just to ensure classes exist
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }

  private buildClassTweaksJS(tweaks: SiteUnifyRule['classTweaks']): string {
    if (!tweaks) return ''
    const addParts: string[] = []
    const removeParts: string[] = []

    for (const t of tweaks) {
      if (t.add?.length) {
        addParts.push(
          `document.querySelectorAll('${t.selector}').forEach(el => el.classList.add('${t.add.join("','")}'));`
        )
      }
      if (t.remove?.length) {
        removeParts.push(
          `document.querySelectorAll('${t.selector}').forEach(el => el.classList.remove('${t.remove.join("','")}'));`
        )
      }
    }

    return h.observeMutations(`
      ${addParts.join('\n')}
      ${removeParts.join('\n')}
    `)
  }

  private buildStyleTweaksCSS(tweaks: SiteUnifyRule['styleTweaks']): string {
    if (!tweaks) return ''
    return tweaks
      .map(t => h.setStyle(t.selector, t.styles, t.important))
      .join('\n')
  }

  private buildStyleTweaksJS(tweaks: SiteUnifyRule['styleTweaks']): string {
    if (!tweaks) return ''
    const parts = tweaks.map(t =>
      h.setStyleJs(t.selector, t.styles, t.important)
    )
    return h.observeMutations(parts.join('\n'))
  }

  private getConfigForUrl(url: string): MergedConfig {
    try {
      const host = new URL(url).host.replace(/^www\./, '')
      const wildcard = this.rules['*'] || {}
      const site = this.rules[host] || {}

      // Merge configs (site overrides wildcard)
      return this.mergeConfigs(wildcard, site)
    } catch {
      return this.emptyConfig()
    }
  }

  private mergeConfigs(
    wildcard: SiteUnifyRule,
    site: SiteUnifyRule
  ): MergedConfig {
    // Normalize hide selectors
    const wildcardHide = h.normalizeHideConfig(wildcard.hide)
    const siteHide = h.normalizeHideConfig(site.hide)
    const hideSelectors = [...wildcardHide, ...siteHide]

    // Merge CSS variables (vars and cssVars)
    const cssVars = {
      ...(wildcard.cssVars || wildcard.vars || {}),
      ...(site.cssVars || site.vars || {})
    }

    // Merge CSS (css and extraCSS)
    const css = h.combineCss(h.mergeCss(wildcard), h.mergeCss(site))

    // Merge flags
    const flags = { ...(wildcard.flags || {}), ...(site.flags || {}) }

    // Merge class/style tweaks
    const classTweaks = [
      ...(wildcard.classTweaks || []),
      ...(site.classTweaks || [])
    ]
    const styleTweaks = [
      ...(wildcard.styleTweaks || []),
      ...(site.styleTweaks || [])
    ]

    return {
      hideSelectors,
      cssVars,
      css,
      js: site.js || wildcard.js || '',
      flags,
      classTweaks,
      styleTweaks,
      userCss: site.userCss || '',
      userJs: site.userJs || '',
      userEnabled: site.userEnabled || false
    }
  }

  private emptyConfig(): MergedConfig {
    return {
      hideSelectors: [],
      cssVars: {},
      css: '',
      js: '',
      flags: {},
      classTweaks: [],
      styleTweaks: [],
      userCss: '',
      userJs: '',
      userEnabled: false
    }
  }
}

interface MergedConfig {
  hideSelectors: string[]
  cssVars: Record<string, string>
  css: string
  js: string
  flags: SiteUnifyRule['flags']
  classTweaks: SiteUnifyRule['classTweaks']
  styleTweaks: SiteUnifyRule['styleTweaks']
  userCss: string
  userJs: string
  userEnabled: boolean
}
