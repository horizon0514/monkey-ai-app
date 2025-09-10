/*
  unifyStyler: Robust style override utility for dynamic SPA pages

  Features:
  - Presets: quick fixes without writing selectors
  - Auto mode: heuristics to flatten backgrounds, remove border radius, zero margins/paddings
  - CSS injection with CSP nonce and !important
  - Inline overrides with style.setProperty(..., 'important') to beat inline !important
  - Handles Shadow DOM (open) and same-origin iframes
  - Observes DOM mutations and SPA history changes
  - Pseudo-element cleanup and common visual overlays removal
  - Returns a cleanup function to revert observers and restore history methods

  Usage example at bottom of file.
*/

/* ========================================================================== */
/* Utilities                                                                  */
/* ========================================================================== */

function toKebab(propName) {
  return String(propName).replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
}

function getNonceFromDoc(doc) {
  try {
    const scriptWithNonce = doc.querySelector('script[nonce]');
    return scriptWithNonce ? scriptWithNonce.getAttribute('nonce') : null;
  } catch (_) {
    return null;
  }
}

function injectStyleWithNonce(cssText, doc) {
  const targetDoc = doc || document;
  const styleEl = targetDoc.createElement('style');
  const nonce = getNonceFromDoc(targetDoc);
  if (nonce) styleEl.setAttribute('nonce', nonce);
  styleEl.textContent = cssText;
  (targetDoc.head || targetDoc.documentElement).appendChild(styleEl);
  return styleEl;
}

function isSameOriginIframe(iframe) {
  try {
    // Accessing contentDocument will throw on cross-origin
    return Boolean(iframe && iframe.contentDocument);
  } catch (_) {
    return false;
  }
}

function forEachShadowRoot(root, callback) {
  const walker = (node) => {
    if (!node) return;
    if (node.shadowRoot) callback(node.shadowRoot);
    const children = node.childNodes || [];
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i];
      if (child.nodeType === 1) walker(child);
    }
  };
  walker(root);
}

function getUniqueSelector(element) {
  // Attempts to build a reasonably stable selector for an element
  if (!(element && element.nodeType === 1)) return '';
  const parts = [];
  let el = element;
  while (el && el.nodeType === 1 && parts.length < 6) {
    const id = el.getAttribute('id');
    if (id) {
      parts.unshift(`#${CSS.escape(id)}`);
      break;
    }
    const tag = el.tagName.toLowerCase();
    const classList = Array.from(el.classList || []);
    const classPart = classList.length > 0 ? '.' + classList.map((c) => CSS.escape(c)).join('.') : '';
    const parent = el.parentElement;
    if (!parent) {
      parts.unshift(`${tag}${classPart}`);
      break;
    }
    const siblings = Array.from(parent.children).filter((n) => n.tagName === el.tagName);
    if (siblings.length <= 1) {
      parts.unshift(`${tag}${classPart}`);
    } else {
      const index = siblings.indexOf(el) + 1;
      parts.unshift(`${tag}${classPart}:nth-of-type(${index})`);
    }
    el = parent;
  }
  return parts.join(' > ');
}

function getComputedNumber(value) {
  const n = parseFloat(value || '0');
  return Number.isFinite(n) ? n : 0;
}

function hasVisibleBackground(style) {
  if (!style) return false;
  const bgImage = style.backgroundImage;
  if (bgImage && bgImage !== 'none') return true;
  const bgColor = style.backgroundColor;
  if (!bgColor) return false;
  // Check alpha channel in rgba/hsla or not transparent keyword
  if (bgColor === 'transparent') return false;
  // Quick heuristic: rgba(?, ?, ?, a)
  const m = bgColor.match(/rgba?\([^\)]*\)/);
  if (m) {
    const nums = m[0].match(/\d*\.?\d+/g) || [];
    const alpha = nums.length >= 4 ? parseFloat(nums[3]) : 1;
    return alpha > 0.01;
  }
  return true;
}

/* ========================================================================== */
/* Core builders                                                              */
/* ========================================================================== */

function buildCssFromTweaks(tweaks) {
  const rules = [];
  for (const t of tweaks) {
    const decls = Object.entries(t.styles || {})
      .map(([k, v]) => `${toKebab(k)}: ${String(v)}${t.important ? ' !important' : ''};`)
      .join(' ');
    if (decls) rules.push(`${t.selector} { ${decls} }`);
    if (t.pseudoCleanup) {
      rules.push(`${t.selector}::before, ${t.selector}::after { content: none !important; background: none !important; box-shadow: none !important; -webkit-mask: none !important; mask: none !important; filter: none !important; }`);
    }
  }
  return rules.join('\n');
}

function applyInlineTweaksOnce(tweaks, rootDoc) {
  const doc = rootDoc || document;
  for (const t of tweaks) {
    const nodeList = doc.querySelectorAll(t.selector);
    nodeList.forEach((el) => {
      for (const [k, v] of Object.entries(t.styles || {})) {
        el.style.setProperty(toKebab(k), String(v), t.important ? 'important' : '');
      }
    });
  }
}

/* ========================================================================== */
/* Auto heuristics                                                            */
/* ========================================================================== */

function buildAutoTweaks(options) {
  const opts = options || {};
  const auto = opts.auto || {};
  const includeBackground = auto.background !== false;
  const includeRadius = auto.borderRadius !== false;
  const includeSpacing = auto.spacing !== false; // margins/paddings
  const maxTargets = Math.max(1, Math.min(12, auto.limit || 8));

  const candidates = [];
  const elements = document.querySelectorAll('div, section, main, header, footer, aside, article');
  const viewportW = window.innerWidth || document.documentElement.clientWidth || 0;
  const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
  const viewportArea = Math.max(1, viewportW * viewportH);

  elements.forEach((el) => {
    // Skip invisible or detached
    const rect = el.getBoundingClientRect();
    if (!rect || rect.width < 16 || rect.height < 16) return;
    if (rect.bottom < 0 || rect.right < 0 || rect.top > viewportH * 2 || rect.left > viewportW * 2) return;
    const style = window.getComputedStyle(el);
    const scoreParts = [];
    const styles = {};

    if (includeBackground && hasVisibleBackground(style)) {
      styles.background = 'none';
      // Prefer also clearing gradient images specifically
      styles['background-image'] = 'none';
      scoreParts.push(3);
    }
    if (includeRadius) {
      const br = ['borderTopLeftRadius','borderTopRightRadius','borderBottomRightRadius','borderBottomLeftRadius']
        .map((k) => getComputedNumber(style[k])).reduce((a, b) => a + b, 0);
      if (br > 0) {
        styles['border-radius'] = '0';
        scoreParts.push(1.5);
      }
    }
    if (includeSpacing) {
      const mSum = ['marginTop','marginRight','marginBottom','marginLeft']
        .map((k) => getComputedNumber(style[k])).reduce((a, b) => a + b, 0);
      if (mSum > 0) {
        styles.margin = '0';
        scoreParts.push(1);
      }
      const pSum = ['paddingTop','paddingRight','paddingBottom','paddingLeft']
        .map((k) => getComputedNumber(style[k])).reduce((a, b) => a + b, 0);
      if (pSum > 0) {
        // avoid breaking layout: only flatten container-level paddings when large
        if (pSum > 16) styles.padding = '0';
        scoreParts.push(0.5);
      }
    }

    if (Object.keys(styles).length === 0) return;
    const area = Math.max(1, rect.width * rect.height);
    const viewportFrac = Math.min(1, area / viewportArea);
    const score = scoreParts.reduce((a, b) => a + b, 0) * (0.5 + viewportFrac);
    candidates.push({ el, styles, score });
  });

  candidates.sort((a, b) => b.score - a.score);
  const chosen = candidates.slice(0, maxTargets);
  const tweaks = chosen.map(({ el, styles }) => ({
    selector: getUniqueSelector(el) || 'html',
    styles,
    important: true,
    pseudoCleanup: true
  }));

  // Always include root-level fallbacks to ensure page background flatten
  if (includeBackground) {
    tweaks.push({ selector: 'html, body', styles: { background: 'none', 'background-image': 'none' }, important: true });
  }
  return tweaks;
}

/* ========================================================================== */
/* Presets                                                                    */
/* ========================================================================== */

const PRESETS = {
  flattenPage: () => ([
    { selector: 'html, body', styles: { background: 'none', 'background-image': 'none' }, important: true },
    { selector: '#ice-container, #ice-container > div', styles: { background: 'none', 'background-image': 'none' }, important: true, pseudoCleanup: true },
  ]),
  removeCardRadius: () => ([
    { selector: '.card, [class*="card"], [class*="panel"], [class*="container"]', styles: { 'border-radius': '0' }, important: true },
  ]),
  removeAppShellPadding: () => ([
    { selector: '#tongyi-content-wrapper, [class*="layout"], [class*="content"]', styles: { margin: '0', padding: '0' }, important: true },
  ]),
};

/* ========================================================================== */
/* Main installer                                                             */
/* ========================================================================== */

function installUnifyStyler(options) {
  const opts = options || {};
  const includeShadowDom = opts.includeShadowDom !== false;
  const includeIframes = opts.includeIframes !== false;
  const trackRouteChanges = opts.trackRouteChanges !== false;
  const forceInline = opts.forceInline !== false;
  const debug = Boolean(opts.debug);

  // Build tweaks from presets + user styles + auto
  let tweaks = [];
  const presetNames = Array.isArray(opts.presets) ? opts.presets : [];
  for (const name of presetNames) {
    const fn = PRESETS[name];
    if (typeof fn === 'function') {
      try { tweaks = tweaks.concat(fn()); } catch (_) {}
    }
  }
  if (Array.isArray(opts.styles)) tweaks = tweaks.concat(opts.styles);
  if (opts.auto) tweaks = tweaks.concat(buildAutoTweaks(opts));

  // De-duplicate by selector+decls signature
  const sigSet = new Set();
  tweaks = tweaks.filter((t) => {
    const key = `${t.selector}__${JSON.stringify(t.styles || {})}__${t.important ? 1 : 0}__${t.pseudoCleanup ? 1 : 0}`;
    if (sigSet.has(key)) return false;
    sigSet.add(key);
    return true;
  });

  if (debug) console.debug('[unifyStyler] Tweaks:', tweaks);

  // CSS injection across documents/roots
  const cssText = buildCssFromTweaks(tweaks);
  const injectedDocs = new WeakSet();
  const injectedStyles = new WeakMap();

  function injectIntoDoc(doc) {
    if (!doc || injectedDocs.has(doc)) return;
    const styleEl = injectStyleWithNonce(cssText, doc);
    injectedStyles.set(doc, styleEl);
    injectedDocs.add(doc);
  }

  // Inline application across documents
  function applyInlineInDoc(doc) {
    if (forceInline) applyInlineTweaksOnce(tweaks, doc);
  }

  function traverseAndApply(root) {
    const doc = root && root.nodeType === 9 ? root : (root && root.ownerDocument) || document;
    injectIntoDoc(doc);
    applyInlineInDoc(doc);

    // Shadow DOM roots
    if (includeShadowDom) {
      forEachShadowRoot(doc.documentElement, (shadowRoot) => {
        injectIntoDoc(shadowRoot);
        applyInlineInDoc(shadowRoot);
      });
      if (root && root.nodeType === 1) {
        forEachShadowRoot(root, (shadowRoot) => {
          injectIntoDoc(shadowRoot);
          applyInlineInDoc(shadowRoot);
        });
      }
    }

    // Same-origin iframes
    if (includeIframes && doc.querySelectorAll) {
      doc.querySelectorAll('iframe').forEach((iframe) => {
        if (isSameOriginIframe(iframe)) {
          const idoc = iframe.contentDocument;
          injectIntoDoc(idoc);
          applyInlineInDoc(idoc);
          if (includeShadowDom) {
            forEachShadowRoot(idoc.documentElement, (shadowRoot) => {
              injectIntoDoc(shadowRoot);
              applyInlineInDoc(shadowRoot);
            });
          }
        }
      });
    }
  }

  // Initial run
  traverseAndApply(document);

  // Observe DOM changes
  const mo = new MutationObserver((muts) => {
    let shouldRerun = false;
    for (let i = 0; i < muts.length; i += 1) {
      const m = muts[i];
      if (m.type === 'childList') {
        if (m.addedNodes && m.addedNodes.length > 0) { shouldRerun = true; break; }
      } else if (m.type === 'attributes') {
        if (m.attributeName === 'class' || m.attributeName === 'style') { shouldRerun = true; break; }
      }
    }
    if (shouldRerun) queueMicrotask(() => traverseAndApply(document));
  });
  mo.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });

  // Observe history changes (SPA)
  const original = { pushState: history.pushState, replaceState: history.replaceState };
  let popListener = null;
  if (trackRouteChanges) {
    const rerun = () => queueMicrotask(() => traverseAndApply(document));
    try {
      history.pushState = function pushStateWrapper() { const r = original.pushState.apply(this, arguments); rerun(); return r; };
      history.replaceState = function replaceStateWrapper() { const r = original.replaceState.apply(this, arguments); rerun(); return r; };
    } catch (_) {}
    popListener = () => rerun();
    window.addEventListener('popstate', popListener);
  }

  // Cleanup
  function cleanup() {
    try { mo.disconnect(); } catch (_) {}
    try { if (trackRouteChanges) {
      history.pushState = original.pushState;
      history.replaceState = original.replaceState;
      if (popListener) window.removeEventListener('popstate', popListener);
    }} catch (_) {}
    // Remove injected style elements
    injectedStyles.forEach((styleEl, doc) => {
      try { if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl); } catch (_) {}
    });
  }

  return cleanup;
}

/* ========================================================================== */
/* Convenience bootstrap                                                      */
/* ========================================================================== */

function unifyRules(options) {
  // Backward-friendly alias; users may already call unifyRules
  return installUnifyStyler(options);
}

/* ========================================================================== */
/* Example usage                                                              */
/* ========================================================================== */
/*
// Basic: presets + your rules + auto
unifyRules({
  presets: ['flattenPage', 'removeCardRadius', 'removeAppShellPadding'],
  styles: [
    { selector: '#ice-container>div', styles: { background: 'none', 'background-image': 'none' }, important: true },
    { selector: '#tongyi-content-wrapper', styles: { margin: '0', 'border-radius': '0' }, important: true },
  ],
  auto: { background: true, borderRadius: true, spacing: true, limit: 8 },
  includeShadowDom: true,
  includeIframes: true,
  trackRouteChanges: true,
  forceInline: true,
  debug: false,
});

// Cleanup later if needed:
// const stop = unifyRules({...});
// stop();
*/

// CommonJS and ESM compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { installUnifyStyler, unifyRules };
}
if (typeof window !== 'undefined') {
  window.installUnifyStyler = installUnifyStyler;
  window.unifyRules = unifyRules;
}

