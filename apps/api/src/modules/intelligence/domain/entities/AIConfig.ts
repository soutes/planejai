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

const BLOCKED_HOSTS = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.google.com',
  'instance-data.ec2.internal',
])

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false
  const [a, b] = parts
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
}

export function validateAIBaseUrl(provider: string, value?: string): string {
  const official = provider === 'openai' || provider === 'anthropic' || provider === 'gemini'
    ? ''
    : OPENAI_COMPATIBLE_BASE_URLS[provider] ?? ''
  const raw = value?.trim() ?? ''
  if (!raw) return official

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('URL do provider inválida')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('URL do provider deve usar HTTP ou HTTPS')

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  const isPrivateIpv6 = host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host === 'fe80::1'
  if (BLOCKED_HOSTS.has(host) || host.endsWith('.local') || host.endsWith('.internal') || isPrivateIpv4(host) || isPrivateIpv6) {
    throw new Error('URL do provider não permitida')
  }
  return url.toString().replace(/\/$/, '')
}

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
