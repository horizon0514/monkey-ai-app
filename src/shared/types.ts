export interface SiteConfig {
  id: string
  title: string
  url: string
  enabled: boolean
  external?: boolean
}

// Unification rules for styling and distractions removal
export interface SiteUnifyRule {
  // CSS selectors to hide (display:none !important)
  hide?: string[]
  // CSS variables to apply on :root
  cssVars?: Record<string, string>
  // Additional CSS strings to be appended via <style>
  extraCSS?: string[]
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
