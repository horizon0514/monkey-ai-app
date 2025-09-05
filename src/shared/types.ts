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
  }
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
