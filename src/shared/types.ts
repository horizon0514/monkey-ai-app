export interface SiteConfig {
  id: string
  title: string
  url: string
  enabled: boolean
  external?: boolean
}

// Simplified union types for flexible configuration
type HideConfig = string | string[]
type CssVarsConfig = Record<string, string>
type CssConfig = string | string[]
type JsConfig = string

// Unification rules for styling and distractions removal
export interface SiteUnifyRule {
  // CSS selectors to hide (display:none !important) - supports comma-separated string or array
  hide?: HideConfig

  // Shorthand for CSS variables
  vars?: CssVarsConfig
  // Deprecated: use vars instead
  cssVars?: CssVarsConfig

  // Additional CSS - supports single string or array
  css?: CssConfig
  // Deprecated: use css instead
  extraCSS?: CssConfig

  // Custom JavaScript to inject (executed in page context)
  js?: JsConfig

  // Feature flags
  flags?: {
    darkModeFix?: boolean
    compact?: boolean
    // Whether to inject baseline CSS reset/tweaks (default false)
    baselineCss?: boolean
  }

  // Add/remove classes for matched elements
  classTweaks?: Array<{
    selector: string
    add?: string[]
    remove?: string[]
  }>

  // Inline style overrides for matched elements
  styleTweaks?: Array<{
    selector: string
    styles: Record<string, string>
    important?: boolean
  }>

  // User-defined custom injections (stored in electron-store)
  userCss?: string
  userJs?: string
  userEnabled?: boolean
}

export type DomainToUnifyRules = Record<string, SiteUnifyRule>

// LLM Provider types
export type LlmProviderId = 'openrouter'

export interface OpenRouterSettings {
  apiKey: string
  baseUrl?: string
}

export interface LlmSettings {
  provider: LlmProviderId
  openrouter?: OpenRouterSettings
}
