export interface SiteConfig {
  id: string
  title: string
  url: string
  enabled: boolean
  external?: boolean
}

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
