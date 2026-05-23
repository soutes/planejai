export type AIProvider = 'anthropic' | 'openai' | 'openrouter' | 'gemini'

export interface AIConfig {
  provider: AIProvider
  model: string
  baseUrl: string
  keyConfigured: boolean
  keyPreview: string
}

export interface SaveAIConfigInput {
  provider: AIProvider
  apiKey?: string
  model: string
  baseUrl?: string
}
