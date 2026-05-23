import Anthropic from '@anthropic-ai/sdk'
import type { IAnthropicRepository, AnthropicCallInput } from '../../domain/repositories/IAnthropicRepository.js'

const client = new Anthropic()

export class AnthropicRepository implements IAnthropicRepository {
  async call(input: AnthropicCallInput): Promise<string> {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: [
        {
          type: 'text',
          text: input.systemPrompt,
          // cache_control obrigatório — reduz latência e custo nas chamadas repetidas
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: input.messages.map((msg) => ({
        role: msg.role,
        content:
          typeof msg.content === 'string'
            ? msg.content
            : msg.content.map((c) => {
                if (c.type === 'text') {
                  return { type: 'text' as const, text: c.text ?? '' }
                }
                const isPdf = c.source?.media_type === 'application/pdf'
                if (isPdf) {
                  return {
                    type: 'document' as const,
                    source: {
                      type: 'base64' as const,
                      media_type: 'application/pdf' as const,
                      data: c.source?.data ?? '',
                    },
                  }
                }
                return {
                  type: 'image' as const,
                  source: {
                    type: 'base64' as const,
                    media_type: (c.source?.media_type ?? 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                    data: c.source?.data ?? '',
                  },
                }
              }),
      })),
    })

    const block = response.content[0]
    if (!block || block.type !== 'text') throw new Error('Resposta inesperada do modelo Anthropic')
    return block.text
  }
}
