/**
 * Helper functions for building CSS/JS injection strings
 * Makes it easier to create common injection patterns
 */

/**
 * Generate CSS to hide elements
 * @param selectors - CSS selectors to hide (string or array)
 * @returns CSS string
 */
export function hide(...selectors: string[]): string {
  if (selectors.length === 0) return ''
  return selectors.map(s => `${s} { display: none !important }`).join('\n')
}

/**
 * Generate CSS to set CSS variables
 * @param vars - Object mapping variable names to values
 * @returns CSS string
 */
export function setVar(vars: Record<string, string>): string {
  const entries = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n')
  return `:root {\n${entries}\n}`
}

/**
 * Generate CSS to set a single CSS variable
 * @param key - Variable name (with or without -- prefix)
 * @param value - Variable value
 * @returns CSS string
 */
export function setSingleVar(key: string, value: string): string {
  const varName = key.startsWith('--') ? key : `--${key}`
  return `:root { ${varName}: ${value}; }`
}

/**
 * Generate JS to add classes to elements
 * @param selector - CSS selector
 * @param classes - Classes to add
 * @returns JS string
 */
export function addClass(selector: string, ...classes: string[]): string {
  return `document.querySelectorAll('${selector}').forEach(el => el.classList.add('${classes.join("','")}'));`
}

/**
 * Generate JS to remove classes from elements
 * @param selector - CSS selector
 * @param classes - Classes to remove
 * @returns JS string
 */
export function removeClass(selector: string, ...classes: string[]): string {
  return `document.querySelectorAll('${selector}').forEach(el => el.classList.remove('${classes.join("','")}'));`
}

/**
 * Generate JS to click an element on load
 * @param selector - CSS selector for element to click
 * @param delay - Optional delay in milliseconds
 * @returns JS string
 */
export function clickOnLoad(selector: string, delay = 100): string {
  return `setTimeout(() => document.querySelector('${selector}')?.click(), ${delay});`
}

/**
 * Generate JS to wait for an element and run callback
 * @param selector - CSS selector to wait for
 * @param callback - JS code to run when element is found
 * @returns JS string
 */
export function waitForElement(selector: string, callback: string): string {
  return `
    (function waitFor${selector.replace(/[^a-z0-9]/gi, '')}() {
      const el = document.querySelector('${selector}');
      if (el) {
        ${callback}
      } else {
        setTimeout(waitFor${selector.replace(/[^a-z0-9]/gi, '')}, 50);
      }
    })();
  `
}

/**
 * Generate CSS to override element styles
 * @param selector - CSS selector
 * @param styles - Object mapping CSS properties to values
 * @param important - Whether to add !important
 * @returns CSS string
 */
export function setStyle(
  selector: string,
  styles: Record<string, string>,
  important = false
): string {
  const suffix = important ? ' !important' : ''
  const entries = Object.entries(styles)
    .map(([k, v]) => `  ${k}: ${v}${suffix};`)
    .join('\n')
  return `${selector} {\n${entries}\n}`
}

/**
 * Generate JS to set inline styles on elements
 * @param selector - CSS selector
 * @param styles - Object mapping CSS properties to values
 * @param important - Whether to use setProperty with 'important'
 * @returns JS string
 */
export function setStyleJs(
  selector: string,
  styles: Record<string, string>,
  important = false
): string {
  const imp = important ? `'important'` : `''`
  const entries = Object.entries(styles)
    .map(([k, v]) => `  el.style.setProperty('${k}', '${v}', ${imp});`)
    .join('\n')
  return `
    document.querySelectorAll('${selector}').forEach(el => {
      ${entries}
    });
  `
}

/**
 * Generate MutationObserver setup for persistent changes
 * @param script - JS code to run on each mutation
 * @returns JS string
 */
export function observeMutations(script: string): string {
  return `
    (function() {
      const apply = () => { ${script} };
      apply();
      new MutationObserver(apply).observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    })();
  `
}

/**
 * Generate CSS to apply on dark mode only
 * @param css - CSS to apply in dark mode
 * @returns CSS string
 */
export function darkMode(css: string): string {
  return `@media (prefers-color-scheme: dark) {\n${css}\n}`
}

/**
 * Generate CSS to apply on light mode only
 * @param css - CSS to apply in light mode
 * @returns CSS string
 */
export function lightMode(css: string): string {
  return `@media (prefers-color-scheme: light) {\n${css}\n}`
}

/**
 * Generate CSS for a container with max-width and centering
 * @param maxWidth - Max width (default: 1080px)
 * @param padding - Padding (default: 16px)
 * @returns CSS string
 */
export function container(maxWidth = '1080px', padding = '16px'): string {
  return `
    .unify-container {
      max-width: ${maxWidth};
      margin: 0 auto;
      padding: ${padding};
    }
  `
}

/**
 * Combine multiple CSS strings
 * @param css - CSS strings to combine
 * @returns Combined CSS string
 */
export function combineCss(...css: string[]): string {
  return css.filter(c => c && c.trim()).join('\n\n')
}

/**
 * Combine multiple JS strings
 * @param js - JS strings to combine
 * @returns Combined JS string
 */
export function combineJs(...js: string[]): string {
  return js.filter(j => j && j.trim()).join('\n\n')
}

/**
 * Normalize hide config to array of selectors
 * @param config - Hide config (string or array)
 * @returns Array of selectors
 */
export function normalizeHideConfig(
  config: string | string[] | undefined
): string[] {
  if (!config) return []
  if (typeof config === 'string') {
    return config
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  }
  return config
}

/**
 * Normalize CSS config to string
 * @param config - CSS config (string or array)
 * @returns Combined CSS string
 */
export function normalizeCssConfig(
  config: string | string[] | undefined
): string {
  if (!config) return ''
  if (typeof config === 'string') return config
  return config.join('\n')
}

/**
 * Merge cssVars and vars, with vars taking precedence
 * @param rule - SiteUnifyRule
 * @returns Merged CSS variables object
 */
export function mergeVars(rule: {
  cssVars?: Record<string, string>
  vars?: Record<string, string>
}): Record<string, string> {
  return { ...(rule.cssVars || {}), ...(rule.vars || {}) }
}

/**
 * Merge css and extraCSS, with css taking precedence
 * @param rule - SiteUnifyRule
 * @returns Combined CSS string
 */
export function mergeCss(rule: {
  css?: string | string[]
  extraCSS?: string | string[]
}): string {
  const old = normalizeCssConfig(rule.extraCSS)
  const neu = normalizeCssConfig(rule.css)
  return [old, neu].filter(c => c).join('\n')
}
