import type { PrismaClient } from '@prisma/client'
import { encrypt, decrypt, maskKey } from '../../../shared/crypto.js'
import type { AIConfig, SaveAIConfigInput } from '../domain/entities/AIConfig.js'

export class PrismaAIConfigRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async get(): Promise<AIConfig> {
    const row = await this.prisma.aIConfig.findUnique({ where: { id: 1 } })
    if (!row) {
      return { provider: 'anthropic', model: 'claude-sonnet-4-6', baseUrl: '', keyConfigured: false, keyPreview: '' }
    }
    const plainKey = row.apiKey ? decrypt(row.apiKey) : ''
    return {
      provider: row.provider as AIConfig['provider'],
      model: row.model,
      baseUrl: row.baseUrl,
      keyConfigured: !!plainKey,
      keyPreview: plainKey ? maskKey(plainKey) : '',
    }
  }

  async save(input: SaveAIConfigInput): Promise<AIConfig> {
    const existing = await this.prisma.aIConfig.findUnique({ where: { id: 1 } })
    const encryptedKey = input.apiKey
      ? encrypt(input.apiKey)
      : (existing?.apiKey ?? '')

    await this.prisma.aIConfig.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        provider: input.provider,
        apiKey: encryptedKey,
        model: input.model,
        baseUrl: input.baseUrl ?? '',
      },
      update: {
        provider: input.provider,
        apiKey: encryptedKey,
        model: input.model,
        baseUrl: input.baseUrl ?? '',
      },
    })

    return this.get()
  }

  async getDecryptedKey(): Promise<string> {
    const row = await this.prisma.aIConfig.findUnique({ where: { id: 1 } })
    if (!row?.apiKey) return process.env.ANTHROPIC_API_KEY ?? ''
    return decrypt(row.apiKey) || (process.env.ANTHROPIC_API_KEY ?? '')
  }

  async getRawConfig(): Promise<{ provider: string; model: string; baseUrl: string; apiKey: string }> {
    const row = await this.prisma.aIConfig.findUnique({ where: { id: 1 } })
    return {
      provider: row?.provider ?? 'anthropic',
      model: row?.model ?? 'claude-sonnet-4-6',
      baseUrl: row?.baseUrl ?? '',
      apiKey: row?.apiKey ? decrypt(row.apiKey) : (process.env.ANTHROPIC_API_KEY ?? ''),
    }
  }
}
