export type AIProvider =
  | 'anthropic'
  | 'openai'
  | 'gemini'
  | 'openrouter'
  | 'groq'
  | 'mistral'
  | 'together'

// Providers que falam o protocolo OpenAI (chat/completions) — roteados via callOpenAI.
// baseUrl default por provider; usuário pode sobrescrever.
export const OPENAI_COMPATIBLE_BASE_URLS: Record<string, string> = {
  openrouter: 'https://openrouter.ai/api/v1',
  groq: 'https://api.groq.com/openai/v1',
  mistral: 'https://api.mistral.ai/v1',
  together: 'https://api.together.xyz/v1',
}

export const AI_PROVIDERS: AIProvider[] = [
  'anthropic',
  'openai',
  'gemini',
  'openrouter',
  'groq',
  'mistral',
  'together',
]

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
