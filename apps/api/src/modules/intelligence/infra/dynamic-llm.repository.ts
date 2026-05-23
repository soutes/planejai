import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { IAnthropicRepository, AnthropicCallInput } from '../domain/repositories/IAnthropicRepository.js'
import type { PrismaAIConfigRepository } from './prisma-aiconfig.repository.js'

export class DynamicLLMRepository implements IAnthropicRepository {
  constructor(private readonly configRepo: PrismaAIConfigRepository) {}

  async call(input: AnthropicCallInput): Promise<string> {
    const cfg = await this.configRepo.getRawConfig()
    return this.callWithConfig(cfg, input)
  }

  async callWithConfig(
    cfg: { provider: string; model: string; baseUrl: string; apiKey: string },
    input: AnthropicCallInput,
  ): Promise<string> {
    switch (cfg.provider) {
      case 'openai':
        return this.callOpenAI(cfg.apiKey, cfg.model, '', input)
      case 'openrouter':
        return this.callOpenAI(cfg.apiKey, cfg.model, cfg.baseUrl || 'https://openrouter.ai/api/v1', input)
      case 'gemini':
        return this.callGemini(cfg.apiKey, cfg.model, input)
      default:
        return this.callAnthropic(cfg.apiKey, cfg.model, input)
    }
  }

  private async callAnthropic(apiKey: string, model: string, input: AnthropicCallInput): Promise<string> {
    const client = new Anthropic({ apiKey: apiKey || undefined })
    const response = await client.messages.create({
      model: model || 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: [{ type: 'text', text: input.systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: input.messages.map((msg) => ({
        role: msg.role,
        content: typeof msg.content === 'string'
          ? msg.content
          : msg.content.map((c) => {
              if (c.type === 'text') return { type: 'text' as const, text: c.text ?? '' }
              return {
                type: 'document' as const,
                source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: c.source?.data ?? '' },
              }
            }),
      })),
    })
    const block = response.content[0]
    if (!block || block.type !== 'text') throw new Error('Resposta inesperada do Anthropic')
    return block.text
  }

  private async callOpenAI(apiKey: string, model: string, baseURL: string, input: AnthropicCallInput): Promise<string> {
    const client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) })
    const userMessages = input.messages.map((msg) => {
      if (typeof msg.content === 'string') {
        return { role: msg.role as 'user' | 'assistant', content: msg.content }
      }
      // Multimodal: passa PDF como image_url com data URL (suportado por openrouter Claude models)
      const parts: Array<Record<string, unknown>> = []
      for (const c of msg.content) {
        if (c.type === 'text' && c.text) {
          parts.push({ type: 'text', text: c.text })
        } else if (c.type === 'image' && c.source?.data) {
          const media = c.source.media_type ?? 'application/pdf'
          parts.push({
            type: 'image_url',
            image_url: { url: `data:${media};base64,${c.source.data}` },
          })
        }
      }
      return { role: msg.role as 'user' | 'assistant', content: parts as unknown as string }
    })
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: input.systemPrompt },
      ...userMessages,
    ]
    const response = await client.chat.completions.create({ model: model || 'gpt-4o', messages, max_tokens: 8192 })
    const content = response.choices?.[0]?.message?.content
    if (!content) {
      const raw = response as unknown as Record<string, unknown>
      const hint = raw.error ? JSON.stringify(raw.error).slice(0, 200) : 'resposta vazia'
      throw new Error(`Modelo não retornou texto. ${hint}`)
    }
    return content
  }

  private async callGemini(apiKey: string, model: string, input: AnthropicCallInput): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey)
    const geminiModel = genAI.getGenerativeModel({ model: model || 'gemini-1.5-pro' })
    const userText = input.messages
      .filter((m) => m.role === 'user')
      .map((m) => typeof m.content === 'string' ? m.content : m.content.filter((c) => c.type === 'text').map((c) => c.text ?? '').join('\n'))
      .join('\n')
    const result = await geminiModel.generateContent(`${input.systemPrompt}\n\n${userText}`)
    return result.response.text()
  }
}
